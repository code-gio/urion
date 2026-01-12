import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import type { ProjectTopicCluster } from '$lib/types/project-settings.js';

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

	const { data: clusters, error: clustersError } = await supabase
		.from('project_topic_clusters')
		.select('*')
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.order('is_pillar', { ascending: false })
		.order('created_at', { ascending: false });

	if (clustersError) {
		throw error(500, 'Failed to load topic clusters');
	}

	return json(clusters || []);
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
	const { name, description, is_pillar, notes } = body;

	// Validate
	if (!name || !name.trim()) {
		throw error(400, 'Name is required');
	}

	// Create cluster
	const { data: newCluster, error: createError } = await supabase
		.from('project_topic_clusters')
		.insert({
			workspace_id: workspaceId,
			project_id: projectId,
			name: name.trim(),
			description: description || null,
			is_pillar: is_pillar || false,
			notes: notes || null
		})
		.select()
		.single();

	if (createError) {
		throw error(500, 'Failed to create topic cluster');
	}

	return json(newCluster, {
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
	const clusterId = requestUrl.searchParams.get('id');

	if (!clusterId) {
		throw error(400, 'Cluster ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const body = await request.json();
	const { name, description, is_pillar, notes } = body;

	const updateData: Partial<ProjectTopicCluster> = {
		updated_at: new Date().toISOString()
	};

	if (name !== undefined) {
		if (!name || !name.trim()) {
			throw error(400, 'Name is required');
		}
		updateData.name = name.trim();
	}
	if (description !== undefined) {
		updateData.description = description;
	}
	if (is_pillar !== undefined) {
		updateData.is_pillar = is_pillar;
	}
	if (notes !== undefined) {
		updateData.notes = notes;
	}

	const { data: updatedCluster, error: updateError } = await supabase
		.from('project_topic_clusters')
		.update(updateData)
		.eq('id', clusterId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.select()
		.single();

	if (updateError) {
		throw error(500, 'Failed to update topic cluster');
	}

	return json(updatedCluster, {
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
	const clusterId = requestUrl.searchParams.get('id');

	if (!clusterId) {
		throw error(400, 'Cluster ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const { error: deleteError } = await supabase
		.from('project_topic_clusters')
		.delete()
		.eq('id', clusterId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId);

	if (deleteError) {
		throw error(500, 'Failed to delete topic cluster');
	}

	return json({ success: true }, {
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		}
	});
};
