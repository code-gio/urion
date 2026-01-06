import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { UpdateMemberRoleRequest, WorkspaceMemberUpdate } from '$lib/types';
import { canManageMembers } from '$lib/types';
import type { WorkspaceRole } from '$lib/types';
import { applySecurity } from '$lib/utils/api-security.js';
import { validateWorkspaceRole } from '$lib/utils/validation.js';

export const PATCH: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'update',
		validateUUIDs: ['workspaceId', 'memberId'],
		maxBodySize: 1 * 1024, // 1KB
	});

	const { params, request, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const supabase = locals.supabase;
	const body: UpdateMemberRoleRequest = await request.json();

	// Validate role
	try {
		body.role = validateWorkspaceRole(body.role);
	} catch (err) {
		throw error(400, err instanceof Error ? err.message : 'Invalid role');
	}

	// Check if user is owner/admin
	const { data: requester } = await supabase
		.from('workspace_members')
		.select('role')
		.eq('workspace_id', params.workspaceId)
		.eq('user_id', user.id)
		.single();

	if (!requester || !canManageMembers(requester.role as WorkspaceRole)) {
		throw error(403, 'Insufficient permissions');
	}

	// Update member role
	const memberUpdate: WorkspaceMemberUpdate = {
		role: body.role,
	};

	const { data: member, error: err } = await supabase
		.from('workspace_members')
		.update(memberUpdate)
		.eq('id', params.memberId)
		.eq('workspace_id', params.workspaceId)
		.select()
		.single();

	if (err) {
		throw error(500, 'Failed to update member role');
	}

	return json(member);
};

export const DELETE: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'delete',
		validateUUIDs: ['workspaceId', 'memberId'],
	});

	const { params, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const supabase = locals.supabase;

	// Get member to be removed
	const { data: memberToRemove } = await supabase
		.from('workspace_members')
		.select('user_id, role')
		.eq('id', params.memberId)
		.single();

	if (!memberToRemove) {
		throw error(404, 'Member not found');
	}

	// Check if requester is owner/admin OR removing themselves
	const { data: requester } = await supabase
		.from('workspace_members')
		.select('role')
		.eq('workspace_id', params.workspaceId)
		.eq('user_id', user.id)
		.single();

	const isRemovingSelf = memberToRemove.user_id === user.id;
	const hasPermission =
		requester && canManageMembers(requester.role as WorkspaceRole);

	if (!isRemovingSelf && !hasPermission) {
		throw error(403, 'Insufficient permissions');
	}

	// Prevent removing last owner
	if (memberToRemove.role === 'owner') {
		const { count } = await supabase
			.from('workspace_members')
			.select('id', { count: 'exact', head: true })
			.eq('workspace_id', params.workspaceId)
			.eq('role', 'owner')
			.eq('status', 'active');

		if (count && count <= 1) {
			throw error(400, 'Cannot remove the last owner');
		}
	}

	// Remove member
	const { error: err } = await supabase
		.from('workspace_members')
		.delete()
		.eq('id', params.memberId);

	if (err) {
		throw error(500, 'Failed to remove member');
	}

	return json({ success: true });
};

