import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type {
	GetSubmissionsParams,
	GetSubmissionsResponse,
	CreateSubmissionRequest,
	CreateSubmissionResponse,
	SubmissionStats,
} from '$lib/types';
import { applySecurity, clearRateLimit } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import { validateUUID } from '$lib/utils/validation.js';

export const GET: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: false,
		rateLimit: 'general',
		validateUUIDs: ['workspaceId', 'projectId'],
	});

	const { params, url, locals } = event;
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
	const status = url.searchParams.get('status');
	const isLive = url.searchParams.get('is_live');
	const sortBy = url.searchParams.get('sort_by') || 'created_at';
	const sortOrder = url.searchParams.get('sort_order') || 'desc';
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
	const offset = parseInt(url.searchParams.get('offset') || '0');

	// Build query
	let query = supabase
		.from('project_backlink_submissions')
		.select(
			`
      *,
      backlink_sites (*)
    `,
			{ count: 'exact' }
		)
		.eq('project_id', projectId);

	// Apply filters
	if (status) {
		query = query.eq('status', status);
	}
	if (isLive !== null) {
		query = query.eq('is_live', isLive === 'true');
	}

	// Apply sorting
	const ascending = sortOrder === 'asc';
	if (sortBy === 'created_at') {
		query = query.order('created_at', { ascending });
	} else if (sortBy === 'submitted_at') {
		query = query.order('submitted_at', { ascending, nullsFirst: true });
	} else if (sortBy === 'dr') {
		// Need to join and sort by site DR
		query = query.order('backlink_sites(dr)', { ascending, nullsFirst: true });
	} else {
		query = query.order('created_at', { ascending: false });
	}

	// Apply pagination
	query = query.range(offset, offset + limit - 1);

	const { data: submissionsData, error: submissionsError, count } = await query;

	if (submissionsError) {
		throw error(500, submissionsError.message);
	}

	// Get unique user IDs and fetch profiles
	const userIds = [...new Set((submissionsData || []).map((s: any) => s.submitted_by).filter(Boolean))];
	const userProfilesMap = new Map();
	
	if (userIds.length > 0) {
		const { data: profiles } = await supabase
			.from('profiles')
			.select('id, full_name, display_name, email')
			.in('id', userIds);
		
		if (profiles) {
			profiles.forEach((profile) => {
				userProfilesMap.set(profile.id, profile);
			});
		}
	}

	// Transform data
	const submissions = (submissionsData || []).map((submission: any) => {
		const site = submission.backlink_sites;
		const userProfile = submission.submitted_by ? userProfilesMap.get(submission.submitted_by) : null;

		return {
			...submission,
			site: site || null,
			submitted_by_user: userProfile
				? {
						id: userProfile.id,
						name: userProfile.full_name || userProfile.display_name || 'Unknown',
						email: userProfile.email || undefined,
					}
				: null,
		};
	});

	// Calculate stats
	const { data: allSubmissions } = await supabase
		.from('project_backlink_submissions')
		.select('status, is_live')
		.eq('project_id', projectId);

	const stats: SubmissionStats = {
		total: allSubmissions?.length || 0,
		not_started: allSubmissions?.filter((s) => s.status === 'not_started').length || 0,
		in_progress: allSubmissions?.filter((s) => s.status === 'in_progress').length || 0,
		submitted: allSubmissions?.filter((s) => s.status === 'submitted').length || 0,
		approved: allSubmissions?.filter((s) => s.status === 'approved').length || 0,
		rejected: allSubmissions?.filter((s) => s.status === 'rejected').length || 0,
		expired: allSubmissions?.filter((s) => s.status === 'expired').length || 0,
		live: allSubmissions?.filter((s) => s.is_live === true).length || 0,
	};

	const response: GetSubmissionsResponse = {
		submissions,
		total: count || 0,
		stats,
	};

	return json(response, {
		headers: {
			'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
		},
	});
};

export const POST: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'create',
		validateUUIDs: ['workspaceId', 'projectId'],
		maxBodySize: 10 * 1024, // 10KB
	});

	const { params, request, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const { workspaceId, projectId } = params;
	const supabase = locals.supabase;

	// Check access (member+ required)
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId, 'member');

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const body: CreateSubmissionRequest = await request.json();

	// Validate required fields
	if (!body.backlink_site_id) {
		throw error(400, 'backlink_site_id is required');
	}

	try {
		validateUUID(body.backlink_site_id, 'backlink_site_id');
	} catch (err) {
		throw error(400, err instanceof Error ? err.message : 'Invalid backlink_site_id');
	}

	// Check if site exists
	const { data: site, error: siteError } = await supabase
		.from('backlink_sites')
		.select('*')
		.eq('id', body.backlink_site_id)
		.eq('status', 'active')
		.single();

	if (siteError || !site) {
		throw error(404, 'Backlink site not found');
	}

	// Check if already tracking this site
	const { data: existing, error: existingError } = await supabase
		.from('project_backlink_submissions')
		.select('id')
		.eq('project_id', projectId)
		.eq('backlink_site_id', body.backlink_site_id)
		.single();

	if (existing && !existingError) {
		return json(
			{
				error: "You're already tracking this backlink site",
				existing_submission_id: existing.id,
			},
			{ status: 400 }
		);
	}

	// Create submission
	const { data: submission, error: submissionError } = await supabase
		.from('project_backlink_submissions')
		.insert({
			project_id: projectId,
			backlink_site_id: body.backlink_site_id,
			submitted_url: body.submitted_url || null,
			status: body.status || 'not_started',
			notes: body.notes || null,
			submitted_by: user.id,
		})
		.select(
			`
      *,
      backlink_sites (*)
    `
		)
		.single();

	if (submissionError) {
		throw error(500, submissionError.message);
	}

	// Clear rate limit on success
	await clearRateLimit(event, 'create');

	// Get user profile data
	let userProfile = null;
	if (user.id) {
		const { data: profile } = await supabase
			.from('profiles')
			.select('id, full_name, display_name, email')
			.eq('id', user.id)
			.single();
		userProfile = profile;
	}

	// Transform response
	const response: CreateSubmissionResponse = {
		success: true,
		message: 'Submission created successfully',
		submission: {
			...submission,
			site: submission.backlink_sites,
			submitted_by_user: userProfile
				? {
						id: userProfile.id,
						name: userProfile.full_name || userProfile.display_name || 'Unknown',
						email: userProfile.email || undefined,
					}
				: {
						id: user.id,
						name: user.email?.split('@')[0] || 'Unknown',
						email: user.email || undefined,
					},
		},
	};

	return json(response, {
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate',
		},
	});
};

