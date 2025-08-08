import { Pool } from 'pg';
import { createHash, randomBytes } from 'crypto';

export interface AnonymizationConfig {
  preserveStructure: boolean;
  saltLength: number;
  hashAlgorithm: string;
  dateGranularity: 'day' | 'week' | 'month' | 'year';
  numericRounding: number;
}

export interface AnonymizedData {
  originalCount: number;
  anonymizedCount: number;
  fieldsAnonymized: string[];
  anonymizationMethod: string;
  timestamp: Date;
}

export interface AnalyticsData {
  assessmentCompletions: number;
  averageCompletionTime: number;
  dropoffPoints: Record<string, number>;
  userEngagement: Record<string, number>;
  industryDistribution: Record<string, number>;
  personaDistribution: Record<string, number>;
  geographicDistribution: Record<string, number>;
  timeBasedMetrics: Record<string, number>;
}

export class DataAnonymizer {
  private db: Pool;
  private config: AnonymizationConfig;
  private saltCache: Map<string, string> = new Map();

  constructor(db: Pool, config?: Partial<AnonymizationConfig>) {
    this.db = db;
    this.config = {
      preserveStructure: true,
      saltLength: 32,
      hashAlgorithm: 'sha256',
      dateGranularity: 'week',
      numericRounding: 5,
      ...config
    };
  }

  /**
   * Anonymize user data for analytics while preserving privacy
   */
  async anonymizeForAnalytics(startDate: Date, endDate: Date): Promise<AnalyticsData> {
    try {
      // Get raw data from audit logs
      const rawData = await this.getRawAnalyticsData(startDate, endDate);
      
      // Anonymize and aggregate the data
      const anonymizedData: AnalyticsData = {
        assessmentCompletions: await this.getAnonymizedCompletions(rawData),
        averageCompletionTime: await this.getAnonymizedCompletionTime(rawData),
        dropoffPoints: await this.getAnonymizedDropoffPoints(rawData),
        userEngagement: await this.getAnonymizedEngagement(rawData),
        industryDistribution: await this.getAnonymizedIndustryDistribution(rawData),
        personaDistribution: await this.getAnonymizedPersonaDistribution(rawData),
        geographicDistribution: await this.getAnonymizedGeographicDistribution(rawData),
        timeBasedMetrics: await this.getAnonymizedTimeMetrics(rawData, startDate, endDate)
      };

      // Log anonymization activity
      await this.logAnonymizationActivity('analytics_generation', {
        recordsProcessed: rawData.length,
        dateRange: { startDate, endDate },
        fieldsAnonymized: ['user_id', 'ip_address', 'email', 'personal_data']
      });

      return anonymizedData;
    } catch (error) {
      console.error('Failed to anonymize data for analytics:', error);
      throw new Error('Data anonymization failed');
    }
  }

  /**
   * Anonymize assessment data for research purposes
   */
  async anonymizeAssessmentData(assessmentType?: string): Promise<any[]> {
    try {
      let query = `
        SELECT 
          al.id,
          al.event_type,
          al.resource,
          al.action,
          al.details,
          al.timestamp,
          al.ip_address,
          al.user_agent
        FROM audit_logs al
        WHERE al.event_type = 'assessment_interaction'
      `;

      const params: any[] = [];
      if (assessmentType) {
        query += ` AND al.details->>'assessmentType' = $1`;
        params.push(assessmentType);
      }

      const result = await this.db.query(query, params);
      
      // Anonymize each record
      const anonymizedRecords = result.rows.map(record => this.anonymizeRecord(record, {
        removeFields: ['ip_address', 'user_agent'],
        hashFields: ['id'],
        generalizeFields: ['timestamp'],
        sanitizeFields: ['details']
      }));

      await this.logAnonymizationActivity('research_data_export', {
        recordsProcessed: result.rows.length,
        assessmentType: assessmentType || 'all',
        anonymizationLevel: 'high'
      });

      return anonymizedRecords;
    } catch (error) {
      console.error('Failed to anonymize assessment data:', error);
      throw new Error('Assessment data anonymization failed');
    }
  }

