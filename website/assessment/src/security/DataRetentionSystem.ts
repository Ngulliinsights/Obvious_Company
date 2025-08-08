import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { DataSecurityFramework } from './DataSecurityFramework';
import cron from 'node-cron';

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
  scheduleExpression: string; // Cron expression
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

export class DataRetentionSystem {
  private config: RetentionConfig;
  private db: Pool;
  private redis: RedisClientType;
  private security: DataSecurityFramework;
  private cronJobs: Map<string, any> = new Map();

  constructor(config: RetentionConfig, db: Pool, redis: RedisClientType, security: DataSecurityFramework) {
    this.config = config;
    this.db = db;
    this.redis = redis;
    this.security = security;
  }

  // Initialize automated retention enforcement
  async initialize(): Promise<void> {
    try {
      if (this.config.automatedEnforcement) {
        await this.scheduleRetentionJobs();
      }

      // Create retention policies table if not exists
      await this.createRetentionTables();

      // Load policies into database
      await this.loadRetentionPolicies();

      console.log('Data retention system initialized successfully');
    } catch (error) {
      console.error('Data retention system initialization failed:', error);
      throw error;
    }
  }

  // Schedule automated retention jobs
  private async scheduleRetentionJobs(): Promise<void> {
    try {
      // Main retention job
      const mainJob = cron.schedule(this.config.scheduleExpression, async () => {
        await this.executeRetentionPolicies();
      }, {
        scheduled: false,
        timezone: 'UTC'
      });

      this.cronJobs.set('main_retention', mainJob);

      // Daily cleanup job for expired sessions
      const cleanupJob = cron.schedule('0 2 * * *', async () => {
        await this.cleanupExpiredSessions();
      }, {
        scheduled: false,
        timezone: 'UTC'
      });

      this.cronJobs.set('session_cleanup', cleanupJob);

      // Weekly audit job
      const auditJob = cron.schedule('0 3 * * 0', async () => {
        await this.generateRetentionAuditReport();
      }, {
        scheduled: false,
        timezone: 'UTC'
      });

      this.cronJobs.set('audit_report', auditJob);

      // Start all jobs
      this.cronJobs.forEach(job => job.start());

      console.log('Retention jobs scheduled successfully');
    } catch (error) {
      console.error('Failed to schedule retention jobs:', error);
      throw error;
    }
  }

  // Execute all retention policies
  async executeRetentionPolicies(): Promise<RetentionJob[]> {
    const jobs: RetentionJob[] = [];

    try {
      await this.security.logSecurityEvent('retention_execution_started', undefined, {
        policiesCount: this.config.policies.length
      });

      for (const policy of this.config.policies) {
        const job = await this.executeRetentionPolicy(policy);
        jobs.push(job);
      }

      await this.security.logSecurityEvent('retention_execution_completed', undefined, {
        jobsCompleted: jobs.length,
        totalRecordsProcessed: jobs.reduce((sum, job) => sum + job.recordsProcessed, 0),
        totalRecordsDeleted: jobs.reduce((sum, job) => sum + job.recordsDeleted, 0),
        totalRecordsAnonymized: jobs.reduce((sum, job) => sum + job.recordsAnonymized, 0)
      });

      return jobs;
    } catch (error) {
      console.error('Retention policy execution failed:', error);
      await this.security.logSecurityEvent('retention_execution_failed', undefined, {
        error: error.toString()
      });
      throw error;
    }
  }

