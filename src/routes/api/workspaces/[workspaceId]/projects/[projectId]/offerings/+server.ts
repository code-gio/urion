import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import { validateURL } from '$lib/utils/validation.js';
import type { ProjectOffering } from '$lib/types/project-settings.js';

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

	const { data: offerings, error: offeringsError } = await supabase
		.from('project_offerings')
		.select('*')
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.order('is_primary', { ascending: false })
		.order('created_at', { ascending: false });

	if (offeringsError) {
		throw error(500, 'Failed to load offerings');
	}

	return json(offerings || []);
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
	const { name, offering_type, description, pricing_notes, url, is_primary } = body;

	// Validate
	if (!name || !name.trim()) {
		throw error(400, 'Name is required');
	}

	// If this is marked as primary, unset other primary offerings
	if (is_primary) {
		await supabase
			.from('project_offerings')
			.update({ is_primary: false })
			.eq('project_id', projectId)
			.eq('workspace_id', workspaceId);
	}

	// Create offering
	const { data: newOffering, error: createError } = await supabase
		.from('project_offerings')
		.insert({
			workspace_id: workspaceId,
			project_id: projectId,
			name: name.trim(),
			offering_type: offering_type || null,
			description: description || null,
			pricing_notes: pricing_notes || null,
			url: url ? validateURL(url) : null,
			is_primary: is_primary || false
		})
		.select()
		.single();

	if (createError) {
		throw error(500, 'Failed to create offering');
	}

	return json(newOffering, {
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
	const offeringId = requestUrl.searchParams.get('id');

	if (!offeringId) {
		throw error(400, 'Offering ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const body = await request.json();
	const { name, offering_type, description, pricing_notes, url, is_primary } = body;

	const updateData: Partial<ProjectOffering> = {
		updated_at: new Date().toISOString()
	};

	if (name !== undefined) {
		if (!name || !name.trim()) {
			throw error(400, 'Name is required');
		}
		updateData.name = name.trim();
	}
	if (offering_type !== undefined) {
		updateData.offering_type = offering_type;
	}
	if (description !== undefined) {
		updateData.description = description;
	}
	if (pricing_notes !== undefined) {
		updateData.pricing_notes = pricing_notes;
	}
	if (url !== undefined) {
		updateData.url = url ? validateURL(url) : null;
	}
	if (is_primary !== undefined) {
		updateData.is_primary = is_primary;
		// If setting as primary, unset others
		if (is_primary) {
			await supabase
				.from('project_offerings')
				.update({ is_primary: false })
				.eq('project_id', projectId)
				.eq('workspace_id', workspaceId)
				.neq('id', offeringId);
		}
	}

	const { data: updatedOffering, error: updateError } = await supabase
		.from('project_offerings')
		.update(updateData)
		.eq('id', offeringId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.select()
		.single();

	if (updateError) {
		throw error(500, 'Failed to update offering');
	}

	return json(updatedOffering, {
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
	const offeringId = requestUrl.searchParams.get('id');

	if (!offeringId) {
		throw error(400, 'Offering ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const { error: deleteError } = await supabase
		.from('project_offerings')
		.delete()
		.eq('id', offeringId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId);

	if (deleteError) {
		throw error(500, 'Failed to delete offering');
	}

	return json({ success: true }, {
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		}
	});
};
