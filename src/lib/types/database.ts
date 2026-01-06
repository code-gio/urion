// =====================================================
// DATABASE ENUMS
// =====================================================

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export type MemberStatus = 'active' | 'invited';

export type ProjectStatus = 'active' | 'archived';

// =====================================================
// DATABASE TABLES
// =====================================================

// -------------------------------------------------
// Profiles (extends auth.users)
// -------------------------------------------------
export interface Profile {
  id: string; // UUID from auth.users
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  display_name: string | null;
  bio: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface ProfileInsert {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  display_name?: string | null;
  bio?: string | null;
}

export interface ProfileUpdate {
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  display_name?: string | null;
  bio?: string | null;
}

// -------------------------------------------------
// Workspaces
// -------------------------------------------------
export interface Workspace {
  id: string; // UUID
  name: string;
  slug: string;
  billing_customer_id: string | null;
  plan: string | null;
  billing_status: string | null;
  created_by: string; // UUID
  created_at: string; // ISO timestamp
  updated_at: string | null; // ISO timestamp
}

export interface WorkspaceInsert {
  name: string;
  slug: string;
  billing_customer_id?: string | null;
  plan?: string | null;
  billing_status?: string | null;
  created_by: string;
}

export interface WorkspaceUpdate {
  name?: string;
  slug?: string;
  billing_customer_id?: string | null;
  plan?: string | null;
  billing_status?: string | null;
}

// -------------------------------------------------
// Workspace Members
// -------------------------------------------------
export interface WorkspaceMember {
  id: string; // UUID
  workspace_id: string; // UUID
  user_id: string | null; // UUID - null for email-only invites
  role: WorkspaceRole;
  status: MemberStatus;
  invited_email: string | null;
  invited_by: string | null; // UUID
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface WorkspaceMemberInsert {
  workspace_id: string;
  user_id?: string | null;
  role?: WorkspaceRole;
  status?: MemberStatus;
  invited_email?: string | null;
  invited_by?: string | null;
}

export interface WorkspaceMemberUpdate {
  role?: WorkspaceRole;
  status?: MemberStatus;
  user_id?: string | null;
  invited_email?: string | null;
}

// -------------------------------------------------
// Projects
// -------------------------------------------------
export interface Project {
  id: string; // UUID
  workspace_id: string; // UUID
  name: string;
  slug: string;
  website_url: string | null;
  status: ProjectStatus;
  created_by: string; // UUID
  created_at: string; // ISO timestamp
  updated_at: string | null; // ISO timestamp
}

export interface ProjectInsert {
  workspace_id: string;
  name: string;
  slug: string;
  website_url?: string | null;
  status?: ProjectStatus;
  created_by: string;
}

export interface ProjectUpdate {
  name?: string;
  slug?: string;
  website_url?: string | null;
  status?: ProjectStatus;
}

// =====================================================
// EXTENDED/JOINED TYPES
// =====================================================

// Workspace with user's membership info
export interface WorkspaceWithMembership extends Workspace {
  workspace_members: Pick<WorkspaceMember, 'id' | 'role' | 'status'>[];
}

// Workspace member with profile info
export interface WorkspaceMemberWithProfile extends WorkspaceMember {
  profiles: Pick<Profile, 'full_name' | 'email' | 'avatar_url' | 'display_name'> | null;
}

// Project with creator info
export interface ProjectWithCreator extends Project {
  created_by_profile: Pick<Profile, 'full_name' | 'email' | 'avatar_url'> | null;
}

// Workspace with projects and member count
export interface WorkspaceWithDetails extends Workspace {
  project_count?: number;
  member_count?: number;
  user_role?: WorkspaceRole;
}

// Workspace list item (for UI components like workspace switcher)
export interface WorkspaceListItem {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
  status: MemberStatus;
  created_at: string;
}

// =====================================================
// SUPABASE DATABASE TYPES
// =====================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      workspaces: {
        Row: Workspace;
        Insert: WorkspaceInsert;
        Update: WorkspaceUpdate;
      };
      workspace_members: {
        Row: WorkspaceMember;
        Insert: WorkspaceMemberInsert;
        Update: WorkspaceMemberUpdate;
      };
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_workspaces: {
        Args: { user_uuid: string };
        Returns: {
          workspace_id: string;
          workspace_name: string;
          workspace_slug: string;
          user_role: WorkspaceRole;
          member_status: MemberStatus;
          created_at: string;
        }[];
      };
      user_has_workspace_access: {
        Args: { user_uuid: string; workspace_uuid: string };
        Returns: boolean;
      };
      user_has_workspace_role: {
        Args: { user_uuid: string; workspace_uuid: string; required_role: WorkspaceRole };
        Returns: boolean;
      };
      accept_workspace_invitation: {
        Args: { user_uuid: string; user_email: string };
        Returns: WorkspaceMember[];
      };
    };
    Enums: {
      workspace_role: WorkspaceRole;
      member_status: MemberStatus;
      project_status: ProjectStatus;
    };
  };
}

