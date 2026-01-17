-- =====================================================
-- URION - Media Storage Bucket Configuration
-- =====================================================
-- Creates and configures Supabase Storage bucket for media files
-- with appropriate access policies
-- =====================================================

-- =====================================================
-- 1. CREATE STORAGE BUCKET
-- =====================================================

-- Create the media bucket (run in Supabase Storage SQL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  false, -- Private bucket (files not publicly accessible without auth)
  104857600, -- 100MB file size limit (adjust as needed)
  ARRAY[
    -- Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    
    -- Videos
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm',
    
    -- Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/aac',
    
    -- Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    
    -- Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    'application/x-tar'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. ENABLE RLS ON STORAGE.OBJECTS
-- =====================================================

-- Storage policies work on storage.objects table
-- Make sure RLS is enabled (it should be by default)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. DROP EXISTING POLICIES (if recreating)
-- =====================================================

-- Uncomment these if you need to recreate the policies
/*
DROP POLICY IF EXISTS "Users can view media in workspaces" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload media to workspaces" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete media in workspaces" ON storage.objects;
*/

-- =====================================================
-- 4. CREATE STORAGE POLICIES
-- =====================================================

-- Policy: Users can view/download media files in their workspaces
CREATE POLICY "Users can view media in workspaces"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'media'
    AND (
      -- Check if user has access to the workspace through media table
      EXISTS (
        SELECT 1 
        FROM public.media m
        JOIN public.workspace_members wm ON wm.workspace_id = m.workspace_id
        WHERE m.storage_path = storage.objects.name
          AND wm.user_id = auth.uid()
          AND wm.status = 'active'
      )
    )
  );

-- Policy: Users can upload media files to their workspaces
CREATE POLICY "Users can upload media to workspaces"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
    -- Additional checks will be done at application level when creating media record
  );

-- Policy: Users can update media files they own or have workspace access to
CREATE POLICY "Users can update their media"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'media'
    AND (
      -- User owns the file
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- User has access to workspace
      EXISTS (
        SELECT 1 
        FROM public.media m
        JOIN public.workspace_members wm ON wm.workspace_id = m.workspace_id
        WHERE m.storage_path = storage.objects.name
          AND wm.user_id = auth.uid()
          AND wm.status = 'active'
      )
    )
  );

-- Policy: Users can delete media files they own or if they're workspace admin/owner
CREATE POLICY "Users can delete media in workspaces"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'media'
    AND (
      -- User created the media item
      EXISTS (
        SELECT 1 
        FROM public.media m
        WHERE m.storage_path = storage.objects.name
          AND m.created_by = auth.uid()
      )
      OR
      -- User is admin/owner of workspace
      EXISTS (
        SELECT 1 
        FROM public.media m
        JOIN public.workspace_members wm ON wm.workspace_id = m.workspace_id
        WHERE m.storage_path = storage.objects.name
          AND wm.user_id = auth.uid()
          AND wm.role IN ('admin', 'owner')
          AND wm.status = 'active'
      )
    )
  );

-- =====================================================
-- 5. STORAGE PATH NAMING CONVENTION
-- =====================================================

/*
Recommended storage path structure:
{workspace_id}/{project_id}/{user_id}/{timestamp}_{random}_{filename}

Example:
550e8400-e29b-41d4-a716-446655440000/
  ├─ 660e8400-e29b-41d4-a716-446655440001/
  │  ├─ 770e8400-e29b-41d4-a716-446655440002/
  │  │  ├─ 1704067200000_a1b2c3_document.pdf
  │  │  └─ 1704067300000_d4e5f6_image.jpg

This structure allows:
- Easy workspace isolation
- Project-based organization
- User attribution
- Unique filenames with timestamp
- Easy deletion of workspace/project data
*/

-- =====================================================
-- 6. HELPER FUNCTION FOR STORAGE PATH GENERATION
-- =====================================================

