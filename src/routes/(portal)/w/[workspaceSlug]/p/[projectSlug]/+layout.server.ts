import type { LayoutServerLoad } from './$types';
import { getProjectBySlug } from '$lib/utils/workspace.js';

export const load: LayoutServerLoad = async ({
	params,
	locals: { safeGetSession, supabase },
	parent,
}) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		return {
			project: null,
			workspace: null,
			userRole: null,
			projects: [],
		};
	}

	const parentData = await parent();
	const workspace = parentData.workspace;

	if (!workspace) {
		return {
			project: null,
			workspace: null,
			userRole: null,
			projects: [],
		};
	}

	const project = await getProjectBySlug(supabase, workspace.id, params.projectSlug);

	// Load projects for the workspace
	const { data: projects } = await supabase
		.from('projects')
		.select('*')
		.eq('workspace_id', workspace.id)
		.eq('status', 'active')
		.order('created_at', { ascending: false });

	return {
		project,
		workspace,
		userRole: parentData.userRole,
		projects: projects || [],
	};
};

