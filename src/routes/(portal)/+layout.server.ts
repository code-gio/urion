import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { Profile, WorkspaceListItem, MePayload, WorkspaceRole, MemberStatus } from '$lib/types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase }, url }) => {
	const { session, user } = await safeGetSession();

	// Redirect to sign-in if not authenticated
	if (!session || !user) {
		const currentPath = url.pathname + url.search;
		throw redirect(303, `/sign-in?redirect_to=${encodeURIComponent(currentPath)}`);
	}

	// Load user profile
	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	if (profileError) {
		console.error('Failed to load profile:', profileError);
	}

	// Load all user workspaces using database function
	const { data: workspacesData, error: workspacesError } = await supabase.rpc(
		'get_user_workspaces',
		{
			user_uuid: user.id,
		}
	);

	const workspaces: WorkspaceListItem[] =
		workspacesData?.map((w: {
			workspace_id: string;
			workspace_name: string;
			workspace_slug: string;
			user_role: string;
			member_status: string;
			created_at: string;
		}) => ({
			id: w.workspace_id,
			name: w.workspace_name,
			slug: w.workspace_slug,
			role: w.user_role as WorkspaceRole,
			status: w.member_status as MemberStatus,
			created_at: w.created_at,
		})) || [];

	// Load all projects user has access to (all projects in workspaces where user is a member)
	const workspaceIds = workspaces.map((w) => w.id);
	let projects: Array<{ id: string; workspace_id: string; name: string; slug: string }> = [];

	if (workspaceIds.length > 0) {
		const { data: projectsData, error: projectsError } = await supabase
			.from('projects')
			.select('id, workspace_id, name, slug')
			.in('workspace_id', workspaceIds)
			.eq('status', 'active');

		if (projectsError) {
			console.error('Failed to load projects:', projectsError);
		} else {
			projects = (projectsData || []).map((p) => ({
				id: p.id,
				workspace_id: p.workspace_id,
				name: p.name,
				slug: p.slug,
			}));
		}
	}

	// Build unified "me" payload
	const me: MePayload = {
		user: { id: user.id, email: user.email || null },
		profile: (profile as Profile) || null,
		workspaces,
		projects,
	};

	return {
		session,
		user,
		profile: (profile as Profile) || null,
		me,
	};
};

