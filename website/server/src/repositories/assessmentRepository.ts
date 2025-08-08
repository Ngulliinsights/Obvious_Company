/**
 * Assessment repository for database operations
 * Handles CRUD operations for all assessment-related data
 */

import { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/connection';
import {
  UserProfile,
  AssessmentSession,
  AssessmentResponse,
  AssessmentResults,
  Question,
  UserTable,
  AssessmentSessionTable,
  AssessmentResponseTable,
  AssessmentResultsTable,
  AssessmentType,
  AssessmentStatus
} from '../types/assessment';
import { AssessmentDatabaseError } from '../utils/errorHandler';

export class AssessmentRepository {
  private db = getDatabase();

  /**
   * User operations
   */
  async createUser(userProfile: Partial<UserProfile>): Promise<string> {
    try {
      const userId = uuidv4();
      const now = new Date();

      await this.db.query(
        `INSERT INTO users (id, demographics_json, professional_json, preferences_json, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          JSON.stringify(userProfile.demographics || {}),
          JSON.stringify(userProfile.professional || {}),
          JSON.stringify(userProfile.preferences || {}),
          now,
          now
        ]
      );

      return userId;
    } catch (error) {
      throw new AssessmentDatabaseError('Failed to create user', error as Error);
    }
  }

  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0] as UserTable;
      return {
        id: row.id,
        demographics: JSON.parse(row.demographics_json),
        professional: JSON.parse(row.professional_json),
        preferences: JSON.parse(row.preferences_json),
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } catch (error) {
      throw new AssessmentDatabaseError('Failed to get user', error as Error);
    }
  }

  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      if (updates.demographics) {
        setClause.push(`demographics_json = $${paramIndex++}`);
        values.push(JSON.stringify(updates.demographics));
      }

      if (updates.professional) {
        setClause.push(`professional_json = $${paramIndex++}`);
        values.push(JSON.stringify(updates.professional));
      }

      if (updates.preferences) {
        setClause.push(`preferences_json = $${paramIndex++}`);
        values.push(JSON.stringify(updates.preferences));
      }

      setClause.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      values.push(userId);

      await this.db.query(
        `UPDATE users SET ${setClause.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    } catch (error) {
      throw new AssessmentDatabaseError('Failed to update user', error as Error);
    }
  }

  /**
   * Assessment session operations
   */
  async createAssessmentSession(
    userId: string,
    assessmentType: AssessmentType
  ): Promise<string> {
    try {
      const sessionId = uuidv4();
      const now = new Date();

      const metadata = {
        start_time: now,
        modality_used: assessmentType,
        cultural_adaptations: [],
        progress_percentage: 0,
        current_question_index: 0
      };

      await this.db.query(
        `INSERT INTO assessment_sessions (id, user_id, assessment_type, status, metadata_json, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          sessionId,
          userId,
          assessmentType,
          AssessmentStatus.NOT_STARTED,
          JSON.stringify(metadata),
          now,
          now
        ]
      );

      return sessionId;
    } catch (error) {
      throw new AssessmentDatabaseError('Failed to create assessment session', error as Error);
    }
  }

  async getAssessmentSession(sessionId: string): Promise<AssessmentSession | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM assessment_sessions WHERE id = $1',
        [sessionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0] as AssessmentSessionTable;
      
      // Get responses for this session
      const responsesResult = await this.db.query(
        'SELECT * FROM assessment_responses WHERE session_id = $1 ORDER BY created_at',
        [sessionId]
      );

      const responses: AssessmentResponse[] = responsesResult.rows.map((responseRow: AssessmentResponseTable) => ({
        id: responseRow.id,
        question_id: responseRow.question_id,
        user_id: responseRow.user_id,
        session_id: responseRow.session_id,
        response_value: JSON.parse(responseRow.response_value_json),
        response_time_ms: responseRow.response_time_ms,
        confidence_level: responseRow.confidence_level,
        metadata: JSON.parse(responseRow.metadata_json)
      }));

      return {
        id: row.id,
        user_id: row.user_id,
        assessment_type: row.assessment_type,
        status: row.status,
        responses,
        metadata: JSON.parse(row.metadata_json),
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } catch (error) {
      throw new AssessmentDatabaseError('Failed to get assessment session', error as Error);
    }
  }

  async updateAssessmentSession(
    sessionId: string,
    updates: Partial<Pick<AssessmentSession, 'status' | 'metadata'>>
  ): Promise<void> {
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      if (updates.status) {
        setClause.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }

      if (updates.metadata) {
        setClause.push(`metadata_json = $${paramIndex++}`);
        values.push(JSON.stringify(updates.metadata));
      }

      setClause.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      values.push(sessionId);

      await this.db.query(
        `UPDATE assessment_sessions SET ${setClause.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    } catch (error) {
      throw new AssessmentDatabaseError('Failed to update assessment session', error as Error);
    }
  }

  /**
   * Assessment response operations
   */
  async createAssessmentResponse(response: Omit<AssessmentResponse, 'id'>): Promise<string> {
    try {
      const responseId = uuidv4();

      await this.db.query(
        `INSERT INTO assessment_responses 
         (id, question_id, user_id, session_id, response_value_json, response_time_ms, confidence_level, metadata_json, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          responseId,
          response.question_id,
          response.user_id,
          response.session_id,
          JSON.stringify(response.response_value),
          response.response_time_ms,
          response.confidence_level,
          JSON.stringify(response.metadata),
          new Date()
        ]
      );

      return responseId;
    } catch (error) {
      throw new AssessmentDatabaseError('Failed to create assessment response', error as Error);
    }
  }

  async getResponsesBySession(sessionId: string): Promise<AssessmentResponse[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM assessment_responses WHERE session_id = $1 ORDER BY created_at',
        [sessionId]
      );

      return result.rows.map((row: AssessmentResponseTable) => ({
        id: row.id,
        question_id: row.question_id,
        user_id: row.user_id,
        session_id: row.session_id,
        response_value: JSON.parse(row.response_value_json),
        response_time_ms: row.response_time_ms,
        confidence_level: row.confidence_level,
        metadata: JSON.parse(row.metadata_json)
      }));
    } catch (error) {
      throw new AssessmentDatabaseError('Failed to get responses by session', error as Error);
    }
  }

  /**
   * Question operations
   */
  async getQuestionsByType(assessmentType: AssessmentType): Promise<Question[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM questions WHERE assessment_type = $1 AND active = true ORDER BY order_index',
        [assessmentType]
      );

      return result.rows.map(row => ({
        id: row.id,
        type: row.type,
        text: row.text,
        description: row.description,
        options: row.options_json ? JSON.parse(row.options_json) : undefined,
        validation_rules: JSON.parse(row.validation_rules_json),
        cultural_adaptations: row.cultural_adaptations_json ? JSON.parse(row.cultural_adaptations_json) : undefined,
        industry_specific: row.industry_specific,
        weight: parseFloat(row.weight),
        dimension: row.dimension
      }));
    } catch (error) {
      throw new AssessmentDatabaseError('Failed to get questions by type', error as Error);
    }
  }

  async getQuestionById(questionId: string): Promise<Question | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM questions WHERE id = $1',
        [questionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        type: row.type,
        text: row.text,
        description: row.description,
        options: row.options_json ? JSON.parse(row.options_json) : undefined,
        validation_rules: JSON.parse(row.validation_rules_json),
        cultural_adaptations: row.cultural_adaptations_json ? JSON.parse(row.cultural_adaptations_json) : undefined,
        industry_specific: row.industry_specific,
        weight: parseFloat(row.weight),
        dimension: row.dimension
      };
    } catch (error) {
      throw new AssessmentDatabaseError('Failed to get question by ID', error as Error);
    }
  }

  /**
   * Assessment results operations
   */
  async createAssessmentResults(results: Omit<AssessmentResults, 'id' | 'created_at' | 'calculated_at'>): Promise<string> {
    try {
      const resultsId = uuidv4();
      const now = new Date();

      await this.db.query(
        `INSERT INTO assessment_results 
         (id, session_id, user_id, overall_score, dimension_scores_json, persona_classification_json, 
          industry_insights_json, recommendations_json, curriculum_pathway_json, created_at, calculated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          resultsId,
          results.session_id,
          results.user_id,
          results.overall_score,
          JSON.stringify(results.dimension_scores),
          JSON.stringify(results.persona_classification),
          JSON.stringify(results.industry_insights),
          JSON.stringify(results.recommendations),
          JSON.stringify(results.curriculum_pathway),
          now,
          now
        ]
      );

      return resultsId;
    } catch (error) {
      throw new AssessmentDatabaseError('Failed to create assessment results', error as Error);
    }
  }

  async getAssessmentResults(sessionId: string): Promise<AssessmentResults | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM assessment_results WHERE session_id = $1',
        [sessionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0] as AssessmentResultsTable;
      return {
        id: row.id,
        session_id: row.session_id,
        user_id: row.user_id,
        overall_score: parseFloat(row.overall_score.toString()),
        dimension_scores: JSON.parse(row.dimension_scores_json),
        persona_classification: JSON.parse(row.persona_classification_json),
        industry_insights: JSON.parse(row.industry_insights_json),
        recommendations: JSON.parse(row.recommendations_json),
        curriculum_pathway: JSON.parse(row.curriculum_pathway_json),
        created_at: row.created_at,
        calculated_at: row.calculated_at
      };
    } catch (error) {
      throw new AssessmentDatabaseError('Failed to get assessment results', error as Error);
    }
  }

  /**
   * Analytics and reporting
   */
  async getAssessmentAnalytics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    try {
      const interval = timeframe === 'day' ? '1 day' : timeframe === 'week' ? '1 week' : '1 month';
      
      const result = await this.db.query(
        `SELECT 
           assessment_type,
           status,
           COUNT(*) as count,
           AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_duration_minutes
         FROM assessment_sessions 
         WHERE created_at >= NOW() - INTERVAL '${interval}'
         GROUP BY assessment_type, status
         ORDER BY assessment_type, status`
      );

      return result.rows;
    } catch (error) {
      throw new AssessmentDatabaseError('Failed to get assessment analytics', error as Error);
    }
  }

  // Additional methods needed by the controller
  async getUser(userId: string): Promise<UserProfile | null> {
    return this.getUserById(userId);
  }

  async getSession(sessionId: string): Promise<AssessmentSession | null> {
    return this.getAssessmentSession(sessionId);
  }

  async updateSession(sessionId: string, updates: Partial<Pick<AssessmentSession, 'status' | 'metadata'>>): Promise<void> {
    return this.updateAssessmentSession(sessionId, updates);
  }

  async updateSessionStatus(sessionId: string, status: AssessmentStatus): Promise<void> {
    return this.updateAssessmentSession(sessionId, { status });
  }

  async updateSessionProgress(sessionId: string, currentIndex: number, percentage: number): Promise<void> {
    const session = await this.getAssessmentSession(sessionId);
    if (session) {
      const updatedMetadata = {
        ...session.metadata,
        current_question_index: currentIndex,
        progress_percentage: percentage
      };
      await this.updateAssessmentSession(sessionId, { metadata: updatedMetadata });
    }
  }

  async saveResponse(response: AssessmentResponse): Promise<string> {
    return this.createAssessmentResponse(response);
  }

  async getResponses(sessionId: string): Promise<AssessmentResponse[]> {
    return this.getResponsesBySession(sessionId);
  }

  async getResults(sessionId: string): Promise<AssessmentResults | null> {
    return this.getAssessmentResults(sessionId);
  }

  async saveResults(results: AssessmentResults): Promise<string> {
    return this.createAssessmentResults(results);
  }

  async getUserAssessments(
    userId: string,
    limit: number = 10,
    offset: number = 0,
    status?: AssessmentStatus
  ): Promise<AssessmentSession[]> {
    try {
      let query = `
        SELECT * FROM assessment_sessions 
        WHERE user_id = $1
      `;
      const params: any[] = [userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(limit, offset);

      const result = await this.db.query(query, params);

      const sessions: AssessmentSession[] = [];
      for (const row of result.rows) {
        const session = await this.getAssessmentSession(row.id);
        if (session) {
          sessions.push(session);
        }
      }

      return sessions;
    } catch (error) {
      throw new AssessmentDatabaseError('Failed to get user assessments', error as Error);
    }
  }
}