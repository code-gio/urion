// =====================================================
// Backlink Directory - TypeScript Types
// =====================================================
// Complete type definitions for the Backlink Directory tool
// =====================================================

// ============================================================================
// DATABASE ENUMS
// ============================================================================

export type BacklinkCategory =
	| 'directory'
	| 'guest_post'
	| 'forum'
	| 'social_bookmarking'
	| 'blog_comment'
	| 'profile'
	| 'resource_page'
	| 'web_2_0'
	| 'press_release'
	| 'q_and_a'
	| 'social_media'
	| 'other';

export type LinkType = 'dofollow' | 'nofollow' | 'ugc' | 'mixed' | 'unknown';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type CostType = 'free' | 'freemium' | 'paid' | 'trial';

export type SubmissionStatus =
	| 'not_started'
	| 'in_progress'
	| 'submitted'
	| 'approved'
	| 'rejected'
	| 'expired';

export type BacklinkStatus = 'active' | 'broken' | 'reviewing' | 'inactive';

// ============================================================================
// CORE TYPES
// ============================================================================

export interface BacklinkSite {
	id: string;
	name: string;
	url: string;
	description: string | null;

	// Status
	status: BacklinkStatus;

	// Categorization
	category: BacklinkCategory;
	speciality: string | null;
	tags: string[];

	// SEO Metrics
	dr: number | null;
	page_authority: number | null;
	spam_score: number | null;
	link_type: LinkType;
	traffic: string | null;

	// Submission Info
	submission_url: string | null;
	submission_instructions: string | null;
	typical_approval_time: string | null;
	difficulty_level: Difficulty | null;
	estimated_time_minutes: number | null;

	// Requirements
	requires_registration: boolean;
	requires_approval: boolean;
	requires_payment_verification: boolean;
	instant_approval: boolean;
	minimum_requirements: string | null;
	required_fields: string[];
	geographic_restrictions: string[];
	accepted_niches: string[];

	// Cost
	cost: string | null; // Legacy
	cost_type: CostType | null;
	pricing_details: string | null;

	// Quality
	is_verified: boolean;
	user_rating: number | null;
	success_rate: number | null;
	submission_count: number;

	// TLD
	tld: string | null;

	// Metadata
	added_by: string | null;
	last_checked_at: string | null;
	broken_reports: number;
	notes_admin: string | null;
	created_at: string;
	updated_at: string;
}

export interface BacklinkSubmission {
	id: string;
	project_id: string;
	backlink_site_id: string;

	// Status
	status: SubmissionStatus;
	is_live: boolean;

	// URLs
	submitted_url: string | null;
	submission_page_url: string | null;
	backlink_url: string | null;
	anchor_text: string | null;

	// Account details
	account_username: string | null;
	account_email: string | null;

	// Tracking
	notes: string | null;
	rejection_reason: string | null;
	attempts: number;

	// Analytics
	referral_traffic: number | null;
	conversion_count: number | null;

	// Dates
	created_at: string;
	started_at: string | null;
	submitted_at: string | null;
	approved_at: string | null;
	rejected_at: string | null;
	last_checked_at: string | null;

	// Metadata
	submitted_by: string;
	updated_at: string;
}

export interface BacklinkSubmissionWithSite extends BacklinkSubmission {
	site: BacklinkSite;
	submitted_by_user: {
		id: string;
		name: string;
		email?: string;
	} | null;
}

export interface BacklinkSiteWithSubmission extends BacklinkSite {
	has_submission: boolean;
	submission: BacklinkSubmission | null;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// Browse Sites
export interface GetBacklinkSitesParams {
	// Filtering
	category?: BacklinkCategory | BacklinkCategory[];
	link_type?: LinkType | LinkType[];
	cost_type?: CostType | CostType[];
	difficulty?: Difficulty | Difficulty[];

	// Ranges
	min_dr?: number;
	max_dr?: number;

