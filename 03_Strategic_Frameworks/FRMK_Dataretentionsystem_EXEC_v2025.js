---
title: "Dataretentionsystem"
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
exports.DataRetentionSystem = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
class DataRetentionSystem {
    constructor(config, db, redis, security) {
        this.cronJobs = new Map();
        this.config = config;
        this.db = db;
        this.redis = redis;
        this.security = security;
    }
    async initialize() {
        try {
            if (this.config.automatedEnforcement) {
                await this.scheduleRetentionJobs();
            }
            await this.createRetentionTables();
            await this.loadRetentionPolicies();
            console.log('Data retention system initialized successfully');
        }
        catch (error) {
            console.error('Data retention system initialization failed:', error);
            throw error;
        }
    }
    async scheduleRetentionJobs() {
        try {
            const mainJob = node_cron_1.default.schedule(this.config.scheduleExpression, async () => {
                await this.executeRetentionPolicies();
            }, {
                scheduled: false,
                timezone: 'UTC'
            });
            this.cronJobs.set('main_retention', mainJob);
            const cleanupJob = node_cron_1.default.schedule('0 2 * * *', async () => {
                await this.cleanupExpiredSessions();
            }, {
                scheduled: false,
                timezone: 'UTC'
            });
            this.cronJobs.set('session_cleanup', cleanupJob);
            const auditJob = node_cron_1.default.schedule('0 3 * * 0', async () => {
                await this.generateRetentionAuditReport();
            }, {
                scheduled: false,
                timezone: 'UTC'
            });
            this.cronJobs.set('audit_report', auditJob);
            this.cronJobs.forEach(job => job.start());
            console.log('Retention jobs scheduled successfully');
        }
        catch (error) {
            console.error('Failed to schedule retention jobs:', error);
            throw error;
        }
    }
    async executeRetentionPolicies() {
        const jobs = [];
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
        }
        catch (error) {
            console.error('Retention policy execution failed:', error);
            await this.security.logSecurityEvent('retention_execution_failed', undefined, {
                error: error.toString()
            });
            throw error;
        }
    }
    async executeRetentionPolicy(policy) {
        const jobId = this.security.generateSecureId();
        const job = {
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
            await this.redis.setEx(`retention_job:${jobId}`, 3600, JSON.stringify(job));
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);
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
            await this.redis.setEx(`retention_job:${jobId}`, 86400, JSON.stringify(job));
            await this.db.query(`INSERT INTO retention_job_log (
          job_id, policy_id, status, start_time, end_time,
          records_processed, records_deleted, records_anonymized, errors
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
                jobId, policy.dataType, job.status, job.startTime, job.endTime,
                job.recordsProcessed, job.recordsDeleted, job.recordsAnonymized,
                JSON.stringify(job.errors)
            ]);
            return job;
        }
        catch (error) {
            job.status = 'failed';
            job.endTime = new Date();
            job.errors.push(error.toString());
            await this.redis.setEx(`retention_job:${jobId}`, 86400, JSON.stringify(job));
            console.error(`Retention policy execution failed for ${policy.dataType}:`, error);
            return job;
        }
    }
    async processAssessmentSessions(policy, cutoffDate, job) {
        try {
            const expiredSessions = await this.db.query(`SELECT id, user_id FROM assessment_sessions 
         WHERE created_at < $1 AND status = 'completed'
         LIMIT $2`, [cutoffDate, this.config.batchSize]);
            job.recordsProcessed = expiredSessions.length;
            for (const session of expiredSessions) {
                try {
                    if (policy.deletionMethod === 'anonymize') {
                        await this.anonymizeAssessmentSession(session.id);
                        job.recordsAnonymized++;
                    }
                    else if (policy.deletionMethod === 'hard_delete') {
                        await this.deleteAssessmentSession(session.id);
                        job.recordsDeleted++;
                    }
                    else if (policy.deletionMethod === 'soft_delete') {
                        await this.softDeleteAssessmentSession(session.id);
                        job.recordsDeleted++;
                    }
                }
                catch (error) {
                    job.errors.push(`Failed to process session ${session.id}: ${error}`);
                }
            }
        }
        catch (error) {
            throw new Error(`Assessment sessions processing failed: ${error}`);
        }
    }
    async processUserAnalytics(policy, cutoffDate, job) {
        try {
            const expiredAnalytics = await this.db.query(`SELECT id FROM user_analytics 
         WHERE created_at < $1
         LIMIT $2`, [cutoffDate, this.config.batchSize]);
            job.recordsProcessed = expiredAnalytics.length;
            if (policy.deletionMethod === 'anonymize') {
                await this.db.query(`UPDATE user_analytics 
           SET user_id = NULL, ip_address = NULL, user_agent = NULL
           WHERE id = ANY($1)`, [expiredAnalytics.map(row => row.id)]);
                job.recordsAnonymized = job.recordsProcessed;
            }
            else {
                await this.db.query(`DELETE FROM user_analytics WHERE id = ANY($1)`, [expiredAnalytics.map(row => row.id)]);
                job.recordsDeleted = job.recordsProcessed;
            }
        }
        catch (error) {
            throw new Error(`User analytics processing failed: ${error}`);
        }
    }
    async processAuditLogs(policy, cutoffDate, job) {
        try {
            const expiredLogs = await this.db.query(`SELECT id FROM security_audit_log 
         WHERE created_at < $1
         LIMIT $2`, [cutoffDate, this.config.batchSize]);
            job.recordsProcessed = expiredLogs.length;
            await this.db.query(`DELETE FROM security_audit_log WHERE id = ANY($1)`, [expiredLogs.map(row => row.id)]);
            job.recordsDeleted = job.recordsProcessed;
        }
        catch (error) {
            throw new Error(`Audit logs processing failed: ${error}`);
        }
    }
    async processUserSessions(policy, cutoffDate, job) {
        try {
            const expiredSessions = await this.db.query(`SELECT session_id FROM user_sessions 
         WHERE expires_at < $1 OR invalidated_at < $1
         LIMIT $2`, [cutoffDate, this.config.batchSize]);
            job.recordsProcessed = expiredSessions.length;
            for (const session of expiredSessions) {
                await this.redis.del(`session:${session.session_id}`);
            }
            await this.db.query(`DELETE FROM user_sessions 
         WHERE session_id = ANY($1)`, [expiredSessions.map(row => row.session_id)]);
            job.recordsDeleted = job.recordsProcessed;
        }
        catch (error) {
            throw new Error(`User sessions processing failed: ${error}`);
        }
    }
    async anonymizeAssessmentSession(sessionId) {
        try {
            await this.db.query('BEGIN');
            await this.db.query(`UPDATE assessment_responses 
         SET response_value = jsonb_build_object(
           'anonymized', true,
           'response_type', response_value->>'type',
           'timestamp', response_value->>'timestamp'
         )
         WHERE session_id = $1`, [sessionId]);
            await this.db.query(`UPDATE assessment_sessions 
         SET user_id = NULL, cultural_adaptations = NULL
         WHERE id = $1`, [sessionId]);
            await this.db.query(`UPDATE assessment_results 
         SET regulatory_considerations = NULL, 
             implementation_priorities = NULL,
             next_steps = NULL,
             resource_requirements = NULL
         WHERE session_id = $1`, [sessionId]);
            await this.db.query('COMMIT');
        }
        catch (error) {
            await this.db.query('ROLLBACK');
            throw new Error(`Session anonymization failed: ${error}`);
        }
    }
    async deleteAssessmentSession(sessionId) {
        try {
            await this.db.query('BEGIN');
            await this.db.query(`DELETE FROM curriculum_recommendations 
         WHERE result_id IN (
           SELECT id FROM assessment_results WHERE session_id = $1
         )`, [sessionId]);
            await this.db.query(`DELETE FROM assessment_results WHERE session_id = $1`, [sessionId]);
            await this.db.query(`DELETE FROM assessment_responses WHERE session_id = $1`, [sessionId]);
            await this.db.query(`DELETE FROM assessment_sessions WHERE id = $1`, [sessionId]);
            await this.db.query('COMMIT');
        }
        catch (error) {
            await this.db.query('ROLLBACK');
            throw new Error(`Session deletion failed: ${error}`);
        }
    }
    async softDeleteAssessmentSession(sessionId) {
        try {
            await this.db.query(`UPDATE assessment_sessions 
         SET status = 'deleted', updated_at = NOW()
         WHERE id = $1`, [sessionId]);
        }
        catch (error) {
            throw new Error(`Session soft deletion failed: ${error}`);
        }
    }
    async cleanupExpiredSessions() {
        try {
            const expiredSessions = await this.db.query(`SELECT session_id FROM user_sessions 
         WHERE expires_at < NOW() AND invalidated_at IS NULL`);
            for (const session of expiredSessions) {
                await this.redis.del(`session:${session.session_id}`);
            }
            await this.db.query(`UPDATE user_sessions 
         SET invalidated_at = NOW() 
         WHERE expires_at < NOW() AND invalidated_at IS NULL`);
            await this.security.logSecurityEvent('expired_sessions_cleaned', undefined, {
                sessionsCleanedUp: expiredSessions.length
            });
        }
        catch (error) {
            console.error('Session cleanup failed:', error);
        }
    }
    async generateRetentionAuditReport() {
        try {
            const report = {
                timestamp: new Date().toISOString(),
                retentionPolicies: this.config.policies.length,
                recentJobs: await this.getRecentRetentionJobs(),
                dataVolumes: await this.getDataVolumes(),
                complianceStatus: await this.getComplianceStatus()
            };
            await this.db.query(`INSERT INTO retention_audit_reports (report_data, created_at)
         VALUES ($1, NOW())`, [JSON.stringify(report)]);
            return report;
        }
        catch (error) {
            console.error('Retention audit report generation failed:', error);
            throw error;
        }
    }
    async getRecentRetentionJobs() {
        const result = await this.db.query(`SELECT * FROM retention_job_log 
       WHERE start_time > NOW() - INTERVAL '7 days'
       ORDER BY start_time DESC`);
        return result;
    }
    async getDataVolumes() {
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
    async getComplianceStatus() {
        return {
            automatedEnforcement: this.config.automatedEnforcement,
            activePolicies: this.config.policies.length,
            lastExecutionTime: await this.getLastExecutionTime(),
            nextScheduledExecution: this.getNextScheduledExecution()
        };
    }
    async getLastExecutionTime() {
        const result = await this.db.query(`SELECT MAX(start_time) as last_execution 
       FROM retention_job_log`);
        return result[0]?.last_execution?.toISOString() || null;
    }
    getNextScheduledExecution() {
        return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }
    async createRetentionTables() {
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
        }
        catch (error) {
            console.error('Failed to create retention tables:', error);
            throw error;
        }
    }
    async loadRetentionPolicies() {
        try {
            for (const policy of this.config.policies) {
                await this.db.query(`INSERT INTO retention_policies (
            data_type, retention_period_days, anonymization_delay,
            deletion_method, legal_basis, exceptions
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (data_type) DO UPDATE SET
            retention_period_days = $2,
            anonymization_delay = $3,
            deletion_method = $4,
            legal_basis = $5,
            exceptions = $6,
            updated_at = NOW()`, [
                    policy.dataType,
                    policy.retentionPeriodDays,
                    policy.anonymizationDelay,
                    policy.deletionMethod,
                    policy.legalBasis,
                    policy.exceptions
                ]);
            }
        }
        catch (error) {
            console.error('Failed to load retention policies:', error);
            throw error;
        }
    }
    async executeManualRetention(dataType) {
        const policy = this.config.policies.find(p => p.dataType === dataType);
        if (!policy) {
            throw new Error(`No retention policy found for data type: ${dataType}`);
        }
        return await this.executeRetentionPolicy(policy);
    }
    async getRetentionStatus() {
        try {
            const recentJobs = await this.getRecentRetentionJobs();
            const dataVolumes = await this.getDataVolumes();
            return {
                policies: this.config.policies,
                recentJobs: recentJobs.slice(0, 10),
                dataVolumes,
                automatedEnforcement: this.config.automatedEnforcement,
                nextScheduledExecution: this.getNextScheduledExecution()
            };
        }
        catch (error) {
            throw new Error(`Failed to get retention status: ${error}`);
        }
    }
    async shutdown() {
        try {
            this.cronJobs.forEach(job => job.stop());
            this.cronJobs.clear();
            console.log('Data retention system shutdown completed');
        }
        catch (error) {
            console.error('Data retention system shutdown failed:', error);
        }
    }
}
exports.DataRetentionSystem = DataRetentionSystem;
//# sourceMappingURL=DataRetentionSystem.js.map