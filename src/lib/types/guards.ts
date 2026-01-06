// =====================================================
// TYPE GUARDS
// =====================================================

import type { WorkspaceRole } from './database.js';
import type { Permission } from './permissions.js';
import { ROLE_PERMISSIONS } from './permissions.js';

export function isWorkspaceOwner(role: WorkspaceRole): boolean {
  return role === 'owner';
}

export function isWorkspaceAdmin(role: WorkspaceRole): boolean {
  return role === 'admin' || role === 'owner';
}

export function canManageMembers(role: WorkspaceRole): boolean {
  return role === 'admin' || role === 'owner';
}

export function canManageProjects(role: WorkspaceRole): boolean {
  return role === 'member' || role === 'admin' || role === 'owner';
}

export function canDeleteProjects(role: WorkspaceRole): boolean {
  return role === 'admin' || role === 'owner';
}

export function hasPermission(role: WorkspaceRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

