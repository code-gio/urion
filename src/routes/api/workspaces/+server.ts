import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type {
	CreateWorkspaceRequest,
	CreateWorkspaceResponse,
} from '$lib/types';
import { applySecurity, clearRateLimit } from '$lib/utils/api-security.js';
import { validateSlug, validateLength } from '$lib/utils/validation.js';
import { supabaseAdmin } from '$lib/modules/auth/server/auth.js';

export const POST: RequestHandler = async (event) => {
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'create',
		maxBodySize: 10 * 1024,
	});

	const { request, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const body: CreateWorkspaceRequest = await request.json();

	// Validate input
	try {
		body.name = validateLength(body.name, 1, 100, 'Name');
		body.slug = validateSlug(body.slug);
	} catch (err) {
		throw error(400, err instanceof Error ? err.message : 'Invalid input');
	}

	// Create workspace and membership atomically using database function
	const { data, error: createError } = await supabaseAdmin.rpc(
		'create_workspace_with_member',
		{
			p_name: body.name,
			p_slug: body.slug,
			p_user_id: user.id,
		}
	);

	if (createError) {
		console.error('Workspace creation error:', createError);
		if (createError.code === '23505') {
			throw error(409, 'Workspace slug already exists');
		}
		throw error(500, `Failed to create workspace: ${createError.message}`);
	}

	if (!data || data.length === 0) {
		throw error(500, 'Failed to create workspace: No data returned');
	}

	const result = data[0];

	// Fetch full workspace and membership data
	const { data: workspace } = await supabaseAdmin
		.from('workspaces')
		.select()
		.eq('id', result.workspace_id)
		.single();

	const { data: membership } = await supabaseAdmin
		.from('workspace_members')
		.select()
		.eq('id', result.member_id)
		.single();

	if (!workspace || !membership) {
		throw error(500, 'Failed to retrieve created workspace or membership');
	}

	const response: CreateWorkspaceResponse = {
		workspace,
		membership,
	};

	await clearRateLimit(event, 'create');
	return json(response, { status: 201 });
};
