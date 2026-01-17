-- =====================================================
-- URION - Media Management Table
-- =====================================================
-- Creates a recursive file/folder structure for media management
-- Linked to workspaces and projects
-- =====================================================

-- Drop existing objects if needed (uncomment if recreating)
-- DROP TABLE IF EXISTS public.media CASCADE;
-- DROP FUNCTION IF EXISTS update_media_updated_at() CASCADE;

-- =====================================================
-- 1. CREATE MEDIA TABLE
-- =====================================================

create table public.media (
  id uuid not null default extensions.uuid_generate_v4 (),
  workspace_id uuid not null,
  project_id uuid not null,
  parent_id uuid null,
  type text not null,
  name text not null,
  slug text not null,
  path text not null,
  depth integer not null default 0,
  mime_type text null,
  file_type text not null default 'other'::text,
  size bigint null,
  storage_path text null,
  public_url text null,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  constraint media_pkey primary key (id),
  constraint media_workspace_id_fkey foreign key (workspace_id) references workspaces (id) on delete cascade,
  constraint media_project_id_fkey foreign key (project_id) references projects (id) on delete cascade,
  constraint media_parent_id_fkey foreign key (parent_id) references media (id) on delete cascade,
  constraint media_created_by_fkey foreign key (created_by) references auth.users (id) on delete set null,
  constraint media_type_check check (type in ('folder', 'file')),
  constraint media_file_type_check check (
    file_type in ('image', 'video', 'audio', 'pdf', 'doc', 'spreadsheet', 'archive', 'other')
  ),
  constraint media_folder_fields_check check (
    type = 'file' or (
      type = 'folder' and 
      mime_type is null and 
      size is null and 
      storage_path is null and
      public_url is null
    )
  )
) tablespace pg_default;

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

-- Single column indexes
create index if not exists idx_media_workspace_id on public.media using btree (workspace_id) tablespace pg_default;

create index if not exists idx_media_project_id on public.media using btree (project_id) tablespace pg_default;

create index if not exists idx_media_parent_id on public.media using btree (parent_id) tablespace pg_default;

create index if not exists idx_media_type on public.media using btree (type) tablespace pg_default;

create index if not exists idx_media_created_by on public.media using btree (created_by) tablespace pg_default;

create index if not exists idx_media_created_at on public.media using btree (created_at desc) tablespace pg_default;

-- Composite indexes for common queries
create index if not exists idx_media_workspace_parent on public.media using btree (workspace_id, parent_id) tablespace pg_default;

create index if not exists idx_media_project_parent on public.media using btree (project_id, parent_id) tablespace pg_default;

create index if not exists idx_media_workspace_type on public.media using btree (workspace_id, type) tablespace pg_default;

create index if not exists idx_media_project_type on public.media using btree (project_id, type) tablespace pg_default;

-- Path index for hierarchical queries
create index if not exists idx_media_path on public.media using btree (path text_pattern_ops) tablespace pg_default;

-- =====================================================
-- 3. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

-- Note: Using the existing update_updated_at_column() function
-- that is already used by workspaces and projects tables

create trigger update_media_updated_at before
update on media for each row
execute function update_updated_at_column ();

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

alter table public.media enable row level security;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- Policy: View media in workspaces where user is a member
create policy "Users can view media in their workspaces"
on public.media
for select
using (
  exists (
    select 1 
    from public.workspace_members
    where workspace_members.workspace_id = media.workspace_id
      and workspace_members.user_id = auth.uid()
      and workspace_members.status = 'active'
  )
);

-- Policy: Create media in workspaces where user is a member
create policy "Users can create media in their workspaces"
on public.media
for insert
with check (
  exists (
    select 1 
    from public.workspace_members
    where workspace_members.workspace_id = media.workspace_id
      and workspace_members.user_id = auth.uid()
      and workspace_members.status = 'active'
  )
  and created_by = auth.uid()
);

-- Policy: Update media in workspaces where user is a member
create policy "Users can update media in their workspaces"
on public.media
for update
using (
  exists (
    select 1 
    from public.workspace_members
    where workspace_members.workspace_id = media.workspace_id
      and workspace_members.user_id = auth.uid()
      and workspace_members.status = 'active'
  )
)
with check (
  exists (
    select 1 
    from public.workspace_members
    where workspace_members.workspace_id = media.workspace_id
      and workspace_members.user_id = auth.uid()
      and workspace_members.status = 'active'
  )
);

-- Policy: Delete media (own files or if admin/owner)
create policy "Users can delete media in their workspaces"
on public.media
for delete
using (
  created_by = auth.uid()
  or exists (
    select 1 
    from public.workspace_members
    where workspace_members.workspace_id = media.workspace_id
      and workspace_members.user_id = auth.uid()
      and workspace_members.role in ('admin', 'owner')
      and workspace_members.status = 'active'
  )
);

-- =====================================================
-- 6. ADD TABLE AND COLUMN COMMENTS
-- =====================================================

comment on table public.media is 'Stores media files and folders with recursive hierarchical structure for workspaces and projects';

