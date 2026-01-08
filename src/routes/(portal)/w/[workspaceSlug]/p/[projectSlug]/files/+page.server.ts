import type { PageServerLoad, Actions } from "./$types";
import {
  getMediaItems,
  createFolder,
  deleteMedia,
  moveMedia,
} from "$lib/utils/media";
import { getWorkspaceBySlug } from "$lib/utils/workspace";
import { error, fail } from "@sveltejs/kit";

export const load: PageServerLoad = async ({
  parent,
  locals: { supabase },
  url,
}) => {
  const parentData = await parent();
  const folderId = url.searchParams.get("folderId");

  // Load media items for the current folder, filtered by project
  const items = await getMediaItems(
    supabase,
    parentData.workspace.id,
    folderId || null,
    undefined,
    parentData.project.id
  );

  return {
    workspace: parentData.workspace,
    project: parentData.project,
    userRole: parentData.userRole,
    items,
    currentFolderId: folderId || null,
  };
};

export const actions: Actions = {
  createFolder: async ({
    request,
    params,
    locals: { supabase, safeGetSession },
  }) => {
    const { user } = await safeGetSession();
    if (!user) {
      throw error(401, "Unauthorized");
    }

    // Get workspace from params
    const { workspace } = await getWorkspaceBySlug(
      supabase,
      params.workspaceSlug,
      user.id
    );

    // Get project from database
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("slug", params.projectSlug)
      .single();

    if (!project) {
      throw error(404, "Project not found");
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const parentId = formData.get("parentId") as string | null;

    if (!name?.trim()) {
      return fail(400, { error: "Folder name is required" });
    }

    try {
      const folder = await createFolder(
        supabase,
        workspace.id,
        project.id,
        name.trim(),
        parentId,
        user.id
      );

      return { success: true, folder };
    } catch (err) {
      console.error("Error creating folder:", err);
      return fail(500, { error: "Failed to create folder" });
    }
  },

  deleteMedia: async ({
    request,
    params,
    locals: { supabase, safeGetSession },
  }) => {
    const { user } = await safeGetSession();
    if (!user) {
      throw error(401, "Unauthorized");
    }

    // Get workspace from params
    const { workspace } = await getWorkspaceBySlug(
      supabase,
      params.workspaceSlug,
      user.id
    );

    const formData = await request.formData();
    const mediaId = formData.get("mediaId") as string;

    if (!mediaId) {
      return fail(400, { error: "Media ID is required" });
    }

    try {
      await deleteMedia(supabase, mediaId, workspace.id);
      return { success: true };
    } catch (err) {
      console.error("Error deleting media:", err);
      return fail(500, { error: "Failed to delete media" });
    }
  },

  moveMedia: async ({
    request,
    params,
    locals: { supabase, safeGetSession },
  }) => {
    const { user } = await safeGetSession();
    if (!user) {
      throw error(401, "Unauthorized");
    }

    // Get workspace from params
    const { workspace } = await getWorkspaceBySlug(
      supabase,
      params.workspaceSlug,
      user.id
    );

    const formData = await request.formData();
    const mediaId = formData.get("mediaId") as string;
    const newParentId = (formData.get("newParentId") as string) || null;

    if (!mediaId) {
      return fail(400, { error: "Media ID is required" });
    }

    try {
      const movedItem = await moveMedia(
        supabase,
        mediaId,
        newParentId,
        workspace.id
      );
      return { success: true, item: movedItem };
    } catch (err) {
      console.error("Error moving media:", err);
      return fail(500, {
        error: err instanceof Error ? err.message : "Failed to move media",
      });
    }
  },
};
