// Frontend API client for Tools endpoints

import type {
	GetToolsParams,
	GetToolsResponse,
	GetProjectToolsParams,
	GetProjectToolsResponse,
	ActivateToolRequest,
	ActivateToolResponse,
	UpdateToolRequest,
	UpdateToolResponse,
	DeactivateToolResponse,
	GetToolDetailsResponse,
	ToolWithActivation,
	ToolsApiClient,
} from '$lib/types';

class ToolsClient implements ToolsApiClient {
	private baseUrl: string;

	constructor(baseUrl: string = '') {
		this.baseUrl = baseUrl;
	}

	/**
	 * Build URL with query parameters
	 */
	private buildUrl(path: string, params?: Record<string, any>): string {
		const url = new URL(path, window.location.origin);

		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.append(key, String(value));
				}
			});
		}

		return url.toString();
	}

	/**
	 * Make API request with error handling
	 */
	private async request<T>(url: string, options?: RequestInit): Promise<T> {
		try {
			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					...options?.headers,
				},
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || `Request failed with status ${response.status}`);
			}

			return data as T;
		} catch (error) {
			console.error('API request failed:', error);
			throw error;
		}
	}

	// ============================================================================
	// CATALOG ENDPOINTS
	// ============================================================================

	/**
	 * Get all tools from catalog
	 */
	async getCatalog(params?: GetToolsParams): Promise<GetToolsResponse> {
		const url = this.buildUrl(`${this.baseUrl}/api/tools`, params);
		return this.request<GetToolsResponse>(url);
	}

	// ============================================================================
	// PROJECT TOOLS ENDPOINTS
	// ============================================================================

	/**
	 * Get all tools for a project (with activation status)
	 */
	async getProjectTools(
		workspaceId: string,
		projectId: string,
		params?: GetProjectToolsParams
	): Promise<GetProjectToolsResponse> {
		const url = this.buildUrl(
			`${this.baseUrl}/api/workspaces/${workspaceId}/projects/${projectId}/tools`,
			params
		);
		return this.request<GetProjectToolsResponse>(url);
	}

	/**
	 * Get only available (not activated) tools for a project
	 */
	async getAvailableTools(workspaceId: string, projectId: string): Promise<ToolWithActivation[]> {
		const url = `${this.baseUrl}/api/workspaces/${workspaceId}/projects/${projectId}/tools/available`;
		const response = await this.request<{ available_tools: ToolWithActivation[] }>(url);
		return response.available_tools;
	}

	/**
	 * Get only activated tools for a project
	 */
	async getActivatedTools(workspaceId: string, projectId: string): Promise<ToolWithActivation[]> {
		const url = `${this.baseUrl}/api/workspaces/${workspaceId}/projects/${projectId}/tools/activated`;
		const response = await this.request<{ activated_tools: ToolWithActivation[] }>(url);
		return response.activated_tools;
	}

	/**
	 * Get details about a specific tool activation
	 */
	async getToolDetails(
		workspaceId: string,
		projectId: string,
		toolId: string
	): Promise<GetToolDetailsResponse> {
		const url = `${this.baseUrl}/api/workspaces/${workspaceId}/projects/${projectId}/tools/${toolId}`;
		return this.request<GetToolDetailsResponse>(url);
	}

	// ============================================================================
	// TOOL MANAGEMENT ENDPOINTS
	// ============================================================================

	/**
	 * Activate a tool for a project
	 */
	async activateTool(
		workspaceId: string,
		projectId: string,
		request: ActivateToolRequest
	): Promise<ActivateToolResponse> {
		const url = `${this.baseUrl}/api/workspaces/${workspaceId}/projects/${projectId}/tools`;
		return this.request<ActivateToolResponse>(url, {
			method: 'POST',
			body: JSON.stringify(request),
		});
	}

	/**
	 * Update tool configuration or toggle enabled status
	 */
	async updateTool(
		workspaceId: string,
		projectId: string,
		toolId: string,
		request: UpdateToolRequest
	): Promise<UpdateToolResponse> {
		const url = `${this.baseUrl}/api/workspaces/${workspaceId}/projects/${projectId}/tools/${toolId}`;
		return this.request<UpdateToolResponse>(url, {
			method: 'PATCH',
			body: JSON.stringify(request),
		});
	}

	/**
	 * Deactivate a tool from a project
	 */
	async deactivateTool(
		workspaceId: string,
		projectId: string,
		toolId: string
	): Promise<DeactivateToolResponse> {
		const url = `${this.baseUrl}/api/workspaces/${workspaceId}/projects/${projectId}/tools/${toolId}`;
		return this.request<DeactivateToolResponse>(url, {
			method: 'DELETE',
		});
	}

	// ============================================================================
	// CONVENIENCE METHODS
	// ============================================================================

	/**
	 * Activate tool by slug (convenience method)
	 */
	async activateToolBySlug(
		workspaceId: string,
		projectId: string,
		toolSlug: string,
		config?: Record<string, any>
	): Promise<ActivateToolResponse> {
		return this.activateTool(workspaceId, projectId, {
			tool_slug: toolSlug,
			config,
		});
	}

	/**
	 * Toggle tool enabled status (convenience method)
	 */
	async toggleTool(
		workspaceId: string,
		projectId: string,
		toolId: string,
		enabled: boolean
	): Promise<UpdateToolResponse> {
		return this.updateTool(workspaceId, projectId, toolId, {
			is_enabled: enabled,
		});
	}

	/**
	 * Update only tool configuration (convenience method)
	 */
	async updateToolConfig(
		workspaceId: string,
		projectId: string,
		toolId: string,
		config: Record<string, any>
	): Promise<UpdateToolResponse> {
		return this.updateTool(workspaceId, projectId, toolId, {
			config,
		});
	}
}

// Export singleton instance
export const toolsApi = new ToolsClient();

// Export class for testing or custom instances
export default ToolsClient;

