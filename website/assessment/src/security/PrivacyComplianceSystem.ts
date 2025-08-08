import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { DataSecurityFramework } from './DataSecurityFramework';

export interface PrivacyConfig {
  dataRetentionDays: number;
  anonymizationDelay: number;
  consentValidityDays: number;
  gdprEnabled: boolean;
  ccpaEnabled: boolean;
  regionalCompliance: string[];
}

export interface ConsentRecord {
  userId: string;
  consentType: string;
  consentGiven: boolean;
  consentDate: Date;
  consentVersion: string;
  ipAddress?: string;
  userAgent?: string;
  withdrawalDate?: Date;
}

export interface DataProcessingPurpose {
  purpose: string;
  legalBasis: string;
  dataTypes: string[];
  retentionPeriod: number;
  thirdPartySharing: boolean;
}

export interface PrivacyRequest {
  id: string;
  userId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: Date;
  completionDate?: Date;
  requestDetails?: any;
  responseData?: any;
}

export class PrivacyComplianceSystem {
  private config: PrivacyConfig;
  private db: Pool;
  private redis: RedisClientType;
  private security: DataSecurityFramework;

  constructor(config: PrivacyConfig, db: Pool, redis: RedisClientType, security: DataSecurityFramework) {
    this.config = config;
    this.db = db;
    this.redis = redis;
    this.security = security;
  }

