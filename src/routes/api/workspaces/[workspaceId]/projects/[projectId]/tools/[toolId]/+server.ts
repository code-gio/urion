import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type {
	GetToolDetailsResponse,
	UpdateToolRequest,
	UpdateToolResponse,
	DeactivateToolResponse,
	ToolActivationDetails,
} from '$lib/types';
import { applySecurity, clearRateLimit } from '$lib/utils/api-security.js';
import { checkProjectAccess, getToolByIdOrSlug } from '$lib/server/tools.js';

export const GET: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: false,
		rateLimit: 'general',
		validateUUIDs: ['workspaceId', 'projectId', 'toolId'],
	});

	const { locals, params } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const { workspaceId, projectId, toolId } = params;
	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	// Get tool
	const tool = await getToolByIdOrSlug(supabase, toolId);

	if (!tool) {
		throw error(404, 'Tool not found');
	}

	// Get tool activation
	const { data: activation, error: activationError } = await supabase
		.from('project_tools')
		.select(
			`
      *,
      enabled_by_user:profiles!project_tools_enabled_by_fkey (
        id,
        full_name,
        display_name,
        email
      )
    `
		)
		.eq('project_id', projectId)
		.eq('tool_id', tool.id)
		.single();

	if (activationError || !activation) {
		throw error(404, 'Tool not activated');
	}

	// Get enabled_by user info
	let enabledBy = null;
	if (activation.enabled_by_user) {
		const userData = Array.isArray(activation.enabled_by_user)
			? activation.enabled_by_user[0]
			: activation.enabled_by_user;
		enabledBy = {
			id: userData.id,
			name: userData.full_name || userData.display_name || 'Unknown',
			email: userData.email || undefined,
		};
	}

	const activationDetails: ToolActivationDetails = {
		id: activation.id,
		is_enabled: activation.is_enabled,
		config: activation.config,
		usage_count: activation.usage_count || 0,
		last_used_at: activation.last_used_at,
		enabled_at: activation.enabled_at,
		enabled_by: enabledBy,
	};

	const response: GetToolDetailsResponse = {
		tool,
		activation: activationDetails,
	};

	return json(response, {
		headers: {
			'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
		},
	});
};

export const PATCH: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'update',
		validateUUIDs: ['workspaceId', 'projectId', 'toolId'],
		maxBodySize: 10 * 1024, // 10KB
	});

	const { locals, params, request } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const { workspaceId, projectId, toolId } = params;
	const supabase = locals.supabase;

	// Check access (member+)
	const { authorized } = await checkProjectAccess(
		supabase,
		user.id,
		workspaceId,
		projectId,
		'member'
	);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	// Parse body
	const body: UpdateToolRequest = await request.json();
	const { is_enabled, config } = body;

	// Get tool
	const tool = await getToolByIdOrSlug(supabase, toolId);

	if (!tool) {
		throw error(404, 'Tool not found');
	}

	// Update
	const updateData: any = {};
	if (typeof is_enabled === 'boolean') {
		updateData.is_enabled = is_enabled;
		if (!is_enabled) {
			updateData.disabled_at = new Date().toISOString();
		} else {
			updateData.disabled_at = null;
		}
	}
	if (config !== undefined) {
		updateData.config = config;
	}

	const { data: activation, error: updateError } = await supabase
		.from('project_tools')
		.update(updateData)
		.eq('project_id', projectId)
		.eq('tool_id', tool.id)
		.select()
		.single();

	if (updateError) {
		throw error(500, updateError.message);
	}

	clearRateLimit(event, 'update');

	const response: UpdateToolResponse = {
		success: true,
		message: 'Tool updated successfully',
		activation: activation as any,
	};

	return json(response, {
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
		validateUUIDs: ['workspaceId', 'projectId', 'toolId'],
	});

	const { locals, params } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const { workspaceId, projectId, toolId } = params;
	const supabase = locals.supabase;

	// Check access (admin+)
	const { authorized } = await checkProjectAccess(
		supabase,
		user.id,
		workspaceId,
		projectId,
		'admin'
	);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	// Get tool
	const tool = await getToolByIdOrSlug(supabase, toolId);

	if (!tool) {
		throw error(404, 'Tool not found');
	}

	// Delete
	const { error: deleteError } = await supabase
		.from('project_tools')
		.delete()
		.eq('project_id', projectId)
		.eq('tool_id', tool.id);

	if (deleteError) {
		throw error(500, deleteError.message);
	}

	clearRateLimit(event, 'delete');

	const response: DeactivateToolResponse = {
		success: true,
		message: 'Tool deactivated successfully',
	};

	return json(response, {
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate',
		},
	});
};

