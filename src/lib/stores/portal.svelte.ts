import { getContext, setContext } from 'svelte';
import type {
	Profile,
	WorkspaceListItem,
	Workspace,
	WorkspaceRole,
	WorkspaceUpdate,
	Project,
	ProjectUpdate,
	MePayload,
} from '$lib/types';
import { post, patch, del, invalidateEndpointCache } from '$lib/api/client.js';
import { invalidateCachePattern } from '$lib/api/cache.js';
import { invalidateAll } from '$app/navigation';

const SYMBOL_KEY = 'urion-portal-state';

class PortalState {
	// User state
	profile = $state<Profile | null>(null);

	// Workspace state
	workspaces = $state<WorkspaceListItem[]>([]);
	currentWorkspaceId = $state<string | null>(null);
	currentWorkspaceRole = $state<WorkspaceRole | null>(null);

	// Project state
	projects = $state<Map<string, Project[]>>(new Map()); // Map<workspaceId, Project[]>
	currentProjectId = $state<string | null>(null);

	// Loading state
	isLoading = $state(false);

	// Derived properties (computed from state)
	currentWorkspace = $derived.by(() => {
		if (!this.currentWorkspaceId) return null;
		return this.workspaces.find((w) => w.id === this.currentWorkspaceId) || null;
	});

	currentProject = $derived.by(() => {
		if (!this.currentProjectId) return null;
		for (const projects of this.projects.values()) {
			const found = projects.find((p) => p.id === this.currentProjectId);
			if (found) return found;
		}
		return null;
	});

	currentWorkspaceProjects = $derived.by(() => {
		if (!this.currentWorkspaceId) return [];
		return this.projects.get(this.currentWorkspaceId) || [];
	});

	/**
	 * Hydrate store from me payload (single hydration point)
	 */
	hydrate(mePayload: MePayload | null | undefined): void {
		if (!mePayload) return;

		// Sync profile
		this.profile = mePayload.profile;

		// Sync workspaces (single source)
		this.workspaces = mePayload.workspaces || [];

		// Sync projects by workspace
		const projectsByWorkspace = new Map<string, Project[]>();
		for (const project of mePayload.projects || []) {
			const existing = projectsByWorkspace.get(project.workspace_id) || [];
			projectsByWorkspace.set(project.workspace_id, [...existing, project as Project]);
		}
		this.projects = projectsByWorkspace;
	}

	/**
	 * Set current workspace ID (called by workspace layout)
	 */
	setCurrentWorkspace(workspaceId: string | null, userRole: WorkspaceRole | null = null): void {
		this.currentWorkspaceId = workspaceId;
		if (userRole) {
			this.currentWorkspaceRole = userRole;
		} else if (!workspaceId) {
			this.currentWorkspaceRole = null;
		}
	}

	/**
	 * Set current project ID (called by project layout)
	 */
	setCurrentProject(projectId: string | null): void {
		this.currentProjectId = projectId;
	}

	/**
	 * Get projects for a workspace
	 */
	getProjects(workspaceId: string): Project[] {
		return this.projects.get(workspaceId) || [];
	}

	/**
	 * Set loading state
	 */
	setLoading(loading: boolean): void {
		this.isLoading = loading;
	}

