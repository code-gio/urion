import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ToolWithActivation } from '$lib/types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';

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

	const category = url.searchParams.get('category');

	// Get all tools
	let query = supabase
		.from('tools')
		.select(
			`
      *,
      project_tools!left (
        id
      )
    `
		)
		.eq('status', 'active');

	if (category) {
		query = query.eq('category', category);
	}

	const { data: toolsData, error: toolsError } = await query;

	if (toolsError) {
		throw error(500, toolsError.message);
	}

	// Filter to only tools NOT activated for this project
	const availableTools: ToolWithActivation[] = (toolsData || [])
		.filter((tool: any) => {
			const activations = tool.project_tools || [];
			return !activations.some((act: any) => act.id);
		})
		.map((tool: any) => ({
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
			is_activated: false,
			activation: null,
		}));

	return json(
		{
			available_tools: availableTools,
			count: availableTools.length,
		},
		{
			headers: {
				'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
			},
		}
	);
};

