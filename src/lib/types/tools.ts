// ============================================================================
// TOOLS TYPES
// ============================================================================
// Type definitions for Tools/Integrations system
// ============================================================================

import type { WorkspaceRole } from './database.js';

// ============================================================================
// DATABASE ENUMS
// ============================================================================

export type ToolCategory =
	| 'ai'
	| 'scanner'
	| 'analytics'
	| 'automation'
	| 'integration'
	| 'other';

export type ToolStatus = 'active' | 'beta' | 'deprecated' | 'maintenance';

// ============================================================================
// TOOL TYPES
// ============================================================================

export interface Tool {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	category: ToolCategory;
	status: ToolStatus;
	requires_premium: boolean;
	icon_url: string | null;
	documentation_url: string | null;
	version: string | null;
	config_schema: Record<string, any> | null;
	default_config: Record<string, any> | null;
	created_at: string;
	updated_at: string;
}

export interface ToolActivation {
	id: string;
	project_id: string;
	tool_id: string;
	is_enabled: boolean;
	config: Record<string, any> | null;
	usage_count: number;
	last_used_at: string | null;
	enabled_by: string;
	enabled_at: string;
	disabled_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface ToolWithActivation extends Tool {
	is_activated: boolean;
	activation: ToolActivationDetails | null;
}

export interface ToolActivationDetails {
	id: string;
	is_enabled: boolean;
	config: Record<string, any> | null;
	enabled_at: string;
	enabled_by: {
		id: string;
		name: string;
		email?: string;
	} | null;
	usage_count: number;
	last_used_at: string | null;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// Browse Tools
export interface GetToolsParams {
	category?: ToolCategory;
	status?: ToolStatus;
	search?: string;
}

export interface GetToolsResponse {
	tools: Tool[];
}

// Project Tools
export interface GetProjectToolsParams {
	filter?: 'all' | 'activated' | 'available';
	category?: ToolCategory;
}

export interface GetProjectToolsResponse {
	project: {
		id: string;
		name: string;
		workspace_id: string;
	};
	tools: ToolWithActivation[];
}

// Activate Tool
export interface ActivateToolRequest {
	tool_id?: string;
	tool_slug?: string;
	config?: Record<string, any>;
}

export interface ActivateToolResponse {
	success: boolean;
	message: string;
	activation: {
		id: string;
		project_id: string;
		tool_id: string;
		tool: {
			id: string;
			slug: string;
			name: string;
		};
		is_enabled: boolean;
		config: Record<string, any> | null;
		enabled_by: string;
		enabled_at: string;
	};
}

// Update Tool
export interface UpdateToolRequest {
	is_enabled?: boolean;
	config?: Record<string, any>;
}

export interface UpdateToolResponse {
	success: boolean;
	message: string;
	activation: ToolActivation;
}

// Deactivate Tool
export interface DeactivateToolResponse {
	success: boolean;
	message: string;
}

// Tool Details
export interface GetToolDetailsResponse {
	tool: Tool;
	activation: ToolActivationDetails;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
	error: string;
	code?: string;
	details?: Record<string, any>;
}

export type ApiErrorCode =
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'ALREADY_EXISTS'
	| 'PREMIUM_REQUIRED'
	| 'VALIDATION_ERROR'
	| 'INTERNAL_ERROR';

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface AccessCheck {
	authorized: boolean;
	role: WorkspaceRole | null;
}

// ============================================================================
// FRONTEND UI TYPES
// ============================================================================

export interface ToolCardProps {
	tool: ToolWithActivation;
	onActivate?: (tool: Tool) => void;
	onConfigure?: (tool: Tool) => void;
	onDeactivate?: (tool: Tool) => void;
}

export interface ToolsGridProps {
	tools: ToolWithActivation[];
	loading?: boolean;
	error?: string | null;
	filter?: 'all' | 'activated' | 'available';
	onFilterChange?: (filter: 'all' | 'activated' | 'available') => void;
}

export interface ActivateToolModalProps {
	tool: Tool;
	open: boolean;
	onClose: () => void;
	onConfirm: (config: Record<string, any>) => void;
	loading?: boolean;
}

export interface ToolSettingsProps {
	tool: Tool;
	activation: ToolActivationDetails;
	onSave: (config: Record<string, any>) => void;
	onToggle: (enabled: boolean) => void;
	loading?: boolean;
}

// ============================================================================
// STORE TYPES (for state management)
// ============================================================================

export interface ToolsStore {
	catalog: Tool[];
	projectTools: ToolWithActivation[];
	loading: boolean;
	error: string | null;

