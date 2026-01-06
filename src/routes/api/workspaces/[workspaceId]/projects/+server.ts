import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { CreateProjectRequest, ProjectInsert } from '$lib/types';
import { canManageProjects } from '$lib/types';
import type { WorkspaceRole, ProjectStatus } from '$lib/types';
import { applySecurity, clearRateLimit } from '$lib/utils/api-security.js';
import { validateSlug, validateLength, validateURL } from '$lib/utils/validation.js';

export const POST: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'create',
		validateUUIDs: ['workspaceId'],
		maxBodySize: 10 * 1024, // 10KB
	});

	const { params, request, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const supabase = locals.supabase;
	const body: CreateProjectRequest = await request.json();

	// Validate and sanitize input
	try {
		body.name = validateLength(body.name, 1, 100, 'Name');
		body.slug = validateSlug(body.slug);
		if (body.website_url) {
			body.website_url = validateURL(body.website_url) || undefined;
		}
	} catch (err) {
		throw error(400, err instanceof Error ? err.message : 'Invalid input');
	}

	// Check if user is at least a member
	const { data: member } = await supabase
		.from('workspace_members')
		.select('role')
		.eq('workspace_id', params.workspaceId)
		.eq('user_id', user.id)
		.single();

	if (!member || !canManageProjects(member.role as WorkspaceRole)) {
		throw error(403, 'Insufficient permissions');
	}

	// Create project
	const projectInsert: ProjectInsert = {
		workspace_id: params.workspaceId,
		name: body.name,
		slug: body.slug,
		website_url: body.website_url || null,
		status: 'active' as ProjectStatus,
		created_by: user.id,
	};

	const { data: project, error: err } = await supabase
		.from('projects')
		.insert(projectInsert)
		.select()
		.single();

	if (err) {
		if (err.code === '23505') {
			throw error(409, 'Project slug already exists in this workspace');
		}
		throw error(500, 'Failed to create project');
	}

	// Clear rate limit on success
	await clearRateLimit(event, 'create');

	return json(project, { status: 201 });
};

