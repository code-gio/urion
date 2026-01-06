/**
 * Centralized API client with error handling, request deduplication, and retry logic
 */

import { error } from '@sveltejs/kit';
import { getCachedRequest, createCacheKey, invalidateCache } from './cache.js';

export interface ApiError {
	message: string;
	status: number;
	code?: string;
}

export class ApiClientError extends Error {
	status: number;
	code?: string;

	constructor(message: string, status: number, code?: string) {
		super(message);
		this.name = 'ApiClientError';
		this.status = status;
		this.code = code;
	}
}

interface RequestOptions extends RequestInit {
	skipCache?: boolean;
	retries?: number;
}

const DEFAULT_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(
	url: string,
	options: RequestOptions,
	retries: number
): Promise<Response> {
	try {
		const response = await fetch(url, {
			...options,
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
		});

		// Retry on 5xx errors
		if (!response.ok && response.status >= 500 && retries > 0) {
			await sleep(RETRY_DELAY);
			return fetchWithRetry(url, options, retries - 1);
		}

		return response;
	} catch (err) {
		// Retry on network errors
		if (retries > 0) {
			await sleep(RETRY_DELAY);
			return fetchWithRetry(url, options, retries - 1);
		}
		throw err;
	}
}

/**
 * Parse error response
 */
async function parseError(response: Response): Promise<ApiError> {
	let message = `Server error: ${response.status} ${response.statusText}`;
	let code: string | undefined;

	try {
		const data = await response.json();
		message = data.error || data.message || message;
		code = data.code;
	} catch {
		// Use default message if JSON parsing fails
	}

	return {
		message,
		status: response.status,
		code,
	};
}

/**
 * Make API request with caching and error handling
 */
export async function apiRequest<T>(
	endpoint: string,
	options: RequestOptions = {}
): Promise<T> {
	const { skipCache = false, retries = DEFAULT_RETRIES, ...fetchOptions } = options;
	const method = fetchOptions.method || 'GET';
	const cacheKey = createCacheKey(endpoint, fetchOptions.body ? JSON.parse(fetchOptions.body as string) : undefined);

	// Skip cache for non-GET requests or if explicitly requested
	if (skipCache || method !== 'GET') {
		const response = await fetchWithRetry(endpoint, fetchOptions, retries);

		if (!response.ok) {
			const error = await parseError(response);
			throw new ApiClientError(error.message, error.status, error.code);
		}

		return response.json();
	}

	// Use cache for GET requests
	return getCachedRequest<T>(cacheKey, async () => {
		const response = await fetchWithRetry(endpoint, fetchOptions, retries);

		if (!response.ok) {
			const error = await parseError(response);
			throw new ApiClientError(error.message, error.status, error.code);
		}

		return response.json();
	});
}

/**
 * GET request
 */
export function get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
	return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 */
export function post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
	return apiRequest<T>(endpoint, {
		...options,
		method: 'POST',
		body: data ? JSON.stringify(data) : undefined,
	});
}

/**
 * PATCH request
 */
export function patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
	return apiRequest<T>(endpoint, {
		...options,
		method: 'PATCH',
		body: data ? JSON.stringify(data) : undefined,
	});
}

/**
 * DELETE request
 */
export function del<T>(endpoint: string, options?: RequestOptions): Promise<T> {
	return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Invalidate cache for endpoint
 */
export function invalidateEndpointCache(endpoint: string): void {
	invalidateCache(endpoint);
}


