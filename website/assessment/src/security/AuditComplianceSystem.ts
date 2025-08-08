import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { DataSecurityFramework } from './DataSecurityFramework';
import crypto from 'crypto';

export interface AuditConfig {
  enableRealTimeAuditing: boolean;
  auditRetentionDays: number;
  complianceReportingInterval: number; // hours
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

export class AuditComplianceSystem {
  private config: AuditConfig;
  private db: Pool;
  private redis: RedisClientType;
  private security: DataSecurityFramework;

  constructor(config: AuditConfig, db: Pool, redis: RedisClientType, security: DataSecurityFramework) {
    this.config = config;
    this.db = db;
    this.redis = redis;
    this.security = security;
  }

  // Initialize audit and compliance system
  async initialize(): Promise<void> {
    try {
      await this.createAuditTables();
      
      if (this.config.enableRealTimeAuditing) {
        await this.startRealTimeMonitoring();
      }

      console.log('Audit and compliance system initialized successfully');
    } catch (error) {
      console.error('Audit and compliance system initialization failed:', error);
      throw error;
    }
  }

  // Audit Event Logging
  async logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string> {
    try {
      const auditEvent: AuditEvent = {
        id: this.security.generateSecureId(),
        timestamp: new Date(),
        ...event
      };

      // Store in database
      await this.db.query(
        `INSERT INTO audit_events (
          id, event_type, user_id, session_id, ip_address, user_agent,
          event_data, risk_level, timestamp, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
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
        ]
      );

      // Store in Redis for real-time monitoring
      if (this.config.enableRealTimeAuditing) {
        await this.redis.lpush('audit_events_stream', JSON.stringify(auditEvent));
        await this.redis.ltrim('audit_events_stream', 0, 999); // Keep last 1000 events
      }

      // Check for security alerts
      await this.checkSecurityAlerts(auditEvent);

      return auditEvent.id;
    } catch (error) {
      console.error('Audit event logging failed:', error);
      throw error;
    }
  }

  // User Interaction Logging
  async logUserInteraction(userId: string, action: string, details: any, sessionId?: string, ipAddress?: string): Promise<void> {
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

  // Data Access Logging
  async logDataAccess(userId: string, dataType: string, operation: string, recordIds: string[], sessionId?: string): Promise<void> {
    await this.logAuditEvent({
      eventType: 'data_access',
      userId,
      sessionId,
      eventData: {
        dataType,
        operation,
        recordCount: recordIds.length,
        recordIds: recordIds.slice(0, 10), // Log first 10 IDs for audit
        timestamp: new Date().toISOString()
      },
      riskLevel: this.determineDataAccessRiskLevel(dataType, operation),
      source: 'data_layer'
    });
  }

  // System Event Logging
  async logSystemEvent(eventType: string, details: any, riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'): Promise<void> {
    await this.logAuditEvent({
      eventType,
      eventData: details,
      riskLevel,
      source: 'system'
    });
  }

  // Compliance Monitoring
  async generateComplianceReport(reportType: string, startDate: Date, endDate: Date): Promise<ComplianceReport> {
    try {
      const reportId = this.security.generateSecureId();
      
      const metrics = await this.calculateComplianceMetrics(startDate, endDate);
      const violations = await this.detectComplianceViolations(startDate, endDate);
      const recommendations = await this.generateRecommendations(metrics, violations);

      const report: ComplianceReport = {
        id: reportId,
        reportType,
        period: { start: startDate, end: endDate },
        metrics,
        violations,
        recommendations,
        generatedAt: new Date()
      };

      // Store report
      await this.db.query(
        `INSERT INTO compliance_reports (
          id, report_type, period_start, period_end, metrics, 
          violations, recommendations, generated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          reportId,
          reportType,
          startDate,
          endDate,
          JSON.stringify(metrics),
          JSON.stringify(violations),
          JSON.stringify(recommendations),
          report.generatedAt
        ]
      );

      return report;
    } catch (error) {
      throw new Error(`Compliance report generation failed: ${error}`);
    }
  }

  // Data Anonymization for Analytics
  async anonymizeDataForAnalytics(data: any[]): Promise<any[]> {
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
    } catch (error) {
      throw new Error(`Data anonymization failed: ${error}`);
    }
  }

