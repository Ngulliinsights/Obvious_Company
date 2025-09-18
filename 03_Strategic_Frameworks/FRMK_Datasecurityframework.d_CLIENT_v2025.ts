---
title: "Datasecurityframework.d"
type: "framework"
audience: "clients"
version: "v2025.ts"
dependencies:
  - "" # Add dependencies here
implementations:
  - "" # Add implementations here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

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
export declare class DataSecurityFramework {
    private config;
    private db;
    private redis;
    constructor(config: SecurityConfig, db: Pool, redis: RedisClientType);
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
    encryptSensitiveData(data: string): EncryptedData;
    decryptSensitiveData(encryptedData: EncryptedData): string;
    generateAccessToken(payload: object): string;
    verifyAccessToken(token: string): any;
    createUserSession(userId: string, email: string, role: string, permissions: string[], ipAddress?: string, userAgent?: string): Promise<UserSession>;
    validateUserSession(sessionId: string): Promise<UserSession | null>;
    invalidateSession(sessionId: string): Promise<void>;
    invalidateAllUserSessions(userId: string): Promise<void>;
    checkLoginAttempts(identifier: string): Promise<{
        allowed: boolean;
        remainingAttempts: number;
        lockoutExpires?: Date;
    }>;
    recordLoginAttempt(identifier: string, success: boolean): Promise<void>;
    sanitizeUserInput(input: string): string;
    sanitizeEmail(email: string): string;
    generateSecureToken(length?: number): string;
    generateSecureId(): string;
    validateAssessmentData(data: any): boolean;
    private validateResponseStructure;
    private isValidUUID;
    getSecurityHeaders(): Record<string, string>;
    logSecurityEvent(event: string, userId?: string, details?: any, ipAddress?: string): Promise<void>;
}
//# sourceMappingURL=DataSecurityFramework.d.ts.map