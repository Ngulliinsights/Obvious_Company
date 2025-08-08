/**
 * Security Middleware
 * Express middleware for authentication, authorization, and security
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticationService } from './AuthenticationService';
import { AuthorizationService } from './AuthorizationService';
import { SecurityConfig } from './SecurityConfig';
import { SecurityEventType } from './types';

// Extend Express Request type to include security context
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        sessionId: string;
        roles: string[];
        permissions: any[];
      };
      securityContext?: any;
    }
  }
}

export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private authService = AuthenticationService.getInstance();
  private authzService = AuthorizationService.getInstance();
  private config = SecurityConfig.getInstance();

  private constructor() {}

  public static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  /**
   * Authentication middleware
   */
  public authenticate(required: boolean = true) {
    return (req: Request, res: Response, next: NextFunction) => {
      const token = this.extractToken(req);

      if (!token) {
        if (required) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
          });
        }
        // For optional authentication, continue without user context
        return next();
      }

      const validation = this.authService.validateToken(token);
      if (!validation.valid) {
        this.logSecurityEvent(req, SecurityEventType.LOGIN_FAILURE, {
          reason: validation.error,
          token: token.substring(0, 10) + '...'
        });

        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
          code: 'AUTH_INVALID'
        });
      }

      // Validate session security
      const sessionValid = this.authService.validateSessionSecurity(
        validation.payload.sessionId,
        req.ip,
        req.get('User-Agent') || ''
      );

      if (!sessionValid) {
        return res.status(401).json({
          success: false,
          error: 'Session security validation failed',
          code: 'SESSION_INVALID'
        });
      }

      // Set user context
      req.user = {
        userId: validation.payload.userId,
        sessionId: validation.payload.sessionId,
        roles: this.authzService.getUserRoles(validation.payload.userId),
        permissions: this.authzService.getUserPermissions(validation.payload.userId)
      };

      req.securityContext = this.authzService.createSecurityContext(
        validation.payload.userId,
        validation.payload.sessionId,
        req.ip,
        req.get('User-Agent') || ''
      );

      next();
    };
  }

  /**
   * Authorization middleware
   */
  public authorize(resource: string, action: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required for authorization',
          code: 'AUTH_REQUIRED'
        });
      }

      const hasPermission = this.authzService.hasPermission(
        req.user.userId,
        resource,
        action,
        { ip: req.ip, userAgent: req.get('User-Agent') }
      );

      if (!hasPermission) {
        this.logSecurityEvent(req, SecurityEventType.PERMISSION_DENIED, {
          resource,
          action,
          userId: req.user.userId,
          roles: req.user.roles
        });

        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'PERMISSION_DENIED',
          required: { resource, action }
        });
      }

      // Log successful authorization
      this.authzService.logAuthorizationEvent(
        req.user.userId,
        resource,
        action,
        true,
        { ip: req.ip, userAgent: req.get('User-Agent') }
      );

      next();
    };
  }

  /**
   * Rate limiting middleware
   */
  public rateLimit(resource: string) {
    const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
      const identifier = req.user?.userId || req.ip;
      const limits = this.authzService.getRateLimit(req.user?.userId || 'anonymous', resource);
      
      const key = `${identifier}:${resource}`;
      const now = Date.now();
      const windowStart = now - limits.window;

      let rateLimitData = rateLimitMap.get(key);
      
      if (!rateLimitData || rateLimitData.resetTime < windowStart) {
        rateLimitData = { count: 0, resetTime: now + limits.window };
      }

      rateLimitData.count++;
      rateLimitMap.set(key, rateLimitData);

      if (rateLimitData.count > limits.requests) {
        this.logSecurityEvent(req, SecurityEventType.RATE_LIMIT_EXCEEDED, {
          resource,
          limit: limits.requests,
          window: limits.window,
          identifier
        });

        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((rateLimitData.resetTime - now) / 1000)
        });
      }

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': limits.requests.toString(),
        'X-RateLimit-Remaining': (limits.requests - rateLimitData.count).toString(),
        'X-RateLimit-Reset': Math.ceil(rateLimitData.resetTime / 1000).toString()
      });

      next();
    };
  }

  /**
   * Security headers middleware
   */
  public securityHeaders() {
    return (req: Request, res: Response, next: NextFunction) => {
      const headers = this.config.getSecurityHeaders();
      
      for (const [header, value] of Object.entries(headers)) {
        res.set(header, value);
      }

      next();
    };
  }

  /**
   * Input validation middleware
   */
  public validateInput(schema: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      // Basic input validation - in production, use a proper validation library
      const errors: string[] = [];

      // Check for common security issues
      const body = JSON.stringify(req.body);
      
      // Check for potential XSS
      if (/<script|javascript:|on\w+=/i.test(body)) {
        errors.push('Potential XSS detected in input');
      }

      // Check for SQL injection patterns
      if (/(union|select|insert|update|delete|drop|create|alter)\s/i.test(body)) {
        errors.push('Potential SQL injection detected in input');
      }

      // Check for path traversal
      if (/\.\.[\/\\]/.test(body)) {
        errors.push('Path traversal attempt detected');
      }

      if (errors.length > 0) {
        this.logSecurityEvent(req, SecurityEventType.SECURITY_VIOLATION, {
          violations: errors,
          input: body.substring(0, 200) + '...'
        });

        return res.status(400).json({
          success: false,
          error: 'Input validation failed',
          code: 'INPUT_VALIDATION_FAILED',
          details: errors
        });
      }

      next();
    };
  }

  /**
   * CORS middleware with security considerations
   */
  public corsWithSecurity() {
    return (req: Request, res: Response, next: NextFunction) => {
      const origin = req.get('Origin');
      const allowedOrigins = [
        process.env.WEBSITE_URL,
        'http://localhost:3000',
        'https://theobviouscompany.com'
      ].filter(Boolean);

      if (origin && allowedOrigins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
      }

      res.set({
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400' // 24 hours
      });

      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      next();
    };
  }

  /**
   * Session security middleware
   */
  public sessionSecurity() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.user) {
        // Check for session hijacking indicators
        const session = this.authService.getSession(req.user.sessionId);
        if (session) {
          const ipChanged = session.ipAddress !== req.ip;
          const userAgentChanged = session.userAgent !== req.get('User-Agent');

          if (ipChanged || userAgentChanged) {
            this.logSecurityEvent(req, SecurityEventType.SUSPICIOUS_ACTIVITY, {
              sessionId: req.user.sessionId,
              originalIp: session.ipAddress,
              currentIp: req.ip,
              originalUserAgent: session.userAgent,
              currentUserAgent: req.get('User-Agent'),
              ipChanged,
              userAgentChanged
            });

            // For high-security endpoints, terminate session
            if (req.path.includes('/admin') || req.path.includes('/sensitive')) {
              this.authService.invalidateSession(req.user.sessionId, 'security_violation');
              return res.status(401).json({
                success: false,
                error: 'Session terminated due to security violation',
                code: 'SESSION_TERMINATED'
              });
            }
          }
        }
      }

      next();
    };
  }

  /**
   * API key validation middleware
   */
  public validateApiKey() {
    return (req: Request, res: Response, next: NextFunction) => {
      const apiKey = req.get('X-API-Key');
      
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API key required',
          code: 'API_KEY_REQUIRED'
        });
      }

      // Validate API key format
      if (!/^ak_\d+_[a-f0-9]{32}$/.test(apiKey)) {
        return res.status(401).json({
          success: false,
          error: 'Invalid API key format',
          code: 'API_KEY_INVALID'
        });
      }

      // In production, validate against database
      // For now, accept any properly formatted key
      next();
    };
  }

  /**
   * Extract token from request
   */
  private extractToken(req: Request): string | null {
    const authHeader = req.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Also check for token in cookies for web requests
    if (req.cookies && req.cookies.auth_token) {
      return req.cookies.auth_token;
    }

    return null;
  }

  /**
   * Log security events
   */
  private logSecurityEvent(req: Request, eventType: SecurityEventType, metadata: any): void {
    const logEntry = {
      timestamp: new Date(),
      eventType,
      userId: req.user?.userId,
      sessionId: req.user?.sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      path: req.path,
      method: req.method,
      metadata
    };

    // In production, this would be stored in a secure audit log
    console.log('Security Middleware Event:', JSON.stringify(logEntry, null, 2));
  }

  /**
   * Create middleware chain for assessment endpoints
   */
  public assessmentSecurity() {
    return [
      this.securityHeaders(),
      this.corsWithSecurity(),
      this.rateLimit('assessment'),
      this.validateInput({}),
      this.authenticate(false), // Optional authentication for assessments
      this.sessionSecurity()
    ];
  }

  /**
   * Create middleware chain for admin endpoints
   */
  public adminSecurity() {
    return [
      this.securityHeaders(),
      this.corsWithSecurity(),
      this.rateLimit('admin'),
      this.validateInput({}),
      this.authenticate(true), // Required authentication
      this.authorize('admin', 'access'),
      this.sessionSecurity()
    ];
  }

  /**
   * Create middleware chain for API endpoints
   */
  public apiSecurity(resource: string, action: string) {
    return [
      this.securityHeaders(),
      this.corsWithSecurity(),
      this.rateLimit(resource),
      this.validateInput({}),
      this.authenticate(true),
      this.authorize(resource, action),
      this.sessionSecurity()
    ];
  }
}