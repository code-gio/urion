import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GetBacklinkSiteResponse } from '$lib/types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';

export const GET: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: false,
		rateLimit: 'general',
		validateUUIDs: ['workspaceId', 'projectId', 'siteId'],
	});

	const { params, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const { workspaceId, projectId, siteId } = params;
	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	// Get site
	const { data: site, error: siteError } = await supabase
		.from('backlink_sites')
		.select('*')
		.eq('id', siteId)
		.eq('status', 'active')
		.single();

	if (siteError || !site) {
		throw error(404, 'Backlink site not found');
	}

	// Get submission for this project if exists
	const { data: submission, error: submissionError } = await supabase
		.from('project_backlink_submissions')
		.select('*')
		.eq('project_id', projectId)
		.eq('backlink_site_id', siteId)
		.single();

	// submissionError is expected if no submission exists, so we ignore it
	const response: GetBacklinkSiteResponse = {
		site,
		submission: submission || null,
	};

	return json(response, {
		headers: {
			'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
		},
	});
};

