// =====================================================
// ROUTE PARAMETER TYPES
// =====================================================

import type {
  WorkspaceListItem,
  WorkspaceMemberWithProfile,
  Workspace,
  WorkspaceMember,
  Project,
  WorkspaceRole,
} from './database.js';

export interface WorkspaceParams {
  workspaceSlug: string;
}

export interface ProjectParams extends WorkspaceParams {
  projectSlug: string;
}

// =====================================================
// SVELTEKIT PAGE DATA TYPES
// =====================================================

// App page (workspace switcher)
export interface AppPageData {
  workspaces: WorkspaceListItem[];
  pendingInvites: WorkspaceMemberWithProfile[];
}

// Workspace page
export interface WorkspacePageData {
  workspace: Workspace;
  projects: Project[];
  members: WorkspaceMemberWithProfile[];
  userRole: WorkspaceRole;
}

// Project page
export interface ProjectPageData {
  workspace: Workspace;
  project: Project;
  userRole: WorkspaceRole;
}

// Workspace settings page
export interface WorkspaceSettingsPageData {
  workspace: Workspace;
  userRole: WorkspaceRole;
}

// Members page
export interface MembersPageData {
  workspace: Workspace;
  members: WorkspaceMemberWithProfile[];
  pendingInvites: WorkspaceMemberWithProfile[];
  userRole: WorkspaceRole;
}

// =====================================================
// SVELTEKIT FORM ACTION TYPES
// =====================================================

export interface ActionData {
  success?: boolean;
  error?: string;
  errors?: Record<string, string>;
}

export interface CreateWorkspaceActionData extends ActionData {
  workspace?: Workspace;
}

export interface InviteMemberActionData extends ActionData {
  member?: WorkspaceMember;
}

export interface UpdateProjectActionData extends ActionData {
  project?: Project;
}

