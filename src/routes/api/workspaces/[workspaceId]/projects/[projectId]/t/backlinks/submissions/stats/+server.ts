import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { SubmissionAnalytics } from '$lib/types';
import { applySecurity } from '$lib/utils/api-security.js';
import { checkProjectAccess } from '$lib/server/tools.js';
import { calculateSuccessRate } from '$lib/types/backlinks.js';

export const GET: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: false,
		rateLimit: 'general',
		validateUUIDs: ['workspaceId', 'projectId'],
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

	// Get all submissions with site data
	const { data: submissions, error: submissionsError } = await supabase
    .from("project_backlink_submissions")
    .select(
      `
      *,
      backlink_sites (
        id,
        primary_category,
        link_type,
        dr
      )
    `
    )
    .eq("project_id", projectId);

  if (submissionsError) {
    throw error(500, submissionsError.message);
  }

  const submissionsData = submissions || [];

  // Calculate overview stats
  const overview = {
    total_submissions: submissionsData.length,
    not_started: submissionsData.filter((s) => s.status === "not_started")
      .length,
    in_progress: submissionsData.filter((s) => s.status === "in_progress")
      .length,
    submitted: submissionsData.filter((s) => s.status === "submitted").length,
    approved: submissionsData.filter((s) => s.status === "approved").length,
    rejected: submissionsData.filter((s) => s.status === "rejected").length,
    expired: submissionsData.filter((s) => s.status === "expired").length,
    live_backlinks: submissionsData.filter((s) => s.is_live === true).length,
    success_rate: calculateSuccessRate(
      submissionsData.filter((s) => s.status === "approved").length,
      submissionsData.filter((s) => s.status === "rejected").length
    ),
  };

  // Calculate by category
  const categoryMap = new Map<
    string,
    { count: number; approved: number; rejected: number }
  >();
  submissionsData.forEach((submission: any) => {
    const category = submission.backlink_sites?.primary_category || "other";
    const current = categoryMap.get(category) || {
      count: 0,
      approved: 0,
      rejected: 0,
    };
    current.count++;
    if (submission.status === "approved") current.approved++;
    if (submission.status === "rejected") current.rejected++;
    categoryMap.set(category, current);
  });

	const by_category = Array.from(categoryMap.entries()).map(([category, stats]) => ({
		category: category as any,
		...stats,
	}));

	// Calculate by link type
	const linkTypeMap = new Map<string, { count: number; approved: number }>();
	submissionsData.forEach((submission: any) => {
		const linkType = submission.backlink_sites?.link_type || 'unknown';
		const current = linkTypeMap.get(linkType) || { count: 0, approved: 0 };
		current.count++;
		if (submission.status === 'approved') current.approved++;
		linkTypeMap.set(linkType, current);
	});

	const by_link_type = Array.from(linkTypeMap.entries()).map(([link_type, stats]) => ({
		link_type: link_type as any,
		...stats,
	}));

	// Calculate metrics
	const approvedSubmissions = submissionsData.filter((s) => s.status === 'approved');
	const drValues = approvedSubmissions
		.map((s: any) => s.backlink_sites?.dr)
		.filter((dr: any) => dr !== null && dr !== undefined) as number[];
	const avg_dr = drValues.length > 0 ? drValues.reduce((a, b) => a + b, 0) / drValues.length : 0;

	const total_referral_traffic = submissionsData.reduce(
		(sum, s) => sum + (s.referral_traffic || 0),
		0
	);
	const total_conversions = submissionsData.reduce((sum, s) => sum + (s.conversion_count || 0), 0);

	// Calculate average approval time
	const approvedWithDates = approvedSubmissions.filter(
		(s) => s.submitted_at && s.approved_at
	);
	let avg_approval_time_days = 0;
	if (approvedWithDates.length > 0) {
		const totalDays = approvedWithDates.reduce((sum, s) => {
			const submitted = new Date(s.submitted_at).getTime();
			const approved = new Date(s.approved_at).getTime();
			const days = (approved - submitted) / (1000 * 60 * 60 * 24);
			return sum + days;
		}, 0);
		avg_approval_time_days = totalDays / approvedWithDates.length;
	}

	const metrics = {
		avg_dr: Math.round(avg_dr * 10) / 10,
		total_referral_traffic,
		total_conversions,
		avg_approval_time_days: Math.round(avg_approval_time_days * 10) / 10,
	};

	// Calculate recent activity (last 30 days)
	const recentActivityMap = new Map<string, { submitted: number; approved: number; rejected: number }>();
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	submissionsData.forEach((submission: any) => {
		if (submission.submitted_at) {
			const date = new Date(submission.submitted_at);
			if (date >= thirtyDaysAgo) {
				const dateStr = date.toISOString().split('T')[0];
				const current = recentActivityMap.get(dateStr) || {
					submitted: 0,
					approved: 0,
					rejected: 0,
				};
				if (submission.status === 'submitted' || submission.status === 'approved') {
					current.submitted++;
				}
				if (submission.status === 'approved') {
					current.approved++;
				}
				if (submission.status === 'rejected') {
					current.rejected++;
				}
				recentActivityMap.set(dateStr, current);
			}
		}
	});

	const recent_activity = Array.from(recentActivityMap.entries())
		.map(([date, stats]) => ({ date, ...stats }))
		.sort((a, b) => a.date.localeCompare(b.date));

	const response: SubmissionAnalytics = {
		overview,
		by_category,
		by_link_type,
		metrics,
		recent_activity,
	};

	return json(response, {
		headers: {
			'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
		},
	});
};

