import { Pool } from 'pg';
import { UserProfile } from '../models/UserProfile';
import { AssessmentSession } from '../models/AssessmentSession';

export class DatabaseService {
  constructor(private pool: Pool) {}

  // User Profile operations
  async createUserProfile(profile: UserProfile): Promise<UserProfile> {
    const query = `
      INSERT INTO user_profiles (
        id, email, age_range, geographic_region, cultural_context, languages,
        industry, role_level, organization_size, decision_authority, years_experience,
        assessment_modality, learning_style, communication_preference, timezone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      profile.id,
      profile.email,
      profile.demographics.ageRange,
      profile.demographics.geographicRegion,
      profile.demographics.culturalContext,
      profile.demographics.languages,
      profile.professional.industry,
      profile.professional.roleLevel,
      profile.professional.organizationSize,
      profile.professional.decisionAuthority,
      profile.professional.yearsExperience,
      profile.preferences.assessmentModality,
      profile.preferences.learningStyle,
      profile.preferences.communicationPreference,
      profile.preferences.timezone,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToUserProfile(result.rows[0]);
  }

  async getUserProfile(id: string): Promise<UserProfile | null> {
    const query = 'SELECT * FROM user_profiles WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUserProfile(result.rows[0]);
  }

  async updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    // Build dynamic update query based on provided fields
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      values.push(updates.email);
    }

    if (updates.demographics?.ageRange !== undefined) {
      updateFields.push(`age_range = $${paramIndex++}`);
      values.push(updates.demographics.ageRange);
    }

    // Add more fields as needed...

    if (updateFields.length === 0) {
      return this.getUserProfile(id);
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE user_profiles 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUserProfile(result.rows[0]);
  }

  // Assessment Session operations
  async createAssessmentSession(session: AssessmentSession): Promise<AssessmentSession> {
    const query = `
      INSERT INTO assessment_sessions (
        id, user_id, assessment_type, status, start_time,
        modality_used, cultural_adaptations, current_question_index, total_questions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      session.id,
      session.userId,
      session.assessmentType,
      session.status,
      session.startTime,
      session.modalityUsed,
      session.culturalAdaptations,
      session.currentQuestionIndex,
      session.totalQuestions,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToAssessmentSession(result.rows[0]);
  }

  async getAssessmentSession(id: string): Promise<AssessmentSession | null> {
    const query = 'SELECT * FROM assessment_sessions WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToAssessmentSession(result.rows[0]);
  }

  async updateAssessmentSession(id: string, updates: Partial<AssessmentSession>): Promise<AssessmentSession | null> {
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }

    if (updates.currentQuestionIndex !== undefined) {
      updateFields.push(`current_question_index = $${paramIndex++}`);
      values.push(updates.currentQuestionIndex);
    }

    if (updates.completionTime !== undefined) {
      updateFields.push(`completion_time = $${paramIndex++}`);
      values.push(updates.completionTime);
    }

    if (updates.durationMinutes !== undefined) {
      updateFields.push(`duration_minutes = $${paramIndex++}`);
      values.push(updates.durationMinutes);
    }

    if (updateFields.length === 0) {
      return this.getAssessmentSession(id);
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE assessment_sessions 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToAssessmentSession(result.rows[0]);
  }

  // Helper methods to map database rows to models
  private mapRowToUserProfile(row: any): UserProfile {
    return {
      id: row.id,
      email: row.email,
      demographics: {
        ageRange: row.age_range,
        geographicRegion: row.geographic_region,
        culturalContext: row.cultural_context || [],
        languages: row.languages || [],
      },
      professional: {
        industry: row.industry,
        roleLevel: row.role_level,
        organizationSize: row.organization_size,
        decisionAuthority: row.decision_authority,
        yearsExperience: row.years_experience,
      },
      preferences: {
        assessmentModality: row.assessment_modality || [],
        learningStyle: row.learning_style,
        communicationPreference: row.communication_preference,
        timezone: row.timezone,
      },
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapRowToAssessmentSession(row: any): AssessmentSession {
    return {
      id: row.id,
      userId: row.user_id,
      assessmentType: row.assessment_type,
      status: row.status,
      startTime: new Date(row.start_time),
      completionTime: row.completion_time ? new Date(row.completion_time) : undefined,
      durationMinutes: row.duration_minutes,
      modalityUsed: row.modality_used,
      culturalAdaptations: row.cultural_adaptations || [],
      currentQuestionIndex: row.current_question_index,
      totalQuestions: row.total_questions,
      responses: [], // Will be loaded separately
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT NOW()');
      return result.rows.length > 0;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}