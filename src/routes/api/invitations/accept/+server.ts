import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { WorkspaceMember } from '$lib/types';
import { applySecurity, clearRateLimit } from '$lib/utils/api-security.js';

export const POST: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'update',
		maxBodySize: 1 * 1024, // 1KB
	});

	const { locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const supabase = locals.supabase;

	if (!user.email) {
		throw error(400, 'User email is required');
	}

	// Accept all pending invitations for this user's email
	const { data: accepted, error: err } = await supabase.rpc('accept_workspace_invitation', {
		user_uuid: user.id,
		user_email: user.email,
	});

	if (err) {
		throw error(500, 'Failed to accept invitations');
	}

	// Clear rate limit on success
	await clearRateLimit(event, 'update');

	return json({ accepted: (accepted as WorkspaceMember[]) || [] });
};

