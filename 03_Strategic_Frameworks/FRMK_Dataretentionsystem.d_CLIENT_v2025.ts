---
title: "Dataretentionsystem.d"
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
import { DataSecurityFramework } from './DataSecurityFramework';
export interface RetentionPolicy {
    dataType: string;
    retentionPeriodDays: number;
    anonymizationDelay: number;
    deletionMethod: 'hard_delete' | 'soft_delete' | 'anonymize';
    legalBasis: string;
    exceptions: string[];
}
export interface RetentionConfig {
    policies: RetentionPolicy[];
    automatedEnforcement: boolean;
    scheduleExpression: string;
    batchSize: number;
    notificationEmail?: string;
}
export interface DataClassification {
    category: 'personal' | 'sensitive' | 'public' | 'internal';
    retentionRequired: boolean;
    encryptionRequired: boolean;
    accessRestrictions: string[];
}
export interface RetentionJob {
    id: string;
    policyId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime: Date;
    endTime?: Date;
    recordsProcessed: number;
    recordsDeleted: number;
    recordsAnonymized: number;
    errors: string[];
}
export declare class DataRetentionSystem {
    private config;
    private db;
    private redis;
    private security;
    private cronJobs;
    constructor(config: RetentionConfig, db: Pool, redis: RedisClientType, security: DataSecurityFramework);
    initialize(): Promise<void>;
    private scheduleRetentionJobs;
    executeRetentionPolicies(): Promise<RetentionJob[]>;
    executeRetentionPolicy(policy: RetentionPolicy): Promise<RetentionJob>;
    private processAssessmentSessions;
    private processUserAnalytics;
    private processAuditLogs;
    private processUserSessions;
    private anonymizeAssessmentSession;
    private deleteAssessmentSession;
    private softDeleteAssessmentSession;
    cleanupExpiredSessions(): Promise<void>;
    generateRetentionAuditReport(): Promise<any>;
    private getRecentRetentionJobs;
    private getDataVolumes;
    private getComplianceStatus;
    private getLastExecutionTime;
    private getNextScheduledExecution;
    private createRetentionTables;
    private loadRetentionPolicies;
    executeManualRetention(dataType: string): Promise<RetentionJob>;
    getRetentionStatus(): Promise<any>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=DataRetentionSystem.d.ts.map