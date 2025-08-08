import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { EncryptionService } from '../security/EncryptionService';

export interface AuditEvent {
  id?: string;
  eventType: string;
  userId?: string;
  sessionId?: string;
  resource: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  complianceFlags?: string[];
}

export interface AuditQuery {
  eventType?: string;
  userId?: string;
  resource?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  severity?: string[];
  limit?: number;
  offset?: number;
}

export class AuditLogger {
  private db: Pool;
  private encryptionService: EncryptionService;
  private retentionPeriodDays: number;

  constructor(db: Pool, encryptionService?: EncryptionService, retentionPeriodDays: number = 2555) { // 7 years default
    this.db = db;
    this.encryptionService = encryptionService || EncryptionService.getInstance();
    this.retentionPeriodDays = retentionPeriodDays;
  }

  /**
   * Log an audit event
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string> {
    const auditEvent: AuditEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      ...event
    };

    try {
      // Encrypt sensitive details
      const encryptedDetails = await this.encryptSensitiveData(auditEvent.details);
      
      const query = `
        INSERT INTO audit_logs (
          id, event_type, user_id, session_id, resource, action, 
          details, ip_address, user_agent, timestamp, severity, compliance_flags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;

      const values = [
        auditEvent.id,
        auditEvent.eventType,
        auditEvent.userId,
        auditEvent.sessionId,
        auditEvent.resource,
        auditEvent.action,
        JSON.stringify(encryptedDetails),
        auditEvent.ipAddress,
        auditEvent.userAgent,
        auditEvent.timestamp,
        auditEvent.severity,
        auditEvent.complianceFlags ? JSON.stringify(auditEvent.complianceFlags) : null
      ];

      await this.db.query(query, values);
      
      // Check for compliance violations
      await this.checkComplianceViolations(auditEvent);
      
      return auditEvent.id!;
    } catch (error) {
      console.error('Failed to log audit event:', error);
      throw new Error('Audit logging failed');
    }
  }

  /**
   * Query audit logs with filtering
   */
  async queryLogs(query: AuditQuery): Promise<AuditEvent[]> {
    try {
      let sql = 'SELECT * FROM audit_logs WHERE 1=1';
      const values: any[] = [];
      let paramCount = 0;

      if (query.eventType) {
        sql += ` AND event_type = $${++paramCount}`;
        values.push(query.eventType);
      }

      if (query.userId) {
        sql += ` AND user_id = $${++paramCount}`;
        values.push(query.userId);
      }

      if (query.resource) {
        sql += ` AND resource = $${++paramCount}`;
        values.push(query.resource);
      }

      if (query.action) {
        sql += ` AND action = $${++paramCount}`;
        values.push(query.action);
      }

      if (query.startDate) {
        sql += ` AND timestamp >= $${++paramCount}`;
        values.push(query.startDate);
      }

      if (query.endDate) {
        sql += ` AND timestamp <= $${++paramCount}`;
        values.push(query.endDate);
      }

      if (query.severity && query.severity.length > 0) {
        sql += ` AND severity = ANY($${++paramCount})`;
        values.push(query.severity);
      }

      sql += ' ORDER BY timestamp DESC';

      if (query.limit) {
        sql += ` LIMIT $${++paramCount}`;
        values.push(query.limit);
      }

      if (query.offset) {
        sql += ` OFFSET $${++paramCount}`;
        values.push(query.offset);
      }

      const result = await this.db.query(sql, values);
      
      // Decrypt sensitive data for authorized access
      const decryptedLogs = await Promise.all(
        result.rows.map(async (row) => ({
          ...row,
          details: await this.decryptSensitiveData(JSON.parse(row.details)),
          complianceFlags: row.compliance_flags ? JSON.parse(row.compliance_flags) : []
        }))
      );

      return decryptedLogs;
    } catch (error) {
      console.error('Failed to query audit logs:', error);
      throw new Error('Audit query failed');
    }
  }

  /**
   * Log user data access
   */
  async logDataAccess(userId: string, resource: string, action: string, details: Record<string, any>, request: any): Promise<void> {
    await this.logEvent({
      eventType: 'data_access',
      userId,
      resource,
      action,
      details: {
        ...details,
        dataFields: this.extractDataFields(details),
        accessReason: details.accessReason || 'system_operation'
      },
      ipAddress: request.ip,
      userAgent: request.get('User-Agent'),
      severity: this.determineSeverity(action, resource),
      complianceFlags: this.determineComplianceFlags(action, resource, details)
    });
  }

  /**
   * Log authentication events
   */
  async logAuthentication(eventType: string, userId?: string, details: Record<string, any> = {}, request?: any): Promise<void> {
    await this.logEvent({
      eventType: 'authentication',
      userId,
      resource: 'auth_system',
      action: eventType,
      details: {
        ...details,
        loginMethod: details.loginMethod || 'unknown',
        success: details.success || false
      },
      ipAddress: request?.ip,
      userAgent: request?.get('User-Agent'),
      severity: details.success ? 'low' : 'medium',
      complianceFlags: details.success ? [] : ['failed_authentication']
    });
  }

