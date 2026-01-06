import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type {
	GetProjectToolsResponse,
	GetProjectToolsParams,
	ActivateToolRequest,
	ActivateToolResponse,
	ToolWithActivation,
} from '$lib/types';
import { applySecurity, clearRateLimit } from '$lib/utils/api-security.js';
import { checkProjectAccess, getToolByIdOrSlug } from '$lib/server/tools.js';

export const GET: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: false,
		rateLimit: 'general',
		validateUUIDs: ['workspaceId', 'projectId'],
	});

	const { locals, params, url } = event;
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

	// Get filter
	const filter = url.searchParams.get('filter') || 'all';
	const category = url.searchParams.get('category');

	// Get project
	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('id, name, workspace_id')
		.eq('id', projectId)
		.single();

	if (projectError || !project) {
		throw error(404, 'Project not found');
	}

	// Get all active tools
	let query = supabase.from('tools').select('*').eq('status', 'active');

	if (category) {
		query = query.eq('category', category);
	}

	const { data: toolsData, error: toolsError } = await query;

	if (toolsError) {
		throw error(500, toolsError.message);
	}

	// Get activations for this specific project
	const { data: activationsData, error: activationsError } = await supabase
		.from('project_tools')
		.select(
			`
      id,
      tool_id,
      is_enabled,
      config,
      enabled_at,
      enabled_by,
      usage_count,
      last_used_at
    `
		)
		.eq('project_id', projectId);

	if (activationsError) {
		throw error(500, activationsError.message);
	}

	// Create a map of tool_id -> activation for quick lookup
	const activationsMap = new Map(
		(activationsData || []).map((act: any) => [act.tool_id, act])
	);

	// Transform data - merge tools with their activations
	const tools: ToolWithActivation[] = (toolsData || []).map((tool: any) => {
		const activation = activationsMap.get(tool.id) || null;

		return {
			id: tool.id,
			slug: tool.slug,
			name: tool.name,
			description: tool.description,
			category: tool.category,
			status: tool.status,
			requires_premium: tool.requires_premium,
			icon_url: tool.icon_url,
			documentation_url: tool.documentation_url,
			version: tool.version,
			config_schema: tool.config_schema,
			default_config: tool.default_config,
			created_at: tool.created_at,
			updated_at: tool.updated_at,
			is_activated: !!activation,
			activation: activation
				? {
						id: activation.id,
						is_enabled: activation.is_enabled,
						config: activation.config,
						enabled_at: activation.enabled_at,
						usage_count: activation.usage_count || 0,
						last_used_at: activation.last_used_at,
						enabled_by: null, // Will be populated if needed
					}
				: null,
		};
	});

	// Apply filter
	let filteredTools = tools;
	if (filter === 'activated') {
		filteredTools = tools.filter((t) => t.is_activated);
	} else if (filter === 'available') {
		filteredTools = tools.filter((t) => !t.is_activated);
	}

	const response: GetProjectToolsResponse = {
		project,
		tools: filteredTools,
	};

	return json(response, {
		headers: {
			'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
		},
	});
};

export const POST: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'create',
		validateUUIDs: ['workspaceId', 'projectId'],
		maxBodySize: 10 * 1024, // 10KB
	});

	const { locals, params, request } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const { workspaceId, projectId } = params;
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
	const body: ActivateToolRequest = await request.json();
	const { tool_id, tool_slug, config } = body;

	if (!tool_id && !tool_slug) {
		throw error(400, 'tool_id or tool_slug required');
	}

	// Get tool
	const tool = await getToolByIdOrSlug(supabase, tool_id || tool_slug || '');

	if (!tool) {
		throw error(404, 'Tool not found');
	}

	if (tool.status !== 'active') {
		throw error(400, 'Tool is not active');
	}

	// Check if already activated
	const { data: existing } = await supabase
		.from('project_tools')
		.select('id')
		.eq('project_id', projectId)
		.eq('tool_id', tool.id)
		.single();

	if (existing) {
		throw error(400, 'Tool already activated');
	}

	// Activate tool
	const { data: activation, error: activationError } = await supabase
		.from('project_tools')
		.insert({
			project_id: projectId,
			tool_id: tool.id,
			enabled_by: user.id,
			config: config || tool.default_config || {},
			is_enabled: true,
		})
		.select()
		.single();

	if (activationError) {
		throw error(500, activationError.message);
	}

	clearRateLimit(event, 'create');

	const response: ActivateToolResponse = {
		success: true,
		message: 'Tool activated successfully',
		activation: {
			id: activation.id,
			project_id: activation.project_id,
			tool_id: activation.tool_id,
			tool: {
				id: tool.id,
				slug: tool.slug,
				name: tool.name,
			},
			is_enabled: activation.is_enabled,
			config: activation.config,
			enabled_by: activation.enabled_by,
			enabled_at: activation.enabled_at,
		},
	};

	return json(response, {
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate',
		},
	});
};

