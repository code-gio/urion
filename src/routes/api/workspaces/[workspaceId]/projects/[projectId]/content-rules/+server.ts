import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import type { ProjectContentRule } from '$lib/types/project-settings.js';

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

	const { data: rules, error: rulesError } = await supabase
		.from('project_content_rules')
		.select('*')
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.order('created_at', { ascending: false });

	if (rulesError) {
		throw error(500, 'Failed to load content rules');
	}

	return json(rules || []);
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
	const { rule_scope, pattern, allow_ai_edit, allow_ai_generate, allow_index, notes } = body;

	// Validate
	if (!rule_scope || !pattern || !pattern.trim()) {
		throw error(400, 'rule_scope and pattern are required');
	}

	// Validate regex if scope is regex
	if (rule_scope === 'path_regex') {
		try {
			new RegExp(pattern);
		} catch {
			throw error(400, 'Invalid regex pattern');
		}
	}

	// Create rule
	const { data: newRule, error: createError } = await supabase
		.from('project_content_rules')
		.insert({
			workspace_id: workspaceId,
			project_id: projectId,
			rule_scope: rule_scope as 'path_prefix' | 'path_regex' | 'exact_url',
			pattern: pattern.trim(),
			allow_ai_edit: allow_ai_edit ?? null,
			allow_ai_generate: allow_ai_generate ?? null,
			allow_index: allow_index ?? null,
			notes: notes || null
		})
		.select()
		.single();

	if (createError) {
		throw error(500, 'Failed to create content rule');
	}

	return json(newRule, {
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
	const ruleId = requestUrl.searchParams.get('id');

	if (!ruleId) {
		throw error(400, 'Rule ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const body = await request.json();
	const { rule_scope, pattern, allow_ai_edit, allow_ai_generate, allow_index, notes } = body;

	const updateData: Partial<ProjectContentRule> = {
		updated_at: new Date().toISOString()
	};

	if (rule_scope !== undefined) {
		updateData.rule_scope = rule_scope as 'path_prefix' | 'path_regex' | 'exact_url';
	}
	if (pattern !== undefined) {
		if (!pattern || !pattern.trim()) {
			throw error(400, 'Pattern is required');
		}
		updateData.pattern = pattern.trim();
		// Validate regex if scope is regex
		if ((rule_scope || updateData.rule_scope) === 'path_regex') {
			try {
				new RegExp(pattern.trim());
			} catch {
				throw error(400, 'Invalid regex pattern');
			}
		}
	}
	if (allow_ai_edit !== undefined) {
		updateData.allow_ai_edit = allow_ai_edit;
	}
	if (allow_ai_generate !== undefined) {
		updateData.allow_ai_generate = allow_ai_generate;
	}
	if (allow_index !== undefined) {
		updateData.allow_index = allow_index;
	}
	if (notes !== undefined) {
		updateData.notes = notes;
	}

	const { data: updatedRule, error: updateError } = await supabase
		.from('project_content_rules')
		.update(updateData)
		.eq('id', ruleId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.select()
		.single();

	if (updateError) {
		throw error(500, 'Failed to update content rule');
	}

	return json(updatedRule, {
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
	const ruleId = requestUrl.searchParams.get('id');

	if (!ruleId) {
		throw error(400, 'Rule ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const { error: deleteError } = await supabase
		.from('project_content_rules')
		.delete()
		.eq('id', ruleId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId);

	if (deleteError) {
		throw error(500, 'Failed to delete content rule');
	}

	return json({ success: true }, {
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		}
	});
};
