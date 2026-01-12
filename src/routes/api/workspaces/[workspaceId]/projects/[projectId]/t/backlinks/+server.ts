import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type {
  GetBacklinkSitesParams,
  GetBacklinkSitesResponse,
} from "$lib/types";
import { applySecurity } from "$lib/utils/api-security.js";
import { checkProjectAccess } from "$lib/server/tools.js";

export const GET: RequestHandler = async (event) => {
  // Apply security checks
  await applySecurity(event, {
    csrf: false, // GET requests don't need CSRF
    rateLimit: "general",
    validateUUIDs: ["workspaceId", "projectId"],
  });

  const { params, url, locals } = event;
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

  // Get query parameters
  const category = url.searchParams.get("category");
  const linkType = url.searchParams.get("link_type");
  const cost = url.searchParams.get("cost");
  const difficulty = url.searchParams.get("difficulty");
  const minDr = url.searchParams.get("min_dr");
  const maxDr = url.searchParams.get("max_dr");
  const verifiedOnly = url.searchParams.get("verified_only") === "true";
  const instantApproval = url.searchParams.get("instant_approval") === "true";
  const requiresRegistration =
    url.searchParams.get("requires_registration") === "true";
  const search = url.searchParams.get("search");
  const tags = url.searchParams.get("tags")?.split(",").filter(Boolean);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const sortBy = url.searchParams.get("sort_by") || "dr";
  const sortOrder = url.searchParams.get("sort_order") || "desc";

  // Parse array filters (comma-separated values)
  const linkTypes = linkType?.split(",").filter(Boolean) || [];
  const costs = cost?.split(",").filter(Boolean) || [];
  const difficulties = difficulty?.split(",").filter(Boolean) || [];

  // Build query for backlink sites (without joins to avoid duplicates)
  // Use 'planned' count for better performance with large datasets
  let query = supabase
    .from("backlink_sites")
    .select("*", { count: "exact" })
    // .select("*", { count: "planned" })
    .eq("status", "active");

  // Apply filters
  if (category) {
    query = query.eq("primary_category", category);
  }
  if (linkTypes.length > 0) {
    if (linkTypes.length === 1) {
      query = query.eq("link_type", linkTypes[0]);
    } else {
      query = query.in("link_type", linkTypes);
    }
  }
  if (costs.length > 0) {
    if (costs.length === 1) {
      query = query.eq("cost", costs[0]);
    } else {
      query = query.in("cost", costs);
    }
  }
  if (difficulties.length > 0) {
    if (difficulties.length === 1) {
      query = query.eq("difficulty_level", difficulties[0]);
    } else {
      query = query.in("difficulty_level", difficulties);
    }
  }
  if (minDr) {
    query = query.gte("dr", parseInt(minDr));
  }
  if (maxDr) {
    query = query.lte("dr", parseInt(maxDr));
  }
  if (verifiedOnly) {
    query = query.eq("is_verified", true);
  }
  if (instantApproval) {
    query = query.eq("instant_approval", true);
  }
  if (requiresRegistration) {
    query = query.eq("requires_registration", true);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }
  if (tags && tags.length > 0) {
    query = query.contains("tags", tags);
  }

  // Apply sorting with stable secondary sort by id to avoid pagination duplicates
  const ascending = sortOrder === "asc";
  if (sortBy === "dr") {
    query = query
      .order("dr", { ascending, nullsFirst: false })
      .order("id", { ascending: true });
  } else if (sortBy === "name") {
    query = query.order("name", { ascending }).order("id", { ascending: true });
  } else if (sortBy === "submissions") {
    query = query
      .order("submission_count", { ascending })
      .order("id", { ascending: true });
  } else if (sortBy === "rating") {
    query = query
      .order("user_rating", { ascending, nullsFirst: false })
      .order("id", { ascending: true });
  } else {
    query = query
      .order("dr", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true });
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: sitesData, error: sitesError, count } = await query;

  if (sitesError) {
    throw error(500, sitesError.message);
  }

  // Get site IDs
  const siteIds = (sitesData || []).map((site: any) => site.id);

  // Fetch submissions for these sites in this project
  let submissions: any[] = [];
  if (siteIds.length > 0) {
    const { data: submissionsData } = await supabase
      .from("project_backlink_submissions")
      .select(
        "id, backlink_site_id, status, is_live, submitted_at, approved_at"
      )
      .eq("project_id", projectId)
      .in("backlink_site_id", siteIds);

    submissions = submissionsData || [];
  }

  // Create a map of submissions by site ID
  const submissionsMap = new Map();
  submissions.forEach((sub) => {
    submissionsMap.set(sub.backlink_site_id, sub);
  });

  // Transform data to include submission status
  const sites = (sitesData || []).map((site: any) => {
    const submission = submissionsMap.get(site.id) || null;

    return {
      ...site,
      has_submission: !!submission,
      submission: submission
        ? {
            id: submission.id,
            status: submission.status,
            is_live: submission.is_live,
            submitted_at: submission.submitted_at,
            approved_at: submission.approved_at,
          }
        : null,
    };
  });

  const response: GetBacklinkSitesResponse = {
    sites,
    total: count || 0,
    limit,
    offset,
    filters_applied: {
      ...(category && { category }),
      ...(linkTypes.length > 0 && {
        link_type: linkTypes.length === 1 ? linkTypes[0] : linkTypes,
      }),
      ...(costs.length > 0 && {
        cost: costs.length === 1 ? costs[0] : costs,
      }),
      ...(difficulties.length > 0 && {
        difficulty: difficulties.length === 1 ? difficulties[0] : difficulties,
      }),
      ...(minDr && { min_dr: parseInt(minDr) }),
      ...(maxDr && { max_dr: parseInt(maxDr) }),
      ...(verifiedOnly && { verified_only: true }),
      ...(instantApproval && { instant_approval: true }),
      ...(requiresRegistration && { requires_registration: true }),
      ...(search && { search }),
      ...(tags && tags.length > 0 && { tags }),
    },
  };

  return json(response, {
    headers: {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=30",
    },
  });
};
