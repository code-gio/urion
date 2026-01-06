/**
 * Server helper functions for Tools API
 * Permission checks and tool queries
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AccessCheck, WorkspaceRole, Tool } from '$lib/types';

/**
 * Check project access and verify user has required role
 */
export async function checkProjectAccess(
	supabase: SupabaseClient,
	userId: string,
	workspaceId: string,
	projectId: string,
	requiredRole: WorkspaceRole = 'member'
): Promise<AccessCheck> {
	// Check workspace membership
	const { data: member, error } = await supabase
		.from('workspace_members')
		.select('role')
		.eq('workspace_id', workspaceId)
		.eq('user_id', userId)
		.eq('status', 'active')
		.single();

	if (error || !member) {
		return { authorized: false, role: null };
	}

	// Check role hierarchy
	const roles: WorkspaceRole[] = ['viewer', 'member', 'admin', 'owner'];
	const userRoleIndex = roles.indexOf(member.role as WorkspaceRole);
	const requiredRoleIndex = roles.indexOf(requiredRole);

	if (userRoleIndex < requiredRoleIndex) {
		return { authorized: false, role: member.role as WorkspaceRole };
	}

	// Verify project belongs to workspace
	const { data: project } = await supabase
		.from('projects')
		.select('id')
		.eq('id', projectId)
		.eq('workspace_id', workspaceId)
		.single();

	if (!project) {
		return { authorized: false, role: member.role as WorkspaceRole };
	}

	return { authorized: true, role: member.role as WorkspaceRole };
}

/**
 * Get tool by ID or slug
 */
export async function getToolByIdOrSlug(
	supabase: SupabaseClient,
	idOrSlug: string
): Promise<Tool | null> {
	// Try by ID first
	let { data: tool, error } = await supabase
		.from('tools')
		.select('*')
		.eq('id', idOrSlug)
		.single();

	// If not found by ID, try by slug
	if (error) {
		const { data: toolBySlug, error: slugError } = await supabase
			.from('tools')
			.select('*')
			.eq('slug', idOrSlug)
			.single();

		if (slugError) {
			return null;
		}

		tool = toolBySlug;
	}

	return tool as Tool | null;
}

