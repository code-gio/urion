import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GetToolsResponse, GetToolsParams } from '$lib/types';
import { applySecurity } from '$lib/utils/api-security.js';

export const GET: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: false, // GET requests don't need CSRF
		rateLimit: 'general',
	});

	const { locals, url } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const supabase = locals.supabase;

	// Get query parameters
	const category = url.searchParams.get('category');
	const status = url.searchParams.get('status') || 'active';
	const search = url.searchParams.get('search');

	// Build query
	let query = supabase.from('tools').select('*').eq('status', status);

	if (category) {
		query = query.eq('category', category);
	}

	if (search) {
		query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
	}

	query = query.order('category').order('name');

	const { data: tools, error: err } = await query;

	if (err) {
		throw error(500, err.message);
	}

	const response: GetToolsResponse = {
		tools: tools || [],
	};

	return json(response, {
		headers: {
			'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
		},
	});
};

