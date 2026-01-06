import type { LayoutServerLoad } from './$types';
import { getWorkspaceBySlug } from '$lib/utils/workspace.js';
import type { WorkspaceRole } from '$lib/types';

export const load: LayoutServerLoad = async ({
	params,
	locals: { safeGetSession, supabase },
}) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		return {
			workspace: null,
			userRole: null,
		};
	}

	const { workspace, userRole } = await getWorkspaceBySlug(
		supabase,
		params.workspaceSlug,
		user.id
	);

	return {
		workspace,
		userRole: userRole as WorkspaceRole,
	};
};

