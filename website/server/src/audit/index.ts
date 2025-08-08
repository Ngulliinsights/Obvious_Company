import { Pool } from 'pg';
import { AuditLogger } from './AuditLogger';
import { ComplianceMonitor } from './ComplianceMonitor';
import { DataAnonymizer } from './DataAnonymizer';
import { SecurityTester } from './SecurityTester';
import { EncryptionService } from '../security/EncryptionService';

export interface AuditSystemConfig {
  retentionPeriodDays?: number;
  monitoringIntervalMinutes?: number;
  enableAutomatedTesting?: boolean;
  anonymizationConfig?: {
    preserveStructure?: boolean;
    saltLength?: number;
    hashAlgorithm?: string;
    dateGranularity?: 'day' | 'week' | 'month' | 'year';
    numericRounding?: number;
  };
}

export class AuditSystem {
  private db: Pool;
  private auditLogger: AuditLogger;
  private complianceMonitor: ComplianceMonitor;
  private dataAnonymizer: DataAnonymizer;
  private securityTester: SecurityTester;
  private encryptionService: EncryptionService;
  private initialized: boolean = false;

  constructor(db: Pool, encryptionService?: EncryptionService, config?: AuditSystemConfig) {
    this.db = db;
    this.encryptionService = encryptionService || EncryptionService.getInstance();
    
    // Initialize components
    this.auditLogger = new AuditLogger(
      db, 
      this.encryptionService, 
      config?.retentionPeriodDays || 2555
    );
    
    this.complianceMonitor = new ComplianceMonitor(db, this.auditLogger);
    this.dataAnonymizer = new DataAnonymizer(db, config?.anonymizationConfig);
    this.securityTester = new SecurityTester(db, this.auditLogger);
  }

  /**
   * Initialize the audit system
   */
  async initialize(): Promise<void> {
    try {
      // Create database tables if they don't exist
      await this.createTables();
      
      // Start monitoring services
      this.complianceMonitor.startMonitoring(15); // 15 minutes
      this.securityTester.startAutomatedTesting();
      
      // Schedule cleanup tasks
      this.scheduleCleanupTasks();
      
      this.initialized = true;
      console.log('✅ Audit and compliance system initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize audit system:', error);
      throw error;
    }
  }

  /**
   * Shutdown the audit system
   */
  async shutdown(): Promise<void> {
    try {
      this.complianceMonitor.stopMonitoring();
      this.securityTester.stopAutomatedTesting();
      
      console.log('✅ Audit and compliance system shutdown complete');
    } catch (error) {
      console.error('❌ Error during audit system shutdown:', error);
    }
  }

  /**
   * Get audit logger instance
   */
  getAuditLogger(): AuditLogger {
    return this.auditLogger;
  }

  /**
   * Get compliance monitor instance
   */
  getComplianceMonitor(): ComplianceMonitor {
    return this.complianceMonitor;
  }

  /**
   * Get data anonymizer instance
   */
  getDataAnonymizer(): DataAnonymizer {
    return this.dataAnonymizer;
  }

