import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import type { ProjectConversionGoal } from '$lib/types/project-settings.js';

export const GET: RequestHandler = async (event) => {
	await applySecurity(event, {
		csrf: false,
		rateLimit: 'general',
		validateUUIDs: ['workspaceId', 'projectId']
	});

	const { params, locals } = event;
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

	const { data: goals, error: goalsError } = await supabase
		.from('project_conversion_goals')
		.select('*')
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.order('is_primary', { ascending: false })
		.order('created_at', { ascending: false });

	if (goalsError) {
		throw error(500, 'Failed to load conversion goals');
	}

	return json(goals || []);
};

export const POST: RequestHandler = async (event) => {
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'create',
		validateUUIDs: ['workspaceId', 'projectId'],
		maxBodySize: 10 * 1024
	});

	const { params, request, locals } = event;
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

	const body = await request.json();
	const { name, goal_type, event_name, is_primary, value, notes } = body;

	// Validate
	if (!name || !name.trim()) {
		throw error(400, 'Name is required');
	}

	// Create goal
	const { data: newGoal, error: createError } = await supabase
		.from('project_conversion_goals')
		.insert({
			workspace_id: workspaceId,
			project_id: projectId,
			name: name.trim(),
			goal_type: goal_type?.trim() || null,
			event_name: event_name?.trim() || null,
			is_primary: is_primary || false,
			value: value !== null && value !== undefined ? Number(value) : null,
			notes: notes?.trim() || null
		})
		.select()
		.single();

	if (createError) {
		if (createError.code === '23505') {
			throw error(400, 'A goal with this name already exists');
		}
		throw error(500, 'Failed to create conversion goal');
	}

	return json(newGoal, {
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		}
	});
};

export const PATCH: RequestHandler = async (event) => {
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'update',
		validateUUIDs: ['workspaceId', 'projectId'],
		maxBodySize: 10 * 1024
	});

	const { params, url: requestUrl, request, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const { workspaceId, projectId } = params;
	const goalId = requestUrl.searchParams.get('id');

	if (!goalId) {
		throw error(400, 'Goal ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const body = await request.json();
	const { name, goal_type, event_name, is_primary, value, notes } = body;

	const updateData: Partial<ProjectConversionGoal> = {
		updated_at: new Date().toISOString()
	};

	if (name !== undefined) {
		if (!name || !name.trim()) {
			throw error(400, 'Name is required');
		}
		updateData.name = name.trim();
	}
	if (goal_type !== undefined) {
		updateData.goal_type = goal_type?.trim() || null;
	}
	if (event_name !== undefined) {
		updateData.event_name = event_name?.trim() || null;
	}
	if (is_primary !== undefined) {
		updateData.is_primary = is_primary;
	}
	if (value !== undefined) {
		updateData.value = value !== null && value !== undefined ? Number(value) : null;
	}
	if (notes !== undefined) {
		updateData.notes = notes?.trim() || null;
	}

	const { data: updatedGoal, error: updateError } = await supabase
		.from('project_conversion_goals')
		.update(updateData)
		.eq('id', goalId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.select()
		.single();

	if (updateError) {
		if (updateError.code === '23505') {
			throw error(400, 'A goal with this name already exists');
		}
		throw error(500, 'Failed to update conversion goal');
	}

	return json(updatedGoal, {
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		}
	});
};

export const DELETE: RequestHandler = async (event) => {
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'delete',
		validateUUIDs: ['workspaceId', 'projectId']
	});

	const { params, url: requestUrl, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const { workspaceId, projectId } = params;
	const goalId = requestUrl.searchParams.get('id');

	if (!goalId) {
		throw error(400, 'Goal ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const { error: deleteError } = await supabase
		.from('project_conversion_goals')
		.delete()
		.eq('id', goalId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId);

	if (deleteError) {
		throw error(500, 'Failed to delete conversion goal');
	}

	return json(
		{ success: true },
		{
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate'
			}
		}
	);
};