	// Actions
	fetchCatalog: () => Promise<void>;
	fetchProjectTools: (workspaceId: string, projectId: string) => Promise<void>;
	activateTool: (
		workspaceId: string,
		projectId: string,
		request: ActivateToolRequest
	) => Promise<void>;
	updateTool: (
		workspaceId: string,
		projectId: string,
		toolId: string,
		request: UpdateToolRequest
	) => Promise<void>;
	deactivateTool: (workspaceId: string, projectId: string, toolId: string) => Promise<void>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// For filtering tools by category
export const TOOL_CATEGORIES: Record<ToolCategory, { label: string; icon: string }> = {
	ai: { label: 'AI & Machine Learning', icon: '🤖' },
	scanner: { label: 'Scanners & Crawlers', icon: '🔍' },
	analytics: { label: 'Analytics & Insights', icon: '📊' },
	automation: { label: 'Automation', icon: '⚡' },
	integration: { label: 'Integrations', icon: '🔌' },
	other: { label: 'Other', icon: '📦' },
};

// For displaying status
export const TOOL_STATUS_LABELS: Record<ToolStatus, string> = {
	active: 'Active',
	beta: 'Beta',
	deprecated: 'Deprecated',
	maintenance: 'Maintenance',
};

// For permission checks
export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
	viewer: 0,
	member: 1,
	admin: 2,
	owner: 3,
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isTool(obj: any): obj is Tool {
	return (
		typeof obj === 'object' &&
		typeof obj.id === 'string' &&
		typeof obj.slug === 'string' &&
		typeof obj.name === 'string'
	);
}

export function isToolWithActivation(obj: any): obj is ToolWithActivation {
	return isTool(obj) && 'is_activated' in obj && typeof obj.is_activated === 'boolean';
}

export function hasRequiredRole(userRole: WorkspaceRole, requiredRole: WorkspaceRole): boolean {
	return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// ============================================================================
// API CLIENT TYPES (for frontend)
// ============================================================================

export interface ToolsApiClient {
	getCatalog(params?: GetToolsParams): Promise<GetToolsResponse>;
	getProjectTools(
		workspaceId: string,
		projectId: string,
		params?: GetProjectToolsParams
	): Promise<GetProjectToolsResponse>;
	getAvailableTools(workspaceId: string, projectId: string): Promise<ToolWithActivation[]>;
	getActivatedTools(workspaceId: string, projectId: string): Promise<ToolWithActivation[]>;
	activateTool(
		workspaceId: string,
		projectId: string,
		request: ActivateToolRequest
	): Promise<ActivateToolResponse>;
	getToolDetails(
		workspaceId: string,
		projectId: string,
		toolId: string
	): Promise<GetToolDetailsResponse>;
	updateTool(
		workspaceId: string,
		projectId: string,
		toolId: string,
		request: UpdateToolRequest
	): Promise<UpdateToolResponse>;
	deactivateTool(
		workspaceId: string,
		projectId: string,
		toolId: string
	): Promise<DeactivateToolResponse>;
}

// ============================================================================
// VALIDATION SCHEMAS (for runtime validation)
// ============================================================================

export const VALIDATION = {
	toolSlug: /^[a-z0-9-]{2,50}$/,
	toolName: { minLength: 1, maxLength: 100 },
	toolDescription: { maxLength: 500 },
} as const;