	// Boolean filters
	verified_only?: boolean;
	instant_approval?: boolean;
	requires_registration?: boolean;

	// Search
	search?: string;
	tags?: string[];

	// Pagination
	limit?: number;
	offset?: number;

	// Sorting
	sort_by?: 'dr' | 'name' | 'submissions' | 'rating';
	sort_order?: 'asc' | 'desc';
}

export interface GetBacklinkSitesResponse {
	sites: BacklinkSiteWithSubmission[];
	total: number;
	limit: number;
	offset: number;
	filters_applied: Record<string, any>;
}

// Get Site Details
export interface GetBacklinkSiteResponse {
	site: BacklinkSite;
	submission: BacklinkSubmission | null;
}

// List Submissions
export interface GetSubmissionsParams {
	status?: SubmissionStatus;
	is_live?: boolean;
	sort_by?: 'created_at' | 'submitted_at' | 'dr';
	sort_order?: 'asc' | 'desc';
	limit?: number;
	offset?: number;
}

export interface GetSubmissionsResponse {
	submissions: BacklinkSubmissionWithSite[];
	total: number;
	stats: SubmissionStats;
}

// Submission Stats
export interface SubmissionStats {
	total: number;
	not_started: number;
	in_progress: number;
	submitted: number;
	approved: number;
	rejected: number;
	expired: number;
	live: number;
}

// Create Submission
export interface CreateSubmissionRequest {
	backlink_site_id: string;
	submitted_url?: string;
	status?: SubmissionStatus;
	notes?: string;
}

export interface CreateSubmissionResponse {
	success: boolean;
	message: string;
	submission: BacklinkSubmissionWithSite;
}

// Update Submission
export interface UpdateSubmissionRequest {
	status?: SubmissionStatus;
	is_live?: boolean;
	backlink_url?: string;
	submission_page_url?: string;
	anchor_text?: string;
	account_username?: string;
	account_email?: string;
	notes?: string;
	rejection_reason?: string;
	referral_traffic?: number;
	conversion_count?: number;
	increment_attempts?: boolean;
}

export interface UpdateSubmissionResponse {
	success: boolean;
	message: string;
	submission: BacklinkSubmissionWithSite;
}

// Submission Analytics
export interface SubmissionAnalytics {
	overview: {
		total_submissions: number;
		not_started: number;
		in_progress: number;
		submitted: number;
		approved: number;
		rejected: number;
		expired: number;
		live_backlinks: number;
		success_rate: number;
	};

	by_category: Array<{
		category: BacklinkCategory;
		count: number;
		approved: number;
		rejected: number;
	}>;

	by_link_type: Array<{
		link_type: LinkType;
		count: number;
		approved: number;
	}>;

	metrics: {
		avg_dr: number;
		total_referral_traffic: number;
		total_conversions: number;
		avg_approval_time_days: number;
	};

