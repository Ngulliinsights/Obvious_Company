/**
 * Security Framework Types
 */

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    saltLength: number;
  };
  authentication: {
    jwtSecret: string;
    jwtExpiresIn: string;
    refreshTokenExpiresIn: string;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  dataProtection: {
    dataRetentionDays: number;
    anonymizationDelay: number;
    backupEncryption: boolean;
    auditLogRetention: number;
  };
  privacy: {
    gdprCompliance: boolean;
    ccpaCompliance: boolean;
    dataProcessingBasis: string[];
    consentRequired: boolean;
  };
}

export interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
  algorithm: string;
  timestamp: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  createdAt: Date;
  lastAccessedAt: Date;
}

export interface SecurityAuditLog {
  id: string;
  eventType: SecurityEventType;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  action: string;
  success: boolean;
  errorMessage?: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export enum SecurityEventType {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  TOKEN_REFRESH = 'token_refresh',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  DATA_DELETION = 'data_deletion',
  PERMISSION_DENIED = 'permission_denied',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SECURITY_VIOLATION = 'security_violation'
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionPeriod: number; // days
  anonymizationRequired: boolean;
  deletionRequired: boolean;
  archivalRequired: boolean;
  complianceRequirements: string[];
}

export interface PrivacyConsent {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  version: string;
  metadata: Record<string, any>;
}

export enum ConsentType {
  DATA_PROCESSING = 'data_processing',
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  COOKIES = 'cookies',
  THIRD_PARTY_SHARING = 'third_party_sharing'
}

export interface SecurityPermission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: SecurityPermission[];
  isActive: boolean;
}

export interface SecurityContext {
  userId: string;
  sessionId: string;
  roles: string[];
  permissions: SecurityPermission[];
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}