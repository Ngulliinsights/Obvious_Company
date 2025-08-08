/**
 * Security Configuration
 * Centralized security settings and configuration management
 */

import { SecurityConfig as SecurityConfigType } from './types';

export class SecurityConfigManager {
  private static instance: SecurityConfigManager;
  private config: SecurityConfigType;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): SecurityConfigManager {
    if (!SecurityConfigManager.instance) {
      SecurityConfigManager.instance = new SecurityConfigManager();
    }
    return SecurityConfigManager.instance;
  }

  private loadConfiguration(): SecurityConfigType {
    return {
      encryption: {
        algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc',
        keyLength: parseInt(process.env.ENCRYPTION_KEY_LENGTH || '32'),
        ivLength: parseInt(process.env.ENCRYPTION_IV_LENGTH || '16'),
        saltLength: parseInt(process.env.ENCRYPTION_SALT_LENGTH || '32')
      },
      authentication: {
        jwtSecret: process.env.JWT_SECRET || this.generateSecureSecret(),
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
        refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000') // 15 minutes
      },
      dataProtection: {
        dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '365'),
        anonymizationDelay: parseInt(process.env.ANONYMIZATION_DELAY || '30'),
        backupEncryption: process.env.BACKUP_ENCRYPTION === 'true',
        auditLogRetention: parseInt(process.env.AUDIT_LOG_RETENTION || '2555') // 7 years
      },
      privacy: {
        gdprCompliance: process.env.GDPR_COMPLIANCE !== 'false',
        ccpaCompliance: process.env.CCPA_COMPLIANCE === 'true',
        dataProcessingBasis: (process.env.DATA_PROCESSING_BASIS || 'consent,legitimate_interest').split(','),
        consentRequired: process.env.CONSENT_REQUIRED !== 'false'
      }
    };
  }

  private generateSecureSecret(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(64).toString('hex');
  }

  public getConfig(): SecurityConfigType {
    return { ...this.config };
  }

  public getEncryptionConfig() {
    return this.config.encryption;
  }

  public getAuthenticationConfig() {
    return this.config.authentication;
  }

  public getDataProtectionConfig() {
    return this.config.dataProtection;
  }

  public getPrivacyConfig() {
    return this.config.privacy;
  }

  public updateConfig(updates: Partial<SecurityConfigType>): void {
    this.config = { ...this.config, ...updates };
  }

  public validateConfiguration(): boolean {
    const errors: string[] = [];

    // Validate encryption settings
    if (!this.config.encryption.algorithm) {
      errors.push('Encryption algorithm is required');
    }

    // Validate authentication settings
    if (!this.config.authentication.jwtSecret || this.config.authentication.jwtSecret.length < 32) {
      errors.push('JWT secret must be at least 32 characters long');
    }

    // Validate data protection settings
    if (this.config.dataProtection.dataRetentionDays < 1) {
      errors.push('Data retention period must be at least 1 day');
    }

    if (errors.length > 0) {
      console.error('Security configuration validation failed:', errors);
      return false;
    }

    return true;
  }

  public getSecurityHeaders(): Record<string, string> {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Content-Security-Policy': this.generateCSP()
    };
  }

  private generateCSP(): string {
    const baseUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
    
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      `form-action 'self' ${baseUrl}`,
      "frame-ancestors 'none'",
      "base-uri 'self'"
    ].join('; ');
  }
}

export const SecurityConfig = SecurityConfigManager.getInstance();