  /**
   * Create anonymized user cohorts for analysis
   */
  async createAnonymizedCohorts(cohortCriteria: any): Promise<any[]> {
    try {
      // Get users matching criteria
      const usersQuery = `
        SELECT DISTINCT
          al.user_id,
          al.details->>'industry' as industry,
          al.details->>'role' as role,
          al.details->>'company_size' as company_size,
          MIN(al.timestamp) as first_interaction,
          MAX(al.timestamp) as last_interaction,
          COUNT(*) as interaction_count
        FROM audit_logs al
        WHERE al.user_id IS NOT NULL
          AND al.timestamp >= $1
          AND al.timestamp <= $2
        GROUP BY al.user_id, al.details->>'industry', al.details->>'role', al.details->>'company_size'
      `;

      const result = await this.db.query(usersQuery, [
        cohortCriteria.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        cohortCriteria.endDate || new Date()
      ]);

      // Create anonymized cohorts
      const cohorts = this.groupIntoCohorts(result.rows, cohortCriteria);
      
      // Anonymize cohort data
      const anonymizedCohorts = cohorts.map(cohort => ({
        cohortId: this.generateCohortId(cohort.criteria),
        size: cohort.users.length,
        criteria: this.sanitizeCriteria(cohort.criteria),
        metrics: this.calculateCohortMetrics(cohort.users),
        timeRange: {
          start: this.anonymizeDate(cohort.timeRange.start),
          end: this.anonymizeDate(cohort.timeRange.end)
        }
      }));

      await this.logAnonymizationActivity('cohort_analysis', {
        cohortsCreated: anonymizedCohorts.length,
        totalUsers: result.rows.length,
        criteria: cohortCriteria
      });

      return anonymizedCohorts;
    } catch (error) {
      console.error('Failed to create anonymized cohorts:', error);
      throw new Error('Cohort anonymization failed');
    }
  }

  /**
   * Anonymize individual record
   */
  private anonymizeRecord(record: any, options: {
    removeFields?: string[];
    hashFields?: string[];
    generalizeFields?: string[];
    sanitizeFields?: string[];
  }): any {
    const anonymized = { ...record };

    // Remove sensitive fields
    if (options.removeFields) {
      options.removeFields.forEach(field => {
        delete anonymized[field];
      });
    }

    // Hash identifying fields
    if (options.hashFields) {
      options.hashFields.forEach(field => {
        if (anonymized[field]) {
          anonymized[field] = this.hashValue(anonymized[field]);
        }
      });
    }

    // Generalize temporal fields
    if (options.generalizeFields) {
      options.generalizeFields.forEach(field => {
        if (anonymized[field] && field === 'timestamp') {
          anonymized[field] = this.anonymizeDate(new Date(anonymized[field]));
        }
      });
    }

    // Sanitize complex fields
    if (options.sanitizeFields) {
      options.sanitizeFields.forEach(field => {
        if (anonymized[field]) {
          anonymized[field] = this.sanitizeComplexField(anonymized[field]);
        }
      });
    }

    return anonymized;
  }

  /**
   * Hash a value with salt
   */
  private hashValue(value: string): string {
    const salt = this.getSalt(value);
    return createHash(this.config.hashAlgorithm)
      .update(value + salt)
      .digest('hex');
  }

  /**
   * Get or create salt for consistent hashing
   */
  private getSalt(key: string): string {
    if (!this.saltCache.has(key)) {
      this.saltCache.set(key, randomBytes(this.config.saltLength).toString('hex'));
    }
    return this.saltCache.get(key)!;
  }

  /**
   * Anonymize date based on granularity setting
   */
  private anonymizeDate(date: Date): string {
    switch (this.config.dateGranularity) {
      case 'year':
        return date.getFullYear().toString();
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
      case 'day':
      default:
        return date.toISOString().split('T')[0];
    }
  }

  /**
   * Sanitize complex fields (JSON objects)
   */
  private sanitizeComplexField(field: any): any {
    if (typeof field === 'string') {
      try {
        field = JSON.parse(field);
      } catch {
        return '[sanitized]';
      }
    }

    if (typeof field === 'object' && field !== null) {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(field)) {
        // Remove or hash sensitive fields
        if (this.isSensitiveField(key)) {
          if (this.shouldHash(key)) {
            sanitized[key] = this.hashValue(String(value));
          }
          // Otherwise, omit the field
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    }

    return field;
  }

  /**
   * Check if field contains sensitive data
   */
  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'email', 'phone', 'name', 'firstName', 'lastName',
      'address', 'personalData', 'userInput', 'ipAddress',
      'userId', 'sessionId'
    ];
    
