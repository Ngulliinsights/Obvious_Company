---
title: "Auditcompliancesystem"
type: "framework"
audience: "executives"
version: "v2025.js"
dependencies:
  - "" # Add dependencies here
implementations:
  - "" # Add implementations here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditComplianceSystem = void 0;
const crypto_1 = __importDefault(require("crypto"));
class AuditComplianceSystem {
    constructor(config, db, redis, security) {
        this.config = config;
        this.db = db;
        this.redis = redis;
        this.security = security;
    }
    async initialize() {
        try {
            await this.createAuditTables();
            if (this.config.enableRealTimeAuditing) {
                await this.startRealTimeMonitoring();
            }
            console.log('Audit and compliance system initialized successfully');
        }
        catch (error) {
            console.error('Audit and compliance system initialization failed:', error);
            throw error;
        }
    }
    async logAuditEvent(event) {
        try {
            const auditEvent = {
                id: this.security.generateSecureId(),
                timestamp: new Date(),
                ...event
            };
            await this.db.query(`INSERT INTO audit_events (
          id, event_type, user_id, session_id, ip_address, user_agent,
          event_data, risk_level, timestamp, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [
                auditEvent.id,
                auditEvent.eventType,
                auditEvent.userId,
                auditEvent.sessionId,
                auditEvent.ipAddress,
                auditEvent.userAgent,
                JSON.stringify(auditEvent.eventData),
                auditEvent.riskLevel,
                auditEvent.timestamp,
                auditEvent.source
            ]);
            if (this.config.enableRealTimeAuditing) {
                await this.redis.lpush('audit_events_stream', JSON.stringify(auditEvent));
                await this.redis.ltrim('audit_events_stream', 0, 999);
            }
            await this.checkSecurityAlerts(auditEvent);
            return auditEvent.id;
        }
        catch (error) {
            console.error('Audit event logging failed:', error);
            throw error;
        }
    }
    async logUserInteraction(userId, action, details, sessionId, ipAddress) {
        await this.logAuditEvent({
            eventType: 'user_interaction',
            userId,
            sessionId,
            ipAddress,
            eventData: {
                action,
                details,
                timestamp: new Date().toISOString()
            },
            riskLevel: 'low',
            source: 'user_interface'
        });
    }
    async logDataAccess(userId, dataType, operation, recordIds, sessionId) {
        await this.logAuditEvent({
            eventType: 'data_access',
            userId,
            sessionId,
            eventData: {
                dataType,
                operation,
                recordCount: recordIds.length,
                recordIds: recordIds.slice(0, 10),
                timestamp: new Date().toISOString()
            },
            riskLevel: this.determineDataAccessRiskLevel(dataType, operation),
            source: 'data_layer'
        });
    }
    async logSystemEvent(eventType, details, riskLevel = 'low') {
        await this.logAuditEvent({
            eventType,
            eventData: details,
            riskLevel,
            source: 'system'
        });
    }
    async generateComplianceReport(reportType, startDate, endDate) {
        try {
            const reportId = this.security.generateSecureId();
            const metrics = await this.calculateComplianceMetrics(startDate, endDate);
            const violations = await this.detectComplianceViolations(startDate, endDate);
            const recommendations = await this.generateRecommendations(metrics, violations);
            const report = {
                id: reportId,
                reportType,
                period: { start: startDate, end: endDate },
                metrics,
                violations,
                recommendations,
                generatedAt: new Date()
            };
            await this.db.query(`INSERT INTO compliance_reports (
          id, report_type, period_start, period_end, metrics, 
          violations, recommendations, generated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
                reportId,
                reportType,
                startDate,
                endDate,
                JSON.stringify(metrics),
                JSON.stringify(violations),
                JSON.stringify(recommendations),
                report.generatedAt
            ]);
            return report;
        }
        catch (error) {
            throw new Error(`Compliance report generation failed: ${error}`);
        }
    }
    async anonymizeDataForAnalytics(data) {
        try {
            return data.map(record => {
                const anonymized = { ...record };
                for (const rule of this.config.anonymizationRules) {
                    if (anonymized[rule.field]) {
                        anonymized[rule.field] = this.applyAnonymizationRule(anonymized[rule.field], rule);
                    }
                }
                return anonymized;
            });
        }
        catch (error) {
            throw new Error(`Data anonymization failed: ${error}`);
        }
    }
    async createSecurityAlert(alertType, severity, message, details) {
        try {
            const alertId = this.security.generateSecureId();
            const alert = {
                id: alertId,
                alertType,
                severity,
                message,
                details,
                triggeredAt: new Date()
            };
            await this.db.query(`INSERT INTO security_alerts (
          id, alert_type, severity, message, details, triggered_at
        ) VALUES ($1, $2, $3, $4, $5, $6)`, [alertId, alertType, severity, message, JSON.stringify(details), alert.triggeredAt]);
            if (severity === 'critical') {
                await this.sendCriticalAlertNotification(alert);
            }
            return alertId;
        }
        catch (error) {
            throw new Error(`Security alert creation failed: ${error}`);
        }
    }
    async runSecurityAssessment() {
        try {
            const assessment = {
                id: this.security.generateSecureId(),
                timestamp: new Date(),
                checks: await this.performSecurityChecks(),
                vulnerabilities: await this.identifyVulnerabilities(),
                recommendations: await this.generateSecurityRecommendations()
            };
            await this.db.query(`INSERT INTO security_assessments (
          id, assessment_data, created_at
        ) VALUES ($1, $2, $3)`, [assessment.id, JSON.stringify(assessment), assessment.timestamp]);
            return assessment;
        }
        catch (error) {
            throw new Error(`Security assessment failed: ${error}`);
        }
    }
    async startRealTimeMonitoring() {
        try {
            setInterval(async () => {
                await this.monitorFailedLogins();
            }, 60000);
            setInterval(async () => {
                await this.monitorDataAccessPatterns();
            }, 300000);
            setInterval(async () => {
                await this.monitorPrivacyRequests();
            }, 3600000);
            console.log('Real-time monitoring started');
        }
        catch (error) {
            console.error('Real-time monitoring setup failed:', error);
        }
    }
    async monitorFailedLogins() {
        try {
            const recentFailures = await this.db.query(`SELECT COUNT(*) as count, ip_address
         FROM audit_events 
         WHERE event_type = 'login_failed' 
           AND timestamp > NOW() - INTERVAL '1 hour'
         GROUP BY ip_address
         HAVING COUNT(*) >= $1`, [this.config.alertThresholds.failedLogins]);
            for (const failure of recentFailures) {
                await this.createSecurityAlert('excessive_failed_logins', 'warning', `Excessive failed login attempts from IP: ${failure.ip_address}`, { ipAddress: failure.ip_address, attempts: failure.count });
            }
        }
        catch (error) {
            console.error('Failed login monitoring error:', error);
        }
    }
    async monitorDataAccessPatterns() {
        try {
            const unusualAccess = await this.db.query(`SELECT user_id, COUNT(*) as access_count
         FROM audit_events 
         WHERE event_type = 'data_access' 
           AND timestamp > NOW() - INTERVAL '1 hour'
         GROUP BY user_id
         HAVING COUNT(*) >= $1`, [this.config.alertThresholds.dataAccess]);
            for (const access of unusualAccess) {
                await this.createSecurityAlert('unusual_data_access', 'warning', `Unusual data access pattern detected for user: ${access.user_id}`, { userId: access.user_id, accessCount: access.access_count });
            }
        }
        catch (error) {
            console.error('Data access monitoring error:', error);
        }
    }
    async monitorPrivacyRequests() {
        try {
            const overdueRequests = await this.db.query(`SELECT COUNT(*) as count
         FROM privacy_requests 
         WHERE status = 'pending' 
           AND request_date < NOW() - INTERVAL '30 days'`);
            const count = overdueRequests[0].count;
            if (count >= this.config.alertThresholds.privacyRequests) {
                await this.createSecurityAlert('overdue_privacy_requests', 'error', `${count} privacy requests are overdue for processing`, { overdueCount: count });
            }
        }
        catch (error) {
            console.error('Privacy request monitoring error:', error);
        }
    }
    async calculateComplianceMetrics(startDate, endDate) {
        try {
            const [totalUsers, activeUsers, dataProcessingActivities, consentMetrics, privacyRequests, securityIncidents] = await Promise.all([
                this.getTotalUsersCount(startDate, endDate),
                this.getActiveUsersCount(startDate, endDate),
                this.getDataProcessingActivitiesCount(startDate, endDate),
                this.getConsentMetrics(startDate, endDate),
                this.getPrivacyRequestMetrics(startDate, endDate),
                this.getSecurityIncidentsCount(startDate, endDate)
            ]);
            return {
                totalUsers,
                activeUsers,
                dataProcessingActivities,
                consentRate: consentMetrics.rate,
                privacyRequestsProcessed: privacyRequests.processed,
                averageResponseTime: privacyRequests.averageResponseTime,
                securityIncidents,
                dataBreaches: 0
            };
        }
        catch (error) {
            throw new Error(`Compliance metrics calculation failed: ${error}`);
        }
    }
    async detectComplianceViolations(startDate, endDate) {
        const violations = [];
        try {
            const consentViolations = await this.db.query(`SELECT COUNT(*) as count
         FROM user_profiles up
         LEFT JOIN user_consent uc ON up.id = uc.user_id AND uc.consent_type = 'data_processing'
         WHERE up.created_at BETWEEN $1 AND $2
           AND (uc.consent_given IS NULL OR uc.consent_given = FALSE)`, [startDate, endDate]);
            if (consentViolations[0].count > 0) {
                violations.push({
                    id: this.security.generateSecureId(),
                    type: 'missing_consent',
                    severity: 'high',
                    description: `${consentViolations[0].count} users without proper data processing consent`,
                    affectedUsers: consentViolations[0].count,
                    detectedAt: new Date(),
                    remediation: ['Obtain explicit consent', 'Review consent collection process']
                });
            }
            const retentionViolations = await this.db.query(`SELECT COUNT(*) as count
         FROM assessment_sessions 
         WHERE created_at < NOW() - INTERVAL '${this.config.auditRetentionDays} days'
           AND user_id IS NOT NULL`);
            if (retentionViolations[0].count > 0) {
                violations.push({
                    id: this.security.generateSecureId(),
                    type: 'data_retention_violation',
                    severity: 'medium',
                    description: `${retentionViolations[0].count} records exceed retention period`,
                    affectedUsers: retentionViolations[0].count,
                    detectedAt: new Date(),
                    remediation: ['Execute data retention policy', 'Anonymize expired records']
                });
            }
            return violations;
        }
        catch (error) {
            throw new Error(`Compliance violation detection failed: ${error}`);
        }
    }
    async generateRecommendations(metrics, violations) {
        const recommendations = [];
        if (metrics.consentRate < 0.95) {
            recommendations.push('Improve consent collection process to achieve >95% consent rate');
        }
        if (metrics.averageResponseTime > 30) {
            recommendations.push('Reduce privacy request response time to under 30 days');
        }
        if (metrics.securityIncidents > 0) {
            recommendations.push('Review and strengthen security controls to prevent incidents');
        }
        for (const violation of violations) {
            recommendations.push(...violation.remediation);
        }
        return [...new Set(recommendations)];
    }
    determineDataAccessRiskLevel(dataType, operation) {
        const sensitiveDataTypes = ['user_profiles', 'assessment_responses', 'personal_data'];
        const riskOperations = ['export', 'bulk_access', 'admin_access'];
        if (sensitiveDataTypes.includes(dataType) && riskOperations.includes(operation)) {
            return 'high';
        }
        else if (sensitiveDataTypes.includes(dataType) || riskOperations.includes(operation)) {
            return 'medium';
        }
        else {
            return 'low';
        }
    }
    applyAnonymizationRule(value, rule) {
        switch (rule.method) {
            case 'hash':
                return crypto_1.default.createHash('sha256').update(value.toString()).digest('hex').substring(0, 8);
            case 'mask':
                return rule.replacement || '***';
            case 'remove':
                return null;
            case 'generalize':
                if (rule.pattern && rule.replacement) {
                    return value.toString().replace(new RegExp(rule.pattern, 'g'), rule.replacement);
                }
                return value;
            default:
                return value;
        }
    }
    async checkSecurityAlerts(event) {
        if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
            await this.createSecurityAlert('high_risk_event', event.riskLevel === 'critical' ? 'critical' : 'error', `High-risk event detected: ${event.eventType}`, event.eventData);
        }
    }
    async sendCriticalAlertNotification(alert) {
        console.log(`CRITICAL ALERT: ${alert.message}`, alert.details);
    }
    async performSecurityChecks() {
        const checks = [];
        const weakPasswords = await this.db.query(`SELECT COUNT(*) as count FROM user_auth 
       WHERE password_changed_at < NOW() - INTERVAL '90 days'`);
        checks.push({
            check: 'password_age',
            status: weakPasswords[0].count === 0 ? 'pass' : 'fail',
            details: `${weakPasswords[0].count} users with passwords older than 90 days`
        });
        const inactiveSessions = await this.db.query(`SELECT COUNT(*) as count FROM user_sessions 
       WHERE last_activity < NOW() - INTERVAL '24 hours' 
         AND expires_at > NOW() AND invalidated_at IS NULL`);
        checks.push({
            check: 'inactive_sessions',
            status: inactiveSessions[0].count === 0 ? 'pass' : 'warning',
            details: `${inactiveSessions[0].count} inactive sessions found`
        });
        return checks;
    }
    async identifyVulnerabilities() {
        return [];
    }
    async generateSecurityRecommendations() {
        return [
            'Regularly update dependencies',
            'Implement automated security scanning',
            'Review access controls quarterly',
            'Conduct penetration testing annually'
        ];
    }
    async getTotalUsersCount(startDate, endDate) {
        const result = await this.db.query(`SELECT COUNT(*) as count FROM user_profiles 
       WHERE created_at BETWEEN $1 AND $2`, [startDate, endDate]);
        return result[0].count;
    }
    async getActiveUsersCount(startDate, endDate) {
        const result = await this.db.query(`SELECT COUNT(DISTINCT user_id) as count FROM user_sessions 
       WHERE created_at BETWEEN $1 AND $2`, [startDate, endDate]);
        return result[0].count;
    }
    async getDataProcessingActivitiesCount(startDate, endDate) {
        const result = await this.db.query(`SELECT COUNT(*) as count FROM audit_events 
       WHERE event_type = 'data_access' AND timestamp BETWEEN $1 AND $2`, [startDate, endDate]);
        return result[0].count;
    }
    async getConsentMetrics(startDate, endDate) {
        const result = await this.db.query(`SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN consent_given THEN 1 ELSE 0 END) as given
       FROM user_consent 
       WHERE consent_date BETWEEN $1 AND $2`, [startDate, endDate]);
        const metrics = result[0];
        return {
            rate: metrics.total > 0 ? metrics.given / metrics.total : 1
        };
    }
    async getPrivacyRequestMetrics(startDate, endDate) {
        const result = await this.db.query(`SELECT 
         COUNT(*) as processed,
         AVG(EXTRACT(EPOCH FROM (completion_date - request_date))/86400) as avg_days
       FROM privacy_requests 
       WHERE request_date BETWEEN $1 AND $2 AND status = 'completed'`, [startDate, endDate]);
        const metrics = result[0];
        return {
            processed: metrics.processed || 0,
            averageResponseTime: metrics.avg_days || 0
        };
    }
    async getSecurityIncidentsCount(startDate, endDate) {
        const result = await this.db.query(`SELECT COUNT(*) as count FROM security_alerts 
       WHERE severity IN ('error', 'critical') AND triggered_at BETWEEN $1 AND $2`, [startDate, endDate]);
        return result[0].count;
    }
    async createAuditTables() {
        try {
            await this.db.query(`
        -- Audit events table
        CREATE TABLE IF NOT EXISTS audit_events (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          event_type VARCHAR(100) NOT NULL,
          user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
          session_id VARCHAR(255),
          ip_address INET,
          user_agent TEXT,
          event_data JSONB NOT NULL,
          risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          source VARCHAR(50) NOT NULL
        );

        -- Compliance reports table
        CREATE TABLE IF NOT EXISTS compliance_reports (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          report_type VARCHAR(100) NOT NULL,
          period_start TIMESTAMP WITH TIME ZONE NOT NULL,
          period_end TIMESTAMP WITH TIME ZONE NOT NULL,
          metrics JSONB NOT NULL,
          violations JSONB NOT NULL,
          recommendations JSONB NOT NULL,
          generated_at TIMESTAMP WITH TIME ZONE NOT NULL
        );

        -- Security alerts table
        CREATE TABLE IF NOT EXISTS security_alerts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          alert_type VARCHAR(100) NOT NULL,
          severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
          message TEXT NOT NULL,
          details JSONB,
          triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
          acknowledged_at TIMESTAMP WITH TIME ZONE,
          resolved_at TIMESTAMP WITH TIME ZONE
        );

        -- Security assessments table
        CREATE TABLE IF NOT EXISTS security_assessments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          assessment_data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON audit_events(event_type);
        CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp);
        CREATE INDEX IF NOT EXISTS idx_audit_events_risk_level ON audit_events(risk_level);

        CREATE INDEX IF NOT EXISTS idx_compliance_reports_report_type ON compliance_reports(report_type);
        CREATE INDEX IF NOT EXISTS idx_compliance_reports_period ON compliance_reports(period_start, period_end);

        CREATE INDEX IF NOT EXISTS idx_security_alerts_alert_type ON security_alerts(alert_type);
        CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
        CREATE INDEX IF NOT EXISTS idx_security_alerts_triggered_at ON security_alerts(triggered_at);

        CREATE INDEX IF NOT EXISTS idx_security_assessments_created_at ON security_assessments(created_at);
      `);
            console.log('Audit and compliance tables created successfully');
        }
        catch (error) {
            console.error('Failed to create audit tables:', error);
            throw error;
        }
    }
    async getUserAuditTrail(userId, startDate, endDate) {
        try {
            const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate || new Date();
            const result = await this.db.query(`SELECT * FROM audit_events 
         WHERE user_id = $1 AND timestamp BETWEEN $2 AND $3
         ORDER BY timestamp DESC`, [userId, start, end]);
            return result.map(row => ({
                id: row.id,
                eventType: row.event_type,
                userId: row.user_id,
                sessionId: row.session_id,
                ipAddress: row.ip_address,
                userAgent: row.user_agent,
                eventData: row.event_data,
                riskLevel: row.risk_level,
                timestamp: row.timestamp,
                source: row.source
            }));
        }
        catch (error) {
            throw new Error(`Failed to get user audit trail: ${error}`);
        }
    }
    async getSystemHealthStatus() {
        try {
            const [recentAlerts, activeViolations, systemMetrics] = await Promise.all([
                this.getRecentSecurityAlerts(),
                this.getActiveComplianceViolations(),
                this.getSystemMetrics()
            ]);
            return {
                timestamp: new Date().toISOString(),
                status: this.calculateOverallHealthStatus(recentAlerts, activeViolations),
                alerts: recentAlerts,
                violations: activeViolations,
                metrics: systemMetrics
            };
        }
        catch (error) {
            throw new Error(`Failed to get system health status: ${error}`);
        }
    }
    async getRecentSecurityAlerts() {
        const result = await this.db.query(`SELECT * FROM security_alerts 
       WHERE triggered_at > NOW() - INTERVAL '24 hours'
       ORDER BY triggered_at DESC
       LIMIT 10`);
        return result.map(row => ({
            id: row.id,
            alertType: row.alert_type,
            severity: row.severity,
            message: row.message,
            details: row.details,
            triggeredAt: row.triggered_at,
            acknowledgedAt: row.acknowledged_at,
            resolvedAt: row.resolved_at
        }));
    }
    async getActiveComplianceViolations() {
        return [];
    }
    async getSystemMetrics() {
        const result = await this.db.query(`
      SELECT 
        (SELECT COUNT(*) FROM audit_events WHERE timestamp > NOW() - INTERVAL '24 hours') as events_24h,
        (SELECT COUNT(*) FROM security_alerts WHERE triggered_at > NOW() - INTERVAL '24 hours') as alerts_24h,
        (SELECT COUNT(*) FROM user_sessions WHERE expires_at > NOW() AND invalidated_at IS NULL) as active_sessions,
        (SELECT COUNT(*) FROM privacy_requests WHERE status = 'pending') as pending_privacy_requests
    `);
        return result[0];
    }
    calculateOverallHealthStatus(alerts, violations) {
        const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
        const highViolations = violations.filter(v => v.severity === 'high' || v.severity === 'critical').length;
        if (criticalAlerts > 0 || highViolations > 0) {
            return 'critical';
        }
        else if (alerts.length > 5 || violations.length > 0) {
            return 'warning';
        }
        else {
            return 'healthy';
        }
    }
}
exports.AuditComplianceSystem = AuditComplianceSystem;
//# sourceMappingURL=AuditComplianceSystem.js.map