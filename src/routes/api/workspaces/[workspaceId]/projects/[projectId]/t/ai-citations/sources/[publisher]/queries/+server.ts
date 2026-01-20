import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import type { AICitationSourceQuery } from '$lib/types/ai-citations.js';

export const GET: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: false,
		rateLimit: 'general',
		validateUUIDs: ['workspaceId', 'projectId'],
	});

	const { locals, params, url } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const { workspaceId, projectId, publisher } = params;
	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	// Decode publisher parameter (URL-encoded)
	const publisherDecoded = decodeURIComponent(publisher);

	// Get query parameters
	const daysParam = parseInt(url.searchParams.get('days') || '7', 10);
	const queryKeyParam = url.searchParams.get('query_key') || null;

	// Validate days parameter
	if (isNaN(daysParam) || daysParam < 1 || daysParam > 365) {
		throw error(400, 'Invalid days parameter. Must be between 1 and 365.');
	}

	// Call RPC function
	const { data, error: rpcError } = await supabase.rpc('get_ai_citations_source_queries', {
		project_id_param: projectId,
		publisher_param: publisherDecoded,
		days_param: daysParam,
		query_key_param: queryKeyParam,
	});

	if (rpcError) {
		throw error(500, `Failed to fetch source queries: ${rpcError.message}`);
	}

	const queries: AICitationSourceQuery[] = (data || []).map((row: any) => ({
		query_key: row.query_key || '',
		rendered_query: row.rendered_query || '',
		citations_count: Number(row.citations_count) || 0,
		last_seen_at: row.last_seen_at || '',
	}));

	return json(queries, {
		headers: {
			'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
		},
	});
};
