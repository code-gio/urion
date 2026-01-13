import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import type { ProjectIntegration, IntegrationType } from '$lib/types/project-settings.js';

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

	const { data: integrations, error: integrationsError } = await supabase
		.from('project_integrations')
		.select('*')
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.order('status', { ascending: true })
		.order('created_at', { ascending: false });

	if (integrationsError) {
		throw error(500, 'Failed to load integrations');
	}

	return json(integrations || []);
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
	const { integration_type, provider, external_account_id, status, config, notes } = body;

	// Validate
	if (!provider || !provider.trim()) {
		throw error(400, 'Provider is required');
	}

	const validIntegrationTypes: IntegrationType[] = [
		'analytics',
		'crm',
		'cms',
		'ads',
		'email',
		'payment',
		'support',
		'ab_testing',
		'other'
	];

	if (!validIntegrationTypes.includes(integration_type)) {
		throw error(400, 'Invalid integration type');
	}

	const validStatuses = ['active', 'disabled', 'error'];
	if (status && !validStatuses.includes(status)) {
		throw error(400, 'Invalid status');
	}

	// Create integration
	const { data: newIntegration, error: createError } = await supabase
		.from('project_integrations')
		.insert({
			workspace_id: workspaceId,
			project_id: projectId,
			integration_type: integration_type as IntegrationType,
			provider: provider.trim(),
			external_account_id: external_account_id?.trim() || null,
			status: (status || 'active') as 'active' | 'disabled' | 'error',
			config: config || {},
			notes: notes?.trim() || null
		})
		.select()
		.single();

	if (createError) {
		throw error(500, 'Failed to create integration');
	}

	return json(newIntegration, {
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
	const integrationId = requestUrl.searchParams.get('id');

	if (!integrationId) {
		throw error(400, 'Integration ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const body = await request.json();
	const { integration_type, provider, external_account_id, status, config, notes } = body;

	const updateData: Partial<ProjectIntegration> = {
		updated_at: new Date().toISOString()
	};

	if (provider !== undefined) {
		if (!provider || !provider.trim()) {
			throw error(400, 'Provider is required');
		}
		updateData.provider = provider.trim();
	}
	if (integration_type !== undefined) {
		const validIntegrationTypes: IntegrationType[] = [
			'analytics',
			'crm',
			'cms',
			'ads',
			'email',
			'payment',
			'support',
			'ab_testing',
			'other'
		];
		if (!validIntegrationTypes.includes(integration_type)) {
			throw error(400, 'Invalid integration type');
		}
		updateData.integration_type = integration_type as IntegrationType;
	}
	if (external_account_id !== undefined) {
		updateData.external_account_id = external_account_id?.trim() || null;
	}
	if (status !== undefined) {
		const validStatuses = ['active', 'disabled', 'error'];
		if (!validStatuses.includes(status)) {
			throw error(400, 'Invalid status');
		}
		updateData.status = status as 'active' | 'disabled' | 'error';
	}
	if (config !== undefined) {
		updateData.config = config || {};
	}
	if (notes !== undefined) {
		updateData.notes = notes?.trim() || null;
	}

	const { data: updatedIntegration, error: updateError } = await supabase
		.from('project_integrations')
		.update(updateData)
		.eq('id', integrationId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.select()
		.single();

	if (updateError) {
		throw error(500, 'Failed to update integration');
	}

	return json(updatedIntegration, {
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
	const integrationId = requestUrl.searchParams.get('id');

	if (!integrationId) {
		throw error(400, 'Integration ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const { error: deleteError } = await supabase
		.from('project_integrations')
		.delete()
		.eq('id', integrationId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId);

	if (deleteError) {
		throw error(500, 'Failed to delete integration');
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
