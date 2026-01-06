// =====================================================
// CONTEXT TYPES
// =====================================================

import type { Workspace, WorkspaceRole, Profile, Project, WorkspaceListItem } from './database.js';

// -------------------------------------------------
// Workspace Context
// -------------------------------------------------
export interface WorkspaceContext {
  workspace: Workspace;
  userRole: WorkspaceRole;
  canManageMembers: boolean;
  canManageProjects: boolean;
  canManageBilling: boolean;
  canDeleteWorkspace: boolean;
}

// -------------------------------------------------
// Project Context
// -------------------------------------------------
export interface ProjectContext {
  project: Project;
  workspace: Workspace;
  userRole: WorkspaceRole;
  canEditProject: boolean;
  canDeleteProject: boolean;
}

// -------------------------------------------------
// Auth Context
// -------------------------------------------------
export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

export interface AuthContext {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// -------------------------------------------------
// Me Payload (unified data structure)
// -------------------------------------------------
export interface MePayload {
  user: { id: string; email: string | null };
  profile: Profile | null;
  workspaces: WorkspaceListItem[];
  projects: Array<{ id: string; workspace_id: string; name: string; slug: string }>;
}

