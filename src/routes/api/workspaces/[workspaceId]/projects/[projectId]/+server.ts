import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { UpdateProjectRequest, ProjectUpdate } from '$lib/types';
import { canDeleteProjects } from '$lib/types';
import type { WorkspaceRole } from '$lib/types';
import { applySecurity } from '$lib/utils/api-security.js';
import { validateLength, validateURL } from '$lib/utils/validation.js';

export const PATCH: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'update',
		validateUUIDs: ['workspaceId', 'projectId'],
		maxBodySize: 10 * 1024, // 10KB
	});

	const { params, request, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const supabase = locals.supabase;
	const body: UpdateProjectRequest = await request.json();

	// Validate and sanitize input
	try {
		if (body.name !== undefined) {
			body.name = validateLength(body.name, 1, 100, 'Name');
		}
		if (body.website_url !== undefined) {
			body.website_url = validateURL(body.website_url);
		}
	} catch (err) {
		throw error(400, err instanceof Error ? err.message : 'Invalid input');
	}

	// RLS will handle workspace access check
	const projectUpdate: ProjectUpdate = {
		...(body.name && { name: body.name }),
		...(body.website_url !== undefined && { website_url: body.website_url }),
		...(body.status && { status: body.status }),
	};

	const { data: project, error: err } = await supabase
		.from('projects')
		.update(projectUpdate)
		.eq('id', params.projectId)
		.eq('workspace_id', params.workspaceId)
		.select()
		.single();

	if (err) {
		throw error(500, 'Failed to update project');
	}

	return json(project, {
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
		validateUUIDs: ['workspaceId', 'projectId'],
	});

	const { params, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const supabase = locals.supabase;

	// Check if user is admin/owner
	const { data: member } = await supabase
		.from('workspace_members')
		.select('role')
		.eq('workspace_id', params.workspaceId)
		.eq('user_id', user.id)
		.single();

	if (!member || !canDeleteProjects(member.role as WorkspaceRole)) {
		throw error(403, 'Only admins and owners can delete projects');
	}

	// Delete project
	const { error: err } = await supabase
		.from('projects')
		.delete()
		.eq('id', params.projectId)
		.eq('workspace_id', params.workspaceId);

	if (err) {
		throw error(500, 'Failed to delete project');
	}

	return json({ success: true }, {
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate',
		},
	});
};

