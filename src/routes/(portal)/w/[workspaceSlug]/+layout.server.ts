import type { LayoutServerLoad } from './$types';
import type { WorkspaceRole } from '$lib/types';
import { getWorkspaceBySlug } from '$lib/utils/workspace.js';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ params, locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const { workspace, userRole } = await getWorkspaceBySlug(supabase, params.workspaceSlug, user.id);

	return {
		workspace,
		userRole: userRole as WorkspaceRole,
	};
};

