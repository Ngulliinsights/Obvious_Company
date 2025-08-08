/**
 * Authentication Service
 * Handles user authentication, session management, and token validation
 */

import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { UserSession, SecurityAuditLog, SecurityEventType } from './types';
import { SecurityConfig } from './SecurityConfig';
import { EncryptionService } from './EncryptionService';

export class AuthenticationService {
  private static instance: AuthenticationService;
  private config = SecurityConfig.getAuthenticationConfig();
  private encryptionService = EncryptionService.getInstance();
  private activeSessions = new Map<string, UserSession>();
  private loginAttempts = new Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }>();

  private constructor() {}

  public static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService();
    }
    return AuthenticationService.instance;
  }

  /**
   * Generate JWT token for authenticated user
   */
  public generateToken(userId: string, sessionId: string, metadata: Record<string, any> = {}): string {
    const payload = {
      userId,
      sessionId,
      type: 'access_token',
      metadata,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn,
      issuer: 'obvious-company-assessment',
      audience: 'assessment-platform'
    });
  }

  /**
   * Generate refresh token
   */
  public generateRefreshToken(userId: string, sessionId: string): string {
    const payload = {
      userId,
      sessionId,
      type: 'refresh_token',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.refreshTokenExpiresIn,
      issuer: 'obvious-company-assessment',
      audience: 'assessment-platform'
    });
  }

  /**
   * Validate JWT token
   */
  public validateToken(token: string): { valid: boolean; payload?: any; error?: string } {
    try {
      const payload = jwt.verify(token, this.config.jwtSecret, {
        issuer: 'obvious-company-assessment',
        audience: 'assessment-platform'
      });

      // Check if session is still active
      if (typeof payload === 'object' && payload.sessionId) {
        const session = this.activeSessions.get(payload.sessionId);
        if (!session || !session.isActive || session.expiresAt < new Date()) {
          return { valid: false, error: 'Session expired or invalid' };
        }

        // Update last accessed time
        session.lastAccessedAt = new Date();
        this.activeSessions.set(payload.sessionId, session);
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Create user session
   */
  public createSession(userId: string, ipAddress: string, userAgent: string): UserSession {
    const sessionId = this.encryptionService.generateSecureToken();
    const token = this.generateToken(userId, sessionId);
    const refreshToken = this.generateRefreshToken(userId, sessionId);

    const session: UserSession = {
      id: sessionId,
      userId,
      token,
      refreshToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      ipAddress,
      userAgent,
      isActive: true,
      createdAt: new Date(),
      lastAccessedAt: new Date()
    };

    this.activeSessions.set(sessionId, session);
    
    // Log session creation
    this.logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, {
      userId,
      sessionId,
      ipAddress,
      userAgent,
      resource: 'session',
      action: 'create',
      success: true,
      metadata: { sessionDuration: this.config.jwtExpiresIn }
    });

    return session;
  }

  /**
   * Refresh session token
   */
  public refreshSession(refreshToken: string, ipAddress: string): { success: boolean; session?: UserSession; error?: string } {
    try {
      const payload = jwt.verify(refreshToken, this.config.jwtSecret) as any;
      
      if (payload.type !== 'refresh_token') {
        return { success: false, error: 'Invalid token type' };
      }

      const session = this.activeSessions.get(payload.sessionId);
      if (!session || !session.isActive) {
        return { success: false, error: 'Session not found or inactive' };
      }

      // Verify IP address for security
      if (session.ipAddress !== ipAddress) {
        this.logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
          userId: session.userId,
          sessionId: session.id,
          ipAddress,
          userAgent: session.userAgent,
          resource: 'session',
          action: 'refresh',
          success: false,
          metadata: { 
            originalIp: session.ipAddress, 
            newIp: ipAddress,
            reason: 'IP address mismatch'
          }
        });
        return { success: false, error: 'Security violation detected' };
      }

      // Generate new tokens
      const newToken = this.generateToken(session.userId, session.id);
      const newRefreshToken = this.generateRefreshToken(session.userId, session.id);

      // Update session
      session.token = newToken;
      session.refreshToken = newRefreshToken;
      session.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      session.lastAccessedAt = new Date();

      this.activeSessions.set(session.id, session);

      this.logSecurityEvent(SecurityEventType.TOKEN_REFRESH, {
        userId: session.userId,
        sessionId: session.id,
        ipAddress,
        userAgent: session.userAgent,
        resource: 'session',
        action: 'refresh',
        success: true,
        metadata: {}
      });

      return { success: true, session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Invalidate session
   */
  public invalidateSession(sessionId: string, reason: string = 'logout'): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.isActive = false;
    this.activeSessions.set(sessionId, session);

    this.logSecurityEvent(SecurityEventType.LOGOUT, {
      userId: session.userId,
      sessionId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      resource: 'session',
      action: 'invalidate',
      success: true,
      metadata: { reason }
    });

    return true;
  }

  /**
   * Check rate limiting for login attempts
   */
  public checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts?: number; lockedUntil?: Date } {
    const attempts = this.loginAttempts.get(identifier);
    
    if (!attempts) {
      return { allowed: true, remainingAttempts: this.config.maxLoginAttempts };
    }

    // Check if currently locked
    if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
      return { allowed: false, lockedUntil: attempts.lockedUntil };
    }

    // Reset if lockout period has passed
    if (attempts.lockedUntil && attempts.lockedUntil <= new Date()) {
      this.loginAttempts.delete(identifier);
      return { allowed: true, remainingAttempts: this.config.maxLoginAttempts };
    }

    // Check if max attempts exceeded
    if (attempts.count >= this.config.maxLoginAttempts) {
      const lockedUntil = new Date(Date.now() + this.config.lockoutDuration);
      attempts.lockedUntil = lockedUntil;
      this.loginAttempts.set(identifier, attempts);
      
      return { allowed: false, lockedUntil };
    }

    return { 
      allowed: true, 
      remainingAttempts: this.config.maxLoginAttempts - attempts.count 
    };
  }

  /**
   * Record login attempt
   */
  public recordLoginAttempt(identifier: string, success: boolean): void {
    if (success) {
      // Clear attempts on successful login
      this.loginAttempts.delete(identifier);
      return;
    }

    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
    attempts.count++;
    attempts.lastAttempt = new Date();
    
    this.loginAttempts.set(identifier, attempts);
  }

  /**
   * Generate secure session ID
   */
  public generateSessionId(): string {
    return this.encryptionService.generateSecureToken(32);
  }

  /**
   * Validate session security
   */
  public validateSessionSecurity(sessionId: string, ipAddress: string, userAgent: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Check IP consistency (with some flexibility for mobile networks)
    const ipChanged = session.ipAddress !== ipAddress;
    const userAgentChanged = session.userAgent !== userAgent;

    if (ipChanged || userAgentChanged) {
      this.logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
        userId: session.userId,
        sessionId,
        ipAddress,
        userAgent,
        resource: 'session',
        action: 'validate',
        success: false,
        metadata: {
          originalIp: session.ipAddress,
          newIp: ipAddress,
          originalUserAgent: session.userAgent,
          newUserAgent: userAgent,
          ipChanged,
          userAgentChanged
        }
      });

      // For high-security scenarios, invalidate session
      if (ipChanged && userAgentChanged) {
        this.invalidateSession(sessionId, 'security_violation');
        return false;
      }
    }

    return true;
  }

  /**
   * Clean up expired sessions
   */
  public cleanupExpiredSessions(): number {
    let cleanedCount = 0;
    const now = new Date();

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.expiresAt < now || !session.isActive) {
        this.activeSessions.delete(sessionId);
        cleanedCount++;
      }
    }

    // Clean up old login attempts (older than 24 hours)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    for (const [identifier, attempts] of this.loginAttempts.entries()) {
      if (attempts.lastAttempt < dayAgo && (!attempts.lockedUntil || attempts.lockedUntil < now)) {
        this.loginAttempts.delete(identifier);
      }
    }

    return cleanedCount;
  }

  /**
   * Get active session count
   */
  public getActiveSessionCount(): number {
    return Array.from(this.activeSessions.values()).filter(s => s.isActive).length;
  }

  /**
   * Get session by ID
   */
  public getSession(sessionId: string): UserSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Log security events
   */
  private logSecurityEvent(eventType: SecurityEventType, details: Partial<SecurityAuditLog>): void {
    const auditLog: SecurityAuditLog = {
      id: crypto.randomUUID(),
      eventType,
      userId: details.userId,
      sessionId: details.sessionId,
      ipAddress: details.ipAddress || 'unknown',
      userAgent: details.userAgent || 'unknown',
      resource: details.resource || 'unknown',
      action: details.action || 'unknown',
      success: details.success || false,
      errorMessage: details.errorMessage,
      metadata: details.metadata || {},
      timestamp: new Date()
    };

    // In production, this would be stored in a secure audit log database
    console.log('Security Event:', JSON.stringify(auditLog, null, 2));
  }
}