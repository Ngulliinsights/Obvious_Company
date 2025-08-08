import { Pool } from 'pg';
import { AuditLogger, AuditEvent } from './AuditLogger';

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  regulation: 'GDPR' | 'CCPA' | 'PIPEDA' | 'INTERNAL';
  severity: 'low' | 'medium' | 'high' | 'critical';
  conditions: {
    eventType?: string[];
    action?: string[];
    resource?: string[];
    timeWindow?: number; // minutes
    threshold?: number;
  };
  enabled: boolean;
}

export interface ComplianceViolation {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: string;
  description: string;
  eventIds: string[];
  detectedAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  notes?: string;
}

export interface ComplianceMetrics {
  totalEvents: number;
  violations: number;
  violationRate: number;
  complianceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastAssessment: Date;
}

export class ComplianceMonitor {
  private db: Pool;
  private auditLogger: AuditLogger;
  private rules: ComplianceRule[];
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(db: Pool, auditLogger: AuditLogger) {
    this.db = db;
    this.auditLogger = auditLogger;
    this.rules = this.getDefaultComplianceRules();
  }

  /**
   * Start continuous compliance monitoring
   */
  startMonitoring(intervalMinutes: number = 15): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkCompliance();
      } catch (error) {
        console.error('Compliance monitoring error:', error);
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`Compliance monitoring started with ${intervalMinutes} minute intervals`);
  }

  /**
   * Stop compliance monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Compliance monitoring stopped');
    }
  }

  /**
   * Check compliance against all active rules
   */
  async checkCompliance(): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    for (const rule of this.rules.filter(r => r.enabled)) {
      try {
        const ruleViolations = await this.checkRule(rule);
        violations.push(...ruleViolations);
      } catch (error) {
        console.error(`Error checking compliance rule ${rule.id}:`, error);
      }
    }

    // Store violations in database
    for (const violation of violations) {
      await this.storeViolation(violation);
    }

    if (violations.length > 0) {
      console.warn(`Detected ${violations.length} compliance violations`);
      await this.handleViolations(violations);
    }

    return violations;
  }

  /**
   * Check a specific compliance rule
   */
  private async checkRule(rule: ComplianceRule): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    const timeWindow = rule.conditions.timeWindow || 60; // Default 1 hour
    const startTime = new Date(Date.now() - timeWindow * 60 * 1000);

    // Query audit logs for events matching rule conditions
    const query = await this.auditLogger.queryLogs({
      eventType: rule.conditions.eventType?.[0],
      action: rule.conditions.action?.[0],
      resource: rule.conditions.resource?.[0],
      startDate: startTime,
      endDate: new Date()
    });

    // Apply rule-specific logic
    switch (rule.id) {
      case 'excessive_data_access':
        violations.push(...await this.checkExcessiveDataAccess(rule, query));
        break;
      case 'unauthorized_export':
        violations.push(...await this.checkUnauthorizedExport(rule, query));
        break;
      case 'gdpr_consent_violation':
        violations.push(...await this.checkGDPRConsent(rule, query));
        break;
      case 'data_retention_violation':
        violations.push(...await this.checkDataRetention(rule));
        break;
      case 'failed_authentication_threshold':
        violations.push(...await this.checkFailedAuthentication(rule, query));
        break;
      case 'sensitive_data_access_pattern':
        violations.push(...await this.checkSensitiveDataPattern(rule, query));
        break;
    }

    return violations;
  }

  /**
   * Check for excessive data access patterns
   */
  private async checkExcessiveDataAccess(rule: ComplianceRule, events: AuditEvent[]): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    const threshold = rule.conditions.threshold || 50;
    
    // Group by user and count data access events
    const userAccess = new Map<string, AuditEvent[]>();
    
    events.filter(e => e.eventType === 'data_access').forEach(event => {
      if (event.userId) {
        if (!userAccess.has(event.userId)) {
          userAccess.set(event.userId, []);
        }
        userAccess.get(event.userId)!.push(event);
      }
    });

    // Check for users exceeding threshold
    for (const [userId, userEvents] of userAccess) {
      if (userEvents.length > threshold) {
        violations.push({
          id: `excessive_access_${userId}_${Date.now()}`,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          description: `User ${userId} accessed data ${userEvents.length} times in ${rule.conditions.timeWindow} minutes (threshold: ${threshold})`,
          eventIds: userEvents.map(e => e.id!),
          detectedAt: new Date(),
          resolved: false
        });
      }
    }

    return violations;
  }

  /**
   * Check for unauthorized data export attempts
   */
  private async checkUnauthorizedExport(rule: ComplianceRule, events: AuditEvent[]): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    
    const exportEvents = events.filter(e => 
      e.action.includes('export') || 
      e.action.includes('download') ||
      e.details.dataExport === true
    );

    for (const event of exportEvents) {
      // Check if export was authorized (this would depend on your authorization logic)
      const isAuthorized = await this.checkExportAuthorization(event);
      
      if (!isAuthorized) {
        violations.push({
          id: `unauthorized_export_${event.id}_${Date.now()}`,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          description: `Unauthorized data export attempt by user ${event.userId} for resource ${event.resource}`,
          eventIds: [event.id!],
          detectedAt: new Date(),
          resolved: false
        });
      }
    }

    return violations;
  }

  /**
   * Check GDPR consent compliance
   */
  private async checkGDPRConsent(rule: ComplianceRule, events: AuditEvent[]): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    
    const dataProcessingEvents = events.filter(e => 
      e.complianceFlags?.includes('gdpr_relevant') &&
      (e.action.includes('process') || e.action.includes('store'))
    );

    for (const event of dataProcessingEvents) {
      // Check if valid consent exists
      const hasValidConsent = await this.checkUserGDPRConsent(event.userId || 'anonymous');
      
      if (!hasValidConsent) {
        violations.push({
          id: `gdpr_consent_${event.id}_${Date.now()}`,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          description: `GDPR data processing without valid consent for user ${event.userId}`,
          eventIds: [event.id!],
          detectedAt: new Date(),
          resolved: false
        });
      }
    }

    return violations;
  }

  /**
   * Check data retention policy compliance
   */
  private async checkDataRetention(rule: ComplianceRule): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    const retentionPeriodDays = 2555; // 7 years
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionPeriodDays);

    try {
      // Check for data older than retention period
      const oldDataQuery = `
        SELECT COUNT(*) as count, MIN(timestamp) as oldest
        FROM audit_logs 
        WHERE timestamp < $1
      `;
      
      const result = await this.db.query(oldDataQuery, [cutoffDate]);
      const oldDataCount = parseInt(result.rows[0].count);

      if (oldDataCount > 0) {
        violations.push({
          id: `data_retention_${Date.now()}`,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          description: `${oldDataCount} audit log entries exceed data retention period of ${retentionPeriodDays} days`,
          eventIds: [],
          detectedAt: new Date(),
          resolved: false
        });
      }
    } catch (error) {
      console.error('Error checking data retention:', error);
    }

    return violations;
  }

  /**
   * Check for failed authentication threshold violations
   */
  private async checkFailedAuthentication(rule: ComplianceRule, events: AuditEvent[]): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    const threshold = rule.conditions.threshold || 5;
    
    const failedAuthEvents = events.filter(e => 
      e.eventType === 'authentication' && 
      e.details.success === false
    );

    // Group by IP address
    const ipFailures = new Map<string, AuditEvent[]>();
    
    failedAuthEvents.forEach(event => {
      if (event.ipAddress) {
        if (!ipFailures.has(event.ipAddress)) {
          ipFailures.set(event.ipAddress, []);
        }
        ipFailures.get(event.ipAddress)!.push(event);
      }
    });

    // Check for IPs exceeding threshold
    for (const [ipAddress, failures] of ipFailures) {
      if (failures.length >= threshold) {
        violations.push({
          id: `failed_auth_${ipAddress}_${Date.now()}`,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          description: `${failures.length} failed authentication attempts from IP ${ipAddress} in ${rule.conditions.timeWindow} minutes`,
          eventIds: failures.map(e => e.id!),
          detectedAt: new Date(),
          resolved: false
        });
      }
    }

    return violations;
  }

  /**
   * Check for suspicious sensitive data access patterns
   */
  private async checkSensitiveDataPattern(rule: ComplianceRule, events: AuditEvent[]): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    
    const sensitiveEvents = events.filter(e => 
      e.complianceFlags?.includes('personal_identifier') ||
      e.complianceFlags?.includes('assessment_data')
    );

    // Look for unusual patterns (e.g., accessing many different users' data)
    const userDataAccess = new Map<string, Set<string>>();
    
    sensitiveEvents.forEach(event => {
      if (event.userId && event.details.targetUserId) {
        if (!userDataAccess.has(event.userId)) {
          userDataAccess.set(event.userId, new Set());
        }
        userDataAccess.get(event.userId)!.add(event.details.targetUserId);
      }
    });

    // Check for users accessing too many different user records
    const threshold = rule.conditions.threshold || 10;
    for (const [userId, accessedUsers] of userDataAccess) {
      if (accessedUsers.size > threshold) {
        violations.push({
          id: `sensitive_pattern_${userId}_${Date.now()}`,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          description: `User ${userId} accessed ${accessedUsers.size} different user records in ${rule.conditions.timeWindow} minutes`,
          eventIds: sensitiveEvents.filter(e => e.userId === userId).map(e => e.id!),
          detectedAt: new Date(),
          resolved: false
        });
      }
    }

    return violations;
  }

  /**
   * Store violation in database
   */
  private async storeViolation(violation: ComplianceViolation): Promise<void> {
    try {
      const query = `
        INSERT INTO compliance_violations (
          id, rule_id, rule_name, severity, description, event_ids, 
          detected_at, resolved, resolved_at, resolved_by, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `;

      const values = [
        violation.id,
        violation.ruleId,
        violation.ruleName,
        violation.severity,
        violation.description,
        JSON.stringify(violation.eventIds),
        violation.detectedAt,
        violation.resolved,
        violation.resolvedAt,
        violation.resolvedBy,
        violation.notes
      ];

      await this.db.query(query, values);
    } catch (error) {
      console.error('Failed to store compliance violation:', error);
    }
  }

  /**
   * Handle detected violations (alerts, notifications, etc.)
   */
  private async handleViolations(violations: ComplianceViolation[]): Promise<void> {
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    const highViolations = violations.filter(v => v.severity === 'high');

    if (criticalViolations.length > 0) {
      // Send immediate alerts for critical violations
      console.error(`CRITICAL COMPLIANCE VIOLATIONS DETECTED: ${criticalViolations.length}`);
      // Could integrate with alerting system (email, Slack, etc.)
    }

    if (highViolations.length > 0) {
      console.warn(`High severity compliance violations detected: ${highViolations.length}`);
    }

    // Log all violations for audit trail
    for (const violation of violations) {
      await this.auditLogger.logEvent({
        eventType: 'compliance_violation',
        resource: 'compliance_system',
        action: 'violation_detected',
        details: {
          violationId: violation.id,
          ruleId: violation.ruleId,
          severity: violation.severity,
          description: violation.description
        },
        severity: violation.severity as any,
        complianceFlags: ['compliance_violation']
      });
    }
  }

  /**
   * Get compliance metrics
   */
  async getComplianceMetrics(days: number = 30): Promise<ComplianceMetrics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      // Get total events
      const eventsQuery = await this.auditLogger.queryLogs({
        startDate,
        endDate: new Date()
      });

      // Get violations
      const violationsQuery = `
        SELECT COUNT(*) as count, severity
        FROM compliance_violations 
        WHERE detected_at >= $1 AND resolved = false
        GROUP BY severity
      `;
      
      const violationsResult = await this.db.query(violationsQuery, [startDate]);
      const totalViolations = violationsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);

      const violationRate = eventsQuery.length > 0 ? (totalViolations / eventsQuery.length) * 100 : 0;
      const complianceScore = Math.max(0, 100 - violationRate * 10); // Simple scoring algorithm

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (violationRate > 10) riskLevel = 'critical';
      else if (violationRate > 5) riskLevel = 'high';
      else if (violationRate > 1) riskLevel = 'medium';

      return {
        totalEvents: eventsQuery.length,
        violations: totalViolations,
        violationRate,
        complianceScore,
        riskLevel,
        lastAssessment: new Date()
      };
    } catch (error) {
      console.error('Failed to get compliance metrics:', error);
      throw new Error('Compliance metrics calculation failed');
    }
  }

  /**
   * Resolve a compliance violation
   */
  async resolveViolation(violationId: string, resolvedBy: string, notes?: string): Promise<void> {
    try {
      const query = `
        UPDATE compliance_violations 
        SET resolved = true, resolved_at = $1, resolved_by = $2, notes = $3
        WHERE id = $4
      `;

      await this.db.query(query, [new Date(), resolvedBy, notes, violationId]);

      // Log resolution
      await this.auditLogger.logEvent({
        eventType: 'compliance_violation',
        resource: 'compliance_system',
        action: 'violation_resolved',
        details: {
          violationId,
          resolvedBy,
          notes
        },
        severity: 'low',
        complianceFlags: ['violation_resolved']
      });
    } catch (error) {
      console.error('Failed to resolve compliance violation:', error);
      throw new Error('Violation resolution failed');
    }
  }

  /**
   * Helper methods
   */
  private async checkExportAuthorization(event: AuditEvent): Promise<boolean> {
    // Implement your authorization logic here
    // For now, assume exports are authorized if they have proper user context
    return event.userId !== undefined && event.details.authorized === true;
  }

  private async checkUserGDPRConsent(userId: string): Promise<boolean> {
    // Implement GDPR consent checking logic
    // For now, assume consent exists for non-anonymous users
    return userId !== 'anonymous';
  }

  /**
   * Default compliance rules
   */
  private getDefaultComplianceRules(): ComplianceRule[] {
    return [
      {
        id: 'excessive_data_access',
        name: 'Excessive Data Access',
        description: 'Detects users accessing data excessively within a time window',
        regulation: 'INTERNAL',
        severity: 'medium',
        conditions: {
          eventType: ['data_access'],
          timeWindow: 60,
          threshold: 50
        },
        enabled: true
      },
      {
        id: 'unauthorized_export',
        name: 'Unauthorized Data Export',
        description: 'Detects unauthorized data export attempts',
        regulation: 'GDPR',
        severity: 'high',
        conditions: {
          action: ['export', 'download'],
          timeWindow: 1440 // 24 hours
        },
        enabled: true
      },
      {
        id: 'gdpr_consent_violation',
        name: 'GDPR Consent Violation',
        description: 'Detects data processing without valid GDPR consent',
        regulation: 'GDPR',
        severity: 'critical',
        conditions: {
          eventType: ['data_access'],
          timeWindow: 60
        },
        enabled: true
      },
      {
        id: 'data_retention_violation',
        name: 'Data Retention Policy Violation',
        description: 'Detects data retained beyond policy limits',
        regulation: 'GDPR',
        severity: 'high',
        conditions: {
          timeWindow: 1440 // Check daily
        },
        enabled: true
      },
      {
        id: 'failed_authentication_threshold',
        name: 'Failed Authentication Threshold',
        description: 'Detects excessive failed authentication attempts',
        regulation: 'INTERNAL',
        severity: 'medium',
        conditions: {
          eventType: ['authentication'],
          timeWindow: 15,
          threshold: 5
        },
        enabled: true
      },
      {
        id: 'sensitive_data_access_pattern',
        name: 'Suspicious Sensitive Data Access',
        description: 'Detects unusual patterns in sensitive data access',
        regulation: 'INTERNAL',
        severity: 'high',
        conditions: {
          timeWindow: 60,
          threshold: 10
        },
        enabled: true
      }
    ];
  }
}