    return sensitiveFields.some(sensitive => 
      fieldName.toLowerCase().includes(sensitive.toLowerCase())
    );
  }

  /**
   * Check if field should be hashed rather than removed
   */
  private shouldHash(fieldName: string): boolean {
    const hashableFields = ['userId', 'sessionId', 'email'];
    return hashableFields.some(hashable => 
      fieldName.toLowerCase().includes(hashable.toLowerCase())
    );
  }

  /**
   * Get raw analytics data from audit logs
   */
  private async getRawAnalyticsData(startDate: Date, endDate: Date): Promise<any[]> {
    const query = `
      SELECT * FROM audit_logs 
      WHERE timestamp BETWEEN $1 AND $2
      ORDER BY timestamp ASC
    `;
    
    const result = await this.db.query(query, [startDate, endDate]);
    return result.rows;
  }

  /**
   * Calculate anonymized completion metrics
   */
  private async getAnonymizedCompletions(rawData: any[]): Promise<number> {
    const completions = rawData.filter(record => 
      record.event_type === 'assessment_interaction' && 
      record.action === 'complete_assessment'
    );
    
    return completions.length;
  }

  /**
   * Calculate anonymized completion time
   */
  private async getAnonymizedCompletionTime(rawData: any[]): Promise<number> {
    const completionTimes: number[] = [];
    
    // Group by session and calculate completion times
    const sessions = new Map<string, any[]>();
    rawData.forEach(record => {
      if (record.session_id) {
        if (!sessions.has(record.session_id)) {
          sessions.set(record.session_id, []);
        }
        sessions.get(record.session_id)!.push(record);
      }
    });

    sessions.forEach(sessionRecords => {
      const startTime = Math.min(...sessionRecords.map(r => new Date(r.timestamp).getTime()));
      const endTime = Math.max(...sessionRecords.map(r => new Date(r.timestamp).getTime()));
      const duration = (endTime - startTime) / 1000 / 60; // minutes
      
      if (duration > 0 && duration < 120) { // Filter out unrealistic times
        completionTimes.push(duration);
      }
    });

    return completionTimes.length > 0 
      ? Math.round(completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length)
      : 0;
  }

  /**
   * Calculate anonymized dropoff points
   */
  private async getAnonymizedDropoffPoints(rawData: any[]): Promise<Record<string, number>> {
    const dropoffs: Record<string, number> = {};
    
    // Analyze session abandonment patterns
    const sessions = new Map<string, any[]>();
    rawData.forEach(record => {
      if (record.session_id && record.event_type === 'assessment_interaction') {
        if (!sessions.has(record.session_id)) {
          sessions.set(record.session_id, []);
        }
        sessions.get(record.session_id)!.push(record);
      }
    });

    sessions.forEach(sessionRecords => {
      const lastAction = sessionRecords[sessionRecords.length - 1];
      if (lastAction.action !== 'complete_assessment') {
        const dropoffPoint = lastAction.details?.questionId || lastAction.action || 'unknown';
        dropoffs[dropoffPoint] = (dropoffs[dropoffPoint] || 0) + 1;
      }
    });

    return dropoffs;
  }

  /**
   * Calculate other anonymized metrics
   */
  private async getAnonymizedEngagement(rawData: any[]): Promise<Record<string, number>> {
    // Implementation for engagement metrics
    return {};
  }

  private async getAnonymizedIndustryDistribution(rawData: any[]): Promise<Record<string, number>> {
    const distribution: Record<string, number> = {};
    
    rawData.forEach(record => {
      if (record.details?.industry) {
        const industry = record.details.industry;
        distribution[industry] = (distribution[industry] || 0) + 1;
      }
    });

    return distribution;
  }

  private async getAnonymizedPersonaDistribution(rawData: any[]): Promise<Record<string, number>> {
    const distribution: Record<string, number> = {};
    
    rawData.forEach(record => {
      if (record.details?.persona) {
        const persona = record.details.persona;
        distribution[persona] = (distribution[persona] || 0) + 1;
      }
    });

    return distribution;
  }

  private async getAnonymizedGeographicDistribution(rawData: any[]): Promise<Record<string, number>> {
    // Generalize geographic data to country/region level only
    const distribution: Record<string, number> = {};
    
    rawData.forEach(record => {
      if (record.details?.region) {
        const region = record.details.region;
        distribution[region] = (distribution[region] || 0) + 1;
      }
    });

    return distribution;
  }

  private async getAnonymizedTimeMetrics(rawData: any[], startDate: Date, endDate: Date): Promise<Record<string, number>> {
    const metrics: Record<string, number> = {};
    
    // Group by time periods based on granularity
    rawData.forEach(record => {
      const timeKey = this.anonymizeDate(new Date(record.timestamp));
      metrics[timeKey] = (metrics[timeKey] || 0) + 1;
    });

    return metrics;
  }

  /**
   * Group users into cohorts
   */
  private groupIntoCohorts(users: any[], criteria: any): any[] {
    // Implementation for cohort grouping
    return [];
  }

  /**
   * Generate cohort ID
   */
  private generateCohortId(criteria: any): string {
    return this.hashValue(JSON.stringify(criteria));
  }

  /**
   * Sanitize cohort criteria
   */
  private sanitizeCriteria(criteria: any): any {
    // Remove or generalize sensitive criteria
    return criteria;
  }

  /**
   * Calculate cohort metrics
   */
  private calculateCohortMetrics(users: any[]): any {
    return {
      size: users.length,
      avgInteractions: users.reduce((sum, user) => sum + user.interaction_count, 0) / users.length,
      retentionRate: 0 // Calculate based on return visits
    };
  }

  /**
   * Log anonymization activity
   */
  private async logAnonymizationActivity(activity: string, details: any): Promise<void> {
    try {
      const query = `
        INSERT INTO anonymization_log (
          id, activity, details, timestamp
        ) VALUES ($1, $2, $3, $4)
      `;

      await this.db.query(query, [
        randomBytes(16).toString('hex'),
        activity,
        JSON.stringify(details),
        new Date()
      ]);
    } catch (error) {
      console.error('Failed to log anonymization activity:', error);
    }
  }
}