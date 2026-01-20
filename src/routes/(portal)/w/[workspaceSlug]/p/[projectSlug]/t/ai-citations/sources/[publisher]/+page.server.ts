import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { checkProjectAccess } from '$lib/server/tools.js';

export const load: PageServerLoad = async ({ parent, params, locals, url }) => {
	const parentData = await parent();
	const { workspace, project, userRole } = parentData;

	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
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

	// Decode publisher parameter
	const publisher = decodeURIComponent(params.publisher);

	// Get query parameters
	const days = parseInt(url.searchParams.get('days') || '7', 10);
	const queryKey = url.searchParams.get('query_key') || null;

	// Build API URL
	const baseUrl = `/api/workspaces/${workspace.id}/projects/${project.id}/t/ai-citations/sources/${encodeURIComponent(publisher)}`;
	const paramsUrl = new URLSearchParams();
	if (days !== 7) paramsUrl.append('days', days.toString());
	if (queryKey) paramsUrl.append('query_key', queryKey);

	const citationsUrl = `${baseUrl}?${paramsUrl.toString()}`;
	const queriesUrl = `${baseUrl}/queries?${paramsUrl.toString()}`;

	return {
		workspace,
		project,
		userRole,
		canEdit: true, // TODO: Use proper role check
		publisher,
		days,
		queryKey,
		citationsUrl,
		queriesUrl,
	};
};
