/**
 * Advanced Rate Limiting Configuration
 * Implements comprehensive rate limiting and API security measures
 * Requirements: 5.4, 9.4, 10.1
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiting configurations for different endpoint types
 */
export const rateLimitConfigs = {
  // General API rate limiting
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
      error: 'Too many requests from this IP',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 900, // 15 minutes in seconds
      details: 'Please wait before making more requests'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(req.rateLimit.resetTime! / 1000),
        limit: req.rateLimit.limit,
        remaining: req.rateLimit.remaining,
        reset: new Date(req.rateLimit.resetTime!)
      });
    }
  }),

  // Assessment creation (more restrictive)
  assessmentCreation: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 new assessments per hour
    message: {
      error: 'Too many assessment sessions created',
      code: 'ASSESSMENT_CREATION_LIMIT_EXCEEDED',
      retryAfter: 3600
    },
    keyGenerator: (req: Request) => {
      // Rate limit by IP and user ID if available
      const userId = req.body?.user_profile?.id || req.user?.id;
      return userId ? `${req.ip}-${userId}` : req.ip;
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'Assessment creation limit exceeded',
        code: 'ASSESSMENT_CREATION_LIMIT_EXCEEDED',
        message: 'You have created too many assessments recently. Please wait before creating another.',
        retryAfter: Math.ceil(req.rateLimit.resetTime! / 1000)
      });
    }
  }),

  // Response submission (moderate)
  responseSubmission: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 responses per minute
    message: {
      error: 'Too many responses submitted',
      code: 'RESPONSE_SUBMISSION_LIMIT_EXCEEDED',
      retryAfter: 60
    },
    keyGenerator: (req: Request) => {
      // Rate limit by session ID to prevent abuse of specific sessions
      const sessionId = req.params.sessionId || req.body?.session_id;
      return sessionId ? `${req.ip}-${sessionId}` : req.ip;
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'Response submission rate limit exceeded',
        code: 'RESPONSE_SUBMISSION_LIMIT_EXCEEDED',
        message: 'You are submitting responses too quickly. Please slow down.',
        retryAfter: Math.ceil(req.rateLimit.resetTime! / 1000)
      });
    }
  }),

  // Results calculation (restrictive)
  resultsCalculation: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 calculations per 5 minutes
    message: {
      error: 'Too many result calculations',
      code: 'RESULTS_CALCULATION_LIMIT_EXCEEDED',
      retryAfter: 300
    },
    keyGenerator: (req: Request) => {
      const sessionId = req.params.sessionId;
      return sessionId ? `calc-${req.ip}-${sessionId}` : `calc-${req.ip}`;
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'Results calculation limit exceeded',
        code: 'RESULTS_CALCULATION_LIMIT_EXCEEDED',
        message: 'Please wait before requesting another results calculation.',
        retryAfter: Math.ceil(req.rateLimit.resetTime! / 1000)
      });
    }
  }),

  // Export/download (very restrictive)
  exportDownload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 exports per hour
    message: {
      error: 'Too many export requests',
      code: 'EXPORT_LIMIT_EXCEEDED',
      retryAfter: 3600
    },
    keyGenerator: (req: Request) => {
      const userId = req.user?.id || req.body?.user_id;
      return userId ? `export-${userId}` : `export-${req.ip}`;
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'Export limit exceeded',
        code: 'EXPORT_LIMIT_EXCEEDED',
        message: 'You have reached the maximum number of exports allowed per hour.',
        retryAfter: Math.ceil(req.rateLimit.resetTime! / 1000)
      });
    }
  }),

  // API documentation (lenient)
  documentation: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    message: {
      error: 'Too many documentation requests',
      code: 'DOCS_RATE_LIMIT_EXCEEDED',
      retryAfter: 900
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'Documentation access rate limit exceeded',
        retryAfter: Math.ceil(req.rateLimit.resetTime! / 1000)
      });
    }
  }),

  // Health checks (very lenient)
  healthCheck: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: {
      error: 'Too many health check requests',
      code: 'HEALTH_CHECK_LIMIT_EXCEEDED',
      retryAfter: 60
    }
  })
};

/**
 * Dynamic rate limiting based on user behavior
 */
export class AdaptiveRateLimiter {
  private suspiciousIPs = new Map<string, { count: number; lastSeen: Date }>();
  private trustedIPs = new Set<string>();

  /**
   * Check if an IP should have stricter rate limiting
   */
  public isIPSuspicious(ip: string): boolean {
    const record = this.suspiciousIPs.get(ip);
    if (!record) return false;

    // Clean up old records (older than 1 hour)
    if (Date.now() - record.lastSeen.getTime() > 60 * 60 * 1000) {
      this.suspiciousIPs.delete(ip);
      return false;
    }

    return record.count > 5; // Suspicious if more than 5 violations
  }

  /**
   * Mark an IP as having violated rate limits
   */
  public markIPViolation(ip: string): void {
    const existing = this.suspiciousIPs.get(ip);
    if (existing) {
      existing.count += 1;
      existing.lastSeen = new Date();
    } else {
      this.suspiciousIPs.set(ip, { count: 1, lastSeen: new Date() });
    }
  }

  /**
   * Add an IP to the trusted list
   */
  public trustIP(ip: string): void {
    this.trustedIPs.add(ip);
  }

  /**
   * Check if an IP is trusted
   */
  public isIPTrusted(ip: string): boolean {
    return this.trustedIPs.has(ip);
  }

  /**
   * Create adaptive rate limiter middleware
   */
  public createAdaptiveLimit(baseConfig: any) {
    return rateLimit({
      ...baseConfig,
      max: (req: Request) => {
        const ip = req.ip;
        
        // Trusted IPs get higher limits
        if (this.isIPTrusted(ip)) {
          return baseConfig.max * 2;
        }
        
        // Suspicious IPs get lower limits
        if (this.isIPSuspicious(ip)) {
          return Math.max(1, Math.floor(baseConfig.max * 0.5));
        }
        
        return baseConfig.max;
      },
      onLimitReached: (req: Request) => {
        this.markIPViolation(req.ip);
      }
    });
  }
}

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: Function) => {
  // API-specific security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // API versioning header
  res.setHeader('API-Version', '1.0.0');
  
  // Rate limit information headers (will be overridden by rate limiter if applicable)
  res.setHeader('X-RateLimit-Policy', 'Dynamic rate limiting based on endpoint and user behavior');
  
  next();
};

/**
 * Request size limiting middleware
 */
export const requestSizeLimiter = (req: Request, res: Response, next: Function) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const contentLength = parseInt(req.get('content-length') || '0');
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      error: 'Request entity too large',
      code: 'REQUEST_TOO_LARGE',
      maxSize: '10MB'
    });
  }
  
  next();
};

/**
 * API key validation middleware (for future use)
 */
export const apiKeyValidation = (req: Request, res: Response, next: Function) => {
  // Skip API key validation in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  const apiKey = req.get('X-API-Key');
  const validApiKeys = process.env.API_KEYS?.split(',') || [];
  
  // If no API keys are configured, skip validation
  if (validApiKeys.length === 0) {
    return next();
  }
  
  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing API key',
      code: 'INVALID_API_KEY'
    });
  }
  
  next();
};

// Export singleton instance
export const adaptiveRateLimiter = new AdaptiveRateLimiter();