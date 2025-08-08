import { BaseAssessment } from './assessments/BaseAssessment';
import { AssessmentFactory } from './assessments/AssessmentFactory';
import { 
  AssessmentType, 
  UserContext, 
  AssessmentResponse, 
  NextQuestion 
} from '../models/types';
import { AssessmentSession, AssessmentSessionModel } from '../models/AssessmentSession';

export class AssessmentEngine {
  private currentAssessment: BaseAssessment | null = null;
  private session: AssessmentSession | null = null;

  /**
   * Start a new assessment session
   */
  async startAssessment(
    assessmentType: AssessmentType,
    userContext: UserContext,
    sessionId?: string
  ): Promise<{ session: AssessmentSession; firstQuestion: NextQuestion | null }> {
    // Create new session
    const sessionData = AssessmentSessionModel.create({
      id: sessionId || this.generateSessionId(),
      userId: userContext.userId || 'anonymous',
      assessmentType,
      modalityUsed: assessmentType,
      culturalAdaptations: userContext.culturalContext
    });

    this.session = sessionData;

    // Create assessment instance
    this.currentAssessment = AssessmentFactory.createAssessment(
      assessmentType,
      userContext,
      this.session
    );

    // Initialize assessment
    await this.currentAssessment.initialize();

    // Get first question
    const firstQuestion = await this.currentAssessment.getCurrentQuestion();

    return {
      session: this.session,
      firstQuestion
    };
  }

  /**
   * Submit response and get next question
   */
  async submitResponse(response: AssessmentResponse): Promise<NextQuestion | null> {
    if (!this.currentAssessment) {
      throw new Error('No active assessment session');
    }

    return await this.currentAssessment.submitResponse(response);
  }

  /**
   * Get current assessment progress
   */
  getProgress(): { current: number; total: number; percentage: number } | null {
    if (!this.currentAssessment) {
      return null;
    }

    return this.currentAssessment.getProgress();
  }

  /**
   * Check if assessment is complete
   */
  isComplete(): boolean {
    return this.currentAssessment?.isComplete() || false;
  }

  /**
   * Get current session
   */
  getCurrentSession(): AssessmentSession | null {
    return this.session;
  }

  /**
   * Resume existing assessment session
   */
  async resumeAssessment(
    session: AssessmentSession,
    userContext: UserContext
  ): Promise<NextQuestion | null> {
    this.session = session;
    
    // Recreate assessment instance
    this.currentAssessment = AssessmentFactory.createAssessment(
      session.assessmentType,
      userContext,
      session
    );

    // Initialize and get current question
    await this.currentAssessment.initialize();
    return await this.currentAssessment.getCurrentQuestion();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get available assessment types
   */
  static getAvailableAssessmentTypes(): AssessmentType[] {
    return AssessmentFactory.getAvailableTypes();
  }

  /**
   * Get assessment type metadata
   */
  static getAssessmentMetadata(assessmentType: AssessmentType) {
    return AssessmentFactory.getAssessmentMetadata(assessmentType);
  }

  /**
   * Recommend assessment type for user
   */
  static recommendAssessmentType(userContext: UserContext): AssessmentType {
    return AssessmentFactory.recommendAssessmentType(userContext);
  }
}