-- ============================================
-- CONFIGURAR RLS PARA project_queries
-- Genérico para todos los workspaces
-- Members pueden hacer CRUD en queries de su workspace
-- ============================================

-- Limpiar políticas viejas
DROP POLICY IF EXISTS "allow_select_queries" ON project_queries;
DROP POLICY IF EXISTS "allow_insert_queries" ON project_queries;
DROP POLICY IF EXISTS "allow_update_queries" ON project_queries;
DROP POLICY IF EXISTS "allow_delete_queries" ON project_queries;
DROP POLICY IF EXISTS "Members can view project queries" ON project_queries;
DROP POLICY IF EXISTS "Owners/admins/editors can insert project queries" ON project_queries;
DROP POLICY IF EXISTS "Owners/admins/editors can update project queries" ON project_queries;
DROP POLICY IF EXISTS "Owners/admins/editors can delete project queries" ON project_queries;
DROP POLICY IF EXISTS "view_project_queries" ON project_queries;
DROP POLICY IF EXISTS "insert_project_queries" ON project_queries;
DROP POLICY IF EXISTS "update_project_queries" ON project_queries;
DROP POLICY IF EXISTS "delete_project_queries" ON project_queries;
DROP POLICY IF EXISTS "select_project_queries" ON project_queries;

-- Habilitar RLS
ALTER TABLE project_queries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICA SELECT
-- Cualquier member activo de un workspace puede ver sus queries
-- ============================================
CREATE POLICY "members_can_select_queries"
ON project_queries
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- ============================================
-- POLÍTICA INSERT
-- Cualquier member activo puede crear queries en su workspace
-- ============================================
CREATE POLICY "members_can_insert_queries"
ON project_queries
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- ============================================
-- POLÍTICA UPDATE
-- Cualquier member activo puede actualizar queries de su workspace
-- ============================================
CREATE POLICY "members_can_update_queries"
ON project_queries
FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- ============================================
-- POLÍTICA DELETE
-- Cualquier member activo puede eliminar queries de su workspace
-- ============================================
CREATE POLICY "members_can_delete_queries"
ON project_queries
FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- ============================================
-- VERIFICAR
-- ============================================
SELECT 
  'Políticas creadas correctamente' as status,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'project_queries';

-- Ver las políticas
SELECT 
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'project_queries'
ORDER BY cmd;
