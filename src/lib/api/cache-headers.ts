/**
 * Cache headers utility for API responses
 */

export interface CacheHeadersOptions {
	maxAge?: number; // Cache duration in seconds
	staleWhileRevalidate?: number; // Stale-while-revalidate duration in seconds
	private?: boolean; // Whether cache should be private (default: true for authenticated endpoints)
	noCache?: boolean; // Whether to disable caching
}

const DEFAULT_MAX_AGE = 300; // 5 minutes
const DEFAULT_STALE_WHILE_REVALIDATE = 60; // 1 minute

/**
 * Generate cache headers for GET requests
 */
export function getCacheHeaders(options: CacheHeadersOptions = {}): Headers {
	const {
		maxAge = DEFAULT_MAX_AGE,
		staleWhileRevalidate = DEFAULT_STALE_WHILE_REVALIDATE,
		private: isPrivate = true,
		noCache = false,
	} = options;

	const headers = new Headers();

	if (noCache) {
		headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
		headers.set('Pragma', 'no-cache');
		headers.set('Expires', '0');
		return headers;
	}

	const cacheControl = [
		isPrivate ? 'private' : 'public',
		`max-age=${maxAge}`,
		`stale-while-revalidate=${staleWhileRevalidate}`,
	].join(', ');

	headers.set('Cache-Control', cacheControl);
	return headers;
}

/**
 * Generate no-cache headers for mutation requests (POST, PATCH, DELETE)
 */
export function getNoCacheHeaders(): Headers {
	return getCacheHeaders({ noCache: true });
}

