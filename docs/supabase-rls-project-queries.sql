-- Enable RLS on project_queries table
ALTER TABLE project_queries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view queries for workspaces they are members of
CREATE POLICY "Members can view project queries"
ON project_queries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = project_queries.workspace_id
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.status = 'active'
  )
);

-- Policy: Owners, admins, and editors can insert queries
CREATE POLICY "Owners/admins/editors can insert project queries"
ON project_queries
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = project_queries.workspace_id
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.role IN ('owner', 'admin', 'editor')
    AND workspace_members.status = 'active'
  )
);

-- Policy: Owners, admins, and editors can update queries
CREATE POLICY "Owners/admins/editors can update project queries"
ON project_queries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = project_queries.workspace_id
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.role IN ('owner', 'admin', 'editor')
    AND workspace_members.status = 'active'
  )
);

-- Policy: Owners, admins, and editors can delete queries
CREATE POLICY "Owners/admins/editors can delete project queries"
ON project_queries
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = project_queries.workspace_id
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.role IN ('owner', 'admin', 'editor')
    AND workspace_members.status = 'active'
  )
);
