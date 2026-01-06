import { getContext, setContext } from 'svelte';
import type { Profile, WorkspaceListItem } from '$lib/types';
import { patch, invalidateEndpointCache } from '$lib/api/client.js';

const SYMBOL_KEY = 'urion-user-state';

class UserState {
	profile = $state<Profile | null>(null);
	workspaces = $state<WorkspaceListItem[]>([]);
	isLoading = $state(false);

	/**
	 * Sync profile from server data
	 */
	syncProfile(profile: Profile | null): void {
		this.profile = profile;
	}

	/**
	 * Sync workspaces list from server data
	 */
	syncWorkspaces(workspaces: WorkspaceListItem[]): void {
		this.workspaces = workspaces;
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

			return profile;
		} catch (error) {
			// Rollback optimistic update
			this.profile = previousProfile;
			throw error;
		}
	}

	/**
	 * Clear user state
	 */
	clear(): void {
		this.profile = null;
		this.workspaces = [];
	}
}

/**
 * Set user state in context
 * Idempotent - returns existing state if already set
 */
export function setUserState(): UserState {
	const existing = getContext<UserState>(Symbol.for(SYMBOL_KEY));
	if (existing) {
		return existing;
	}
	return setContext(Symbol.for(SYMBOL_KEY), new UserState());
}

/**
 * Get user state from context
 */
export function useUser(): UserState {
	const state = getContext<UserState>(Symbol.for(SYMBOL_KEY));
	if (!state) {
		throw new Error('UserState not found in context. Make sure to call setUserState() first.');
	}
	return state;
}