  // Execute a specific retention policy
  async executeRetentionPolicy(policy: RetentionPolicy): Promise<RetentionJob> {
    const jobId = this.security.generateSecureId();
    const job: RetentionJob = {
      id: jobId,
      policyId: policy.dataType,
      status: 'pending',
      startTime: new Date(),
      recordsProcessed: 0,
      recordsDeleted: 0,
      recordsAnonymized: 0,
      errors: []
    };

    try {
      job.status = 'running';
      
      // Store job status
      await this.redis.setEx(`retention_job:${jobId}`, 3600, JSON.stringify(job));

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

      // Execute policy based on data type
      switch (policy.dataType) {
        case 'assessment_sessions':
          await this.processAssessmentSessions(policy, cutoffDate, job);
          break;
        case 'user_analytics':
          await this.processUserAnalytics(policy, cutoffDate, job);
          break;
        case 'audit_logs':
          await this.processAuditLogs(policy, cutoffDate, job);
          break;
        case 'user_sessions':
          await this.processUserSessions(policy, cutoffDate, job);
          break;
        default:
          job.errors.push(`Unknown data type: ${policy.dataType}`);
      }

      job.status = 'completed';
      job.endTime = new Date();

      // Update job status
      await this.redis.setEx(`retention_job:${jobId}`, 86400, JSON.stringify(job));

      // Log job completion
      await this.db.query(
        `INSERT INTO retention_job_log (
          job_id, policy_id, status, start_time, end_time,
          records_processed, records_deleted, records_anonymized, errors
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          jobId, policy.dataType, job.status, job.startTime, job.endTime,
          job.recordsProcessed, job.recordsDeleted, job.recordsAnonymized,
          JSON.stringify(job.errors)
        ]
      );

      return job;

    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      job.errors.push(error.toString());

      await this.redis.setEx(`retention_job:${jobId}`, 86400, JSON.stringify(job));

      console.error(`Retention policy execution failed for ${policy.dataType}:`, error);
      return job;
    }
  }

  // Process assessment sessions retention
  private async processAssessmentSessions(policy: RetentionPolicy, cutoffDate: Date, job: RetentionJob): Promise<void> {
    try {
      // Find expired sessions
      const expiredSessions = await this.db.query(
        `SELECT id, user_id FROM assessment_sessions 
         WHERE created_at < $1 AND status = 'completed'
         LIMIT $2`,
        [cutoffDate, this.config.batchSize]
      );

      job.recordsProcessed = (expiredSessions as any[]).length;

      for (const session of expiredSessions as any[]) {
        try {
          if (policy.deletionMethod === 'anonymize') {
            await this.anonymizeAssessmentSession(session.id);
            job.recordsAnonymized++;
          } else if (policy.deletionMethod === 'hard_delete') {
            await this.deleteAssessmentSession(session.id);
            job.recordsDeleted++;
          } else if (policy.deletionMethod === 'soft_delete') {
            await this.softDeleteAssessmentSession(session.id);
            job.recordsDeleted++;
          }
        } catch (error) {
          job.errors.push(`Failed to process session ${session.id}: ${error}`);
        }
      }
    } catch (error) {
      throw new Error(`Assessment sessions processing failed: ${error}`);
    }
  }

  // Process user analytics retention
  private async processUserAnalytics(policy: RetentionPolicy, cutoffDate: Date, job: RetentionJob): Promise<void> {
    try {
      const expiredAnalytics = await this.db.query(
        `SELECT id FROM user_analytics 
         WHERE created_at < $1
         LIMIT $2`,
        [cutoffDate, this.config.batchSize]
      );

      job.recordsProcessed = (expiredAnalytics as any[]).length;

      if (policy.deletionMethod === 'anonymize') {
        await this.db.query(
          `UPDATE user_analytics 
           SET user_id = NULL, ip_address = NULL, user_agent = NULL
           WHERE id = ANY($1)`,
          [(expiredAnalytics as any[]).map(row => row.id)]
        );
        job.recordsAnonymized = job.recordsProcessed;
      } else {
        await this.db.query(
          `DELETE FROM user_analytics WHERE id = ANY($1)`,
          [(expiredAnalytics as any[]).map(row => row.id)]
        );
        job.recordsDeleted = job.recordsProcessed;
      }
    } catch (error) {
      throw new Error(`User analytics processing failed: ${error}`);
    }
  }

  // Process audit logs retention
  private async processAuditLogs(policy: RetentionPolicy, cutoffDate: Date, job: RetentionJob): Promise<void> {
    try {
      const expiredLogs = await this.db.query(
        `SELECT id FROM security_audit_log 
         WHERE created_at < $1
         LIMIT $2`,
        [cutoffDate, this.config.batchSize]
      );

      job.recordsProcessed = (expiredLogs as any[]).length;

      // Audit logs are typically hard deleted after retention period
      await this.db.query(
        `DELETE FROM security_audit_log WHERE id = ANY($1)`,
        [(expiredLogs as any[]).map(row => row.id)]
      );

      job.recordsDeleted = job.recordsProcessed;
    } catch (error) {
      throw new Error(`Audit logs processing failed: ${error}`);
    }
  }

  // Process user sessions retention
  private async processUserSessions(policy: RetentionPolicy, cutoffDate: Date, job: RetentionJob): Promise<void> {
    try {
      const expiredSessions = await this.db.query(
        `SELECT session_id FROM user_sessions 
         WHERE expires_at < $1 OR invalidated_at < $1
         LIMIT $2`,
        [cutoffDate, this.config.batchSize]
      );

      job.recordsProcessed = (expiredSessions as any[]).length;

      // Clean up expired sessions from Redis
      for (const session of expiredSessions as any[]) {
        await this.redis.del(`session:${session.session_id}`);
      }

      // Delete from database
      await this.db.query(
        `DELETE FROM user_sessions 
         WHERE session_id = ANY($1)`,
        [(expiredSessions as any[]).map(row => row.session_id)]
      );

      job.recordsDeleted = job.recordsProcessed;
    } catch (error) {
      throw new Error(`User sessions processing failed: ${error}`);
    }
  }

  // Anonymization methods
  private async anonymizeAssessmentSession(sessionId: string): Promise<void> {
    try {
      await this.db.query('BEGIN');

      // Anonymize responses
      await this.db.query(
        `UPDATE assessment_responses 
         SET response_value = jsonb_build_object(
           'anonymized', true,
           'response_type', response_value->>'type',
           'timestamp', response_value->>'timestamp'
         )
         WHERE session_id = $1`,
        [sessionId]
      );

      // Anonymize session
      await this.db.query(
        `UPDATE assessment_sessions 
         SET user_id = NULL, cultural_adaptations = NULL
         WHERE id = $1`,
        [sessionId]
      );

      // Anonymize results
      await this.db.query(
        `UPDATE assessment_results 
         SET regulatory_considerations = NULL, 
             implementation_priorities = NULL,
             next_steps = NULL,
             resource_requirements = NULL
         WHERE session_id = $1`,
        [sessionId]
      );

      await this.db.query('COMMIT');
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw new Error(`Session anonymization failed: ${error}`);
    }
  }

  private async deleteAssessmentSession(sessionId: string): Promise<void> {
    try {
      await this.db.query('BEGIN');

      // Delete in correct order due to foreign key constraints
      await this.db.query(
        `DELETE FROM curriculum_recommendations 
         WHERE result_id IN (
           SELECT id FROM assessment_results WHERE session_id = $1
         )`,
        [sessionId]
      );

      await this.db.query(
        `DELETE FROM assessment_results WHERE session_id = $1`,
        [sessionId]
      );

      await this.db.query(
        `DELETE FROM assessment_responses WHERE session_id = $1`,
        [sessionId]
      );

      await this.db.query(
        `DELETE FROM assessment_sessions WHERE id = $1`,
        [sessionId]
      );

      await this.db.query('COMMIT');
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw new Error(`Session deletion failed: ${error}`);
    }
  }

  private async softDeleteAssessmentSession(sessionId: string): Promise<void> {
    try {
      await this.db.query(
        `UPDATE assessment_sessions 
         SET status = 'deleted', updated_at = NOW()
         WHERE id = $1`,
        [sessionId]
      );
    } catch (error) {
      throw new Error(`Session soft deletion failed: ${error}`);
    }
  }

  // Cleanup expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    try {
      // Get expired sessions from database
      const expiredSessions = await this.db.query(
        `SELECT session_id FROM user_sessions 
         WHERE expires_at < NOW() AND invalidated_at IS NULL`
      );

      // Clean up from Redis
      for (const session of expiredSessions as any[]) {
        await this.redis.del(`session:${session.session_id}`);
      }

      // Mark as invalidated in database
      await this.db.query(
        `UPDATE user_sessions 
         SET invalidated_at = NOW() 
         WHERE expires_at < NOW() AND invalidated_at IS NULL`
      );

      await this.security.logSecurityEvent('expired_sessions_cleaned', undefined, {
        sessionsCleanedUp: (expiredSessions as any[]).length
      });
    } catch (error) {
      console.error('Session cleanup failed:', error);
    }
  }

  // Generate retention audit report
  async generateRetentionAuditReport(): Promise<any> {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        retentionPolicies: this.config.policies.length,
        recentJobs: await this.getRecentRetentionJobs(),
        dataVolumes: await this.getDataVolumes(),
        complianceStatus: await this.getComplianceStatus()
      };

      // Store report
      await this.db.query(
        `INSERT INTO retention_audit_reports (report_data, created_at)
         VALUES ($1, NOW())`,
        [JSON.stringify(report)]
      );

      return report;
    } catch (error) {
      console.error('Retention audit report generation failed:', error);
      throw error;
    }
  }

  private async getRecentRetentionJobs(): Promise<any[]> {
    const result = await this.db.query(
      `SELECT * FROM retention_job_log 
       WHERE start_time > NOW() - INTERVAL '7 days'
       ORDER BY start_time DESC`
    );

    return result as any[];
  }

  private async getDataVolumes(): Promise<any> {
    const volumes = await this.db.query(`
      SELECT 
        'assessment_sessions' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_records
      FROM assessment_sessions
      UNION ALL
      SELECT 
        'user_analytics' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_records
      FROM user_analytics
      UNION ALL
      SELECT 
        'security_audit_log' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_records
      FROM security_audit_log
    `);

    return volumes;
  }

  private async getComplianceStatus(): Promise<any> {
    return {
      automatedEnforcement: this.config.automatedEnforcement,
      activePolicies: this.config.policies.length,
      lastExecutionTime: await this.getLastExecutionTime(),
      nextScheduledExecution: this.getNextScheduledExecution()
    };
  }

  private async getLastExecutionTime(): Promise<string | null> {
    const result = await this.db.query(
      `SELECT MAX(start_time) as last_execution 
       FROM retention_job_log`
    );

    return (result as any[])[0]?.last_execution?.toISOString() || null;
  }

  private getNextScheduledExecution(): string {
    // This would calculate based on cron expression
    // For simplicity, returning a placeholder
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }

  // Create necessary database tables
  private async createRetentionTables(): Promise<void> {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS retention_policies (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          data_type VARCHAR(100) NOT NULL,
          retention_period_days INTEGER NOT NULL,
          anonymization_delay INTEGER DEFAULT 0,
          deletion_method VARCHAR(20) NOT NULL CHECK (deletion_method IN ('hard_delete', 'soft_delete', 'anonymize')),
          legal_basis TEXT,
          exceptions TEXT[],
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS retention_job_log (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          job_id VARCHAR(100) NOT NULL,
          policy_id VARCHAR(100) NOT NULL,
          status VARCHAR(20) NOT NULL,
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          end_time TIMESTAMP WITH TIME ZONE,
          records_processed INTEGER DEFAULT 0,
          records_deleted INTEGER DEFAULT 0,
          records_anonymized INTEGER DEFAULT 0,
          errors JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS retention_audit_reports (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          report_data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_retention_job_log_start_time ON retention_job_log(start_time);
        CREATE INDEX IF NOT EXISTS idx_retention_audit_reports_created_at ON retention_audit_reports(created_at);
      `);
    } catch (error) {
      console.error('Failed to create retention tables:', error);
      throw error;
    }
  }

