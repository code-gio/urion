import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { UpdateWorkspaceRequest, WorkspaceUpdate } from '$lib/types';
import { isWorkspaceAdmin, isWorkspaceOwner } from '$lib/types';
import type { WorkspaceRole } from '$lib/types';
import { applySecurity } from '$lib/utils/api-security.js';
import { validateLength, sanitizeString } from '$lib/utils/validation.js';

export const GET: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: false, // GET requests don't need CSRF
		rateLimit: 'general',
		validateUUIDs: ['workspaceId'],
	});

	const { params, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const supabase = locals.supabase;

	// RLS will automatically filter this
	const { data: workspace, error: err } = await supabase
		.from('workspaces')
		.select(
			`
      *,
      workspace_members!inner (
        id,
        role,
        user_id,
        status
      )
    `
		)
		.eq('id', params.workspaceId)
		.eq('workspace_members.user_id', user.id)
		.single();

	if (err || !workspace) {
		throw error(404, 'Workspace not found');
	}

	return json(workspace);
};

export const PATCH: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'update',
		validateUUIDs: ['workspaceId'],
		maxBodySize: 10 * 1024, // 10KB
	});

	const { params, request, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const supabase = locals.supabase;
	const body: UpdateWorkspaceRequest = await request.json();

	// Validate and sanitize input
	if (body.name !== undefined) {
		try {
			body.name = validateLength(body.name, 1, 100, 'Name');
		} catch (err) {
			throw error(400, err instanceof Error ? err.message : 'Invalid name');
		}
	}
	if (body.billing_customer_id !== undefined) {
		body.billing_customer_id = sanitizeString(body.billing_customer_id, 255);
	}
	if (body.plan !== undefined) {
		body.plan = sanitizeString(body.plan, 50);
	}
	if (body.billing_status !== undefined) {
		body.billing_status = sanitizeString(body.billing_status, 50);
	}

	// Check if user is owner/admin
	const { data: member } = await supabase
		.from('workspace_members')
		.select('role')
		.eq('workspace_id', params.workspaceId)
		.eq('user_id', user.id)
		.single();

	if (!member || !isWorkspaceAdmin(member.role as WorkspaceRole)) {
		throw error(403, 'Insufficient permissions');
	}

	// Update workspace
	const workspaceUpdate: WorkspaceUpdate = {
		...(body.name && { name: body.name }),
		...(body.billing_customer_id && { billing_customer_id: body.billing_customer_id }),
		...(body.plan && { plan: body.plan }),
		...(body.billing_status && { billing_status: body.billing_status }),
	};

	const { data: workspace, error: err } = await supabase
		.from('workspaces')
		.update(workspaceUpdate)
		.eq('id', params.workspaceId)
		.select()
		.single();

	if (err) {
		throw error(500, 'Failed to update workspace');
	}

	return json(workspace);
};

export const DELETE: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'delete',
		validateUUIDs: ['workspaceId'],
	});

	const { params, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const supabase = locals.supabase;

	// Check if user is owner
	const { data: member } = await supabase
		.from('workspace_members')
		.select('role')
		.eq('workspace_id', params.workspaceId)
		.eq('user_id', user.id)
		.single();

	if (!member || !isWorkspaceOwner(member.role as WorkspaceRole)) {
		throw error(403, 'Only owners can delete workspaces');
	}

	// Delete workspace (cascade will handle members and projects)
	const { error: err } = await supabase.from('workspaces').delete().eq('id', params.workspaceId);

	if (err) {
		throw error(500, 'Failed to delete workspace');
	}

	return json({ success: true });
};

