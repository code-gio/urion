import { getContext, setContext } from 'svelte';
import type { Project, ProjectUpdate } from '$lib/types';
import { post, patch, del, invalidateEndpointCache } from '$lib/api/client.js';
import { invalidateCachePattern } from '$lib/api/cache.js';

const SYMBOL_KEY = 'urion-project-state';

class ProjectState {
	current = $state<Project | null>(null);
	list = $state<Map<string, Project[]>>(new Map()); // Map<workspaceId, Project[]>
	isLoading = $state(false);

	/**
	 * Sync project from server data
	 */
	syncProject(project: Project | null): void {
		this.current = project;
	}

	/**
	 * Sync project list for a workspace
	 */
	syncProjectList(workspaceId: string, projects: Project[]): void {
		this.list.set(workspaceId, projects);
	}

	/**
	 * Get project list for a workspace
	 */
	getProjects(workspaceId: string): Project[] {
		return this.list.get(workspaceId) || [];
	}

	/**
	 * Set loading state
	 */
	setLoading(loading: boolean): void {
		this.isLoading = loading;
	}

	/**
	 * Create project (optimistic update)
	 */
	async createProject(workspaceId: string, name: string, slug: string, websiteUrl?: string | null): Promise<Project> {
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
		this.list.set(workspaceId, [...currentList, tempProject]);

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
			this.list.set(workspaceId, updatedList);

			// Invalidate cache
			invalidateEndpointCache(`/api/workspaces/${workspaceId}/projects`);
			invalidateCachePattern(new RegExp(`^/api/workspaces/${workspaceId}/projects`));

			return project;
		} catch (error) {
			// Rollback optimistic update
			const updatedList = this.getProjects(workspaceId).filter((p) => p.id !== tempProject.id);
			this.list.set(workspaceId, updatedList);
			throw error;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Update project (optimistic update)
	 */
	async updateProject(workspaceId: string, projectId: string, updates: ProjectUpdate): Promise<Project> {
		if (!this.current || this.current.id !== projectId) {
			throw new Error('Project not loaded');
		}

		// Optimistic update: update current project
		const previousProject = { ...this.current };
		this.current = { ...this.current, ...updates };

		// Update in list if present
		const currentList = this.getProjects(workspaceId);
		this.list.set(
			workspaceId,
			currentList.map((p) =>
				p.id === projectId
					? {
							...p,
							name: updates.name ?? p.name,
							slug: updates.slug ?? p.slug,
							website_url: updates.website_url ?? p.website_url,
							status: updates.status ?? p.status,
						}
					: p
			)
		);

		try {
			const project = await patch<Project>(`/api/workspaces/${workspaceId}/projects/${projectId}`, updates);

			// Update with server response
			this.current = project;
			const updatedList = this.getProjects(workspaceId).map((p) =>
				p.id === projectId ? project : p
			);
			this.list.set(workspaceId, updatedList);

			// Invalidate cache
			invalidateEndpointCache(`/api/workspaces/${workspaceId}/projects/${projectId}`);
			invalidateCachePattern(new RegExp(`^/api/workspaces/${workspaceId}/projects`));

			return project;
		} catch (error) {
			// Rollback optimistic update
			this.current = previousProject;
			const updatedList = this.getProjects(workspaceId).map((p) =>
				p.id === projectId ? previousProject : p
			);
			this.list.set(workspaceId, updatedList);
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
		this.list.set(workspaceId, currentList.filter((p) => p.id !== projectId));

		// Clear current if it's the deleted project
		if (this.current?.id === projectId) {
			this.current = null;
		}

		try {
			await del(`/api/workspaces/${workspaceId}/projects/${projectId}`);

			// Invalidate cache
			invalidateEndpointCache(`/api/workspaces/${workspaceId}/projects/${projectId}`);
			invalidateCachePattern(new RegExp(`^/api/workspaces/${workspaceId}/projects`));
		} catch (error) {
			// Rollback optimistic update
			if (projectToDelete) {
				this.list.set(workspaceId, [...this.getProjects(workspaceId), projectToDelete]);
				if (!this.current) {
					this.current = projectToDelete;
				}
			}
			throw error;
		}
	}

	/**
	 * Clear project state
	 */
	clear(): void {
		this.current = null;
	}

	/**
	 * Clear projects for a workspace
	 */
	clearWorkspaceProjects(workspaceId: string): void {
		this.list.delete(workspaceId);
		if (this.current?.workspace_id === workspaceId) {
			this.current = null;
		}
	}
}

/**
 * Set project state in context
 * Idempotent - returns existing state if already set
 */
export function setProjectState(): ProjectState {
	const existing = getContext<ProjectState>(Symbol.for(SYMBOL_KEY));
	if (existing) {
		return existing;
	}
	return setContext(Symbol.for(SYMBOL_KEY), new ProjectState());
}

/**
 * Get project state from context
 */
export function useProject(): ProjectState {
	const state = getContext<ProjectState>(Symbol.for(SYMBOL_KEY));
	if (!state) {
		throw new Error('ProjectState not found in context. Make sure to call setProjectState() first.');
	}
	return state;
}


