import type { RequestHandler } from "./$types";
import { error, json } from "@sveltejs/kit";
import { getFileTypeFromMime } from "$lib/utils/media";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const POST: RequestHandler = async ({
  request,
  locals: { supabase, safeGetSession },
}) => {
  const { user } = await safeGetSession();
  if (!user) {
    throw error(401, "Unauthorized");
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const workspaceId = formData.get("workspaceId") as string;
    const projectId = formData.get("projectId") as string;
    const parentId = (formData.get("parentId") as string) || null;



    if (!file) {
      throw error(400, "No file provided");
    }

    if (!workspaceId || !projectId) {
      throw error(400, "Workspace ID and Project ID are required");
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw error(
        400,
        `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
      );
    }

    // Calculate path and depth if parent exists
    let path = file.name;
    let depth = 0;

    if (parentId) {
      const { data: parent, error: parentErr } = await supabase
        .from("media")
        .select("path, depth")
        .eq("id", parentId)
        .eq("workspace_id", workspaceId)
        .single();

      if (parentErr || !parent) {
        console.error("Parent folder error:", parentErr);
        throw error(404, "Parent folder not found");
      }

      path = `${parent.path}/${file.name}`;
      depth = parent.depth + 1;
    }

    // Generate storage path: workspace_id/project_id/timestamp_random_filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${workspaceId}/${projectId}/${timestamp}_${randomString}_${sanitizedName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw error(
        500,
        `Failed to upload file to storage: ${uploadError.message}`
      );
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Get file type from mime type
    const fileType = getFileTypeFromMime(file.type);

    // Create media record in database
    const mediaData = {
      workspace_id: workspaceId,
      project_id: projectId,
      parent_id: parentId,
      type: "file",
      name: file.name,
      slug: file.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      path,
      depth,
      mime_type: file.type,
      file_type: fileType,
      size: file.size,
      storage_path: storagePath,
      public_url: publicUrl,
      created_by: user.id,
    };

    const { data: mediaRecord, error: dbError } = await supabase
      .from("media")
      .insert(mediaData)
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // If database insert fails, delete the uploaded file
      await supabase.storage.from("media").remove([storagePath]);
      throw error(500, `Failed to create media record: ${dbError.message}`);
    }

    return json({
      success: true,
      media: mediaRecord,
    });
  } catch (err) {
    console.error("Upload error:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};
