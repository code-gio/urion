import type { PageServerLoad } from './$types';
import { checkProjectAccess } from '$lib/server/tools.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const parentData = await parent();
	const { workspace, project } = parentData;

	if (!workspace || !project) {
		throw error(404, 'Workspace or project not found');
	}

	// Check access
	const { authorized } = await checkProjectAccess(
		locals.supabase,
		user.id,
		workspace.id,
		project.id
	);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	// Load topic clusters
	const { data: clusters } = await locals.supabase
		.from('project_topic_clusters')
		.select('*')
		.eq('project_id', project.id)
		.eq('workspace_id', workspace.id)
		.order('is_pillar', { ascending: false })
		.order('created_at', { ascending: false });

	// Load keywords
	const { data: keywords } = await locals.supabase
		.from('project_keywords')
		.select('*')
		.eq('project_id', project.id)
		.eq('workspace_id', workspace.id)
		.order('created_at', { ascending: false });

	// Load project settings for SEO guidelines
	const { data: settings } = await locals.supabase
		.from('project_settings')
		.select('settings')
		.eq('project_id', project.id)
		.eq('workspace_id', workspace.id)
		.single();

	return {
		workspace,
		project,
		canEdit: parentData.canEdit,
		clusters: clusters || [],
		keywords: keywords || [],
		seoSettings: settings?.settings?.seo || {}
	};
};
