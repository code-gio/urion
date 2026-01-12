import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import { validateURL } from '$lib/utils/validation.js';
import type { ProjectCompetitor, CompetitorType } from '$lib/types/project-settings.js';

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

	const { data: competitors, error: competitorsError } = await supabase
		.from('project_competitors')
		.select('*')
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.order('priority', { ascending: true })
		.order('created_at', { ascending: false });

	if (competitorsError) {
		throw error(500, 'Failed to load competitors');
	}

	return json(competitors || []);
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
	const { name, website_url, competitor_type, positioning, differentiators, notes, priority } = body;

	// Validate
	if (!name || !name.trim()) {
		throw error(400, 'Name is required');
	}

	if (website_url) {
		const validatedUrl = validateURL(website_url);
		if (!validatedUrl) {
			throw error(400, 'Invalid URL');
		}
	}

	// Create competitor
	const { data: newCompetitor, error: createError } = await supabase
		.from('project_competitors')
		.insert({
			workspace_id: workspaceId,
			project_id: projectId,
			name: name.trim(),
			website_url: website_url ? validateURL(website_url) : null,
			competitor_type: (competitor_type || 'other') as CompetitorType,
			positioning: positioning || null,
			differentiators: differentiators || [],
			notes: notes || null,
			priority: Math.min(Math.max(priority || 3, 1), 5) as 1 | 2 | 3 | 4 | 5,
			created_by: user.id
		})
		.select()
		.single();

	if (createError) {
		throw error(500, 'Failed to create competitor');
	}

	return json(newCompetitor, {
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
	const competitorId = requestUrl.searchParams.get('id');

	if (!competitorId) {
		throw error(400, 'Competitor ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const body = await request.json();
	const { name, website_url, competitor_type, positioning, differentiators, notes, priority } = body;

	const updateData: Partial<ProjectCompetitor> = {
		updated_at: new Date().toISOString()
	};

	if (name !== undefined) {
		if (!name || !name.trim()) {
			throw error(400, 'Name is required');
		}
		updateData.name = name.trim();
	}
	if (website_url !== undefined) {
		updateData.website_url = website_url ? validateURL(website_url) : null;
	}
	if (competitor_type !== undefined) {
		updateData.competitor_type = competitor_type as CompetitorType;
	}
	if (positioning !== undefined) {
		updateData.positioning = positioning;
	}
	if (differentiators !== undefined) {
		updateData.differentiators = differentiators;
	}
	if (notes !== undefined) {
		updateData.notes = notes;
	}
	if (priority !== undefined) {
		updateData.priority = Math.min(Math.max(priority, 1), 5) as 1 | 2 | 3 | 4 | 5;
	}

	const { data: updatedCompetitor, error: updateError } = await supabase
		.from('project_competitors')
		.update(updateData)
		.eq('id', competitorId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.select()
		.single();

	if (updateError) {
		throw error(500, 'Failed to update competitor');
	}

	return json(updatedCompetitor, {
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
	const competitorId = requestUrl.searchParams.get('id');

	if (!competitorId) {
		throw error(400, 'Competitor ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const { error: deleteError } = await supabase
		.from('project_competitors')
		.delete()
		.eq('id', competitorId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId);

	if (deleteError) {
		throw error(500, 'Failed to delete competitor');
	}

	return json({ success: true }, {
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		}
	);
};
