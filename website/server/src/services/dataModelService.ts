/**
 * Data model service for the AI Integration Assessment Platform
 * Provides high-level operations for assessment data management
 */

import { AssessmentRepository } from '../repositories/assessmentRepository';
import { validationService } from '../utils/validation';
import { 
  UserProfile, 
  AssessmentSession, 
  AssessmentResponse, 
  AssessmentResults,
  AssessmentType,
  CreateAssessmentRequest,
  CreateAssessmentResponse,
  SubmitResponseRequest,
  SubmitResponseResponse
} from '../types/assessment';
import { 
  AssessmentValidationError, 
  AssessmentProcessingError 
} from '../utils/errorHandler';

export class DataModelService {
  private repository = new AssessmentRepository();

  /**
   * Create a new user profile with validation
   */
  async createUserProfile(userProfile: Partial<UserProfile>): Promise<string> {
    // Validate user profile
    const validation = validationService.validateUserProfile(userProfile);
    if (!validation.isValid) {
      throw new AssessmentValidationError('Invalid user profile data', validation.errors);
    }

    return await this.repository.createUser(userProfile);
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId || typeof userId !== 'string') {
      throw new AssessmentValidationError('Invalid user ID', [
        { field: 'userId', message: 'User ID is required and must be a string', code: 'INVALID_USER_ID' }
      ]);
    }

