/**
 * Redirect utilities for post-authentication flows
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';

const LAST_WORKSPACE_KEY = 'lastWorkspace';

/**
 * Get the redirect URL after authentication
 * Priority:
 * 1. redirect_to URL parameter
 * 2. lastWorkspace from localStorage (client-side only)
 * 3. Smart redirect based on workspace count
 */
export async function getPostAuthRedirect(
	supabase: SupabaseClient,
	userId: string,
	url: URL,
	lastWorkspace?: string | null
): Promise<string> {
	// Check redirect_to parameter first
	const redirectTo = url.searchParams.get('redirect_to');
	if (redirectTo && redirectTo.startsWith('/')) {
		return redirectTo;
	}

	// Get user workspaces
	const { data: workspaces } = await supabase.rpc('get_user_workspaces', {
		user_uuid: userId,
	});

	if (!workspaces || workspaces.length === 0) {
		// No workspaces - go to root to create first workspace
		return '/';
	}

	if (workspaces.length === 1) {
		// Single workspace - go directly to it
		return `/w/${workspaces[0].workspace_slug}`;
	}

	// Multiple workspaces - check for lastWorkspace
	if (lastWorkspace) {
		// Verify the workspace still exists and user has access
		const workspaceExists = workspaces.some((w) => w.workspace_slug === lastWorkspace);
		if (workspaceExists) {
			return `/w/${lastWorkspace}`;
		}
	}

	// Show workspace switcher
	return '/';
}

/**
 * Store last workspace in localStorage (client-side only)
 */
export function setLastWorkspace(slug: string): void {
	if (typeof window !== 'undefined') {
		window.localStorage.setItem(LAST_WORKSPACE_KEY, slug);
	}
}

/**
 * Get last workspace from localStorage (client-side only)
 */
export function getLastWorkspace(): string | null {
	if (typeof window !== 'undefined') {
		return window.localStorage.getItem(LAST_WORKSPACE_KEY);
	}
	return null;
}

