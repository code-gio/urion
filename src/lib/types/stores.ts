// =====================================================
// STORE TYPES (if using Svelte stores)
// =====================================================

import type { WorkspaceListItem } from './ui.js';
import type { Workspace, Project, Profile } from './database.js';

export interface WorkspaceStore {
  current: Workspace | null;
  list: WorkspaceListItem[];
  isLoading: boolean;
}

export interface ProjectStore {
  current: Project | null;
  list: Project[];
  isLoading: boolean;
}

export interface UserStore {
  profile: Profile | null;
  workspaces: WorkspaceListItem[];
  isLoading: boolean;
}

