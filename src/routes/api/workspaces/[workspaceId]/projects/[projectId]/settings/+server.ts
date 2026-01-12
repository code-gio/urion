import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import type { ProjectSettingsRow, ProjectSettings } from '$lib/types/project-settings.js';

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

	// Get or create project settings
	const { data: settings, error: settingsError } = await supabase
		.from('project_settings')
		.select('*')
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.single();

	if (settingsError && settingsError.code !== 'PGRST116') {
		// PGRST116 is "not found", which is okay - we'll create it
		throw error(500, 'Failed to load project settings');
	}

	// If no settings exist, return defaults
	if (!settings) {
		return json({
			project_id: projectId,
			workspace_id: workspaceId,
			industry: null,
			primary_language: null,
			target_countries: [],
			settings: {} as ProjectSettings,
			created_by: user.id,
			updated_by: null,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		});
	}

	return json(settings);
};

export const PATCH: RequestHandler = async (event) => {
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'update',
		validateUUIDs: ['workspaceId', 'projectId'],
		maxBodySize: 100 * 1024 // 100KB for JSONB
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
	const { settings: settingsPatch, industry, primary_language, target_countries } = body;

	// Get current settings
	const { data: currentSettings, error: fetchError } = await supabase
		.from('project_settings')
		.select('settings')
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.single();

	let mergedSettings: ProjectSettings = {};

	if (currentSettings && !fetchError) {
		mergedSettings = currentSettings.settings || {};
	}

	// Deep merge settings if provided
	if (settingsPatch) {
		mergedSettings = {
			...mergedSettings,
			...settingsPatch
		};
	}

	// Prepare update
	const updateData: Partial<ProjectSettingsRow> = {
		updated_by: user.id,
		updated_at: new Date().toISOString()
	};

	if (settingsPatch !== undefined) {
		updateData.settings = mergedSettings;
	}
	if (industry !== undefined) {
		updateData.industry = industry;
	}
	if (primary_language !== undefined) {
		updateData.primary_language = primary_language;
	}
	if (target_countries !== undefined) {
		updateData.target_countries = target_countries;
	}

	// Upsert settings
	const { data: updatedSettings, error: updateError } = await supabase
		.from('project_settings')
		.upsert(
			{
				project_id: projectId,
				workspace_id: workspaceId,
				...updateData,
				created_by: currentSettings?.created_by || user.id
			},
			{
				onConflict: 'project_id,workspace_id'
			}
		)
		.select()
		.single();

	if (updateError) {
		throw error(500, 'Failed to update project settings');
	}

	return json(updatedSettings, {
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		}
	});
};