  // Security Alert Management
  async createSecurityAlert(alertType: string, severity: 'info' | 'warning' | 'error' | 'critical', message: string, details: any): Promise<string> {
    try {
      const alertId = this.security.generateSecureId();
      
      const alert: SecurityAlert = {
        id: alertId,
        alertType,
        severity,
        message,
        details,
        triggeredAt: new Date()
      };

      await this.db.query(
        `INSERT INTO security_alerts (
          id, alert_type, severity, message, details, triggered_at
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [alertId, alertType, severity, message, JSON.stringify(details), alert.triggeredAt]
      );

      // Send real-time notification for critical alerts
      if (severity === 'critical') {
        await this.sendCriticalAlertNotification(alert);
      }

      return alertId;
    } catch (error) {
      throw new Error(`Security alert creation failed: ${error}`);
    }
  }

  // Vulnerability Assessment Integration
  async runSecurityAssessment(): Promise<any> {
    try {
      const assessment = {
        id: this.security.generateSecureId(),
        timestamp: new Date(),
        checks: await this.performSecurityChecks(),
        vulnerabilities: await this.identifyVulnerabilities(),
        recommendations: await this.generateSecurityRecommendations()
      };

      // Store assessment results
      await this.db.query(
        `INSERT INTO security_assessments (
          id, assessment_data, created_at
        ) VALUES ($1, $2, $3)`,
        [assessment.id, JSON.stringify(assessment), assessment.timestamp]
      );

      return assessment;
    } catch (error) {
      throw new Error(`Security assessment failed: ${error}`);
    }
  }

  // Real-time Monitoring
  private async startRealTimeMonitoring(): Promise<void> {
    try {
      // Monitor failed login attempts
      setInterval(async () => {
        await this.monitorFailedLogins();
      }, 60000); // Every minute

      // Monitor unusual data access patterns
      setInterval(async () => {
        await this.monitorDataAccessPatterns();
      }, 300000); // Every 5 minutes

      // Monitor privacy request processing
      setInterval(async () => {
        await this.monitorPrivacyRequests();
      }, 3600000); // Every hour

      console.log('Real-time monitoring started');
    } catch (error) {
      console.error('Real-time monitoring setup failed:', error);
    }
  }

  private async monitorFailedLogins(): Promise<void> {
    try {
      const recentFailures = await this.db.query(
        `SELECT COUNT(*) as count, ip_address
         FROM audit_events 
         WHERE event_type = 'login_failed' 
           AND timestamp > NOW() - INTERVAL '1 hour'
         GROUP BY ip_address
         HAVING COUNT(*) >= $1`,
        [this.config.alertThresholds.failedLogins]
      );

      for (const failure of recentFailures as any[]) {
        await this.createSecurityAlert(
          'excessive_failed_logins',
          'warning',
          `Excessive failed login attempts from IP: ${failure.ip_address}`,
          { ipAddress: failure.ip_address, attempts: failure.count }
        );
      }
    } catch (error) {
      console.error('Failed login monitoring error:', error);
    }
  }

  private async monitorDataAccessPatterns(): Promise<void> {
    try {
      const unusualAccess = await this.db.query(
        `SELECT user_id, COUNT(*) as access_count
         FROM audit_events 
         WHERE event_type = 'data_access' 
           AND timestamp > NOW() - INTERVAL '1 hour'
         GROUP BY user_id
         HAVING COUNT(*) >= $1`,
        [this.config.alertThresholds.dataAccess]
      );

      for (const access of unusualAccess as any[]) {
        await this.createSecurityAlert(
          'unusual_data_access',
          'warning',
          `Unusual data access pattern detected for user: ${access.user_id}`,
          { userId: access.user_id, accessCount: access.access_count }
        );
      }
    } catch (error) {
      console.error('Data access monitoring error:', error);
    }
  }

  private async monitorPrivacyRequests(): Promise<void> {
    try {
      const overdueRequests = await this.db.query(
        `SELECT COUNT(*) as count
         FROM privacy_requests 
         WHERE status = 'pending' 
           AND request_date < NOW() - INTERVAL '30 days'`
      );

      const count = (overdueRequests as any[])[0].count;
      
      if (count >= this.config.alertThresholds.privacyRequests) {
        await this.createSecurityAlert(
          'overdue_privacy_requests',
          'error',
          `${count} privacy requests are overdue for processing`,
          { overdueCount: count }
        );
      }
    } catch (error) {
      console.error('Privacy request monitoring error:', error);
    }
  }

  // Helper Methods
  private async calculateComplianceMetrics(startDate: Date, endDate: Date): Promise<ComplianceMetrics> {
    try {
      const [
        totalUsers,
        activeUsers,
        dataProcessingActivities,
        consentMetrics,
        privacyRequests,
        securityIncidents
      ] = await Promise.all([
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
        dataBreaches: 0 // Would be calculated based on incident severity
      };
    } catch (error) {
      throw new Error(`Compliance metrics calculation failed: ${error}`);
    }
  }

  private async detectComplianceViolations(startDate: Date, endDate: Date): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    try {
      // Check for consent violations
      const consentViolations = await this.db.query(
        `SELECT COUNT(*) as count
         FROM user_profiles up
         LEFT JOIN user_consent uc ON up.id = uc.user_id AND uc.consent_type = 'data_processing'
         WHERE up.created_at BETWEEN $1 AND $2
           AND (uc.consent_given IS NULL OR uc.consent_given = FALSE)`,
        [startDate, endDate]
      );

      if ((consentViolations as any[])[0].count > 0) {
        violations.push({
          id: this.security.generateSecureId(),
          type: 'missing_consent',
          severity: 'high',
          description: `${(consentViolations as any[])[0].count} users without proper data processing consent`,
          affectedUsers: (consentViolations as any[])[0].count,
          detectedAt: new Date(),
          remediation: ['Obtain explicit consent', 'Review consent collection process']
        });
      }

      // Check for data retention violations
      const retentionViolations = await this.db.query(
        `SELECT COUNT(*) as count
         FROM assessment_sessions 
         WHERE created_at < NOW() - INTERVAL '${this.config.auditRetentionDays} days'
           AND user_id IS NOT NULL`
      );

      if ((retentionViolations as any[])[0].count > 0) {
        violations.push({
          id: this.security.generateSecureId(),
          type: 'data_retention_violation',
          severity: 'medium',
          description: `${(retentionViolations as any[])[0].count} records exceed retention period`,
          affectedUsers: (retentionViolations as any[])[0].count,
          detectedAt: new Date(),
          remediation: ['Execute data retention policy', 'Anonymize expired records']
        });
      }

      return violations;
    } catch (error) {
      throw new Error(`Compliance violation detection failed: ${error}`);
    }
  }

  private async generateRecommendations(metrics: ComplianceMetrics, violations: ComplianceViolation[]): Promise<string[]> {
    const recommendations: string[] = [];

    // Consent rate recommendations
    if (metrics.consentRate < 0.95) {
      recommendations.push('Improve consent collection process to achieve >95% consent rate');
    }

    // Privacy request response time
    if (metrics.averageResponseTime > 30) {
      recommendations.push('Reduce privacy request response time to under 30 days');
    }

    // Security incident recommendations
    if (metrics.securityIncidents > 0) {
      recommendations.push('Review and strengthen security controls to prevent incidents');
    }

    // Violation-specific recommendations
    for (const violation of violations) {
      recommendations.push(...violation.remediation);
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private determineDataAccessRiskLevel(dataType: string, operation: string): 'low' | 'medium' | 'high' | 'critical' {
    const sensitiveDataTypes = ['user_profiles', 'assessment_responses', 'personal_data'];
    const riskOperations = ['export', 'bulk_access', 'admin_access'];

    if (sensitiveDataTypes.includes(dataType) && riskOperations.includes(operation)) {
      return 'high';
    } else if (sensitiveDataTypes.includes(dataType) || riskOperations.includes(operation)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private applyAnonymizationRule(value: any, rule: AnonymizationRule): any {
    switch (rule.method) {
      case 'hash':
        return crypto.createHash('sha256').update(value.toString()).digest('hex').substring(0, 8);
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

  private async checkSecurityAlerts(event: AuditEvent): Promise<void> {
    // Check for suspicious patterns
    if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
      await this.createSecurityAlert(
        'high_risk_event',
        event.riskLevel === 'critical' ? 'critical' : 'error',
        `High-risk event detected: ${event.eventType}`,
        event.eventData
      );
    }
  }

  private async sendCriticalAlertNotification(alert: SecurityAlert): Promise<void> {
    // Implementation would integrate with notification system
    console.log(`CRITICAL ALERT: ${alert.message}`, alert.details);
  }

  private async performSecurityChecks(): Promise<any[]> {
    const checks = [];

    // Check for weak passwords
    const weakPasswords = await this.db.query(
      `SELECT COUNT(*) as count FROM user_auth 
       WHERE password_changed_at < NOW() - INTERVAL '90 days'`
    );
    checks.push({
      check: 'password_age',
      status: (weakPasswords as any[])[0].count === 0 ? 'pass' : 'fail',
      details: `${(weakPasswords as any[])[0].count} users with passwords older than 90 days`
    });

    // Check for inactive sessions
    const inactiveSessions = await this.db.query(
      `SELECT COUNT(*) as count FROM user_sessions 
       WHERE last_activity < NOW() - INTERVAL '24 hours' 
         AND expires_at > NOW() AND invalidated_at IS NULL`
    );
    checks.push({
      check: 'inactive_sessions',
      status: (inactiveSessions as any[])[0].count === 0 ? 'pass' : 'warning',
      details: `${(inactiveSessions as any[])[0].count} inactive sessions found`
    });

    return checks;
  }

  private async identifyVulnerabilities(): Promise<any[]> {
    // This would integrate with vulnerability scanning tools
    return [];
  }

  private async generateSecurityRecommendations(): Promise<string[]> {
    return [
      'Regularly update dependencies',
      'Implement automated security scanning',
      'Review access controls quarterly',
      'Conduct penetration testing annually'
    ];
  }

  // Metric calculation helpers
  private async getTotalUsersCount(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.db.query(
      `SELECT COUNT(*) as count FROM user_profiles 
       WHERE created_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    );
    return (result as any[])[0].count;
  }

  private async getActiveUsersCount(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.db.query(
      `SELECT COUNT(DISTINCT user_id) as count FROM user_sessions 
       WHERE created_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    );
    return (result as any[])[0].count;
  }

  private async getDataProcessingActivitiesCount(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.db.query(
      `SELECT COUNT(*) as count FROM audit_events 
       WHERE event_type = 'data_access' AND timestamp BETWEEN $1 AND $2`,
      [startDate, endDate]
    );
    return (result as any[])[0].count;
  }

  private async getConsentMetrics(startDate: Date, endDate: Date): Promise<{ rate: number }> {
    const result = await this.db.query(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN consent_given THEN 1 ELSE 0 END) as given
       FROM user_consent 
       WHERE consent_date BETWEEN $1 AND $2`,
      [startDate, endDate]
    );
    
    const metrics = (result as any[])[0];
    return {
      rate: metrics.total > 0 ? metrics.given / metrics.total : 1
    };
  }

  private async getPrivacyRequestMetrics(startDate: Date, endDate: Date): Promise<{ processed: number; averageResponseTime: number }> {
    const result = await this.db.query(
      `SELECT 
         COUNT(*) as processed,
         AVG(EXTRACT(EPOCH FROM (completion_date - request_date))/86400) as avg_days
       FROM privacy_requests 
       WHERE request_date BETWEEN $1 AND $2 AND status = 'completed'`,
      [startDate, endDate]
    );
    
    const metrics = (result as any[])[0];
    return {
      processed: metrics.processed || 0,
      averageResponseTime: metrics.avg_days || 0
    };
  }

  private async getSecurityIncidentsCount(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.db.query(
      `SELECT COUNT(*) as count FROM security_alerts 
       WHERE severity IN ('error', 'critical') AND triggered_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    );
    return (result as any[])[0].count;
  }

  // Database table creation
  private async createAuditTables(): Promise<void> {
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
    } catch (error) {
      console.error('Failed to create audit tables:', error);
      throw error;
    }
  }

  // Get audit trail for specific user
  async getUserAuditTrail(userId: string, startDate?: Date, endDate?: Date): Promise<AuditEvent[]> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const end = endDate || new Date();

      const result = await this.db.query(
        `SELECT * FROM audit_events 
         WHERE user_id = $1 AND timestamp BETWEEN $2 AND $3
         ORDER BY timestamp DESC`,
        [userId, start, end]
      );

      return (result as any[]).map(row => ({
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
    } catch (error) {
      throw new Error(`Failed to get user audit trail: ${error}`);
    }
  }

  // Get system health status
  async getSystemHealthStatus(): Promise<any> {
    try {
      const [
        recentAlerts,
        activeViolations,
        systemMetrics
      ] = await Promise.all([
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
    } catch (error) {
      throw new Error(`Failed to get system health status: ${error}`);
    }
  }

  private async getRecentSecurityAlerts(): Promise<SecurityAlert[]> {
    const result = await this.db.query(
      `SELECT * FROM security_alerts 
       WHERE triggered_at > NOW() - INTERVAL '24 hours'
       ORDER BY triggered_at DESC
       LIMIT 10`
    );

    return (result as any[]).map(row => ({
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

  private async getActiveComplianceViolations(): Promise<ComplianceViolation[]> {
    // This would query for active violations from the latest compliance report
    return [];
  }

  private async getSystemMetrics(): Promise<any> {
    const result = await this.db.query(`
      SELECT 
        (SELECT COUNT(*) FROM audit_events WHERE timestamp > NOW() - INTERVAL '24 hours') as events_24h,
        (SELECT COUNT(*) FROM security_alerts WHERE triggered_at > NOW() - INTERVAL '24 hours') as alerts_24h,
        (SELECT COUNT(*) FROM user_sessions WHERE expires_at > NOW() AND invalidated_at IS NULL) as active_sessions,
        (SELECT COUNT(*) FROM privacy_requests WHERE status = 'pending') as pending_privacy_requests
    `);

    return (result as any[])[0];
  }

  private calculateOverallHealthStatus(alerts: SecurityAlert[], violations: ComplianceViolation[]): string {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const highViolations = violations.filter(v => v.severity === 'high' || v.severity === 'critical').length;

    if (criticalAlerts > 0 || highViolations > 0) {
      return 'critical';
    } else if (alerts.length > 5 || violations.length > 0) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }
}