  // Load retention policies into database
  private async loadRetentionPolicies(): Promise<void> {
    try {
      for (const policy of this.config.policies) {
        await this.db.query(
          `INSERT INTO retention_policies (
            data_type, retention_period_days, anonymization_delay,
            deletion_method, legal_basis, exceptions
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (data_type) DO UPDATE SET
            retention_period_days = $2,
            anonymization_delay = $3,
            deletion_method = $4,
            legal_basis = $5,
            exceptions = $6,
            updated_at = NOW()`,
          [
            policy.dataType,
            policy.retentionPeriodDays,
            policy.anonymizationDelay,
            policy.deletionMethod,
            policy.legalBasis,
            policy.exceptions
          ]
        );
      }
    } catch (error) {
      console.error('Failed to load retention policies:', error);
      throw error;
    }
  }

  // Manual retention execution
  async executeManualRetention(dataType: string): Promise<RetentionJob> {
    const policy = this.config.policies.find(p => p.dataType === dataType);
    if (!policy) {
      throw new Error(`No retention policy found for data type: ${dataType}`);
    }

    return await this.executeRetentionPolicy(policy);
  }

  // Get retention status
  async getRetentionStatus(): Promise<any> {
    try {
      const recentJobs = await this.getRecentRetentionJobs();
      const dataVolumes = await this.getDataVolumes();
      
      return {
        policies: this.config.policies,
        recentJobs: recentJobs.slice(0, 10), // Last 10 jobs
        dataVolumes,
        automatedEnforcement: this.config.automatedEnforcement,
        nextScheduledExecution: this.getNextScheduledExecution()
      };
    } catch (error) {
      throw new Error(`Failed to get retention status: ${error}`);
    }
  }

  // Shutdown
  async shutdown(): Promise<void> {
    try {
      // Stop all cron jobs
      this.cronJobs.forEach(job => job.stop());
      this.cronJobs.clear();
      
      console.log('Data retention system shutdown completed');
    } catch (error) {
      console.error('Data retention system shutdown failed:', error);
    }
  }
}