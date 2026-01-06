import { getContext, setContext } from 'svelte';
import type { Workspace, WorkspaceListItem, WorkspaceRole, WorkspaceUpdate } from '$lib/types';
import { post, patch, invalidateEndpointCache } from '$lib/api/client.js';
import { invalidateCachePattern } from '$lib/api/cache.js';

const SYMBOL_KEY = 'urion-workspace-state';

class WorkspaceState {
	current = $state<Workspace | null>(null);
	list = $state<WorkspaceListItem[]>([]);
	isLoading = $state(false);
	userRole = $state<WorkspaceRole | null>(null);

	/**
	 * Sync workspace from server data
	 */
	syncWorkspace(workspace: Workspace | null, userRole: WorkspaceRole | null = null): void {
		this.current = workspace;
		if (userRole) {
			this.userRole = userRole;
		}
	}

	/**
	 * Sync workspace list from server data
	 */
	syncWorkspaceList(workspaces: WorkspaceListItem[]): void {
		this.list = workspaces;
	}

	/**
	 * Set loading state
	 */
	setLoading(loading: boolean): void {
		this.isLoading = loading;
	}

	/**
	 * Create workspace (optimistic update)
	 */
	async createWorkspace(name: string, slug: string): Promise<Workspace> {
		this.isLoading = true;

		// Optimistic update: add temporary workspace to list
		const tempWorkspace: WorkspaceListItem = {
			id: `temp-${Date.now()}`,
			name,
			slug,
			role: 'owner',
			status: 'active',
			created_at: new Date().toISOString(),
		};
		this.list = [...this.list, tempWorkspace];

		try {
			const response = await post<{ workspace: Workspace; membership: unknown }>(
				'/api/workspaces',
				{ name, slug }
			);

			// Replace temp workspace with real one
			this.list = this.list.map((w) => (w.id === tempWorkspace.id ? {
				id: response.workspace.id,
				name: response.workspace.name,
				slug: response.workspace.slug,
				role: 'owner',
				status: 'active',
				created_at: response.workspace.created_at,
			} : w));

			// Invalidate cache
			invalidateEndpointCache('/api/workspaces');
			invalidateCachePattern(/^\/api\/workspaces/);

			return response.workspace;
		} catch (error) {
			// Rollback optimistic update
			this.list = this.list.filter((w) => w.id !== tempWorkspace.id);
			throw error;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Update workspace (optimistic update)
	 */
	async updateWorkspace(workspaceId: string, updates: WorkspaceUpdate): Promise<Workspace> {
		if (!this.current || this.current.id !== workspaceId) {
			throw new Error('Workspace not loaded');
		}

		// Optimistic update: update current workspace
		const previousWorkspace = { ...this.current };
		this.current = { ...this.current, ...updates };

		// Update in list if present
		this.list = this.list.map((w) =>
			w.id === workspaceId
				? {
						...w,
						name: updates.name ?? w.name,
						slug: updates.slug ?? w.slug,
					}
				: w
		);

		try {
			const workspace = await patch<Workspace>(`/api/workspaces/${workspaceId}`, updates);

			// Update with server response
			this.current = workspace;
			this.list = this.list.map((w) =>
				w.id === workspaceId
					? {
							...w,
							name: workspace.name,
							slug: workspace.slug,
						}
					: w
			);

			// Invalidate cache
			invalidateEndpointCache(`/api/workspaces/${workspaceId}`);
			invalidateCachePattern(/^\/api\/workspaces/);

			return workspace;
		} catch (error) {
			// Rollback optimistic update
			this.current = previousWorkspace;
			this.list = this.list.map((w) =>
				w.id === workspaceId ? { ...w, name: previousWorkspace.name, slug: previousWorkspace.slug } : w
			);
			throw error;
		}
	}

	/**
	 * Switch to a different workspace
	 */
	switchWorkspace(workspaceSlug: string): void {
		const workspace = this.list.find((w) => w.slug === workspaceSlug);
		if (workspace) {
			// Workspace will be loaded from server on navigation
			// This just clears current to force reload
			this.current = null;
			this.userRole = null;
		}
	}

	/**
	 * Clear workspace state
	 */
	clear(): void {
		this.current = null;
		this.userRole = null;
	}
}

/**
 * Set workspace state in context
 * Idempotent - returns existing state if already set
 */
export function setWorkspaceState(): WorkspaceState {
	const existing = getContext<WorkspaceState>(Symbol.for(SYMBOL_KEY));
	if (existing) {
		return existing;
	}
	return setContext(Symbol.for(SYMBOL_KEY), new WorkspaceState());
}

/**
 * Get workspace state from context
 */
export function useWorkspace(): WorkspaceState {
	const state = getContext<WorkspaceState>(Symbol.for(SYMBOL_KEY));
	if (!state) {
		throw new Error('WorkspaceState not found in context. Make sure to call setWorkspaceState() first.');
	}
	return state;
}


