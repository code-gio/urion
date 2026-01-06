/**
 * API Security Middleware
 * Combines CSRF protection, rate limiting, and validation
 */

import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { csrfProtection } from './csrf.js';
import { RateLimiter, RateLimitPresets, createRateLimitKey } from './rate-limit.js';
import { validateUUID } from './validation.js';

// Global rate limiters (in-memory - use Redis in production)
const rateLimiters = {
	general: new RateLimiter(RateLimitPresets.apiGeneral),
	create: new RateLimiter(RateLimitPresets.apiCreate),
	update: new RateLimiter(RateLimitPresets.apiUpdate),
	delete: new RateLimiter(RateLimitPresets.apiDelete),
	invite: new RateLimiter(RateLimitPresets.apiInvite),
};

/**
 * Get client IP from request
 */
function getClientIp(event: RequestEvent): string {
	const forwarded = event.request.headers.get('x-forwarded-for');
	if (forwarded) {
		return forwarded.split(',')[0].trim();
	}
	const realIp = event.request.headers.get('x-real-ip');
	if (realIp) {
		return realIp;
	}
	return event.getClientAddress() || 'unknown';
}

/**
 * Security middleware options
 */
export interface SecurityOptions {
	/** Enable CSRF protection (default: true) */
	csrf?: boolean;
	/** Rate limit type: 'general' | 'create' | 'update' | 'delete' | 'invite' */
	rateLimit?: 'general' | 'create' | 'update' | 'delete' | 'invite';
	/** Validate UUID path parameters */
	validateUUIDs?: string[];
	/** Maximum request body size in bytes (default: 1MB) */
	maxBodySize?: number;
}

/**
 * Apply security checks to API endpoint
 * @throws {Response} if security check fails
 */
export async function applySecurity(
	event: RequestEvent,
	options: SecurityOptions = {}
): Promise<void> {
	const {
		csrf = true,
		rateLimit = 'general',
		validateUUIDs = [],
		maxBodySize = 1024 * 1024, // 1MB default
	} = options;

	// CSRF protection
	if (csrf) {
		const csrfResponse = csrfProtection(event, false);
		if (csrfResponse) {
			throw error(403, 'CSRF validation failed');
		}
	}

	// Rate limiting
	if (rateLimit) {
		const clientIp = getClientIp(event);
		// Get user ID from session if available
		let userId: string | null = null;
		try {
			const { user } = await event.locals.safeGetSession();
			userId = user?.id || null;
		} catch {
			// Session check will happen in endpoint handler
		}
		const rateLimitKey = userId
			? createRateLimitKey(clientIp, userId)
			: createRateLimitKey(clientIp);

		const limiter = rateLimiters[rateLimit];
		const result = limiter.check(rateLimitKey);

		if (!result.allowed) {
			throw error(429, result.message || 'Too many requests');
		}

		// Record attempt (will be cleared on success by caller if needed)
		limiter.recordAttempt(rateLimitKey);
	}

	// Validate UUID path parameters
	for (const paramName of validateUUIDs) {
		const paramValue = event.params[paramName];
		if (paramValue) {
			try {
				validateUUID(paramValue, paramName);
			} catch (err) {
				throw error(400, err instanceof Error ? err.message : 'Invalid parameter');
			}
		}
	}

	// Check request body size (for POST/PATCH/PUT)
	const method = event.request.method.toUpperCase();
	if (['POST', 'PATCH', 'PUT'].includes(method)) {
		const contentLength = event.request.headers.get('content-length');
		if (contentLength && parseInt(contentLength) > maxBodySize) {
			throw error(413, 'Request body too large');
		}
	}
}

/**
 * Clear rate limit for successful operations
 */
export async function clearRateLimit(
	event: RequestEvent,
	rateLimitType: SecurityOptions['rateLimit'] = 'general'
): Promise<void> {
	if (rateLimitType) {
		const clientIp = getClientIp(event);
		let userId: string | null = null;
		try {
			const { user } = await event.locals.safeGetSession();
			userId = user?.id || null;
		} catch {
			// Ignore
		}
		const rateLimitKey = userId
			? createRateLimitKey(clientIp, userId)
			: createRateLimitKey(clientIp);

		const limiter = rateLimiters[rateLimitType];
		limiter.clear(rateLimitKey);
	}
}

