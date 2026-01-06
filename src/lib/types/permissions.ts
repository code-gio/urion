// =====================================================
// PERMISSION HELPERS
// =====================================================

import type { WorkspaceRole } from './database.js';

export type Permission =
  | 'workspace:read'
  | 'workspace:update'
  | 'workspace:delete'
  | 'members:invite'
  | 'members:remove'
  | 'members:update_role'
  | 'projects:create'
  | 'projects:update'
  | 'projects:delete'
  | 'billing:view'
  | 'billing:manage';

export const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  owner: [
    'workspace:read',
    'workspace:update',
    'workspace:delete',
    'members:invite',
    'members:remove',
    'members:update_role',
    'projects:create',
    'projects:update',
    'projects:delete',
    'billing:view',
    'billing:manage',
  ],
  admin: [
    'workspace:read',
    'workspace:update',
    'members:invite',
    'members:remove',
    'members:update_role',
    'projects:create',
    'projects:update',
    'projects:delete',
    'billing:view',
  ],
  member: [
    'workspace:read',
    'projects:create',
    'projects:update',
  ],
  viewer: [
    'workspace:read',
  ],
};

