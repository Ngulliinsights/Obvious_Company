import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { DataSecurityFramework, UserSession } from './DataSecurityFramework';
import { PrivacyComplianceSystem } from './PrivacyComplianceSystem';

export interface AuthConfig {
  requireEmailVerification: boolean;
  sessionTimeout: number;
  refreshTokenExpiry: number;
  multiFactorEnabled: boolean;
  passwordPolicy: PasswordPolicy;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
}

export interface AuthenticatedRequest extends Request {
  user?: UserSession;
  sessionId?: string;
}

export interface UserCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserRegistration extends UserCredentials {
  firstName: string;
  lastName: string;
  organization?: string;
  role?: string;
  industry?: string;
  consentToProcessing: boolean;
  consentToMarketing: boolean;
}

export interface AuthenticationResult {
  success: boolean;
  user?: UserSession;
  accessToken?: string;
  refreshToken?: string;
  requiresVerification?: boolean;
  requiresMFA?: boolean;
  error?: string;
}

export class AuthenticationSystem {
  private config: AuthConfig;
  private db: Pool;
  private redis: RedisClientType;
  private security: DataSecurityFramework;
  private privacy: PrivacyComplianceSystem;

  constructor(
    config: AuthConfig,
    db: Pool,
    redis: RedisClientType,
    security: DataSecurityFramework,
    privacy: PrivacyComplianceSystem
  ) {
    this.config = config;
    this.db = db;
    this.redis = redis;
    this.security = security;
    this.privacy = privacy;
  }

