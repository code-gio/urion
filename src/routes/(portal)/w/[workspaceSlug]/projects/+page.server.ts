import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase }, parent }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		return {
			projects: [],
			workspace: null,
		};
	}

	const parentData = await parent();
	const workspace = parentData.workspace;

	if (!workspace) {
		return {
			projects: [],
			workspace: null,
		};
	}

	const { data: projects } = await supabase
		.from('projects')
		.select('*')
		.eq('workspace_id', workspace.id)
		.order('created_at', { ascending: false });

	return {
		projects: projects || [],
		workspace,
	};
};

