export interface Media {
  id: string;
  workspace_id: string;
  project_id: string;
  parent_id: string | null;
  type: "folder" | "file";
  name: string;
  slug: string;
  path: string;
  depth: number;
  mime_type: string | null;
  file_type:
    | "image"
    | "video"
    | "audio"
    | "pdf"
    | "doc"
    | "spreadsheet"
    | "archive"
    | "other";
  size: number | null;
  storage_path: string | null;
  public_url: string | null; // Public URL from Supabase Storage
  created_by: string;
  created_at: string;
  updated_at: string | null;
}
