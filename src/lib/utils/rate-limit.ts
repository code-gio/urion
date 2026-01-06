/**
 * Rate limiting utility for authentication endpoints
 *
 * ⚠️ IMPORTANT: This uses in-memory storage which is NOT suitable for production
 * with multiple server instances. For production, use Redis, Upstash,
 * or another distributed store.
 *
 * 📖 See PRODUCTION_NOTES.md for migration guide to distributed rate limiting
 *
 * Current implementation is suitable for:
 * - Development environments
 * - Single-server deployments
 * - Testing and prototyping
 *
 * NOT suitable for:
 * - Horizontal scaling (multiple server instances)
 * - Serverless/edge deployments with multiple regions
 * - High-availability production deployments
 */

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  minTimeBetweenAttempts?: number; // Optional cooldown between attempts
}

export interface RateLimitEntry {
  count: number;
  timestamp: number;
  lastAttempt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  message: string;
}

export class RateLimiter {
  private store: Map<string, RateLimitEntry>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.store = new Map();
    this.config = config;
  }

  /**
   * Check if a request is rate limited
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      return { allowed: true, message: "" };
    }

    // Check if we're still within the rate limit window
    if (now - entry.timestamp > this.config.windowMs) {
      this.store.delete(key);
      return { allowed: true, message: "" };
    }

    // Check attempt count
    if (entry.count >= this.config.maxAttempts) {
      const timeLeft = Math.ceil(
        (this.config.windowMs - (now - entry.timestamp)) / 1000 / 60
      );
      return {
        allowed: false,
        message: `Too many attempts. Please try again in ${timeLeft} minutes.`,
      };
    }

    // Check minimum time between attempts if configured
    if (this.config.minTimeBetweenAttempts) {
      const timeSinceLastAttempt = now - entry.lastAttempt;
      if (timeSinceLastAttempt < this.config.minTimeBetweenAttempts) {
        const timeLeft = Math.ceil(
          (this.config.minTimeBetweenAttempts - timeSinceLastAttempt) / 1000
        );
        return {
          allowed: false,
          message: `Please wait ${timeLeft} seconds before trying again.`,
        };
      }
    }

    return { allowed: true, message: "" };
  }

  /**
   * Record a failed attempt
   */
  recordAttempt(key: string): void {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      this.store.set(key, {
        count: 1,
        timestamp: now,
        lastAttempt: now,
      });
      return;
    }

    entry.count += 1;
    entry.lastAttempt = now;
  }

  /**
   * Clear rate limit for a key (e.g., on successful authentication)
   */
  clear(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > this.config.windowMs) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get the number of attempts for a key
   */
  getAttempts(key: string): number {
    return this.store.get(key)?.count ?? 0;
  }
}

/**
 * Create a rate limit key from IP and email
 */
export function createRateLimitKey(clientIp: string, identifier?: string): string {
  if (identifier) {
    return `${clientIp}:${identifier.toLowerCase()}`;
  }
  return clientIp;
}

/**
 * Common rate limit configurations
 */
export const RateLimitPresets = {
  signIn: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  forgotPassword: {
    maxAttempts: 3,
    windowMs: 30 * 60 * 1000, // 30 minutes
    minTimeBetweenAttempts: 120000, // 2 minutes
  },
  magicLink: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    minTimeBetweenAttempts: 60000, // 1 minute
  },
  resendVerification: {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
    minTimeBetweenAttempts: 120000, // 2 minutes
  },
  resetPassword: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // API endpoint rate limits
  apiGeneral: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  apiCreate: {
    maxAttempts: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  apiUpdate: {
    maxAttempts: 30,
    windowMs: 60 * 1000, // 1 minute
  },
  apiDelete: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  apiInvite: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
    minTimeBetweenAttempts: 5000, // 5 seconds between invites
  },
};
