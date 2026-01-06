import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type {
	UpdateSubmissionRequest,
	UpdateSubmissionResponse,
} from '$lib/types';
import { applySecurity, clearRateLimit } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import { validateURL, validateLength } from '$lib/utils/validation.js';

export const GET: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: false,
		rateLimit: 'general',
		validateUUIDs: ['workspaceId', 'projectId', 'submissionId'],
	});

	const { params, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const { workspaceId, projectId, submissionId } = params;
	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	// Get submission with site data
	const { data: submission, error: submissionError } = await supabase
		.from('project_backlink_submissions')
		.select(
			`
      *,
      backlink_sites (*)
    `
		)
		.eq('id', submissionId)
		.eq('project_id', projectId)
		.single();

	if (submissionError || !submission) {
		throw error(404, 'Submission not found');
	}

	// Get user profile
	let userProfile = null;
	if (submission.submitted_by) {
		const { data: profile } = await supabase
			.from('profiles')
			.select('id, full_name, display_name, email')
			.eq('id', submission.submitted_by)
			.single();
		userProfile = profile;
	}

	// Transform response
	const response = {
		submission: {
			...submission,
			site: submission.backlink_sites,
			submitted_by_user: userProfile
				? {
						id: userProfile.id,
						name: userProfile.full_name || userProfile.display_name || 'Unknown',
						email: userProfile.email || undefined,
					}
				: null,
		},
	};

	return json(response, {
		headers: {
			'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
		},
	});
};

export const PATCH: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'update',
		validateUUIDs: ['workspaceId', 'projectId', 'submissionId'],
		maxBodySize: 10 * 1024, // 10KB
	});

	const { params, request, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const { workspaceId, projectId, submissionId } = params;
	const supabase = locals.supabase;

	// Check access (member+ required)
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId, 'member');

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	// Get existing submission
	const { data: existing, error: existingError } = await supabase
		.from('project_backlink_submissions')
		.select('*')
		.eq('id', submissionId)
		.eq('project_id', projectId)
		.single();

	if (existingError || !existing) {
		throw error(404, 'Submission not found');
	}

	const body: UpdateSubmissionRequest = await request.json();

	// Validate and sanitize input
	const updateData: any = {};

	if (body.status !== undefined) {
		updateData.status = body.status;
	}
	if (body.is_live !== undefined) {
		updateData.is_live = body.is_live;
	}
	if (body.backlink_url !== undefined) {
		try {
			updateData.backlink_url = body.backlink_url ? validateURL(body.backlink_url) : null;
		} catch (err) {
			throw error(400, err instanceof Error ? err.message : 'Invalid backlink_url');
		}
	}
	if (body.submission_page_url !== undefined) {
		try {
			updateData.submission_page_url = body.submission_page_url
				? validateURL(body.submission_page_url)
				: null;
		} catch (err) {
			throw error(400, err instanceof Error ? err.message : 'Invalid submission_page_url');
		}
	}
	if (body.anchor_text !== undefined) {
		try {
			updateData.anchor_text = body.anchor_text
				? validateLength(body.anchor_text, 0, 255, 'Anchor text', true)
				: null;
		} catch (err) {
			throw error(400, err instanceof Error ? err.message : 'Invalid anchor_text');
		}
	}
	if (body.account_username !== undefined) {
		try {
			updateData.account_username = body.account_username
				? validateLength(body.account_username, 0, 100, 'Account username', true)
				: null;
		} catch (err) {
			throw error(400, err instanceof Error ? err.message : 'Invalid account_username');
		}
	}
	if (body.account_email !== undefined) {
		updateData.account_email = body.account_email || null;
	}
	if (body.notes !== undefined) {
		updateData.notes = body.notes || null;
	}
	if (body.rejection_reason !== undefined) {
		updateData.rejection_reason = body.rejection_reason || null;
	}
	if (body.referral_traffic !== undefined) {
		updateData.referral_traffic = body.referral_traffic || null;
	}
	if (body.conversion_count !== undefined) {
		updateData.conversion_count = body.conversion_count || null;
	}
	if (body.increment_attempts) {
		updateData.attempts = (existing.attempts || 0) + 1;
	}

	// Handle status transitions and timestamps
	const now = new Date().toISOString();
	if (body.status) {
		if (body.status === 'in_progress' && existing.status === 'not_started') {
			updateData.started_at = existing.started_at || now;
		} else if (body.status === 'submitted' && existing.status !== 'submitted') {
			updateData.submitted_at = existing.submitted_at || now;
		} else if (body.status === 'approved' && existing.status !== 'approved') {
			updateData.approved_at = existing.approved_at || now;
			updateData.is_live = body.is_live !== undefined ? body.is_live : true;
		} else if (body.status === 'rejected' && existing.status !== 'rejected') {
			updateData.rejected_at = now;
		}
	}

	// Update submission
	const { data: submission, error: updateError } = await supabase
		.from('project_backlink_submissions')
		.update(updateData)
		.eq('id', submissionId)
		.eq('project_id', projectId)
		.select(
			`
      *,
      backlink_sites (*)
    `
		)
		.single();

	if (updateError) {
		throw error(500, updateError.message);
	}

	// Clear rate limit on success
	await clearRateLimit(event, 'update');

	// Get user profile
	let userProfile = null;
	if (submission.submitted_by) {
		const { data: profile } = await supabase
			.from('profiles')
			.select('id, full_name, display_name, email')
			.eq('id', submission.submitted_by)
			.single();
		userProfile = profile;
	}

	// Transform response
	const response: UpdateSubmissionResponse = {
		success: true,
		message: 'Submission updated successfully',
		submission: {
			...submission,
			site: submission.backlink_sites,
			submitted_by_user: userProfile
				? {
						id: userProfile.id,
						name: userProfile.full_name || userProfile.display_name || 'Unknown',
						email: userProfile.email || undefined,
					}
				: null,
		},
	};

	return json(response, {
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate',
		},
	});
};

export const DELETE: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'delete',
		validateUUIDs: ['workspaceId', 'projectId', 'submissionId'],
	});

	const { params, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const { workspaceId, projectId, submissionId } = params;
	const supabase = locals.supabase;

	// Check access (member+ required)
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId, 'member');

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	// Delete submission
	const { error: deleteError } = await supabase
		.from('project_backlink_submissions')
		.delete()
		.eq('id', submissionId)
		.eq('project_id', projectId);

	if (deleteError) {
		throw error(500, deleteError.message);
	}

	// Clear rate limit on success
	await clearRateLimit(event, 'delete');

	return json(
		{
			success: true,
			message: 'Submission deleted successfully',
		},
		{
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate',
			},
		}
	);
};

