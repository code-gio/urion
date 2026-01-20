import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import type { AICitationSource } from '$lib/types/ai-citations.js';

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

	const { workspaceId, projectId } = params;
	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	// Get query parameters
	const daysParam = parseInt(url.searchParams.get('days') || '7', 10);
	const queryKeyParam = url.searchParams.get('query_key') || null;

	// Validate days parameter
	if (isNaN(daysParam) || daysParam < 1 || daysParam > 365) {
		throw error(400, 'Invalid days parameter. Must be between 1 and 365.');
	}

	// Call RPC function directly - let it handle the filtering
	// The RPC function will return empty results if no data exists
	const { data, error: rpcError } = await supabase.rpc('get_ai_citations_sources', {
		project_id_param: projectId,
		days_param: daysParam,
		query_key_param: queryKeyParam,
	});

	if (rpcError) {
		// If RPC function doesn't exist, return empty array instead of error
		// This allows the UI to show a helpful message
		if (rpcError.code === '42883' || rpcError.message?.includes('does not exist')) {
			return json([], {
				headers: {
					'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
				},
			});
		}
		throw error(500, `Failed to fetch sources: ${rpcError.message}`);
	}

	const sources: AICitationSource[] = (data || []).map((row: any) => ({
		publisher: row.publisher || '',
		citations_count: Number(row.citations_count) || 0,
		claims_count: Number(row.claims_count) || 0,
		queries_count: Number(row.queries_count) || 0,
		last_seen_at: row.last_seen_at || '',
	}));

	return json(sources, {
		headers: {
			'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
		},
	});
};
