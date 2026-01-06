import type { PageServerLoad } from './$types';
import type { WorkspaceMemberWithProfile } from '$lib/types';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase }, parent }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		return {
			members: [],
			pendingInvites: [],
		};
	}

	const parentData = await parent();
	const workspace = parentData.workspace;

	if (!workspace) {
		return {
			members: [],
			pendingInvites: [],
		};
	}

	// Load active members with profiles
	const { data: membersData } = await supabase
		.from('workspace_members')
		.select(
			`
      *,
      profiles (
        full_name,
        email,
        avatar_url,
        display_name
      )
    `
		)
		.eq('workspace_id', workspace.id)
		.eq('status', 'active')
		.order('created_at', { ascending: false });

	const members: WorkspaceMemberWithProfile[] =
		membersData?.map((m) => ({
			...m,
			profiles: m.profiles || null,
		})) || [];

	// Load pending invitations
	const { data: invitesData } = await supabase
		.from('workspace_members')
		.select(
			`
      *,
      profiles:invited_by (
        full_name,
        email,
        avatar_url,
        display_name
      )
    `
		)
		.eq('workspace_id', workspace.id)
		.eq('status', 'invited')
		.order('created_at', { ascending: false });

	const pendingInvites: WorkspaceMemberWithProfile[] =
		invitesData?.map((m) => ({
			...m,
			profiles: m.profiles || null,
		})) || [];

	return {
		members,
		pendingInvites,
	};
};

