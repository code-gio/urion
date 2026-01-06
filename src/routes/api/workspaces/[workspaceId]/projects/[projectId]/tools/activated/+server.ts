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

	// Get activated tools for this project
	let query = supabase
		.from('project_tools')
		.select(
			`
      *,
      tools (
        *
      )
    `
		)
		.eq('project_id', projectId);

	const { data: activations, error: activationsError } = await query;

	if (activationsError) {
		throw error(500, activationsError.message);
	}

	// Transform to ToolWithActivation format
	const activatedTools: ToolWithActivation[] = (activations || [])
		.filter((activation: any) => {
			const tool = activation.tools;
			if (!tool) return false;
			if (category && tool.category !== category) return false;
			return tool.status === 'active';
		})
		.map((activation: any) => {
			const tool = activation.tools;
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
				is_activated: true,
				activation: {
					id: activation.id,
					is_enabled: activation.is_enabled,
					config: activation.config,
					usage_count: activation.usage_count || 0,
					last_used_at: activation.last_used_at,
					enabled_at: activation.enabled_at,
					enabled_by: null, // Can be populated if needed
				},
			};
		});

	return json(
		{
			activated_tools: activatedTools,
			count: activatedTools.length,
		},
		{
			headers: {
				'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
			},
		}
	);
};

