import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { InviteMemberRequest, WorkspaceMemberInsert } from '$lib/types';
import { canManageMembers } from '$lib/types';
import type { WorkspaceRole, MemberStatus } from '$lib/types';
import { applySecurity, clearRateLimit } from '$lib/utils/api-security.js';
import { validateEmail, validateWorkspaceRole } from '$lib/utils/validation.js';

export const POST: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'invite',
		validateUUIDs: ['workspaceId'],
		maxBodySize: 1 * 1024, // 1KB
	});

	const { params, request, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const supabase = locals.supabase;
	const body: InviteMemberRequest = await request.json();

	// Validate and sanitize email
	try {
		body.email = validateEmail(body.email);
		if (body.role) {
			body.role = validateWorkspaceRole(body.role);
		}
	} catch (err) {
		throw error(400, err instanceof Error ? err.message : 'Invalid input');
	}

	// Check if user is owner/admin
	const { data: inviter } = await supabase
		.from('workspace_members')
		.select('role')
		.eq('workspace_id', params.workspaceId)
		.eq('user_id', user.id)
		.single();

	if (!inviter || !canManageMembers(inviter.role as WorkspaceRole)) {
		throw error(403, 'Insufficient permissions');
	}

	// Check if user already exists with this email
	const { data: existingUser } = await supabase
		.from('profiles')
		.select('id')
		.eq('email', body.email)
		.single();

	// If user exists, check if already a member
	if (existingUser) {
		const { data: existingMember } = await supabase
			.from('workspace_members')
			.select('id')
			.eq('workspace_id', params.workspaceId)
			.eq('user_id', existingUser.id)
			.single();

		if (existingMember) {
			throw error(409, 'User is already a member');
		}
	}

	// Create invitation
	const memberInsert: WorkspaceMemberInsert = {
		workspace_id: params.workspaceId,
		invited_email: body.email,
		invited_by: user.id,
		role: (body.role || 'member') as WorkspaceRole,
		status: 'invited' as MemberStatus,
		user_id: existingUser?.id || null,
	};

	const { data: invitation, error: err } = await supabase
		.from('workspace_members')
		.insert(memberInsert)
		.select()
		.single();

	if (err) {
		throw error(500, 'Failed to create invitation');
	}

	// TODO: Send invitation email
	// await sendInvitationEmail(body.email, workspace, inviter);

	// Clear rate limit on success
	await clearRateLimit(event, 'invite');

	return json(invitation, { status: 201 });
};

