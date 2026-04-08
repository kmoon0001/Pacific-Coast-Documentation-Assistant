import { Request, Response, NextFunction } from 'express';

/**
 * Security middleware for TheraDoc
 * Implements security headers, CSP, and request sanitization
 */

export interface SecurityConfig {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  enableXFrameOptions?: boolean;
  enableXContentTypeOptions?: boolean;
  enableReferrerPolicy?: boolean;
}

const defaultConfig: SecurityConfig = {
  enableCSP: true,
  enableHSTS: true,
  enableXFrameOptions: true,
  enableXContentTypeOptions: true,
  enableReferrerPolicy: true,
};

/**
 * Content Security Policy middleware
 */
export function contentSecurityPolicy(config: SecurityConfig = defaultConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (config.enableCSP) {
      const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://bedrock-runtime.*.amazonaws.com https://generativelanguage.googleapis.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ');

      res.setHeader('Content-Security-Policy', cspDirectives);
    }

    if (config.enableHSTS) {
      // HTTP Strict Transport Security
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    if (config.enableXFrameOptions) {
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
    }

    if (config.enableXContentTypeOptions) {
      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    if (config.enableReferrerPolicy) {
      // Control referrer information
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // Additional security headers
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
  };
}

/**
 * Request sanitization middleware
 * Removes potentially dangerous characters from input
 */
export function sanitizeRequest(req: Request, res: Response, next: NextFunction) {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key] as string);
      }
    });
  }

  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  next();
}

/**
 * Sanitize string input
 */
function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  Object.keys(obj).forEach((key) => {
    const value = obj[key];

    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
}

/**
 * CORS middleware with secure defaults
 */
export function corsMiddleware(allowedOrigins: string[] = ['http://localhost:3001']) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  };
}

/**
 * Security audit logger
 */
export function securityAuditLogger(req: Request, res: Response, next: NextFunction) {
  const securityEvents = {
    suspiciousPatterns: [
      /(\.\.|\/etc\/|\/proc\/|\/sys\/)/i, // Path traversal
      /(union|select|insert|update|delete|drop|create|alter)\s/i, // SQL injection
      /<script|javascript:|onerror=/i, // XSS
      /(\$\{|\{\{)/i, // Template injection
    ],
  };

  const requestData = JSON.stringify({
    query: req.query,
    body: req.body,
    params: req.params,
  });

  // Check for suspicious patterns
  const suspicious = securityEvents.suspiciousPatterns.some((pattern) =>
    pattern.test(requestData)
  );

  if (suspicious) {
    console.warn('Security Alert:', {
      ip: req.ip,
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });
  }

  next();
}
