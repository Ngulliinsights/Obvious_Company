import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
    sessionId: string;
  };
}

export interface AuthConfig {
  jwtSecret: string;
  sessionTimeout: number;
  requireEmailVerification: boolean;
}

export class AuthMiddleware {
  private config: AuthConfig;
  private db: Pool;
  private redis: RedisClientType;

  constructor(config: AuthConfig, db: Pool, redis: RedisClientType) {
    this.config = config;
    this.db = db;
    this.redis = redis;
  }

  // Main authentication middleware
  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const token = authHeader.substring(7);
      
      try {
        // Verify JWT token
        const decoded = jwt.verify(token, this.config.jwtSecret) as any;
        
        // Validate session in Redis
        const sessionData = await this.redis.get(`session:${decoded.sessionId}`);
        if (!sessionData) {
          res.status(401).json({ 
            error: 'Session expired',
            code: 'SESSION_EXPIRED'
          });
          return;
        }

        const session = JSON.parse(sessionData);
        
        // Check if session has expired
        if (new Date() > new Date(session.expiresAt)) {
          await this.redis.del(`session:${decoded.sessionId}`);
          res.status(401).json({ 
            error: 'Session expired',
            code: 'SESSION_EXPIRED'
          });
          return;
        }

        // Check if user account is still active
        const userStatus = await this.getUserStatus(decoded.userId);
        if (!userStatus.active) {
          res.status(401).json({ 
            error: 'Account inactive',
            code: 'ACCOUNT_INACTIVE'
          });
          return;
        }

        // Check email verification if required
        if (this.config.requireEmailVerification && !userStatus.emailVerified) {
          res.status(401).json({ 
            error: 'Email verification required',
            code: 'EMAIL_VERIFICATION_REQUIRED'
          });
          return;
        }

        // Check if data processing is restricted
        const isRestricted = await this.redis.get(`processing_restricted:${decoded.userId}`);
        if (isRestricted) {
          res.status(403).json({ 
            error: 'Data processing restricted',
            code: 'DATA_PROCESSING_RESTRICTED'
          });
          return;
        }

        // Attach user info to request
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          permissions: session.permissions || [],
          sessionId: decoded.sessionId
        };

        // Update session activity
        await this.updateSessionActivity(decoded.sessionId);

        next();

      } catch (tokenError) {
        res.status(401).json({ 
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
        return;
      }

    } catch (error) {
      console.error('Authentication middleware error:', error);
      res.status(500).json({ 
        error: 'Authentication error',
        code: 'AUTH_ERROR'
      });
    }
  };

  // Optional authentication (doesn't fail if no token)
  optionalAuthenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    // Use regular authentication but don't fail on error
    try {
      await this.authenticate(req, res, next);
    } catch (error) {
      // Continue without authentication
      next();
    }
  };

  // Permission-based authorization
  requirePermission = (permission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      if (!req.user.permissions.includes(permission)) {
        res.status(403).json({ 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permission
        });
        return;
      }

      next();
    };
  };

  // Role-based authorization
  requireRole = (role: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      if (req.user.role !== role) {
        res.status(403).json({ 
          error: 'Insufficient role',
          code: 'INSUFFICIENT_ROLE',
          required: role,
          current: req.user.role
        });
        return;
      }

      next();
    };
  };

  // Multiple roles authorization
  requireAnyRole = (roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({ 
          error: 'Insufficient role',
          code: 'INSUFFICIENT_ROLE',
          required: roles,
          current: req.user.role
        });
        return;
      }

      next();
    };
  };

  // Rate limiting by user
  rateLimitByUser = (maxRequests: number, windowMs: number) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        next();
        return;
      }

      const key = `rate_limit:${req.user.userId}`;
      const current = await this.redis.get(key);
      
      if (current && parseInt(current) >= maxRequests) {
        res.status(429).json({ 
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED'
        });
        return;
      }

      // Increment counter
      const multi = this.redis.multi();
      multi.incr(key);
      multi.expire(key, Math.ceil(windowMs / 1000));
      await multi.exec();

      next();
    };
  };

  // Session validation
  validateSession = async (sessionId: string): Promise<boolean> => {
    try {
      const sessionData = await this.redis.get(`session:${sessionId}`);
      if (!sessionData) {
        return false;
      }

      const session = JSON.parse(sessionData);
      return new Date() <= new Date(session.expiresAt);
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  };

  // Get user status
  private async getUserStatus(userId: string): Promise<{ active: boolean; emailVerified: boolean }> {
    try {
      const result = await this.db.query(
        `SELECT ua.email_verified, ua.account_locked
         FROM user_auth ua
         WHERE ua.user_id = $1`,
        [userId]
      );

      if ((result as any[]).length === 0) {
        return { active: false, emailVerified: false };
      }

      const user = (result as any[])[0];
      return {
        active: !user.account_locked,
        emailVerified: user.email_verified
      };
    } catch (error) {
      console.error('Get user status error:', error);
      return { active: false, emailVerified: false };
    }
  }

  // Update session activity
  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const sessionData = await this.redis.get(`session:${sessionId}`);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.lastActivity = new Date().toISOString();
        
        await this.redis.setEx(
          `session:${sessionId}`,
          this.config.sessionTimeout,
          JSON.stringify(session)
        );
      }
    } catch (error) {
      console.error('Session activity update error:', error);
    }
  }

  // Logout user
  logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (req.user?.sessionId) {
        // Remove session from Redis
        await this.redis.del(`session:${req.user.sessionId}`);
        
        // Mark session as invalidated in database
        await this.db.query(
          `UPDATE user_sessions SET invalidated_at = NOW() WHERE session_id = $1`,
          [req.user.sessionId]
        );
      }

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  };

  // Logout from all devices
  logoutAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Get all active sessions for user
      const sessions = await this.db.query(
        `SELECT session_id FROM user_sessions 
         WHERE user_id = $1 AND invalidated_at IS NULL AND expires_at > NOW()`,
        [req.user.userId]
      );

      // Invalidate all sessions
      for (const session of sessions as any[]) {
        await this.redis.del(`session:${session.session_id}`);
      }

      // Mark all sessions as invalidated in database
      await this.db.query(
        `UPDATE user_sessions 
         SET invalidated_at = NOW() 
         WHERE user_id = $1 AND invalidated_at IS NULL`,
        [req.user.userId]
      );

      res.json({ 
        success: true, 
        message: 'Logged out from all devices',
        sessionsInvalidated: (sessions as any[]).length
      });
    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  };
}

// Default configuration
const defaultConfig: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600'), // 1 hour
  requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true'
};

// Export middleware factory
export const createAuthMiddleware = (config: AuthConfig, db: Pool, redis: RedisClientType): AuthMiddleware => {
  return new AuthMiddleware(config, db, redis);
};

// Legacy export for backward compatibility
export const authMiddleware = (config?: Partial<AuthConfig>, db?: Pool, redis?: RedisClientType) => {
  if (!db || !redis) {
    throw new Error('Database and Redis connections required for auth middleware');
  }
  
  const fullConfig = { ...defaultConfig, ...config };
  const middleware = new AuthMiddleware(fullConfig, db, redis);
  return middleware.authenticate;
};