// =====================================================
// ROUTE CONTEXT HELPERS
// =====================================================
// Pure functions to resolve route params to IDs
// No state, no effects - just pure computation
// =====================================================

import type { WorkspaceListItem, Project } from '$lib/types';

/**
 * Resolve workspace ID from slug (pure function, no state)
 */
export function resolveWorkspaceId(
	workspaceSlug: string | undefined,
	workspaces: WorkspaceListItem[]
): string | null {
	if (!workspaceSlug) return null;
	return workspaces.find((w) => w.slug === workspaceSlug)?.id || null;
}

/**
 * Resolve project ID from slug (pure function, no state)
 */
export function resolveProjectId(
	projectSlug: string | undefined,
	workspaceId: string | null,
	projects: Project[]
): string | null {
	if (!projectSlug || !workspaceId) return null;
	return projects.find((p) => p.workspace_id === workspaceId && p.slug === projectSlug)?.id || null;
}

