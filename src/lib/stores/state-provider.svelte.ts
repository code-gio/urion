import { setWorkspaceState, setProjectState, setUserState } from './index.js';
import type { Workspace, WorkspaceListItem, Project, Profile } from '$lib/types';

/**
 * Initialize all state classes and return them
 * This should be called once at the root layout level
 */
export function initState() {
	const workspaceState = setWorkspaceState();
	const projectState = setProjectState();
	const userState = setUserState();

	return {
		workspace: workspaceState,
		project: projectState,
		user: userState,
	};
}


