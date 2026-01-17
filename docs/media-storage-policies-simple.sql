-- =====================================================
-- POLÍTICAS DE STORAGE PARA BUCKET MEDIA
-- Versión segura - Solo afecta políticas del bucket 'media'
-- =====================================================

-- ============================================
-- PASO 1: ELIMINAR SOLO POLÍTICAS DE MEDIA (si existen)
-- ============================================
-- Estos DROP son seguros - solo eliminan SI EXISTEN
-- y solo son las políticas que vamos a crear

DROP POLICY IF EXISTS "Allow authenticated uploads to media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from media bucket" ON storage.objects;

-- ============================================
-- PASO 2: CREAR NUEVAS POLÍTICAS PARA MEDIA
-- ============================================

-- Policy 1: INSERT - Permitir subir archivos a usuarios autenticados
CREATE POLICY "Allow authenticated uploads to media bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media'
);

-- Policy 2: SELECT - Permitir ver archivos a usuarios autenticados
CREATE POLICY "Allow authenticated reads from media bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'media'
);

-- Policy 3: UPDATE - Permitir actualizar archivos a usuarios autenticados
CREATE POLICY "Allow authenticated updates to media bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media'
)
WITH CHECK (
  bucket_id = 'media'
);

-- Policy 4: DELETE - Permitir eliminar archivos a usuarios autenticados
CREATE POLICY "Allow authenticated deletes from media bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media'
);

-- ============================================
-- PASO 3: VERIFICAR QUE TODO ESTÉ BIEN
-- ============================================

-- Ejecuta esto después para verificar:
/*
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%media%'
ORDER BY policyname;
*/

-- Deberías ver exactamente 4 políticas:
-- 1. Allow authenticated deletes from media bucket (DELETE)
-- 2. Allow authenticated reads from media bucket (SELECT)
-- 3. Allow authenticated updates to media bucket (UPDATE)
-- 4. Allow authenticated uploads to media bucket (INSERT)

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- Estas políticas solo afectan al bucket 'media'
-- NO tocan ninguna otra política de otros buckets
-- Son seguras de ejecutar múltiples veces



