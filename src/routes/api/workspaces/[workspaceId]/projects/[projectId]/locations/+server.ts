import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import type { ProjectLocation } from '$lib/types/project-settings.js';

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

	const { data: locations, error: locationsError } = await supabase
		.from('project_locations')
		.select('*')
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.order('is_primary', { ascending: false })
		.order('created_at', { ascending: false });

	if (locationsError) {
		throw error(500, 'Failed to load locations');
	}

	return json(locations || []);
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
	const {
		name,
		is_primary,
		address_line1,
		address_line2,
		city,
		region,
		postal_code,
		country,
		phone,
		email,
		hours,
		lat,
		lng
	} = body;

	// Create location
	const { data: newLocation, error: createError } = await supabase
		.from('project_locations')
		.insert({
			workspace_id: workspaceId,
			project_id: projectId,
			name: name?.trim() || null,
			is_primary: is_primary || false,
			address_line1: address_line1?.trim() || null,
			address_line2: address_line2?.trim() || null,
			city: city?.trim() || null,
			region: region?.trim() || null,
			postal_code: postal_code?.trim() || null,
			country: country?.trim() || null,
			phone: phone?.trim() || null,
			email: email?.trim() || null,
			hours: hours || {},
			lat: lat !== null && lat !== undefined ? Number(lat) : null,
			lng: lng !== null && lng !== undefined ? Number(lng) : null
		})
		.select()
		.single();

	if (createError) {
		throw error(500, 'Failed to create location');
	}

	return json(newLocation, {
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
	const locationId = requestUrl.searchParams.get('id');

	if (!locationId) {
		throw error(400, 'Location ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const body = await request.json();
	const updateData: Partial<ProjectLocation> = {
		updated_at: new Date().toISOString()
	};

	if (body.name !== undefined) {
		updateData.name = body.name?.trim() || null;
	}
	if (body.is_primary !== undefined) {
		updateData.is_primary = body.is_primary;
	}
	if (body.address_line1 !== undefined) {
		updateData.address_line1 = body.address_line1?.trim() || null;
	}
	if (body.address_line2 !== undefined) {
		updateData.address_line2 = body.address_line2?.trim() || null;
	}
	if (body.city !== undefined) {
		updateData.city = body.city?.trim() || null;
	}
	if (body.region !== undefined) {
		updateData.region = body.region?.trim() || null;
	}
	if (body.postal_code !== undefined) {
		updateData.postal_code = body.postal_code?.trim() || null;
	}
	if (body.country !== undefined) {
		updateData.country = body.country?.trim() || null;
	}
	if (body.phone !== undefined) {
		updateData.phone = body.phone?.trim() || null;
	}
	if (body.email !== undefined) {
		updateData.email = body.email?.trim() || null;
	}
	if (body.hours !== undefined) {
		updateData.hours = body.hours || {};
	}
	if (body.lat !== undefined) {
		updateData.lat = body.lat !== null && body.lat !== undefined ? Number(body.lat) : null;
	}
	if (body.lng !== undefined) {
		updateData.lng = body.lng !== null && body.lng !== undefined ? Number(body.lng) : null;
	}

	const { data: updatedLocation, error: updateError } = await supabase
		.from('project_locations')
		.update(updateData)
		.eq('id', locationId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.select()
		.single();

	if (updateError) {
		throw error(500, 'Failed to update location');
	}

	return json(updatedLocation, {
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
	const locationId = requestUrl.searchParams.get('id');

	if (!locationId) {
		throw error(400, 'Location ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const { error: deleteError } = await supabase
		.from('project_locations')
		.delete()
		.eq('id', locationId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId);

	if (deleteError) {
		throw error(500, 'Failed to delete location');
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
