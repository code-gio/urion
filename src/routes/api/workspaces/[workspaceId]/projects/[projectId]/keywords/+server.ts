import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import type { ProjectKeyword, KeywordIntent } from '$lib/types/project-settings.js';

export const GET: RequestHandler = async (event) => {
	await applySecurity(event, {
		csrf: false,
		rateLimit: 'general',
		validateUUIDs: ['workspaceId', 'projectId']
	});

	const { params, url, locals } = event;
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

	// Get filters
	const clusterId = url.searchParams.get('cluster_id');
	const intent = url.searchParams.get('intent');
	const locale = url.searchParams.get('locale');
	const priority = url.searchParams.get('priority');

	let query = supabase
		.from('project_keywords')
		.select('*')
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId);

	if (clusterId) {
		query = query.eq('cluster_id', clusterId);
	}
	if (intent) {
		query = query.eq('intent', intent);
	}
	if (locale) {
		query = query.eq('locale', locale);
	}
	if (priority) {
		query = query.eq('priority', parseInt(priority));
	}

	const { data: keywords, error: keywordsError } = await query.order('created_at', { ascending: false });

	if (keywordsError) {
		throw error(500, 'Failed to load keywords');
	}

	return json(keywords || []);
};

export const POST: RequestHandler = async (event) => {
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'create',
		validateUUIDs: ['workspaceId', 'projectId'],
		maxBodySize: 100 * 1024 // Allow bulk imports
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
	const { keywords: keywordsArray, keyword: singleKeyword, cluster_id, intent, locale, priority, target_page_url } = body;

	// Handle bulk import
	if (keywordsArray && Array.isArray(keywordsArray)) {
		const keywordsToInsert = keywordsArray
			.map((kw: string) => kw.trim())
			.filter((kw: string) => kw.length > 0)
			.map((kw: string) => ({
				workspace_id: workspaceId,
				project_id: projectId,
				keyword: kw,
				locale: locale || null,
				intent: (intent || 'unknown') as KeywordIntent,
				priority: Math.min(Math.max(priority || 3, 1), 5) as 1 | 2 | 3 | 4 | 5,
				cluster_id: cluster_id || null,
				target_page_url: target_page_url || null
			}));

		if (keywordsToInsert.length === 0) {
			throw error(400, 'No valid keywords provided');
		}

		const { data: newKeywords, error: createError } = await supabase
			.from('project_keywords')
			.insert(keywordsToInsert)
			.select();

		if (createError) {
			throw error(500, 'Failed to create keywords');
		}

		return json(newKeywords, {
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate'
			}
		});
	}

	// Handle single keyword
	if (!singleKeyword || !singleKeyword.trim()) {
		throw error(400, 'Keyword is required');
	}

	const { data: newKeyword, error: createError } = await supabase
		.from('project_keywords')
		.insert({
			workspace_id: workspaceId,
			project_id: projectId,
			keyword: singleKeyword.trim(),
			locale: locale || null,
			intent: (intent || 'unknown') as KeywordIntent,
			priority: Math.min(Math.max(priority || 3, 1), 5) as 1 | 2 | 3 | 4 | 5,
			cluster_id: cluster_id || null,
			target_page_url: target_page_url || null
		})
		.select()
		.single();

	if (createError) {
		throw error(500, 'Failed to create keyword');
	}

	return json(newKeyword, {
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
	const keywordId = requestUrl.searchParams.get('id');

	if (!keywordId) {
		throw error(400, 'Keyword ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const body = await request.json();
	const { keyword, cluster_id, intent, locale, priority, target_page_url, notes } = body;

	const updateData: Partial<ProjectKeyword> = {
		updated_at: new Date().toISOString()
	};

	if (keyword !== undefined) {
		if (!keyword || !keyword.trim()) {
			throw error(400, 'Keyword is required');
		}
		updateData.keyword = keyword.trim();
	}
	if (cluster_id !== undefined) {
		updateData.cluster_id = cluster_id;
	}
	if (intent !== undefined) {
		updateData.intent = intent as KeywordIntent;
	}
	if (locale !== undefined) {
		updateData.locale = locale;
	}
	if (priority !== undefined) {
		updateData.priority = Math.min(Math.max(priority, 1), 5) as 1 | 2 | 3 | 4 | 5;
	}
	if (target_page_url !== undefined) {
		updateData.target_page_url = target_page_url;
	}
	if (notes !== undefined) {
		updateData.notes = notes;
	}

	const { data: updatedKeyword, error: updateError } = await supabase
		.from('project_keywords')
		.update(updateData)
		.eq('id', keywordId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.select()
		.single();

	if (updateError) {
		throw error(500, 'Failed to update keyword');
	}

	return json(updatedKeyword, {
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
	const keywordId = requestUrl.searchParams.get('id');

	if (!keywordId) {
		throw error(400, 'Keyword ID is required');
	}

	const supabase = locals.supabase;

	// Check access
	const { authorized } = await checkProjectAccess(supabase, user.id, workspaceId, projectId);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	const { error: deleteError } = await supabase
		.from('project_keywords')
		.delete()
		.eq('id', keywordId)
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId);

	if (deleteError) {
		throw error(500, 'Failed to delete keyword');
	}

	return json({ success: true }, {
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		}
	});
};
