import type { PageServerLoad } from './$types';
import type { WorkspacePageData, WorkspaceMemberWithProfile } from '$lib/types';
import type { WorkspaceRole } from '$lib/types';
import { getWorkspaceBySlug } from '$lib/utils/workspace.js';

export const load: PageServerLoad = async ({
	params,
	locals: { safeGetSession, supabase },
	parent,
}) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		return {
			workspace: null,
			projects: [],
			members: [],
			userRole: null,
		} as WorkspacePageData;
	}

	const parentData = await parent();
	const workspace = parentData.workspace;
	const userRole = parentData.userRole as WorkspaceRole;

	if (!workspace) {
		return {
			workspace: null,
			projects: [],
			members: [],
			userRole: null,
		} as WorkspacePageData;
	}

	// Load projects
	const { data: projects } = await supabase
		.from('projects')
		.select('*')
		.eq('workspace_id', workspace.id)
		.eq('status', 'active')
		.order('created_at', { ascending: false });

	// Load members with profiles
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

	return {
		workspace,
		projects: projects || [],
		members,
		userRole,
	} as WorkspacePageData;
};

