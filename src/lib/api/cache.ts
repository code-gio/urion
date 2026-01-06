/**
 * Request cache utility to prevent duplicate API calls
 * Shares pending requests across components
 */

type CacheEntry<T> = {
	promise: Promise<T>;
	timestamp: number;
	data?: T;
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const requestCache = new Map<string, CacheEntry<unknown>>();

/**
 * Create a cache key from endpoint and params
 */
export function createCacheKey(endpoint: string, params?: Record<string, unknown>): string {
	if (!params || Object.keys(params).length === 0) {
		return endpoint;
	}
	const sortedParams = Object.keys(params)
		.sort()
		.map((key) => `${key}=${JSON.stringify(params[key])}`)
		.join('&');
	return `${endpoint}?${sortedParams}`;
}

/**
 * Get cached request or create new one
 */
export function getCachedRequest<T>(
	key: string,
	fetcher: () => Promise<T>
): Promise<T> {
	const cached = requestCache.get(key);

	// Return cached data if still valid
	if (cached && cached.data && Date.now() - cached.timestamp < CACHE_TTL) {
		return Promise.resolve(cached.data as T);
	}

	// Return pending promise if exists
	if (cached && cached.promise) {
		return cached.promise as Promise<T>;
	}

	// Create new request
	const promise = fetcher().then((data) => {
		const entry = requestCache.get(key);
		if (entry) {
			entry.data = data;
		}
		return data;
	});

	requestCache.set(key, {
		promise,
		timestamp: Date.now(),
	});

	return promise;
}

/**
 * Invalidate cache entry
 */
export function invalidateCache(key: string): void {
	requestCache.delete(key);
}

/**
 * Invalidate cache entries matching pattern
 */
export function invalidateCachePattern(pattern: string | RegExp): void {
	const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
	for (const key of requestCache.keys()) {
		if (regex.test(key)) {
			requestCache.delete(key);
		}
	}
}

/**
 * Clear all cache
 */
export function clearCache(): void {
	requestCache.clear();
}


