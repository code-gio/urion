export interface ProjectQuery {
  id: string;
  workspace_id: string;
  project_id: string;
  query_text: string;
  query_key: string;
  topic: string | null;
  location: string | null;
  tags: string[];
  is_active: boolean;
  created_at: string;
}