    return await this.repository.getUserById(userId);
  }

  /**
   * Update user profile with validation
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    // Validate updates
    const validation = validationService.validateUserProfile(updates);
    if (!validation.isValid) {
      throw new AssessmentValidationError('Invalid user profile updates', validation.errors);
    }

    await this.repository.updateUser(userId, updates);
  }

  /**
   * Create a new assessment session
   */
  async createAssessmentSession(request: CreateAssessmentRequest): Promise<CreateAssessmentResponse> {
    // Validate request
    if (!request.user_profile || !request.assessment_type) {
      throw new AssessmentValidationError('Invalid assessment creation request', [
        { field: 'request', message: 'User profile and assessment type are required', code: 'MISSING_REQUIRED_FIELDS' }
      ]);
    }

    // Create or get user
    let userId: string;
    if (request.user_profile.id) {
      userId = request.user_profile.id;
      // Update existing user profile
      await this.updateUserProfile(userId, request.user_profile);
    } else {
      // Create new user
      userId = await this.createUserProfile(request.user_profile);
    }

    // Create assessment session
    const sessionId = await this.repository.createAssessmentSession(userId, request.assessment_type);

    // Get first question
    const questions = await this.repository.getQuestionsByType(request.assessment_type);
    if (questions.length === 0) {
      throw new AssessmentProcessingError('No questions available for assessment type', {
        assessmentType: request.assessment_type
      });
    }

    const firstQuestion = questions[0];

    return {
      session_id: sessionId,
      first_question: firstQuestion,
      progress: {
        current_step: 1,
        total_steps: questions.length,
        percentage: 0
      }
    };
  }

  /**
   * Get assessment session with validation
   */
  async getAssessmentSession(sessionId: string): Promise<AssessmentSession | null> {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new AssessmentValidationError('Invalid session ID', [
        { field: 'sessionId', message: 'Session ID is required and must be a string', code: 'INVALID_SESSION_ID' }
      ]);
    }

    return await this.repository.getAssessmentSession(sessionId);
  }

  /**
   * Submit assessment response with validation
   */
  async submitAssessmentResponse(request: SubmitResponseRequest): Promise<SubmitResponseResponse> {
    // Get session to validate it exists and get context
    const session = await this.getAssessmentSession(request.session_id);
    if (!session) {
      throw new AssessmentProcessingError('Assessment session not found', {
        sessionId: request.session_id
      });
    }

    // Get question to validate response
    const question = await this.repository.getQuestionById(request.question_id);
    if (!question) {
      throw new AssessmentProcessingError('Question not found', {
        questionId: request.question_id
      });
    }

    // Create response record
    const responseData: Omit<AssessmentResponse, 'id'> = {
      question_id: request.question_id,
      user_id: session.user_id,
      session_id: request.session_id,
      response_value: request.response_value,
      response_time_ms: Date.now(), // This should come from frontend timing
      confidence_level: request.confidence_level,
      metadata: {
        timestamp: new Date(),
        ...request.interaction_metadata
      }
    };

    // Validate response
    const validation = validationService.validateAssessmentResponse(responseData);
    if (!validation.isValid) {
      throw new AssessmentValidationError('Invalid assessment response', validation.errors);
    }

    // Save response
    await this.repository.createAssessmentResponse(responseData);

    // Get all questions for this assessment type to determine progress
    const allQuestions = await this.repository.getQuestionsByType(session.assessment_type);
    const currentQuestionIndex = allQuestions.findIndex(q => q.id === request.question_id);
    const nextQuestionIndex = currentQuestionIndex + 1;
    
    const progress = {
      current_step: nextQuestionIndex + 1,
      total_steps: allQuestions.length,
      percentage: Math.round((nextQuestionIndex / allQuestions.length) * 100)
    };

    // Update session progress
    await this.repository.updateAssessmentSession(request.session_id, {
      metadata: {
        ...session.metadata,
        progress_percentage: progress.percentage,
        current_question_index: nextQuestionIndex
      }
    });

    // Check if assessment is complete
    const isComplete = nextQuestionIndex >= allQuestions.length;
    
    let results: AssessmentResults | undefined;
    if (isComplete) {
      // Mark session as completed
      await this.repository.updateAssessmentSession(request.session_id, {
        status: 'completed',
        metadata: {
          ...session.metadata,
          completion_time: new Date(),
          duration_minutes: Math.round((Date.now() - session.metadata.start_time.getTime()) / 60000)
        }
      });

      // Generate results (this would be implemented in the scoring service)
      // For now, return placeholder
      results = await this.generatePlaceholderResults(request.session_id, session.user_id);
    }

    return {
      success: true,
      next_question: isComplete ? undefined : allQuestions[nextQuestionIndex],
      is_complete: isComplete,
      progress,
      results
    };
  }

  /**
   * Get assessment results
   */
  async getAssessmentResults(sessionId: string): Promise<AssessmentResults | null> {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new AssessmentValidationError('Invalid session ID', [
        { field: 'sessionId', message: 'Session ID is required and must be a string', code: 'INVALID_SESSION_ID' }
      ]);
    }

    return await this.repository.getAssessmentResults(sessionId);
  }

  /**
   * Generate placeholder results (to be replaced by actual scoring algorithm)
   */
  private async generatePlaceholderResults(sessionId: string, userId: string): Promise<AssessmentResults> {
    const placeholderResults: Omit<AssessmentResults, 'id' | 'created_at' | 'calculated_at'> = {
      session_id: sessionId,
      user_id: userId,
      overall_score: 75,
      dimension_scores: {
        strategic_authority: 80,
        organizational_influence: 70,
        resource_availability: 85,
        implementation_readiness: 65,
        cultural_alignment: 90
      },
      persona_classification: {
        primary_persona: 'strategic_catalyst',
        confidence_score: 0.85,
        secondary_characteristics: ['innovative', 'collaborative'],
        persona_description: 'A strategic catalyst with strong influence capabilities and cultural alignment'
      },
      industry_insights: {
        sector_readiness: 75,
        regulatory_considerations: ['Data privacy compliance', 'Industry-specific AI governance'],
        implementation_priorities: ['Leadership alignment', 'Technical infrastructure', 'Change management'],
        market_maturity_level: 'developing'
      },
      recommendations: {
        program_recommendation: 'Strategic Systems Program',
        service_tier_recommendation: 'Strategic Systems',
        next_steps: [
          'Schedule strategic consultation',
          'Conduct organizational readiness audit',
          'Develop implementation roadmap'
        ],
        timeline_suggestion: '3-6 months for full implementation',
        resource_requirements: ['Executive sponsorship', 'Technical team', 'Change management support'],
        investment_range: '$25K-40K'
      },
      curriculum_pathway: {
        pathway_id: 'strategic_catalyst_pathway',
        foundation_modules: [],
        industry_modules: [],
        role_specific_modules: [],
        cultural_adaptation_modules: [],
        estimated_duration: {
          total_hours: 40,
          weekly_commitment: 4,
          completion_timeline: '10 weeks'
        },
        learning_objectives: ['Strategic AI leadership', 'Organizational transformation'],
        success_metrics: ['Implementation success rate', 'Team engagement'],
        prerequisites: ['Executive commitment'],
        optional_enhancements: []
      }
    };

    const resultsId = await this.repository.createAssessmentResults(placeholderResults);
    
    return {
      id: resultsId,
      ...placeholderResults,
      created_at: new Date(),
      calculated_at: new Date()
    };
  }

  /**
   * Get assessment analytics
   */
  async getAssessmentAnalytics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    return await this.repository.getAssessmentAnalytics(timeframe);
  }

  /**
   * Validate data model integrity
   */
  async validateDataIntegrity(): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check for orphaned responses
      const orphanedResponses = await this.repository.db.query(`
        SELECT COUNT(*) as count 
        FROM assessment_responses ar 
        LEFT JOIN assessment_sessions s ON ar.session_id = s.id 
        WHERE s.id IS NULL
      `);

      if (parseInt(orphanedResponses.rows[0].count) > 0) {
        issues.push(`Found ${orphanedResponses.rows[0].count} orphaned assessment responses`);
      }

      // Check for sessions without users
      const orphanedSessions = await this.repository.db.query(`
        SELECT COUNT(*) as count 
        FROM assessment_sessions s 
        LEFT JOIN users u ON s.user_id = u.id 
        WHERE u.id IS NULL
      `);

      if (parseInt(orphanedSessions.rows[0].count) > 0) {
        issues.push(`Found ${orphanedSessions.rows[0].count} sessions without valid users`);
      }

      // Check for results without sessions
      const orphanedResults = await this.repository.db.query(`
        SELECT COUNT(*) as count 
        FROM assessment_results r 
        LEFT JOIN assessment_sessions s ON r.session_id = s.id 
        WHERE s.id IS NULL
      `);

      if (parseInt(orphanedResults.rows[0].count) > 0) {
        issues.push(`Found ${orphanedResults.rows[0].count} results without valid sessions`);
      }

    } catch (error) {
      issues.push(`Error during integrity check: ${error}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance
export const dataModelService = new DataModelService();