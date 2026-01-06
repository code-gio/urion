import type { PageServerLoad } from './$types';
import type { AppPageData, WorkspaceListItem, WorkspaceMemberWithProfile } from '$lib/types';
import type { WorkspaceRole, MemberStatus } from '$lib/types';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		return {
			workspaces: [],
			pendingInvites: [],
		} as AppPageData;
	}

	// Load user workspaces using database function
	const { data: workspacesData, error: workspacesError } = await supabase.rpc(
		'get_user_workspaces',
		{
			user_uuid: user.id,
		}
	);

	const workspaces: WorkspaceListItem[] =
		workspacesData?.map((w) => ({
			id: w.workspace_id,
			name: w.workspace_name,
			slug: w.workspace_slug,
			role: w.user_role as WorkspaceRole,
			status: w.member_status as MemberStatus,
			created_at: w.created_at,
		})) || [];

	// Load pending invitations (where invited_email matches user email)
	const pendingInvites: WorkspaceMemberWithProfile[] = [];
	if (user.email) {
		const { data: invitesData } = await supabase
			.from('workspace_members')
			.select(
				`
        *,
        profiles:workspaces!inner (
          id,
          name,
          slug
        )
      `
			)
			.eq('invited_email', user.email)
			.eq('status', 'invited');

		if (invitesData) {
			for (const invite of invitesData) {
				// Get workspace details
				const { data: workspace } = await supabase
					.from('workspaces')
					.select('name, slug')
					.eq('id', invite.workspace_id)
					.single();

				// Get inviter profile if available
				let inviterProfile = null;
				if (invite.invited_by) {
					const { data: profile } = await supabase
						.from('profiles')
						.select('full_name, email, avatar_url, display_name')
						.eq('id', invite.invited_by)
						.single();
					inviterProfile = profile;
				}

				pendingInvites.push({
					...invite,
					profiles: inviterProfile,
				} as WorkspaceMemberWithProfile);
			}
		}
	}

	return {
		workspaces,
		pendingInvites,
	} as AppPageData;
};