  /**
   * Get security tester instance
   */
  getSecurityTester(): SecurityTester {
    return this.securityTester;
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      const [
        auditReport,
        complianceMetrics,
        securityTestResults,
        anonymizedAnalytics
      ] = await Promise.all([
        this.auditLogger.generateComplianceReport(startDate, endDate),
        this.complianceMonitor.getComplianceMetrics(30),
        this.getSecurityTestSummary(startDate, endDate),
        this.dataAnonymizer.anonymizeForAnalytics(startDate, endDate)
      ]);

      const report = {
        reportPeriod: { startDate, endDate },
        generatedAt: new Date(),
        summary: {
          overallComplianceScore: this.calculateOverallComplianceScore(
            auditReport,
            complianceMetrics,
            securityTestResults
          ),
          riskLevel: this.determineOverallRiskLevel(complianceMetrics, securityTestResults),
          totalAuditEvents: auditReport.summary.totalEvents,
          complianceViolations: complianceMetrics.violations,
          securityVulnerabilities: securityTestResults.totalVulnerabilities,
          dataProcessingCompliance: this.assessDataProcessingCompliance(auditReport)
        },
        auditSummary: auditReport,
        complianceMetrics,
        securitySummary: securityTestResults,
        dataPrivacy: {
          anonymizationStatus: 'active',
          dataRetentionCompliance: await this.checkDataRetentionCompliance(),
          gdprCompliance: await this.assessGDPRCompliance(auditReport),
          encryptionStatus: await this.checkEncryptionStatus()
        },
        recommendations: await this.generateRecommendations(
          auditReport,
          complianceMetrics,
          securityTestResults
        )
      };

      // Log report generation
      await this.auditLogger.logEvent({
        eventType: 'compliance_report',
        resource: 'audit_system',
        action: 'report_generated',
        details: {
          reportPeriod: { startDate, endDate },
          overallScore: report.summary.overallComplianceScore,
          riskLevel: report.summary.riskLevel
        },
        severity: 'low',
        complianceFlags: ['compliance_report']
      });

      return report;
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw new Error('Compliance report generation failed');
    }
  }

  /**
   * Create database tables for audit system
   */
  private async createTables(): Promise<void> {
    const tables = [
      // Audit logs table
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(255) PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        user_id VARCHAR(255),
        session_id VARCHAR(255),
        resource VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        severity VARCHAR(20) NOT NULL,
        compliance_flags JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Compliance violations table
      `CREATE TABLE IF NOT EXISTS compliance_violations (
        id VARCHAR(255) PRIMARY KEY,
        rule_id VARCHAR(255) NOT NULL,
        rule_name VARCHAR(255) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        description TEXT NOT NULL,
        event_ids JSONB,
        detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
        resolved BOOLEAN DEFAULT FALSE,
        resolved_at TIMESTAMP WITH TIME ZONE,
        resolved_by VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Security test results table
      `CREATE TABLE IF NOT EXISTS security_test_results (
        id SERIAL PRIMARY KEY,
        test_id VARCHAR(255) NOT NULL,
        test_name VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL,
        vulnerabilities_count INTEGER DEFAULT 0,
        execution_time INTEGER,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Security vulnerabilities table
      `CREATE TABLE IF NOT EXISTS security_vulnerabilities (
        id VARCHAR(255) PRIMARY KEY,
        test_id VARCHAR(255) NOT NULL,
        test_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        description TEXT NOT NULL,
        evidence JSONB,
        detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
        resolved BOOLEAN DEFAULT FALSE,
        resolved_at TIMESTAMP WITH TIME ZONE,
        resolved_by VARCHAR(255),
        mitigation TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Anonymization log table
      `CREATE TABLE IF NOT EXISTS anonymization_log (
        id VARCHAR(255) PRIMARY KEY,
        activity VARCHAR(255) NOT NULL,
        details JSONB,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    ];

    for (const tableSQL of tables) {
      try {
        await this.db.query(tableSQL);
      } catch (error) {
        console.error('Failed to create table:', error);
        throw error;
      }
    }

    // Create indexes for performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity)',
      'CREATE INDEX IF NOT EXISTS idx_compliance_violations_detected_at ON compliance_violations(detected_at)',
      'CREATE INDEX IF NOT EXISTS idx_compliance_violations_resolved ON compliance_violations(resolved)',
      'CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_detected_at ON security_vulnerabilities(detected_at)',
      'CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_severity ON security_vulnerabilities(severity)'
    ];

    for (const indexSQL of indexes) {
      try {
        await this.db.query(indexSQL);
      } catch (error) {
        console.warn('Failed to create index:', error);
        // Continue - indexes are for performance, not critical
      }
    }
  }

  /**
   * Schedule cleanup tasks
   */
  private scheduleCleanupTasks(): void {
    // Run cleanup daily at 2 AM
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0);
    const msUntilCleanup = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.runCleanupTasks();
      setInterval(() => this.runCleanupTasks(), 24 * 60 * 60 * 1000); // Daily
    }, msUntilCleanup);
  }

  /**
   * Run cleanup tasks
   */
  private async runCleanupTasks(): Promise<void> {
    try {
      console.log('Running audit system cleanup tasks...');
      
      // Clean up old audit logs
      const deletedLogs = await this.auditLogger.cleanupOldLogs();
      
      // Clean up old test results (keep 90 days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      
      const testResultsDeleted = await this.db.query(
        'DELETE FROM security_test_results WHERE timestamp < $1',
        [cutoffDate]
      );
      
      console.log(`Cleanup complete: ${deletedLogs} audit logs, ${testResultsDeleted.rowCount} test results deleted`);
    } catch (error) {
      console.error('Cleanup task failed:', error);
    }
  }

  /**
   * Get security test summary
   */
  private async getSecurityTestSummary(startDate: Date, endDate: Date): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_tests,
          COUNT(CASE WHEN status = 'passed' THEN 1 END) as passed_tests,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tests,
          SUM(vulnerabilities_count) as total_vulnerabilities
        FROM security_test_results 
        WHERE timestamp BETWEEN $1 AND $2
      `;
      
      const result = await this.db.query(query, [startDate, endDate]);
      return result.rows[0] || {
        total_tests: 0,
        passed_tests: 0,
        failed_tests: 0,
        total_vulnerabilities: 0
      };
    } catch (error) {
      console.error('Failed to get security test summary:', error);
      return {
        total_tests: 0,
        passed_tests: 0,
        failed_tests: 0,
        total_vulnerabilities: 0
      };
    }
  }

  /**
   * Calculate overall compliance score
   */
  private calculateOverallComplianceScore(auditReport: any, complianceMetrics: any, securityResults: any): number {
    const auditScore = Math.max(0, 100 - (auditReport.summary.complianceViolations * 10));
    const complianceScore = complianceMetrics.complianceScore || 0;
    const securityScore = securityResults.total_tests > 0 
      ? (securityResults.passed_tests / securityResults.total_tests) * 100 
      : 100;
    
    return Math.round((auditScore + complianceScore + securityScore) / 3);
  }

  /**
   * Determine overall risk level
   */
  private determineOverallRiskLevel(complianceMetrics: any, securityResults: any): string {
    if (complianceMetrics.riskLevel === 'critical' || securityResults.total_vulnerabilities > 10) {
      return 'critical';
    }
    if (complianceMetrics.riskLevel === 'high' || securityResults.total_vulnerabilities > 5) {
      return 'high';
    }
    if (complianceMetrics.riskLevel === 'medium' || securityResults.total_vulnerabilities > 0) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Assess data processing compliance
   */
  private assessDataProcessingCompliance(auditReport: any): string {
    const violations = auditReport.summary.complianceViolations || 0;
    if (violations === 0) return 'compliant';
    if (violations < 5) return 'minor_issues';
    return 'non_compliant';
  }

  /**
   * Check data retention compliance
   */
  private async checkDataRetentionCompliance(): Promise<string> {
    try {
      const retentionPeriodDays = 2555; // 7 years
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionPeriodDays);

      const result = await this.db.query(
        'SELECT COUNT(*) as count FROM audit_logs WHERE timestamp < $1',
        [cutoffDate]
      );

      const oldRecords = parseInt(result.rows[0].count);
      return oldRecords === 0 ? 'compliant' : 'violation_detected';
    } catch (error) {
      console.error('Failed to check data retention compliance:', error);
      return 'unknown';
    }
  }

  /**
   * Assess GDPR compliance
   */
  private async assessGDPRCompliance(auditReport: any): Promise<string> {
    const gdprViolations = auditReport.eventBreakdown.filter((event: any) =>
      event.compliance_flags.includes('gdpr_relevant') && 
      event.compliance_flags.includes('violation')
    ).length;

    if (gdprViolations === 0) return 'compliant';
    if (gdprViolations < 3) return 'minor_issues';
    return 'non_compliant';
  }

  /**
   * Check encryption status
   */
  private async checkEncryptionStatus(): Promise<string> {
    // This would check if encryption is properly implemented
    // For now, assume it's working if the encryption service is available
    return this.encryptionService ? 'active' : 'inactive';
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(auditReport: any, complianceMetrics: any, securityResults: any): Promise<string[]> {
    const recommendations: string[] = [];

    if (complianceMetrics.violations > 0) {
      recommendations.push('Review and resolve compliance violations');
    }

    if (securityResults.total_vulnerabilities > 0) {
      recommendations.push('Address security vulnerabilities identified in testing');
    }

    if (auditReport.summary.complianceViolations > 10) {
      recommendations.push('Implement additional compliance monitoring controls');
    }

    if (complianceMetrics.complianceScore < 80) {
      recommendations.push('Enhance compliance training and awareness programs');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current compliance and security practices');
    }

    return recommendations;
  }
}

// Export all components
export {
  AuditLogger,
  ComplianceMonitor,
  DataAnonymizer,
  SecurityTester
};

// Export types
export * from './AuditLogger';
export * from './ComplianceMonitor';
export * from './DataAnonymizer';
export * from './SecurityTester';