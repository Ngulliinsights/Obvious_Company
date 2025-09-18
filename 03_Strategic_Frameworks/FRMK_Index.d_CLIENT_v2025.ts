---
title: "Index.d"
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
import { DataSecurityFramework, SecurityConfig } from './DataSecurityFramework';
import { PrivacyComplianceSystem, PrivacyConfig } from './PrivacyComplianceSystem';
import { AuthenticationSystem, AuthConfig } from './AuthenticationSystem';
import { DataRetentionSystem, RetentionConfig } from './DataRetentionSystem';
import { AuditComplianceSystem, AuditConfig } from './AuditComplianceSystem';
export interface SecuritySystemConfig {
    security: SecurityConfig;
    privacy: PrivacyConfig;
    auth: AuthConfig;
    retention: RetentionConfig;
    audit: AuditConfig;
}
export declare class SecuritySystem {
    private db;
    private redis;
    security: DataSecurityFramework;
    privacy: PrivacyComplianceSystem;
    auth: AuthenticationSystem;
    retention: DataRetentionSystem;
    audit: AuditComplianceSystem;
    constructor(config: SecuritySystemConfig, db: Pool, redis: RedisClientType);
    initialize(): Promise<void>;
    private createSecurityTables;
    getSecurityStatus(): Promise<any>;
    private getActiveUsersCount;
    private getActiveSessionsCount;
    private getRecentSecurityEvents;
    private getPrivacyRequestsStatus;
    private checkSystemHealth;
    createSecurityMiddleware(): {
        authenticate: (req: import("./AuthenticationSystem").AuthenticatedRequest, res: import("express").Response, next: import("express").NextFunction) => Promise<void>;
        requirePermission: (permission: string) => (req: import("./AuthenticationSystem").AuthenticatedRequest, res: import("express").Response, next: import("express").NextFunction) => Promise<void>;
        requireRole: (role: string) => (req: import("./AuthenticationSystem").AuthenticatedRequest, res: import("express").Response, next: import("express").NextFunction) => Promise<void>;
        securityHeaders: (req: any, res: any, next: any) => void;
    };
    shutdown(): Promise<void>;
}
export { DataSecurityFramework, PrivacyComplianceSystem, AuthenticationSystem, DataRetentionSystem, AuditComplianceSystem };
export * from './DataSecurityFramework';
export * from './PrivacyComplianceSystem';
export * from './AuthenticationSystem';
export * from './DataRetentionSystem';
export * from './AuditComplianceSystem';
//# sourceMappingURL=index.d.ts.map