  /**
   * Log assessment interactions
   */
  async logAssessmentInteraction(sessionId: string, userId: string, action: string, details: Record<string, any>, request: any): Promise<void> {
    await this.logEvent({
      eventType: 'assessment_interaction',
      userId,
      sessionId,
      resource: 'assessment_system',
      action,
      details: {
        ...details,
        assessmentType: details.assessmentType,
        questionId: details.questionId,
        responseData: details.responseData ? 'encrypted' : undefined
      },
      ipAddress: request.ip,
      userAgent: request.get('User-Agent'),
      severity: 'low',
      complianceFlags: this.determineAssessmentComplianceFlags(action, details)
    });
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      const query = `
        SELECT 
          event_type,
          action,
          severity,
          compliance_flags,
          COUNT(*) as event_count,
          COUNT(DISTINCT user_id) as unique_users,
          MIN(timestamp) as first_occurrence,
          MAX(timestamp) as last_occurrence
        FROM audit_logs 
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY event_type, action, severity, compliance_flags
        ORDER BY event_count DESC
      `;

      const result = await this.db.query(query, [startDate, endDate]);
      
      const report = {
        reportPeriod: { startDate, endDate },
        summary: {
          totalEvents: result.rows.reduce((sum, row) => sum + parseInt(row.event_count), 0),
          uniqueUsers: new Set(result.rows.map(row => row.unique_users)).size,
          complianceViolations: result.rows.filter(row => 
            row.compliance_flags && JSON.parse(row.compliance_flags).length > 0
          ).length
        },
        eventBreakdown: result.rows.map(row => ({
          ...row,
          compliance_flags: row.compliance_flags ? JSON.parse(row.compliance_flags) : []
        })),
        complianceStatus: await this.assessComplianceStatus(startDate, endDate)
      };

      return report;
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw new Error('Compliance report generation failed');
    }
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  async cleanupOldLogs(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionPeriodDays);

      const result = await this.db.query(
        'DELETE FROM audit_logs WHERE timestamp < $1',
        [cutoffDate]
      );

      console.log(`Cleaned up ${result.rowCount} old audit log entries`);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Failed to cleanup old audit logs:', error);
      throw new Error('Audit log cleanup failed');
    }
  }

  /**
   * Encrypt sensitive data in audit details
   */
  private async encryptSensitiveData(details: Record<string, any>): Promise<Record<string, any>> {
    const sensitiveFields = ['email', 'phone', 'personalData', 'assessmentResponses', 'userInput'];
    const encrypted = { ...details };

    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        const encryptedData = this.encryptionService.encrypt(JSON.stringify(encrypted[field]));
        encrypted[field] = JSON.stringify(encryptedData);
      }
    }

    return encrypted;
  }

  /**
   * Decrypt sensitive data from audit details
   */
  private async decryptSensitiveData(details: Record<string, any>): Promise<Record<string, any>> {
    const sensitiveFields = ['email', 'phone', 'personalData', 'assessmentResponses', 'userInput'];
    const decrypted = { ...details };

    for (const field of sensitiveFields) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          const encryptedData = JSON.parse(decrypted[field]);
          const decryptedValue = this.encryptionService.decrypt(encryptedData);
          decrypted[field] = JSON.parse(decryptedValue);
        } catch (error) {
          // Field might not be encrypted, leave as is
          console.warn(`Failed to decrypt field ${field}:`, error);
        }
      }
    }

    return decrypted;
  }

  /**
   * Extract data fields accessed for compliance tracking
   */
  private extractDataFields(details: Record<string, any>): string[] {
    const dataFields: string[] = [];
    
    if (details.email) dataFields.push('email');
    if (details.personalData) dataFields.push('personal_data');
    if (details.assessmentResponses) dataFields.push('assessment_responses');
    if (details.behavioralData) dataFields.push('behavioral_data');
    
    return dataFields;
  }

  /**
   * Determine event severity based on action and resource
   */
  private determineSeverity(action: string, resource: string): 'low' | 'medium' | 'high' | 'critical' {
    if (action.includes('delete') || action.includes('export')) return 'high';
    if (action.includes('update') || action.includes('modify')) return 'medium';
    if (resource.includes('personal') || resource.includes('sensitive')) return 'medium';
    return 'low';
  }

  /**
   * Determine compliance flags based on action and resource
   */
  private determineComplianceFlags(action: string, resource: string, details: Record<string, any>): string[] {
    const flags: string[] = [];
    
    if (details.personalData) flags.push('gdpr_relevant');
    if (details.email) flags.push('personal_identifier');
    if (action.includes('export')) flags.push('data_export');
    if (action.includes('delete')) flags.push('data_deletion');
    if (resource.includes('assessment')) flags.push('assessment_data');
    
    return flags;
  }

  /**
   * Determine assessment-specific compliance flags
   */
  private determineAssessmentComplianceFlags(action: string, details: Record<string, any>): string[] {
    const flags: string[] = ['assessment_data'];
    
    if (details.personalData) flags.push('gdpr_relevant');
    if (details.behavioralData) flags.push('behavioral_tracking');
    if (action === 'complete_assessment') flags.push('data_processing');
    
    return flags;
  }

  /**
   * Check for compliance violations
   */
  private async checkComplianceViolations(event: AuditEvent): Promise<void> {
    // Check for suspicious patterns
    if (event.severity === 'critical' || event.complianceFlags?.includes('failed_authentication')) {
      // Log security alert
      console.warn('Compliance violation detected:', {
        eventId: event.id,
        eventType: event.eventType,
        severity: event.severity,
        flags: event.complianceFlags
      });
      
      // Could trigger alerts to security team
    }
  }

  /**
   * Assess overall compliance status
   */
  private async assessComplianceStatus(startDate: Date, endDate: Date): Promise<any> {
    const violations = await this.db.query(`
      SELECT compliance_flags, COUNT(*) as count
      FROM audit_logs 
      WHERE timestamp BETWEEN $1 AND $2 
        AND compliance_flags IS NOT NULL 
        AND compliance_flags != '[]'
      GROUP BY compliance_flags
    `, [startDate, endDate]);

    return {
      status: violations.rows.length === 0 ? 'compliant' : 'violations_detected',
      violationTypes: violations.rows.map(row => ({
        flags: JSON.parse(row.compliance_flags),
        count: parseInt(row.count)
      }))
    };
  }
}