comment on column public.media.id is 'Unique identifier for the media item';
comment on column public.media.workspace_id is 'Reference to the workspace this media belongs to';
comment on column public.media.project_id is 'Reference to the project this media belongs to';
comment on column public.media.parent_id is 'Reference to parent folder (NULL for root-level items)';
comment on column public.media.type is 'Type of media item: "folder" or "file"';
comment on column public.media.name is 'Display name of the media item';
comment on column public.media.slug is 'URL-friendly version of the name';
comment on column public.media.path is 'Full hierarchical path from root (e.g., "Documents/Images/photo.jpg")';
comment on column public.media.depth is 'Nesting depth level (0 = root, 1 = first level, etc.)';
comment on column public.media.mime_type is 'MIME type of the file (NULL for folders)';
comment on column public.media.file_type is 'Categorized file type for filtering: image, video, audio, pdf, doc, spreadsheet, archive, other';
comment on column public.media.size is 'File size in bytes (NULL for folders)';
comment on column public.media.storage_path is 'Path to file in Supabase Storage bucket (NULL for folders)';
comment on column public.media.public_url is 'Public URL from Supabase Storage for accessing the file (NULL for folders)';
comment on column public.media.created_by is 'User who created this media item';
comment on column public.media.created_at is 'Timestamp when the item was created';
comment on column public.media.updated_at is 'Timestamp when the item was last updated';

-- =====================================================
-- 7. GRANT PERMISSIONS (optional, adjust as needed)
-- =====================================================

-- Grant permissions to authenticated users
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
-- GRANT USAGE ON SEQUENCE media_id_seq TO authenticated;

-- =====================================================
-- 8. HELPER FUNCTIONS (optional but useful)
-- =====================================================

-- Drop existing function first to allow changing return type
-- DROP FUNCTION IF EXISTS get_media_descendants(text);

-- Function to get all descendants of a folder
create or replace function get_media_descendants(folder_path text)
returns table (
  id uuid,
  workspace_id uuid,
  project_id uuid,
  parent_id uuid,
  type text,
  name text,
  slug text,
  path text,
  depth integer,
  mime_type text,
  file_type text,
  size bigint,
  storage_path text,
  public_url text,
  created_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) as $$
begin
  return query
  select 
    m.id,
    m.workspace_id,
    m.project_id,
    m.parent_id,
    m.type,
    m.name,
    m.slug,
    m.path,
    m.depth,
    m.mime_type,
    m.file_type,
    m.size,
    m.storage_path,
    m.public_url,
    m.created_by,
    m.created_at,
    m.updated_at
  from public.media m
  where m.path like folder_path || '/%'
  order by m.depth, m.created_at;
end;
$$ language plpgsql security definer;

-- Function to get folder size (sum of all files inside)
create or replace function get_folder_size(folder_id uuid)
returns bigint as $$
declare
  folder_path text;
  total_size bigint;
begin
  -- Get the folder path
  select path into folder_path
  from public.media
  where id = folder_id and type = 'folder';
  
  if folder_path is null then
    return 0;
  end if;
  
  -- Sum all file sizes in this folder and subfolders
  select coalesce(sum(size), 0) into total_size
  from public.media
  where (path like folder_path || '/%' or id = folder_id)
    and type = 'file'
    and size is not null;
  
  return total_size;
end;
$$ language plpgsql security definer;

-- =====================================================
-- 9. EXAMPLE QUERIES (commented out)
-- =====================================================

/*
-- Get all root-level items in a workspace
SELECT * FROM public.media 
WHERE workspace_id = 'YOUR_WORKSPACE_ID' 
  AND parent_id IS NULL 
ORDER BY type DESC, name;

-- Get all items in a specific folder
SELECT * FROM public.media 
WHERE parent_id = 'FOLDER_ID' 
ORDER BY type DESC, name;

-- Get all files of a specific type in a project
SELECT * FROM public.media 
WHERE project_id = 'YOUR_PROJECT_ID' 
  AND type = 'file'
  AND file_type = 'image';

-- Get folder tree with file counts
SELECT 
  m.id,
  m.name,
  m.path,
  m.depth,
  COUNT(children.id) as child_count
FROM public.media m
LEFT JOIN public.media children ON children.parent_id = m.id
WHERE m.type = 'folder' 
  AND m.workspace_id = 'YOUR_WORKSPACE_ID'
GROUP BY m.id, m.name, m.path, m.depth
ORDER BY m.path;

-- Get total storage used per project
SELECT 
  p.name as project_name,
  COUNT(m.id) as file_count,
  COALESCE(SUM(m.size), 0) as total_size_bytes,
  pg_size_pretty(COALESCE(SUM(m.size), 0)::bigint) as total_size
FROM public.projects p
LEFT JOIN public.media m ON m.project_id = p.id AND m.type = 'file'
WHERE p.workspace_id = 'YOUR_WORKSPACE_ID'
GROUP BY p.id, p.name
ORDER BY total_size_bytes DESC;
*/

-- =====================================================
-- END OF MEDIA TABLE CREATION
-- =====================================================

