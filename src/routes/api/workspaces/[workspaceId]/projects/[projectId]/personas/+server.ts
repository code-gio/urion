import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import type { ProjectPersona } from '$lib/types/project-settings.js';

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

	const { data: personas, error: personasError } = await supabase
		.from('project_personas')
		.select('*')
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.order('created_at', { ascending: false });

	if (personasError) {
		throw error(500, 'Failed to load personas');
	}

	return json(personas || []);
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
	const { name, description, pain_points, desired_outcomes, objections, vocabulary } = body;

	// Validate
	if (!name || !name.trim()) {
		throw error(400, 'Name is required');
	}

	// Create persona
	const { data: newPersona, error: createError } = await supabase
		.from('project_personas')
		.insert({
			workspace_id: workspaceId,
			project_id: projectId,
			name: name.trim(),
			description: description?.trim() || null,
			pain_points: pain_points || [],
			desired_outcomes: desired_outcomes || [],
			objections: objections || [],
			vocabulary: vocabulary || []
		})
		.select()
		.single();

	if (createError) {
		if (createError.code === '23505') {
			throw error(400, 'A persona with this name already exists');
		}
		throw error(500, 'Failed to create persona');
	}

	return json(newPersona, {
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
	const personaId = requestUrl.searchParams.get('id');

	if (!personaId) {
		throw error(400, 'Persona ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const body = await request.json();
	const { name, description, pain_points, desired_outcomes, objections, vocabulary } = body;

	const updateData: Partial<ProjectPersona> = {
		updated_at: new Date().toISOString()
	};

	if (name !== undefined) {
		if (!name || !name.trim()) {
			throw error(400, 'Name is required');
		}
		updateData.name = name.trim();
	}
	if (description !== undefined) {
		updateData.description = description?.trim() || null;
	}
	if (pain_points !== undefined) {
		updateData.pain_points = pain_points || [];
	}
	if (desired_outcomes !== undefined) {
		updateData.desired_outcomes = desired_outcomes || [];
	}
	if (objections !== undefined) {
		updateData.objections = objections || [];
	}
	if (vocabulary !== undefined) {
		updateData.vocabulary = vocabulary || [];
	}

	const { data: updatedPersona, error: updateError } = await supabase
		.from('project_personas')
		.update(updateData)
		.eq('id', personaId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.select()
		.single();

	if (updateError) {
		if (updateError.code === '23505') {
			throw error(400, 'A persona with this name already exists');
		}
		throw error(500, 'Failed to update persona');
	}

	return json(updatedPersona, {
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
	const personaId = requestUrl.searchParams.get('id');

	if (!personaId) {
		throw error(400, 'Persona ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const { error: deleteError } = await supabase
		.from('project_personas')
		.delete()
		.eq('id', personaId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId);

	if (deleteError) {
		throw error(500, 'Failed to delete persona');
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
