---
title: "Authenticationsystem.d"
type: "framework"
audience: "executives"
version: "v2025.ts"
dependencies:
  - "" # Add dependencies here
implementations:
  - "" # Add implementations here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

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
export declare class AuthenticationSystem {
    private config;
    private db;
    private redis;
    private security;
    private privacy;
    constructor(config: AuthConfig, db: Pool, redis: RedisClientType, security: DataSecurityFramework, privacy: PrivacyComplianceSystem);
    registerUser(registration: UserRegistration, ipAddress?: string, userAgent?: string): Promise<AuthenticationResult>;
    authenticateUser(credentials: UserCredentials, ipAddress?: string, userAgent?: string): Promise<AuthenticationResult>;
    requireAuthentication: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    requirePermission: (permission: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    requireRole: (role: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    verifyEmail(token: string): Promise<boolean>;
    resendVerificationEmail(email: string): Promise<boolean>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean>;
    resetPassword(email: string): Promise<boolean>;
    confirmPasswordReset(token: string, newPassword: string): Promise<boolean>;
    private getUserByEmail;
    private validateRegistrationData;
    private validatePassword;
    private isPasswordReused;
    private getUserPermissions;
    private sendVerificationEmail;
    private sendPasswordResetEmail;
}
//# sourceMappingURL=AuthenticationSystem.d.ts.map