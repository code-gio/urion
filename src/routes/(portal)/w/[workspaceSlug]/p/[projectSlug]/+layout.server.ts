import type { LayoutServerLoad } from './$types';
import { getProjectBySlug } from '$lib/utils/workspace.js';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ params, locals: { safeGetSession, supabase }, parent }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const parentData = await parent();
	const workspace = parentData.workspace;

	if (!workspace) {
		throw error(404, 'Workspace not found');
	}

	const project = await getProjectBySlug(supabase, workspace.id, params.projectSlug);

	return {
		project,
		workspace: parentData.workspace,
		userRole: parentData.userRole,
	};
};

