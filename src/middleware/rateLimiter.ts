import { Request, Response, NextFunction } from 'express';

/**
 * Rate limiting middleware for TheraDoc
 * Prevents abuse and DDoS attacks
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // Clean up every minute

/**
 * Rate limiter middleware
 */
export function rateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = getClientKey(req);
    const now = Date.now();

    // Initialize or get existing record
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // Increment request count
    store[key].count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - store[key].count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());

    // Check if limit exceeded
    if (store[key].count > maxRequests) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
      });
      return;
    }

    // Handle response to potentially skip counting
    const originalSend = res.send;
    res.send = function (data: any) {
      const statusCode = res.statusCode;

      if (
        (skipSuccessfulRequests && statusCode >= 200 && statusCode < 300) ||
        (skipFailedRequests && statusCode >= 400)
      ) {
        store[key].count--;
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Get unique client identifier
 */
function getClientKey(req: Request): string {
  // Use IP address as primary identifier
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  // Optionally include user ID if authenticated
  const userId = (req as any).user?.id;

  return userId ? `user:${userId}` : `ip:${ip}`;
}

/**
 * Preset rate limiters for common use cases
 */
export const rateLimitPresets = {
  /**
   * Strict rate limit for authentication endpoints
   */
  auth: rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
  }),

  /**
   * Standard rate limit for API endpoints
   */
  api: rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: 'API rate limit exceeded. Please slow down.',
  }),

  /**
   * Generous rate limit for AI generation endpoints
   */
  aiGeneration: rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 generations per minute
    message: 'AI generation rate limit exceeded. Please wait before generating more notes.',
  }),

  /**
   * Strict rate limit for file uploads
   */
  upload: rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 uploads per minute
    message: 'Upload rate limit exceeded. Please wait before uploading more files.',
  }),

  /**
   * Very strict rate limit for sensitive operations
   */
  sensitive: rateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 requests per hour
    message: 'Rate limit exceeded for sensitive operations.',
  }),
};

/**
 * Adaptive rate limiter that adjusts based on server load
 */
export function adaptiveRateLimiter(baseConfig: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get current server load (simplified - in production use actual metrics)
    const serverLoad = getServerLoad();

    // Adjust max requests based on load
    const adjustedConfig = {
      ...baseConfig,
      maxRequests: Math.floor(baseConfig.maxRequests * (1 - serverLoad)),
    };

    return rateLimiter(adjustedConfig)(req, res, next);
  };
}

/**
 * Get current server load (0-1 scale)
 * In production, this should use actual system metrics
 */
function getServerLoad(): number {
  // Simplified implementation
  // In production, use os.loadavg() or similar
  return 0.1; // 10% load
}

/**
 * IP-based rate limiter with whitelist support
 */
export function ipRateLimiter(
  config: RateLimitConfig,
  whitelist: string[] = []
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // Skip rate limiting for whitelisted IPs
    if (whitelist.includes(ip)) {
      return next();
    }

    return rateLimiter(config)(req, res, next);
  };
}
