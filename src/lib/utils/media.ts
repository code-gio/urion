/**
 * Media and folder helper utilities
 * Functions to manage media files and folders with recursive structure
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Media } from "$lib/types/media";
import { error } from "@sveltejs/kit";

/**
 * Get media items by workspace and optional parent folder
 */
export async function getMediaItems(
  supabase: SupabaseClient,
  workspaceId: string,
  parentId: string | null = null,
  type?: "folder" | "file",
  projectId?: string
): Promise<Media[]> {
  let query = supabase
    .from("media")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("type", { ascending: false }) // folders first
    .order("created_at", { ascending: false });

  if (parentId === null) {
    query = query.is("parent_id", null);
  } else {
    query = query.eq("parent_id", parentId);
  }

  if (type) {
    query = query.eq("type", type);
  }

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error: err } = await query;

  if (err) {
    throw error(500, "Failed to load media items");
  }

  return (data as Media[]) || [];
}

/**
 * Get a single media item by id
 */
export async function getMediaById(
  supabase: SupabaseClient,
  id: string,
  workspaceId: string
): Promise<Media> {
  const { data, error: err } = await supabase
    .from("media")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single();

  if (err || !data) {
    throw error(404, "Media not found");
  }

  return data as Media;
}

/**
 * Create a new folder
 */
export async function createFolder(
  supabase: SupabaseClient,
  workspaceId: string,
  projectId: string,
  name: string,
  parentId: string | null,
  userId: string
): Promise<Media> {
  // Calculate path and depth
  let path = name;
  let depth = 0;

  if (parentId) {
    const parent = await getMediaById(supabase, parentId, workspaceId);
    path = `${parent.path}/${name}`;
    depth = parent.depth + 1;
  }

  const { data, error: err } = await supabase
    .from("media")
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      parent_id: parentId,
      type: "folder",
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      path,
      depth,
      file_type: "other",
      created_by: userId,
    })
    .select()
    .single();

  if (err || !data) {
    throw error(500, "Failed to create folder");
  }

  return data as Media;
}

/**
 * Delete a media item (and all children if it's a folder)
 */
export async function deleteMedia(
  supabase: SupabaseClient,
  id: string,
  workspaceId: string
): Promise<void> {
  const media = await getMediaById(supabase, id, workspaceId);

  // Collect all storage paths to delete
  const storagePathsToDelete: string[] = [];

  if (media.type === "folder") {
    // Get all files in this folder and subfolders
    const { data: children, error: childrenErr } = await supabase
      .from("media")
      .select("storage_path")
      .eq("workspace_id", workspaceId)
      .like("path", `${media.path}/%`)
      .eq("type", "file")
      .not("storage_path", "is", null);

    if (!childrenErr && children) {
      storagePathsToDelete.push(
        ...children.map((c) => c.storage_path).filter(Boolean)
      );
    }

    // Delete all children from database
    const { error: deleteChildrenErr } = await supabase
      .from("media")
      .delete()
      .eq("workspace_id", workspaceId)
      .like("path", `${media.path}/%`);

    if (deleteChildrenErr) {
      throw error(500, "Failed to delete folder contents");
    }
  } else if (media.storage_path) {
    // Add file's own storage path
    storagePathsToDelete.push(media.storage_path);
  }

  // Delete the item itself from database
  const { error: err } = await supabase.from("media").delete().eq("id", id);

  if (err) {
    throw error(500, "Failed to delete media");
  }

  // Delete files from storage
  if (storagePathsToDelete.length > 0) {
    const { error: storageErr } = await supabase.storage
      .from("media")
      .remove(storagePathsToDelete);

    if (storageErr) {
      console.error("Failed to delete files from storage:", storageErr);
      // Don't throw error here, as the database records are already deleted
      // This is just a cleanup operation
    }
  }
}

/**
 * Move a media item (file or folder) to a different parent folder
 */
export async function moveMedia(
  supabase: SupabaseClient,
  mediaId: string,
  newParentId: string | null,
  workspaceId: string
): Promise<Media> {
  // Get the media item to move
  const media = await getMediaById(supabase, mediaId, workspaceId);

  // Prevent moving a folder into itself or its descendants
  if (media.type === "folder" && newParentId) {
    const { data: potentialParent } = await supabase
      .from("media")
      .select("path")
      .eq("id", newParentId)
      .single();

    if (potentialParent && potentialParent.path.startsWith(media.path)) {
      throw error(400, "Cannot move a folder into itself or its descendants");
    }
  }

  // Calculate new path and depth
  let newPath = media.name;
  let newDepth = 0;

  if (newParentId) {
    const parent = await getMediaById(supabase, newParentId, workspaceId);
    if (parent.type !== "folder") {
      throw error(400, "Can only move items into folders");
    }
    newPath = `${parent.path}/${media.name}`;
    newDepth = parent.depth + 1;
  }

  const oldPath = media.path;
  const pathDiff = newDepth - media.depth;

  // Update the item itself
  const { data: updated, error: updateErr } = await supabase
    .from("media")
    .update({
      parent_id: newParentId,
      path: newPath,
      depth: newDepth,
    })
    .eq("id", mediaId)
    .select()
    .single();

  if (updateErr || !updated) {
    throw error(500, "Failed to move media item");
  }

  // If it's a folder, update all descendants
  if (media.type === "folder") {
    const { data: descendants } = await supabase
      .from("media")
      .select("*")
      .eq("workspace_id", workspaceId)
      .like("path", `${oldPath}/%`);

    if (descendants && descendants.length > 0) {
      const updates = descendants.map((item) => ({
        id: item.id,
        path: item.path.replace(oldPath, newPath),
        depth: item.depth + pathDiff,
      }));

      for (const update of updates) {
        await supabase
          .from("media")
          .update({ path: update.path, depth: update.depth })
          .eq("id", update.id);
      }
    }
  }

  return updated as Media;
}

/**
 * Count media items in a folder
 */
export async function countMediaInFolder(
  supabase: SupabaseClient,
  folderId: string,
  workspaceId: string
): Promise<number> {
  const { count, error: err } = await supabase
    .from("media")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("parent_id", folderId);

  if (err) {
    return 0;
  }

  return count || 0;
}

/**
 * Get file type from mime type
 */
export function getFileTypeFromMime(mimeType: string): Media["file_type"] {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.includes("document") ||
    mimeType.includes("msword") ||
    mimeType.includes("wordprocessing")
  )
    return "doc";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("sheet")
  )
    return "spreadsheet";
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("archive")
  )
    return "archive";
  return "other";
}

/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
