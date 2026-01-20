import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import type {
	AICitationDetail,
	AICitationSourceDetailHeader,
} from '$lib/types/ai-citations.js';

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

	// Call RPC function to get citations
	const { data: citationsData, error: rpcError } = await supabase.rpc(
		'get_ai_citations_source_citations',
		{
			project_id_param: projectId,
			publisher_param: publisherDecoded,
			days_param: daysParam,
			query_key_param: queryKeyParam,
		}
	);

	if (rpcError) {
		throw error(500, `Failed to fetch source citations: ${rpcError.message}`);
	}

	const citations: AICitationDetail[] = (citationsData || []).map((row: any) => ({
		run_finished_at: row.run_finished_at || '',
		query_key: row.query_key || '',
		rendered_query: row.rendered_query || '',
		claim_id: row.claim_id || '',
		claim_text: row.claim_text || '',
		source_url: row.source_url || '',
		publisher: row.publisher || publisherDecoded,
		snippet: row.snippet || '',
	}));

	// Calculate header stats
	const header: AICitationSourceDetailHeader = {
		publisher: publisherDecoded,
		citations_count: citations.length,
		claims_count: new Set(citations.map((c) => c.claim_id)).size,
		queries_count: new Set(citations.map((c) => c.rendered_query)).size,
		last_seen_at:
			citations.length > 0
				? citations.reduce((latest, c) =>
						c.run_finished_at > latest ? c.run_finished_at : latest
					, citations[0].run_finished_at)
				: '',
	};

	return json(
		{
			header,
			citations,
		},
		{
			headers: {
				'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
			},
		}
	);
};
