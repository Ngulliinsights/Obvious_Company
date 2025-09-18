---
title: "Auditcompliancesystem.d"
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
export interface AuditConfig {
    enableRealTimeAuditing: boolean;
    auditRetentionDays: number;
    complianceReportingInterval: number;
    alertThresholds: {
        failedLogins: number;
        dataAccess: number;
        privacyRequests: number;
    };
    anonymizationRules: AnonymizationRule[];
}
export interface AnonymizationRule {
    field: string;
    method: 'hash' | 'mask' | 'remove' | 'generalize';
    pattern?: string;
    replacement?: string;
}
export interface AuditEvent {
    id: string;
    eventType: string;
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    eventData: any;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    source: string;
}
export interface ComplianceReport {
    id: string;
    reportType: string;
    period: {
        start: Date;
        end: Date;
    };
    metrics: ComplianceMetrics;
    violations: ComplianceViolation[];
    recommendations: string[];
    generatedAt: Date;
}
export interface ComplianceMetrics {
    totalUsers: number;
    activeUsers: number;
    dataProcessingActivities: number;
    consentRate: number;
    privacyRequestsProcessed: number;
    averageResponseTime: number;
    securityIncidents: number;
    dataBreaches: number;
}
export interface ComplianceViolation {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedUsers: number;
    detectedAt: Date;
    resolvedAt?: Date;
    remediation: string[];
}
export interface SecurityAlert {
    id: string;
    alertType: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    details: any;
    triggeredAt: Date;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
}
export declare class AuditComplianceSystem {
    private config;
    private db;
    private redis;
    private security;
    constructor(config: AuditConfig, db: Pool, redis: RedisClientType, security: DataSecurityFramework);
    initialize(): Promise<void>;
    logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string>;
    logUserInteraction(userId: string, action: string, details: any, sessionId?: string, ipAddress?: string): Promise<void>;
    logDataAccess(userId: string, dataType: string, operation: string, recordIds: string[], sessionId?: string): Promise<void>;
    logSystemEvent(eventType: string, details: any, riskLevel?: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
    generateComplianceReport(reportType: string, startDate: Date, endDate: Date): Promise<ComplianceReport>;
    anonymizeDataForAnalytics(data: any[]): Promise<any[]>;
    createSecurityAlert(alertType: string, severity: 'info' | 'warning' | 'error' | 'critical', message: string, details: any): Promise<string>;
    runSecurityAssessment(): Promise<any>;
    private startRealTimeMonitoring;
    private monitorFailedLogins;
    private monitorDataAccessPatterns;
    private monitorPrivacyRequests;
    private calculateComplianceMetrics;
    private detectComplianceViolations;
    private generateRecommendations;
    private determineDataAccessRiskLevel;
    private applyAnonymizationRule;
    private checkSecurityAlerts;
    private sendCriticalAlertNotification;
    private performSecurityChecks;
    private identifyVulnerabilities;
    private generateSecurityRecommendations;
    private getTotalUsersCount;
    private getActiveUsersCount;
    private getDataProcessingActivitiesCount;
    private getConsentMetrics;
    private getPrivacyRequestMetrics;
    private getSecurityIncidentsCount;
    private createAuditTables;
    getUserAuditTrail(userId: string, startDate?: Date, endDate?: Date): Promise<AuditEvent[]>;
    getSystemHealthStatus(): Promise<any>;
    private getRecentSecurityAlerts;
    private getActiveComplianceViolations;
    private getSystemMetrics;
    private calculateOverallHealthStatus;
}
//# sourceMappingURL=AuditComplianceSystem.d.ts.map