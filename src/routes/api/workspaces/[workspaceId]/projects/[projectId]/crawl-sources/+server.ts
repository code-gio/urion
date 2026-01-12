import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import { validateURL } from '$lib/utils/validation.js';
import type { ProjectCrawlSource, CrawlSourceType } from '$lib/types/project-settings.js';

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

	const { data: sources, error: sourcesError } = await supabase
		.from('project_crawl_sources')
		.select('*')
		.eq('project_id', projectId)
		.eq('workspace_id', workspaceId)
		.order('created_at', { ascending: false });

	if (sourcesError) {
		throw error(500, 'Failed to load crawl sources');
	}

	return json(sources || []);
};

export const POST: RequestHandler = async (event) => {
  await applySecurity(event, {
    csrf: true,
    rateLimit: "create",
    validateUUIDs: ["workspaceId", "projectId"],
    maxBodySize: 10 * 1024,
  });

  const { params, request, locals } = event;
  const { session, user } = await locals.safeGetSession();

  if (!session || !user) {
    throw error(401, "Unauthorized");
  }

  const { workspaceId, projectId } = params;
  const supabase = locals.supabase;

  // Check access
  const { authorized } = await checkProjectAccess(
    supabase,
    user.id,
    workspaceId,
    projectId
  );

  if (!authorized) {
    throw error(403, "Forbidden");
  }

  const body = await request.json();
  const {
    source_type,
    url,
    is_primary,
    include_patterns,
    exclude_patterns,
    respect_robots,
    notes,
  } = body;

  console.log('[CRAWL SOURCE CREATE]', {
    source_type,
    url,
    is_primary,
    body
  });

  // Validate
  if (!source_type || !url) {
    throw error(400, "source_type and url are required");
  }

  let validatedUrl: string | null;
  try {
    validatedUrl = validateURL(url);
  } catch (err) {
    console.error('[CRAWL SOURCE VALIDATION ERROR]', err);
    throw error(400, err instanceof Error ? err.message : "Invalid URL");
  }

  if (!validatedUrl) {
    throw error(400, "Invalid URL");
  }

  // If this is marked as primary, unset other primary sources of the same type
  if (is_primary) {
    await supabase
      .from("project_crawl_sources")
      .update({ is_primary: false })
      .eq("project_id", projectId)
      .eq("workspace_id", workspaceId)
      .eq("source_type", source_type);
  }

  // Create crawl source
  const { data: newSource, error: createError } = await supabase
    .from("project_crawl_sources")
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      source_type: source_type as CrawlSourceType,
      url: validatedUrl,
      is_primary: is_primary || false,
      include_patterns: include_patterns || [],
      exclude_patterns: exclude_patterns || [],
      respect_robots: respect_robots !== false,
      notes: notes || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (createError) {
    throw error(500, "Failed to create crawl source");
  }

  return json(newSource, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
};

export const PATCH: RequestHandler = async (event) => {
  await applySecurity(event, {
    csrf: true,
    rateLimit: "update",
    validateUUIDs: ["workspaceId", "projectId"],
    maxBodySize: 10 * 1024,
  });

  const { params, url: requestUrl, request, locals } = event;
  const { session, user } = await locals.safeGetSession();

  if (!session || !user) {
    throw error(401, "Unauthorized");
  }

  const { workspaceId, projectId } = params;
  const sourceId = requestUrl.searchParams.get("id");

  if (!sourceId) {
    throw error(400, "Source ID is required");
  }

  const supabase = locals.supabase;

  // Check access
  const { authorized } = await checkProjectAccess(
    supabase,
    user.id,
    workspaceId,
    projectId
  );

  if (!authorized) {
    throw error(403, "Forbidden");
  }

  const body = await request.json();
  const {
    url,
    is_primary,
    source_type,
    include_patterns,
    exclude_patterns,
    respect_robots,
    notes,
  } = body;

  const updateData: Partial<ProjectCrawlSource> = {
    updated_at: new Date().toISOString(),
  };

  if (url !== undefined) {
    let validatedUrl: string | null;
    try {
      validatedUrl = validateURL(url);
    } catch (err) {
      throw error(400, err instanceof Error ? err.message : "Invalid URL");
    }

    if (!validatedUrl) {
      throw error(400, "Invalid URL");
    }
    updateData.url = validatedUrl;
  }
  if (is_primary !== undefined) {
    updateData.is_primary = is_primary;
    // If setting as primary, unset others of same type
    if (is_primary && source_type) {
      await supabase
        .from("project_crawl_sources")
        .update({ is_primary: false })
        .eq("project_id", projectId)
        .eq("workspace_id", workspaceId)
        .eq("source_type", source_type)
        .neq("id", sourceId);
    }
  }
  if (include_patterns !== undefined) {
    updateData.include_patterns = include_patterns;
  }
  if (exclude_patterns !== undefined) {
    updateData.exclude_patterns = exclude_patterns;
  }
  if (respect_robots !== undefined) {
    updateData.respect_robots = respect_robots;
  }
  if (notes !== undefined) {
    updateData.notes = notes;
  }

  const { data: updatedSource, error: updateError } = await supabase
    .from("project_crawl_sources")
    .update(updateData)
    .eq("id", sourceId)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (updateError) {
    throw error(500, "Failed to update crawl source");
  }

  return json(updatedSource, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
};

export const DELETE: RequestHandler = async (event) => {
  await applySecurity(event, {
    csrf: true,
    rateLimit: "delete",
    validateUUIDs: ["workspaceId", "projectId"],
  });

  const { params, url: requestUrl, locals } = event;
  const { session, user } = await locals.safeGetSession();

  if (!session || !user) {
    throw error(401, "Unauthorized");
  }

  const { workspaceId, projectId } = params;
  const sourceId = requestUrl.searchParams.get("id");

  if (!sourceId) {
    throw error(400, "Source ID is required");
  }

  const supabase = locals.supabase;

  // Check access
  const { authorized } = await checkProjectAccess(
    supabase,
    user.id,
    workspaceId,
    projectId
  );

  if (!authorized) {
    throw error(403, "Forbidden");
  }

  const { error: deleteError } = await supabase
    .from("project_crawl_sources")
    .delete()
    .eq("id", sourceId)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId);

  if (deleteError) {
    throw error(500, "Failed to delete crawl source");
  }

  return json(
    { success: true },
    {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
};