  // Consent Management
  async recordConsent(consent: ConsentRecord): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO user_consent (user_id, consent_type, consent_given, consent_date, consent_version, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id, consent_type) 
         DO UPDATE SET 
           consent_given = $3,
           consent_date = $4,
           consent_version = $5,
           ip_address = $6,
           user_agent = $7,
           withdrawal_date = NULL`,
        [
          consent.userId,
          consent.consentType,
          consent.consentGiven,
          consent.consentDate,
          consent.consentVersion,
          consent.ipAddress,
          consent.userAgent
        ]
      );

      await this.security.logSecurityEvent('consent_recorded', consent.userId, {
        consentType: consent.consentType,
        consentGiven: consent.consentGiven,
        version: consent.consentVersion
      }, consent.ipAddress);
    } catch (error) {
      throw new Error(`Consent recording failed: ${error}`);
    }
  }

  async withdrawConsent(userId: string, consentType: string, ipAddress?: string): Promise<void> {
    try {
      await this.db.query(
        `UPDATE user_consent 
         SET consent_given = FALSE, withdrawal_date = NOW()
         WHERE user_id = $1 AND consent_type = $2`,
        [userId, consentType]
      );

      await this.security.logSecurityEvent('consent_withdrawn', userId, {
        consentType
      }, ipAddress);

      // Trigger data processing restriction if required
      if (consentType === 'data_processing') {
        await this.restrictDataProcessing(userId);
      }
    } catch (error) {
      throw new Error(`Consent withdrawal failed: ${error}`);
    }
  }

  async getConsentStatus(userId: string): Promise<ConsentRecord[]> {
    try {
      const result = await this.db.query(
        `SELECT user_id, consent_type, consent_given, consent_date, consent_version, 
                ip_address, user_agent, withdrawal_date
         FROM user_consent 
         WHERE user_id = $1`,
        [userId]
      );

      return (result as any[]).map(row => ({
        userId: row.user_id,
        consentType: row.consent_type,
        consentGiven: row.consent_given,
        consentDate: row.consent_date,
        consentVersion: row.consent_version,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        withdrawalDate: row.withdrawal_date
      }));
    } catch (error) {
      throw new Error(`Consent status retrieval failed: ${error}`);
    }
  }

  async validateConsent(userId: string, purpose: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        `SELECT consent_given, consent_date 
         FROM user_consent 
         WHERE user_id = $1 AND consent_type = $2 AND consent_given = TRUE`,
        [userId, purpose]
      );

      if ((result as any[]).length === 0) {
        return false;
      }

      const consent = (result as any[])[0];
      const consentAge = Date.now() - consent.consent_date.getTime();
      const maxAge = this.config.consentValidityDays * 24 * 60 * 60 * 1000;

      return consentAge <= maxAge;
    } catch (error) {
      console.error('Consent validation error:', error);
      return false;
    }
  }

  // Data Subject Rights (GDPR)
  async handlePrivacyRequest(request: Omit<PrivacyRequest, 'id' | 'status' | 'requestDate'>): Promise<string> {
    try {
      const requestId = this.security.generateSecureId();
      
      await this.db.query(
        `INSERT INTO privacy_requests (id, user_id, request_type, status, request_date, request_details)
         VALUES ($1, $2, $3, 'pending', NOW(), $4)`,
        [requestId, request.userId, request.requestType, JSON.stringify(request.requestDetails)]
      );

      await this.security.logSecurityEvent('privacy_request_submitted', request.userId, {
        requestId,
        requestType: request.requestType
      });

      // Auto-process certain request types
      if (request.requestType === 'access') {
        setTimeout(() => this.processDataAccessRequest(requestId), 1000);
      }

      return requestId;
    } catch (error) {
      throw new Error(`Privacy request handling failed: ${error}`);
    }
  }

  async processDataAccessRequest(requestId: string): Promise<void> {
    try {
      // Update status to processing
      await this.db.query(
        `UPDATE privacy_requests SET status = 'processing' WHERE id = $1`,
        [requestId]
      );

      // Get request details
      const requestResult = await this.db.query(
        `SELECT user_id FROM privacy_requests WHERE id = $1`,
        [requestId]
      );

      if ((requestResult as any[]).length === 0) {
        throw new Error('Request not found');
      }

      const userId = (requestResult as any[])[0].user_id;

      // Collect all user data
      const userData = await this.collectUserData(userId);

      // Store response data
      await this.db.query(
        `UPDATE privacy_requests 
         SET status = 'completed', completion_date = NOW(), response_data = $2
         WHERE id = $1`,
        [requestId, JSON.stringify(userData)]
      );

      await this.security.logSecurityEvent('privacy_request_completed', userId, {
        requestId,
        requestType: 'access'
      });
    } catch (error) {
      await this.db.query(
        `UPDATE privacy_requests SET status = 'rejected' WHERE id = $1`,
        [requestId]
      );
      throw new Error(`Data access request processing failed: ${error}`);
    }
  }

  async processDataErasureRequest(requestId: string): Promise<void> {
    try {
      // Update status to processing
      await this.db.query(
        `UPDATE privacy_requests SET status = 'processing' WHERE id = $1`,
        [requestId]
      );

      // Get request details
      const requestResult = await this.db.query(
        `SELECT user_id FROM privacy_requests WHERE id = $1`,
        [requestId]
      );

      if ((requestResult as any[]).length === 0) {
        throw new Error('Request not found');
      }

      const userId = (requestResult as any[])[0].user_id;

      // Check if erasure is legally permissible
      const canErase = await this.validateErasureRequest(userId);
      
      if (!canErase) {
        await this.db.query(
          `UPDATE privacy_requests SET status = 'rejected' WHERE id = $1`,
          [requestId]
        );
        return;
      }

      // Perform data erasure
      await this.eraseUserData(userId);

      // Mark request as completed
      await this.db.query(
        `UPDATE privacy_requests 
         SET status = 'completed', completion_date = NOW()
         WHERE id = $1`,
        [requestId]
      );

      await this.security.logSecurityEvent('data_erasure_completed', userId, {
        requestId
      });
    } catch (error) {
      await this.db.query(
        `UPDATE privacy_requests SET status = 'rejected' WHERE id = $1`,
        [requestId]
      );
      throw new Error(`Data erasure request processing failed: ${error}`);
    }
  }

  // Data Collection and Export
  private async collectUserData(userId: string): Promise<any> {
    try {
      const userData: any = {};

      // User profile data
      const profileResult = await this.db.query(
        `SELECT * FROM user_profiles WHERE id = $1`,
        [userId]
      );
      userData.profile = (profileResult as any[])[0];

      // Assessment sessions
      const sessionsResult = await this.db.query(
        `SELECT * FROM assessment_sessions WHERE user_id = $1`,
        [userId]
      );
      userData.assessmentSessions = sessionsResult;

      // Assessment responses (anonymized)
      const responsesResult = await this.db.query(
        `SELECT ar.question_id, ar.question_type, ar.response_time_seconds, ar.created_at
         FROM assessment_responses ar
         JOIN assessment_sessions as_sess ON ar.session_id = as_sess.id
         WHERE as_sess.user_id = $1`,
        [userId]
      );
      userData.assessmentResponses = responsesResult;

      // Assessment results
      const resultsResult = await this.db.query(
        `SELECT ar.* FROM assessment_results ar
         JOIN assessment_sessions as_sess ON ar.session_id = as_sess.id
         WHERE as_sess.user_id = $1`,
        [userId]
      );
      userData.assessmentResults = resultsResult;

      // Consent records
      userData.consentRecords = await this.getConsentStatus(userId);

      // Analytics data (anonymized)
      const analyticsResult = await this.db.query(
        `SELECT page_views, time_on_platform, interaction_count, 
                preferred_question_types, engagement_score, created_at
         FROM user_analytics WHERE user_id = $1`,
        [userId]
      );
      userData.analytics = analyticsResult;

      return userData;
    } catch (error) {
      throw new Error(`User data collection failed: ${error}`);
    }
  }

  // Data Retention and Deletion
  async enforceDataRetention(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.dataRetentionDays);

      // Find expired data
      const expiredSessions = await this.db.query(
        `SELECT id FROM assessment_sessions 
         WHERE created_at < $1 AND status = 'completed'`,
        [cutoffDate]
      );

      // Anonymize expired assessment data
      for (const session of expiredSessions as any[]) {
        await this.anonymizeAssessmentData(session.id);
      }

      // Delete old audit logs (keep for compliance period)
      const auditCutoffDate = new Date();
      auditCutoffDate.setDate(auditCutoffDate.getDate() - (this.config.dataRetentionDays * 2));

      await this.db.query(
        `DELETE FROM security_audit_log WHERE created_at < $1`,
        [auditCutoffDate]
      );

      await this.security.logSecurityEvent('data_retention_enforced', undefined, {
        cutoffDate: cutoffDate.toISOString(),
        sessionsProcessed: (expiredSessions as any[]).length
      });
    } catch (error) {
      console.error('Data retention enforcement error:', error);
    }
  }

  private async anonymizeAssessmentData(sessionId: string): Promise<void> {
    try {
      // Anonymize responses by removing identifying information
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

      // Mark session as anonymized
      await this.db.query(
        `UPDATE assessment_sessions 
         SET user_id = NULL, cultural_adaptations = NULL
         WHERE id = $1`,
        [sessionId]
      );
    } catch (error) {
      throw new Error(`Assessment data anonymization failed: ${error}`);
    }
  }

  private async eraseUserData(userId: string): Promise<void> {
    try {
      // Start transaction
      await this.db.query('BEGIN');

      // Delete user sessions
      await this.db.query(
        `DELETE FROM user_sessions WHERE user_id = $1`,
        [userId]
      );

      // Delete assessment data
      await this.db.query(
        `DELETE FROM assessment_responses 
         WHERE session_id IN (
           SELECT id FROM assessment_sessions WHERE user_id = $1
         )`,
        [userId]
      );

      await this.db.query(
        `DELETE FROM assessment_results 
         WHERE session_id IN (
           SELECT id FROM assessment_sessions WHERE user_id = $1
         )`,
        [userId]
      );

      await this.db.query(
        `DELETE FROM curriculum_recommendations 
         WHERE result_id IN (
           SELECT ar.id FROM assessment_results ar
           JOIN assessment_sessions as_sess ON ar.session_id = as_sess.id
           WHERE as_sess.user_id = $1
         )`,
        [userId]
      );

      await this.db.query(
        `DELETE FROM assessment_sessions WHERE user_id = $1`,
        [userId]
      );

      // Delete analytics data
      await this.db.query(
        `DELETE FROM user_analytics WHERE user_id = $1`,
        [userId]
      );

      // Delete consent records
      await this.db.query(
        `DELETE FROM user_consent WHERE user_id = $1`,
        [userId]
      );

      // Delete user profile
      await this.db.query(
        `DELETE FROM user_profiles WHERE id = $1`,
        [userId]
      );

      // Invalidate all Redis sessions
      await this.security.invalidateAllUserSessions(userId);

      // Commit transaction
      await this.db.query('COMMIT');
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw new Error(`User data erasure failed: ${error}`);
    }
  }

  private async validateErasureRequest(userId: string): Promise<boolean> {
    try {
      // Check if user has any legal obligations that prevent erasure
      const activeObligations = await this.db.query(
        `SELECT COUNT(*) as count FROM legal_obligations 
         WHERE user_id = $1 AND status = 'active'`,
        [userId]
      );

      return (activeObligations as any[])[0].count === 0;
    } catch (error) {
      console.error('Erasure validation error:', error);
      return false;
    }
  }

  private async restrictDataProcessing(userId: string): Promise<void> {
    try {
      // Mark user data as restricted
      await this.db.query(
        `UPDATE user_profiles 
         SET processing_restricted = TRUE, restriction_date = NOW()
         WHERE id = $1`,
        [userId]
      );

      // Add restriction flag to Redis for quick access
      await this.redis.set(`processing_restricted:${userId}`, 'true', {
        EX: 86400 // 24 hours
      });
    } catch (error) {
      throw new Error(`Data processing restriction failed: ${error}`);
    }
  }

  // Regional Compliance
  async getRegionalRequirements(region: string): Promise<any> {
    const requirements: Record<string, any> = {
      'EU': {
        gdpr: true,
        consentRequired: true,
        dataRetentionMax: 1095, // 3 years
        rightToErasure: true,
        rightToPortability: true,
        dpoRequired: true
      },
      'US-CA': {
        ccpa: true,
        consentRequired: true,
        dataRetentionMax: 365, // 1 year
        rightToDelete: true,
        rightToKnow: true,
        optOutRequired: true
      },
      'UK': {
        ukGdpr: true,
        consentRequired: true,
        dataRetentionMax: 1095, // 3 years
        rightToErasure: true,
        rightToPortability: true,
        dpoRequired: false
      }
    };

    return requirements[region] || requirements['EU']; // Default to EU requirements
  }

  async validateRegionalCompliance(userId: string): Promise<boolean> {
    try {
      const userProfile = await this.db.query(
        `SELECT geographic_region FROM user_profiles WHERE id = $1`,
        [userId]
      );

      if ((userProfile as any[]).length === 0) {
        return false;
      }

      const region = (userProfile as any[])[0].geographic_region;
      const requirements = await this.getRegionalRequirements(region);

      // Check consent requirements
      if (requirements.consentRequired) {
        const hasValidConsent = await this.validateConsent(userId, 'data_processing');
        if (!hasValidConsent) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Regional compliance validation error:', error);
      return false;
    }
  }

  // Privacy Impact Assessment
  async generatePrivacyReport(): Promise<any> {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        dataProcessingActivities: await this.getDataProcessingActivities(),
        consentMetrics: await this.getConsentMetrics(),
        privacyRequests: await this.getPrivacyRequestMetrics(),
        dataRetentionStatus: await this.getDataRetentionStatus(),
        complianceStatus: await this.getComplianceStatus()
      };

      return report;
    } catch (error) {
      throw new Error(`Privacy report generation failed: ${error}`);
    }
  }

  private async getDataProcessingActivities(): Promise<any> {
    const result = await this.db.query(
      `SELECT 
         COUNT(DISTINCT user_id) as active_users,
         COUNT(*) as total_sessions,
         AVG(duration_minutes) as avg_session_duration
       FROM assessment_sessions 
       WHERE created_at > NOW() - INTERVAL '30 days'`
    );

    return (result as any[])[0];
  }

  private async getConsentMetrics(): Promise<any> {
    const result = await this.db.query(
      `SELECT 
         consent_type,
         COUNT(*) as total_consents,
         SUM(CASE WHEN consent_given THEN 1 ELSE 0 END) as given_consents,
         SUM(CASE WHEN withdrawal_date IS NOT NULL THEN 1 ELSE 0 END) as withdrawn_consents
       FROM user_consent 
       GROUP BY consent_type`
    );

    return result;
  }

  private async getPrivacyRequestMetrics(): Promise<any> {
    const result = await this.db.query(
      `SELECT 
         request_type,
         status,
         COUNT(*) as count,
         AVG(EXTRACT(EPOCH FROM (completion_date - request_date))/86400) as avg_processing_days
       FROM privacy_requests 
       WHERE request_date > NOW() - INTERVAL '90 days'
       GROUP BY request_type, status`
    );

    return result;
  }

  private async getDataRetentionStatus(): Promise<any> {
    const result = await this.db.query(
      `SELECT 
         COUNT(*) as total_sessions,
         COUNT(CASE WHEN created_at < NOW() - INTERVAL '${this.config.dataRetentionDays} days' THEN 1 END) as expired_sessions,
         COUNT(CASE WHEN user_id IS NULL THEN 1 END) as anonymized_sessions
       FROM assessment_sessions`
    );

    return (result as any[])[0];
  }

  private async getComplianceStatus(): Promise<any> {
    return {
      gdprEnabled: this.config.gdprEnabled,
      ccpaEnabled: this.config.ccpaEnabled,
      dataRetentionDays: this.config.dataRetentionDays,
      consentValidityDays: this.config.consentValidityDays,
      regionalCompliance: this.config.regionalCompliance
    };
  }
}