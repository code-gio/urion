/**
 * Workspace and project helper utilities
 * Functions to resolve workspaces and projects by slug
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Workspace, Project, WorkspaceRole } from '$lib/types';
import { error } from '@sveltejs/kit';

/**
 * Get workspace by slug and verify user access
 */
export async function getWorkspaceBySlug(
	supabase: SupabaseClient,
	slug: string,
	userId: string
): Promise<{ workspace: Workspace; userRole: WorkspaceRole }> {
	const { data: workspace, error: err } = await supabase
		.from('workspaces')
		.select(
			`
      *,
      workspace_members!inner (
        id,
        role,
        user_id,
        status
      )
    `
		)
		.eq('slug', slug)
		.eq('workspace_members.user_id', userId)
		.single();

	if (err || !workspace) {
		throw error(404, 'Workspace not found');
	}

	const membership = workspace.workspace_members?.[0];
	if (!membership) {
		throw error(403, 'Access denied');
	}

	return {
		workspace: workspace as Workspace,
		userRole: membership.role as WorkspaceRole,
	};
}

/**
 * Get project by slug within a workspace
 */
export async function getProjectBySlug(
	supabase: SupabaseClient,
	workspaceId: string,
	slug: string
): Promise<Project> {
	const { data: project, error: err } = await supabase
		.from('projects')
		.select('*')
		.eq('workspace_id', workspaceId)
		.eq('slug', slug)
		.single();

	if (err || !project) {
		throw error(404, 'Project not found');
	}

	return project as Project;
}

