import type { LayoutServerLoad } from './$types';
import { getWorkspaceBySlug } from '$lib/utils/workspace.js';
import type { WorkspaceRole, WorkspaceListItem } from '$lib/types';

export const load: LayoutServerLoad = async ({
	params,
	locals: { safeGetSession, supabase },
	parent,
}) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		return {
			workspace: null,
			userRole: null,
			workspaces: [],
			user: null,
			profile: null,
		};
	}

	const parentData = await parent();
	const { workspace, userRole } = await getWorkspaceBySlug(
		supabase,
		params.workspaceSlug,
		user.id
	);

	// Load user workspaces for the switcher
	const { data: workspacesData } = await supabase.rpc('get_user_workspaces', {
		user_uuid: user.id,
	});

	const workspaces: WorkspaceListItem[] =
		workspacesData?.map((w) => ({
			id: w.workspace_id,
			name: w.workspace_name,
			slug: w.workspace_slug,
			role: w.user_role as WorkspaceRole,
			status: w.member_status,
			created_at: w.created_at,
		})) || [];

	return {
		workspace,
		userRole: userRole as WorkspaceRole,
		workspaces,
		user: parentData.user,
		profile: parentData.profile,
	};
};