	/**
	 * Update profile (optimistic update)
	 */
	async updateProfile(updates: Partial<Profile>): Promise<Profile> {
		if (!this.profile) {
			throw new Error('Profile not loaded');
		}

		// Optimistic update
		const previousProfile = { ...this.profile };
		this.profile = { ...this.profile, ...updates } as Profile;

		try {
			const profile = await patch<Profile>('/api/profile', updates);

			// Update with server response
			this.profile = profile;

			// Invalidate cache
			invalidateEndpointCache('/api/profile');

			// Invalidate all load functions to refetch "me" payload
			await invalidateAll();

			return profile;
		} catch (error) {
			// Rollback optimistic update
			this.profile = previousProfile;
			throw error;
		}
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
		this.workspaces = [...this.workspaces, tempWorkspace];

		try {
			const response = await post<{ workspace: Workspace; membership: unknown }>(
				'/api/workspaces',
				{ name, slug }
			);

			// Replace temp workspace with real one
			this.workspaces = this.workspaces.map((w) =>
				w.id === tempWorkspace.id
					? {
							id: response.workspace.id,
							name: response.workspace.name,
							slug: response.workspace.slug,
							role: 'owner',
							status: 'active',
							created_at: response.workspace.created_at,
						}
					: w
			);

			// Invalidate cache
			invalidateEndpointCache('/api/workspaces');
			invalidateCachePattern(/^\/api\/workspaces/);

			// Invalidate all load functions to refetch "me" payload
			await invalidateAll();

			return response.workspace;
		} catch (error) {
			// Rollback optimistic update
			this.workspaces = this.workspaces.filter((w) => w.id !== tempWorkspace.id);
			throw error;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Update workspace (optimistic update)
	 */
	async updateWorkspace(workspaceId: string, updates: WorkspaceUpdate): Promise<Workspace> {
		if (!this.currentWorkspaceId || this.currentWorkspaceId !== workspaceId) {
			throw new Error('Workspace not loaded');
		}

		// Optimistic update: update in list
		const previousWorkspaces = [...this.workspaces];
		this.workspaces = this.workspaces.map((w) =>
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
			this.workspaces = this.workspaces.map((w) =>
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

			// Invalidate all load functions to refetch "me" payload
			await invalidateAll();

			return workspace;
		} catch (error) {
			// Rollback optimistic update
			this.workspaces = previousWorkspaces;
			throw error;
		}
	}

	/**
	 * Create project (optimistic update)
	 */
	async createProject(
		workspaceId: string,
		name: string,
		slug: string,
		websiteUrl?: string | null
	): Promise<Project> {
		this.isLoading = true;

		// Optimistic update: add temporary project to list
		const tempProject: Project = {
			id: `temp-${Date.now()}`,
			workspace_id: workspaceId,
			name,
			slug,
			website_url: websiteUrl || null,
			status: 'active',
			created_by: '', // Will be set by server
			created_at: new Date().toISOString(),
			updated_at: null,
		};

		const currentList = this.getProjects(workspaceId);
		const newMap = new Map(this.projects);
		newMap.set(workspaceId, [...currentList, tempProject]);
		this.projects = newMap;

		try {
			const project = await post<Project>(`/api/workspaces/${workspaceId}/projects`, {
				name,
				slug,
				website_url: websiteUrl || null,
			});

			// Replace temp project with real one
			const updatedList = this.getProjects(workspaceId).map((p) =>
				p.id === tempProject.id ? project : p
			);
			const newMap = new Map(this.projects);
			newMap.set(workspaceId, updatedList);
			this.projects = newMap;

			// Invalidate cache
			invalidateEndpointCache(`/api/workspaces/${workspaceId}/projects`);
			invalidateCachePattern(new RegExp(`^/api/workspaces/${workspaceId}/projects`));

			// Invalidate all load functions to refetch "me" payload
			await invalidateAll();

			return project;
		} catch (error) {
			// Rollback optimistic update
			const updatedList = this.getProjects(workspaceId).filter((p) => p.id !== tempProject.id);
			const newMap = new Map(this.projects);
			newMap.set(workspaceId, updatedList);
			this.projects = newMap;
			throw error;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Update project (optimistic update)
	 */
	async updateProject(workspaceId: string, projectId: string, updates: ProjectUpdate): Promise<Project> {
		if (!this.currentProjectId || this.currentProjectId !== projectId) {
			throw new Error('Project not loaded');
		}

		// Optimistic update: update in list
		const currentList = this.getProjects(workspaceId);
		const previousProjects = new Map(this.projects);
		const updatedList = currentList.map((p) =>
			p.id === projectId
				? {
						...p,
						name: updates.name ?? p.name,
						slug: updates.slug ?? p.slug,
						website_url: updates.website_url ?? p.website_url,
						status: updates.status ?? p.status,
					}
				: p
		);
		const newMap = new Map(this.projects);
		newMap.set(workspaceId, updatedList);
		this.projects = newMap;

		try {
			const project = await patch<Project>(
				`/api/workspaces/${workspaceId}/projects/${projectId}`,
				updates
			);

			// Update with server response
			const finalList = this.getProjects(workspaceId).map((p) =>
				p.id === projectId ? project : p
			);
			const finalMap = new Map(this.projects);
			finalMap.set(workspaceId, finalList);
			this.projects = finalMap;

			// Invalidate cache
			invalidateEndpointCache(`/api/workspaces/${workspaceId}/projects/${projectId}`);
			invalidateCachePattern(new RegExp(`^/api/workspaces/${workspaceId}/projects`));

			// Invalidate all load functions to refetch "me" payload
			await invalidateAll();

			return project;
		} catch (error) {
			// Rollback optimistic update
			this.projects = previousProjects;
			throw error;
		}
	}

	/**
	 * Delete project (optimistic update)
	 */
	async deleteProject(workspaceId: string, projectId: string): Promise<void> {
		// Optimistic update: remove from list
		const currentList = this.getProjects(workspaceId);
		const projectToDelete = currentList.find((p) => p.id === projectId);
		const previousProjects = new Map(this.projects);
		const newMap = new Map(this.projects);
		newMap.set(workspaceId, currentList.filter((p) => p.id !== projectId));
		this.projects = newMap;

		// Clear current if it's the deleted project
		if (this.currentProjectId === projectId) {
			this.currentProjectId = null;
		}

		try {
			await del(`/api/workspaces/${workspaceId}/projects/${projectId}`);

			// Invalidate cache
			invalidateEndpointCache(`/api/workspaces/${workspaceId}/projects/${projectId}`);
			invalidateCachePattern(new RegExp(`^/api/workspaces/${workspaceId}/projects`));

			// Invalidate all load functions to refetch "me" payload
			await invalidateAll();
		} catch (error) {
			// Rollback optimistic update
			if (projectToDelete) {
				const rollbackMap = new Map(this.projects);
				rollbackMap.set(workspaceId, [...this.getProjects(workspaceId), projectToDelete]);
				this.projects = rollbackMap;
				if (!this.currentProjectId) {
					this.currentProjectId = projectId;
				}
			} else {
				this.projects = previousProjects;
			}
			throw error;
		}
	}

	/**
	 * Clear all state
	 */
	clear(): void {
		this.profile = null;
		this.workspaces = [];
		this.projects = new Map();
		this.currentWorkspaceId = null;
		this.currentProjectId = null;
		this.currentWorkspaceRole = null;
	}
}

/**
 * Set portal state in context
 * Idempotent - returns existing state if already set
 */
export function setPortalState(): PortalState {
	const existing = getContext<PortalState>(Symbol.for(SYMBOL_KEY));
	if (existing) {
		return existing;
	}
	return setContext(Symbol.for(SYMBOL_KEY), new PortalState());
}

/**
 * Get portal state from context
 */
export function usePortal(): PortalState {
	const state = getContext<PortalState>(Symbol.for(SYMBOL_KEY));
	if (!state) {
		throw new Error('PortalState not found in context. Make sure to call setPortalState() first.');
	}
	return state;
}