	recent_activity: Array<{
		date: string;
		submitted: number;
		approved: number;
		rejected: number;
	}>;
}

// ============================================================================
// UI COMPONENT PROPS
// ============================================================================

export interface BacklinkSiteCardProps {
	site: BacklinkSiteWithSubmission;
	onViewDetails?: (site: BacklinkSite) => void;
	onAddToProject?: (site: BacklinkSite) => void;
}

export interface BacklinkFiltersProps {
	filters: GetBacklinkSitesParams;
	onChange: (filters: GetBacklinkSitesParams) => void;
	onReset: () => void;
}

export interface SubmissionCardProps {
	submission: BacklinkSubmissionWithSite;
	onUpdateStatus?: (submission: BacklinkSubmission, status: SubmissionStatus) => void;
	onViewDetails?: (submission: BacklinkSubmission) => void;
	onDelete?: (submission: BacklinkSubmission) => void;
}

export interface UpdateStatusModalProps {
	submission: BacklinkSubmission;
	open: boolean;
	onClose: () => void;
	onConfirm: (data: UpdateSubmissionRequest) => void;
	loading?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const BACKLINK_CATEGORIES: Record<
	BacklinkCategory,
	{ label: string; icon: string }
> = {
	directory: { label: 'Directory', icon: '📁' },
	guest_post: { label: 'Guest Post', icon: '✍️' },
	forum: { label: 'Forum', icon: '💬' },
	social_bookmarking: { label: 'Social Bookmarking', icon: '🔖' },
	blog_comment: { label: 'Blog Comment', icon: '💭' },
	profile: { label: 'Profile', icon: '👤' },
	resource_page: { label: 'Resource Page', icon: '📚' },
	web_2_0: { label: 'Web 2.0', icon: '🌐' },
	press_release: { label: 'Press Release', icon: '📰' },
	q_and_a: { label: 'Q&A', icon: '❓' },
	social_media: { label: 'Social Media', icon: '📱' },
	other: { label: 'Other', icon: '📦' },
};

export const LINK_TYPES: Record<LinkType, { label: string; color: string }> = {
	dofollow: { label: 'Dofollow', color: 'green' },
	nofollow: { label: 'Nofollow', color: 'gray' },
	ugc: { label: 'UGC', color: 'blue' },
	mixed: { label: 'Mixed', color: 'yellow' },
	unknown: { label: 'Unknown', color: 'gray' },
};

export const DIFFICULTY_LEVELS: Record<Difficulty, { label: string; color: string }> =
	{
		easy: { label: 'Easy', color: 'green' },
		medium: { label: 'Medium', color: 'yellow' },
		hard: { label: 'Hard', color: 'red' },
	};

export const SUBMISSION_STATUSES: Record<
	SubmissionStatus,
	{ label: string; color: string; icon: string }
> = {
	not_started: { label: 'Not Started', color: 'gray', icon: '📝' },
	in_progress: { label: 'In Progress', color: 'blue', icon: '⏳' },
	submitted: { label: 'Submitted', color: 'yellow', icon: '📤' },
	approved: { label: 'Approved', color: 'green', icon: '✅' },
	rejected: { label: 'Rejected', color: 'red', icon: '❌' },
	expired: { label: 'Expired', color: 'gray', icon: '⏰' },
};

export const COST_TYPES: Record<CostType, { label: string; icon: string }> = {
	free: { label: 'Free', icon: '🆓' },
	freemium: { label: 'Freemium', icon: '💎' },
	paid: { label: 'Paid', icon: '💰' },
	trial: { label: 'Trial', icon: '⏰' },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getDRBadgeColor(dr: number | null): string {
	if (!dr) return 'gray';
	if (dr >= 80) return 'green';
	if (dr >= 60) return 'blue';
	if (dr >= 40) return 'yellow';
	return 'orange';
}

export function getDRLabel(dr: number | null): string {
	if (!dr) return 'Unknown';
	if (dr >= 80) return 'Excellent';
	if (dr >= 60) return 'Good';
	if (dr >= 40) return 'Fair';
	return 'Low';
}

export function calculateSuccessRate(approved: number, rejected: number): number {
	const total = approved + rejected;
	if (total === 0) return 0;
	return Math.round((approved / total) * 100);
}

export function formatApprovalTime(time: string | null): string {
	if (!time) return 'Unknown';
	return time;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isBacklinkSite(obj: any): obj is BacklinkSite {
	return (
		typeof obj === 'object' &&
		typeof obj.id === 'string' &&
		typeof obj.name === 'string' &&
		typeof obj.url === 'string'
	);
}

export function isBacklinkSubmission(obj: any): obj is BacklinkSubmission {
	return (
		typeof obj === 'object' &&
		typeof obj.id === 'string' &&
		typeof obj.project_id === 'string' &&
		typeof obj.backlink_site_id === 'string'
	);
}

export function hasSubmission(
	site: BacklinkSiteWithSubmission
): site is BacklinkSiteWithSubmission & { submission: BacklinkSubmission } {
	return site.has_submission && site.submission !== null;
}