-- Function to generate storage path
CREATE OR REPLACE FUNCTION generate_storage_path(
  p_workspace_id UUID,
  p_project_id UUID,
  p_user_id UUID,
  p_filename TEXT
)
RETURNS TEXT AS $$
DECLARE
  timestamp_ms BIGINT;
  random_string TEXT;
  file_extension TEXT;
  sanitized_name TEXT;
BEGIN
  -- Get current timestamp in milliseconds
  timestamp_ms := (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT;
  
  -- Generate random string
  random_string := substr(md5(random()::text), 1, 6);
  
  -- Extract file extension
  file_extension := regexp_replace(p_filename, '^.*\.', '');
  
  -- Sanitize filename (remove extension and special chars)
  sanitized_name := regexp_replace(
    regexp_replace(p_filename, '\.[^.]*$', ''),
    '[^a-zA-Z0-9_-]',
    '_',
    'g'
  );
  
  -- Limit sanitized name length
  IF length(sanitized_name) > 50 THEN
    sanitized_name := substr(sanitized_name, 1, 50);
  END IF;
  
  -- Build path
  RETURN format(
    '%s/%s/%s/%s_%s_%s.%s',
    p_workspace_id,
    p_project_id,
    p_user_id,
    timestamp_ms,
    random_string,
    sanitized_name,
    file_extension
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. EXAMPLE USAGE
-- =====================================================

/*
-- Generate a storage path
SELECT generate_storage_path(
  '550e8400-e29b-41d4-a716-446655440000'::UUID, -- workspace_id
  '660e8400-e29b-41d4-a716-446655440001'::UUID, -- project_id
  '770e8400-e29b-41d4-a716-446655440002'::UUID, -- user_id
  'my-document.pdf'                               -- filename
);

-- Result example:
-- 550e8400-e29b-41d4-a716-446655440000/660e8400-e29b-41d4-a716-446655440001/770e8400-e29b-41d4-a716-446655440002/1704067200000_a1b2c3_my-document.pdf

-- Get storage URL for a file (in your application code)
-- const { data } = supabase.storage.from('media').getPublicUrl(storage_path)
-- const { data, error } = await supabase.storage.from('media').download(storage_path)
*/

-- =====================================================
-- 8. BUCKET SIZE MONITORING QUERY
-- =====================================================

/*
-- Check total storage used per workspace
SELECT 
  w.name as workspace_name,
  COUNT(m.id) as file_count,
  COALESCE(SUM(m.size), 0) as total_bytes,
  pg_size_pretty(COALESCE(SUM(m.size), 0)::bigint) as total_size
FROM public.workspaces w
LEFT JOIN public.media m ON m.workspace_id = w.id AND m.type = 'file'
GROUP BY w.id, w.name
ORDER BY total_bytes DESC;

-- Check storage by file type
SELECT 
  file_type,
  COUNT(*) as file_count,
  pg_size_pretty(SUM(size)::bigint) as total_size
FROM public.media
WHERE type = 'file'
GROUP BY file_type
ORDER BY SUM(size) DESC;
*/

-- =====================================================
-- 9. CLEANUP ORPHANED FILES (maintenance)
-- =====================================================

/*
-- Find storage objects that don't have a media record
-- (run periodically to clean up)
SELECT name, created_at
FROM storage.objects
WHERE bucket_id = 'media'
  AND NOT EXISTS (
    SELECT 1 FROM public.media 
    WHERE media.storage_path = storage.objects.name
  )
ORDER BY created_at DESC;

-- Delete orphaned files (BE CAREFUL!)
-- DELETE FROM storage.objects
-- WHERE bucket_id = 'media'
--   AND NOT EXISTS (
--     SELECT 1 FROM public.media 
--     WHERE media.storage_path = storage.objects.name
--   );
*/

-- =====================================================
-- END OF STORAGE CONFIGURATION
-- =====================================================