  // User Registration
  async registerUser(registration: UserRegistration, ipAddress?: string, userAgent?: string): Promise<AuthenticationResult> {
    try {
      // Validate input
      if (!this.validateRegistrationData(registration)) {
        return { success: false, error: 'Invalid registration data' };
      }

      // Check if user already exists
      const existingUser = await this.getUserByEmail(registration.email);
      if (existingUser) {
        return { success: false, error: 'User already exists' };
      }

      // Validate password policy
      if (!this.validatePassword(registration.password)) {
        return { success: false, error: 'Password does not meet policy requirements' };
      }

      // Hash password
      const hashedPassword = await this.security.hashPassword(registration.password);

      // Create user
      const userId = this.security.generateSecureId();
      const verificationToken = this.security.generateSecureToken();

      await this.db.query('BEGIN');

      try {
        // Insert user profile
        await this.db.query(
          `INSERT INTO user_profiles (
            id, email, first_name, last_name, organization, 
            professional, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [
            userId,
            this.security.sanitizeEmail(registration.email),
            this.security.sanitizeUserInput(registration.firstName),
            this.security.sanitizeUserInput(registration.lastName),
            registration.organization ? this.security.sanitizeUserInput(registration.organization) : null,
            JSON.stringify({
              role: registration.role,
              industry: registration.industry
            })
          ]
        );

        // Insert authentication data
        await this.db.query(
          `INSERT INTO user_auth (
            user_id, password_hash, email_verified, verification_token,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [userId, hashedPassword, !this.config.requireEmailVerification, verificationToken]
        );

        // Record consent
        if (registration.consentToProcessing) {
          await this.privacy.recordConsent({
            userId,
            consentType: 'data_processing',
            consentGiven: true,
            consentDate: new Date(),
            consentVersion: '1.0',
            ipAddress,
            userAgent
          });
        }

        if (registration.consentToMarketing) {
          await this.privacy.recordConsent({
            userId,
            consentType: 'marketing',
            consentGiven: true,
            consentDate: new Date(),
            consentVersion: '1.0',
            ipAddress,
            userAgent
          });
        }

        await this.db.query('COMMIT');

        // Log registration
        await this.security.logSecurityEvent('user_registered', userId, {
          email: registration.email,
          requiresVerification: this.config.requireEmailVerification
        }, ipAddress);

        // Send verification email if required
        if (this.config.requireEmailVerification) {
          await this.sendVerificationEmail(registration.email, verificationToken);
          return {
            success: true,
            requiresVerification: true
          };
        }

        // Create session for immediate login
        const session = await this.security.createUserSession(
          userId,
          registration.email,
          'user',
          ['assessment:take', 'profile:read', 'profile:update'],
          ipAddress,
          userAgent
        );

        const accessToken = this.security.generateAccessToken({
          userId,
          sessionId: session.sessionId,
          email: registration.email,
          role: 'user'
        });

        return {
          success: true,
          user: session,
          accessToken
        };

      } catch (error) {
        await this.db.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('User registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  // User Authentication
  async authenticateUser(credentials: UserCredentials, ipAddress?: string, userAgent?: string): Promise<AuthenticationResult> {
    try {
      const email = this.security.sanitizeEmail(credentials.email);

      // Check rate limiting
      const rateLimitCheck = await this.security.checkLoginAttempts(email);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: `Too many login attempts. Try again after ${rateLimitCheck.lockoutExpires?.toLocaleString()}`
        };
      }

      // Get user data
      const user = await this.getUserByEmail(email);
      if (!user) {
        await this.security.recordLoginAttempt(email, false);
        return { success: false, error: 'Invalid credentials' };
      }

      // Verify password
      const passwordValid = await this.security.verifyPassword(credentials.password, user.passwordHash);
      if (!passwordValid) {
        await this.security.recordLoginAttempt(email, false);
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if email is verified
      if (this.config.requireEmailVerification && !user.emailVerified) {
        return {
          success: false,
          requiresVerification: true,
          error: 'Email verification required'
        };
      }

      // Check if account is locked
      if (user.accountLocked) {
        return { success: false, error: 'Account is locked' };
      }

      // Record successful login
      await this.security.recordLoginAttempt(email, true);

      // Update last login
      await this.db.query(
        `UPDATE user_auth SET last_login = NOW() WHERE user_id = $1`,
        [user.id]
      );

      // Create session
      const session = await this.security.createUserSession(
        user.id,
        user.email,
        user.role || 'user',
        this.getUserPermissions(user.role || 'user'),
        ipAddress,
        userAgent
      );

      // Generate tokens
      const accessToken = this.security.generateAccessToken({
        userId: user.id,
        sessionId: session.sessionId,
        email: user.email,
        role: user.role || 'user'
      });

      const refreshToken = credentials.rememberMe ? 
        this.security.generateAccessToken({
          userId: user.id,
          type: 'refresh'
        }) : undefined;

      // Log successful authentication
      await this.security.logSecurityEvent('user_authenticated', user.id, {
        email: user.email,
        ipAddress,
        userAgent
      }, ipAddress);

      return {
        success: true,
        user: session,
        accessToken,
        refreshToken
      };

    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  // Middleware for protecting routes
  requireAuthentication = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = this.security.verifyAccessToken(token);
        
        // Validate session
        const session = await this.security.validateUserSession(decoded.sessionId);
        if (!session) {
          res.status(401).json({ error: 'Invalid session' });
          return;
        }

        // Check if user data processing is restricted
        const isRestricted = await this.redis.get(`processing_restricted:${session.userId}`);
        if (isRestricted) {
          res.status(403).json({ error: 'Data processing restricted' });
          return;
        }

        req.user = session;
        req.sessionId = session.sessionId;
        next();

      } catch (tokenError) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

    } catch (error) {
      console.error('Authentication middleware error:', error);
      res.status(500).json({ error: 'Authentication error' });
    }
  };

  // Permission-based authorization
  requirePermission = (permission: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!req.user.permissions.includes(permission)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      next();
    };
  };

  // Role-based authorization
  requireRole = (role: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (req.user.role !== role) {
        res.status(403).json({ error: 'Insufficient role' });
        return;
      }

      next();
    };
  };

  // Email Verification
  async verifyEmail(token: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        `UPDATE user_auth 
         SET email_verified = TRUE, verification_token = NULL
         WHERE verification_token = $1 AND email_verified = FALSE`,
        [token]
      );

      return (result as any).rowCount > 0;
    } catch (error) {
      console.error('Email verification error:', error);
      return false;
    }
  }

  async resendVerificationEmail(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user || user.emailVerified) {
        return false;
      }

      const newToken = this.security.generateSecureToken();
      
      await this.db.query(
        `UPDATE user_auth SET verification_token = $1 WHERE user_id = $2`,
        [newToken, user.id]
      );

      await this.sendVerificationEmail(email, newToken);
      return true;
    } catch (error) {
      console.error('Resend verification error:', error);
      return false;
    }
  }

  // Password Management
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Get current password hash
      const result = await this.db.query(
        `SELECT password_hash FROM user_auth WHERE user_id = $1`,
        [userId]
      );

      if ((result as any[]).length === 0) {
        return false;
      }

      const currentHash = (result as any[])[0].password_hash;

      // Verify current password
      const isValid = await this.security.verifyPassword(currentPassword, currentHash);
      if (!isValid) {
        return false;
      }

      // Validate new password
      if (!this.validatePassword(newPassword)) {
        return false;
      }

      // Check password reuse
      if (await this.isPasswordReused(userId, newPassword)) {
        return false;
      }

      // Hash new password
      const newHash = await this.security.hashPassword(newPassword);

      // Update password
      await this.db.query(
        `UPDATE user_auth 
         SET password_hash = $1, password_changed_at = NOW()
         WHERE user_id = $2`,
        [newHash, userId]
      );

      // Store in password history
      await this.db.query(
        `INSERT INTO password_history (user_id, password_hash, created_at)
         VALUES ($1, $2, NOW())`,
        [userId, currentHash]
      );

      // Invalidate all user sessions
      await this.security.invalidateAllUserSessions(userId);

      await this.security.logSecurityEvent('password_changed', userId);

      return true;
    } catch (error) {
      console.error('Password change error:', error);
      return false;
    }
  }

  async resetPassword(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        return false; // Don't reveal if user exists
      }

      const resetToken = this.security.generateSecureToken();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      await this.db.query(
        `UPDATE user_auth 
         SET reset_token = $1, reset_token_expires = $2
         WHERE user_id = $3`,
        [resetToken, expiresAt, user.id]
      );

      await this.sendPasswordResetEmail(email, resetToken);
      
      await this.security.logSecurityEvent('password_reset_requested', user.id, {
        email
      });

      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      return false;
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<boolean> {
    try {
      // Validate new password
      if (!this.validatePassword(newPassword)) {
        return false;
      }

      // Find user by reset token
      const result = await this.db.query(
        `SELECT user_id FROM user_auth 
         WHERE reset_token = $1 AND reset_token_expires > NOW()`,
        [token]
      );

      if ((result as any[]).length === 0) {
        return false;
      }

      const userId = (result as any[])[0].user_id;

      // Check password reuse
      if (await this.isPasswordReused(userId, newPassword)) {
        return false;
      }

      // Hash new password
      const newHash = await this.security.hashPassword(newPassword);

      // Update password and clear reset token
      await this.db.query(
        `UPDATE user_auth 
         SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL,
             password_changed_at = NOW()
         WHERE user_id = $2`,
        [newHash, userId]
      );

      // Invalidate all user sessions
      await this.security.invalidateAllUserSessions(userId);

      await this.security.logSecurityEvent('password_reset_completed', userId);

      return true;
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      return false;
    }
  }

  // Utility Methods
  private async getUserByEmail(email: string): Promise<any> {
    try {
      const result = await this.db.query(
        `SELECT up.id, up.email, up.first_name, up.last_name, up.professional,
                ua.password_hash, ua.email_verified, ua.account_locked, ua.role
         FROM user_profiles up
         JOIN user_auth ua ON up.id = ua.user_id
         WHERE up.email = $1`,
        [email]
      );

      return (result as any[]).length > 0 ? (result as any[])[0] : null;
    } catch (error) {
      console.error('Get user by email error:', error);
      return null;
    }
  }

  private validateRegistrationData(registration: UserRegistration): boolean {
    return !!(
      registration.email &&
      registration.password &&
      registration.firstName &&
      registration.lastName &&
      registration.consentToProcessing
    );
  }

  private validatePassword(password: string): boolean {
    const policy = this.config.passwordPolicy;
    
    if (password.length < policy.minLength) return false;
    if (policy.requireUppercase && !/[A-Z]/.test(password)) return false;
    if (policy.requireLowercase && !/[a-z]/.test(password)) return false;
    if (policy.requireNumbers && !/\d/.test(password)) return false;
    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

    return true;
  }

  private async isPasswordReused(userId: string, newPassword: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        `SELECT password_hash FROM password_history 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, this.config.passwordPolicy.preventReuse]
      );

      for (const row of result as any[]) {
        if (await this.security.verifyPassword(newPassword, row.password_hash)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Password reuse check error:', error);
      return false;
    }
  }

  private getUserPermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      'user': ['assessment:take', 'profile:read', 'profile:update'],
      'admin': ['assessment:take', 'assessment:manage', 'profile:read', 'profile:update', 'users:manage'],
      'analyst': ['assessment:take', 'assessment:view', 'analytics:read', 'profile:read', 'profile:update']
    };

    return permissions[role] || permissions['user'];
  }

  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    // Implementation would integrate with email service
    console.log(`Verification email sent to ${email} with token ${token}`);
  }

  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // Implementation would integrate with email service
    console.log(`Password reset email sent to ${email} with token ${token}`);
  }
}