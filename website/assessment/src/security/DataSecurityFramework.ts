import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  encryptionKey: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  authTag: string;
}

export interface UserSession {
  userId: string;
  sessionId: string;
  email?: string;
  role: string;
  permissions: string[];
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class DataSecurityFramework {
  private config: SecurityConfig;
  private db: Pool;
  private redis: RedisClientType;

  constructor(config: SecurityConfig, db: Pool, redis: RedisClientType) {
    this.config = config;
    this.db = db;
    this.redis = redis;
  }

  // Password Security
  async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.config.bcryptRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error(`Password hashing failed: ${error}`);
    }
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error(`Password verification failed: ${error}`);
    }
  }

  // Data Encryption
  encryptSensitiveData(data: string): EncryptedData {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-gcm', this.config.encryptionKey);
      cipher.setAAD(Buffer.from('assessment-platform'));
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw new Error(`Data encryption failed: ${error}`);
    }
  }

  decryptSensitiveData(encryptedData: EncryptedData): string {
    try {
      const decipher = crypto.createDecipher('aes-256-gcm', this.config.encryptionKey);
      decipher.setAAD(Buffer.from('assessment-platform'));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

      let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Data decryption failed: ${error}`);
    }
  }

  // JWT Token Management
  generateAccessToken(payload: object): string {
    try {
      return jwt.sign(payload, this.config.jwtSecret, {
        expiresIn: this.config.jwtExpiresIn,
        issuer: 'ai-assessment-platform',
        audience: 'assessment-users'
      });
    } catch (error) {
      throw new Error(`Token generation failed: ${error}`);
    }
  }

  verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, this.config.jwtSecret, {
        issuer: 'ai-assessment-platform',
        audience: 'assessment-users'
      });
    } catch (error) {
      throw new Error(`Token verification failed: ${error}`);
    }
  }

  // Session Management
  async createUserSession(userId: string, email: string, role: string, permissions: string[], ipAddress?: string, userAgent?: string): Promise<UserSession> {
    try {
      const sessionId = crypto.randomUUID();
      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + this.config.sessionTimeout * 1000);

      const session: UserSession = {
        userId,
        sessionId,
        email,
        role,
        permissions,
        createdAt,
        expiresAt,
        ipAddress,
        userAgent
      };

      // Store session in Redis
      await this.redis.setEx(
        `session:${sessionId}`,
        this.config.sessionTimeout,
        JSON.stringify(session)
      );

      // Store session reference in database
      await this.db.query(
        `INSERT INTO user_sessions (session_id, user_id, created_at, expires_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sessionId, userId, createdAt, expiresAt, ipAddress, userAgent]
      );

      return session;
    } catch (error) {
      throw new Error(`Session creation failed: ${error}`);
    }
  }

  async validateUserSession(sessionId: string): Promise<UserSession | null> {
    try {
      const sessionData = await this.redis.get(`session:${sessionId}`);
      if (!sessionData) {
        return null;
      }

      const session: UserSession = JSON.parse(sessionData);
      
      // Check if session has expired
      if (new Date() > session.expiresAt) {
        await this.invalidateSession(sessionId);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  async invalidateSession(sessionId: string): Promise<void> {
    try {
      // Remove from Redis
      await this.redis.del(`session:${sessionId}`);

      // Mark as invalidated in database
      await this.db.query(
        `UPDATE user_sessions SET invalidated_at = NOW() WHERE session_id = $1`,
        [sessionId]
      );
    } catch (error) {
      throw new Error(`Session invalidation failed: ${error}`);
    }
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      // Get all active sessions for user
      const result = await this.db.query(
        `SELECT session_id FROM user_sessions 
         WHERE user_id = $1 AND invalidated_at IS NULL AND expires_at > NOW()`,
        [userId]
      );

      const sessions = result as { session_id: string }[];

      // Invalidate each session
      for (const session of sessions) {
        await this.invalidateSession(session.session_id);
      }
    } catch (error) {
      throw new Error(`Bulk session invalidation failed: ${error}`);
    }
  }

  // Rate Limiting and Brute Force Protection
  async checkLoginAttempts(identifier: string): Promise<{ allowed: boolean; remainingAttempts: number; lockoutExpires?: Date }> {
    try {
      const key = `login_attempts:${identifier}`;
      const attempts = await this.redis.get(key);
      
      if (!attempts) {
        return { allowed: true, remainingAttempts: this.config.maxLoginAttempts };
      }

      const attemptData = JSON.parse(attempts);
      const now = new Date();

      // Check if lockout period has expired
      if (attemptData.lockoutExpires && new Date(attemptData.lockoutExpires) > now) {
        return {
          allowed: false,
          remainingAttempts: 0,
          lockoutExpires: new Date(attemptData.lockoutExpires)
        };
      }

      // Reset if lockout has expired
      if (attemptData.lockoutExpires && new Date(attemptData.lockoutExpires) <= now) {
        await this.redis.del(key);
        return { allowed: true, remainingAttempts: this.config.maxLoginAttempts };
      }

      const remainingAttempts = this.config.maxLoginAttempts - attemptData.count;
      return {
        allowed: remainingAttempts > 0,
        remainingAttempts: Math.max(0, remainingAttempts)
      };
    } catch (error) {
      console.error('Login attempt check error:', error);
      return { allowed: true, remainingAttempts: this.config.maxLoginAttempts };
    }
  }

  async recordLoginAttempt(identifier: string, success: boolean): Promise<void> {
    try {
      const key = `login_attempts:${identifier}`;
      
      if (success) {
        // Clear attempts on successful login
        await this.redis.del(key);
        return;
      }

      // Increment failed attempts
      const attempts = await this.redis.get(key);
      let attemptData = attempts ? JSON.parse(attempts) : { count: 0 };
      
      attemptData.count += 1;
      attemptData.lastAttempt = new Date().toISOString();

      // Apply lockout if max attempts reached
      if (attemptData.count >= this.config.maxLoginAttempts) {
        attemptData.lockoutExpires = new Date(Date.now() + this.config.lockoutDuration * 1000).toISOString();
      }

      await this.redis.setEx(key, this.config.lockoutDuration, JSON.stringify(attemptData));
    } catch (error) {
      console.error('Login attempt recording error:', error);
    }
  }

  // Data Sanitization
  sanitizeUserInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes to prevent injection
      .replace(/[;&|`$]/g, '') // Remove command injection characters
      .substring(0, 1000); // Limit length
  }

  sanitizeEmail(email: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = this.sanitizeUserInput(email.toLowerCase());
    
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    
    return sanitized;
  }

  // Secure Random Generation
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  generateSecureId(): string {
    return crypto.randomUUID();
  }

  // Data Validation
  validateAssessmentData(data: any): boolean {
    try {
      // Basic structure validation
      if (!data || typeof data !== 'object') {
        return false;
      }

      // Validate required fields exist
      const requiredFields = ['sessionId', 'responses'];
      for (const field of requiredFields) {
        if (!(field in data)) {
          return false;
        }
      }

      // Validate session ID format
      if (!this.isValidUUID(data.sessionId)) {
        return false;
      }

      // Validate responses structure
      if (!Array.isArray(data.responses)) {
        return false;
      }

      // Validate each response
      for (const response of data.responses) {
        if (!this.validateResponseStructure(response)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Assessment data validation error:', error);
      return false;
    }
  }

  private validateResponseStructure(response: any): boolean {
    return (
      response &&
      typeof response === 'object' &&
      'questionId' in response &&
      'value' in response &&
      typeof response.questionId === 'string' &&
      response.questionId.length > 0
    );
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Security Headers
  getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }

  // Audit Logging
  async logSecurityEvent(event: string, userId?: string, details?: any, ipAddress?: string): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO security_audit_log (event_type, user_id, event_details, ip_address, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [event, userId, JSON.stringify(details), ipAddress]
      );
    } catch (error) {
      console.error('Security event logging error:', error);
    }
  }
}