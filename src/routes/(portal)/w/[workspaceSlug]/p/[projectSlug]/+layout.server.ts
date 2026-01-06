import type { LayoutServerLoad } from './$types';
import { getProjectBySlug } from '$lib/utils/workspace.js';
import { checkProjectAccess } from '$lib/server/tools.js';
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

	// Load activated tools for navigation
	let activatedTools: any[] = [];
	const { authorized } = await checkProjectAccess(supabase, user.id, workspace.id, project.id);
	
	if (authorized) {
		// Get activated tools for this project
		const { data: activationsData } = await supabase
			.from('project_tools')
			.select(
				`
        tool_id,
        tools (
          id,
          slug,
          name,
          icon_url
        )
      `
			)
			.eq('project_id', project.id)
			.eq('is_enabled', true);

		if (activationsData) {
			activatedTools = activationsData
				.map((act: any) => act.tools)
				.filter((tool: any) => tool !== null)
				.map((tool: any) => ({
					id: tool.id,
					slug: tool.slug,
					name: tool.name,
					icon_url: tool.icon_url,
				}));
		}
	}

	return {
		project,
		workspace: parentData.workspace,
		userRole: parentData.userRole,
		activatedTools,
	};
};

