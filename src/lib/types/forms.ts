// =====================================================
// FORM TYPES & API REQUEST TYPES
// =====================================================
// Note: Form types and API request types are often the same,
// so they're consolidated here

import type {
  WorkspaceRole,
  ProjectStatus,
  Workspace,
  WorkspaceMember,
} from './database.js';

// -------------------------------------------------
// Workspace Forms
// -------------------------------------------------
export interface CreateWorkspaceFormData {
  name: string;
  slug: string;
}

export interface WorkspaceSettingsFormData {
  name: string;
}

// -------------------------------------------------
// Project Forms
// -------------------------------------------------
export interface CreateProjectFormData {
  name: string;
  slug: string;
  website_url: string;
}

export interface ProjectSettingsFormData {
  name: string;
  website_url: string;
  status: ProjectStatus;
}

// -------------------------------------------------
// Member Forms
// -------------------------------------------------
export interface InviteMemberFormData {
  email: string;
  role: WorkspaceRole;
}

// -------------------------------------------------
// Profile Forms
// -------------------------------------------------
export interface ProfileFormData {
  full_name: string;
  display_name: string;
  bio: string;
}

// =====================================================
// API REQUEST TYPES
// =====================================================
// These types are commonly used for API endpoints
// They often mirror form types but are kept separate for clarity

// -------------------------------------------------
// Workspace API
// -------------------------------------------------
export interface CreateWorkspaceRequest {
  name: string;
  slug: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  billing_customer_id?: string;
  plan?: string;
  billing_status?: string;
}

// -------------------------------------------------
// Member API
// -------------------------------------------------
export interface InviteMemberRequest {
  email: string;
  role?: WorkspaceRole;
}

export interface UpdateMemberRoleRequest {
  role: WorkspaceRole;
}

// -------------------------------------------------
// Project API
// -------------------------------------------------
export interface CreateProjectRequest {
  name: string;
  slug: string;
  website_url?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  website_url?: string;
  status?: ProjectStatus;
}

// -------------------------------------------------
// Profile API
// -------------------------------------------------
export interface UpdateProfileRequest {
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface CreateWorkspaceResponse {
  workspace: Workspace;
  membership: WorkspaceMember;
}

