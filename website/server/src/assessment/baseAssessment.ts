/**
 * Base assessment framework for the AI Integration Assessment Platform
 * Provides polymorphic assessment types and session management
 * Based on requirements 1.1, 4.1, 4.2, 4.3, 4.4
 */

import { 
  AssessmentType, 
  AssessmentSession, 
  AssessmentResponse, 
  Question, 
  UserProfile,
  AssessmentStatus
} from '../types/assessment';
import { AssessmentRepository } from '../repositories/assessmentRepository';
import { validationService } from '../utils/validation';
import { AssessmentProcessingError, AssessmentValidationError } from '../utils/errorHandler';

/**
 * Abstract base class for all assessment types
 */
export abstract class BaseAssessment {
  protected repository = new AssessmentRepository();
  protected sessionId: string;
  protected userId: string;
  protected assessmentType: AssessmentType;
  protected currentSession: AssessmentSession | null = null;

  constructor(sessionId: string, userId: string, assessmentType: AssessmentType) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.assessmentType = assessmentType;
  }

  /**
   * Initialize the assessment session
   */
  async initialize(): Promise<void> {
    this.currentSession = await this.repository.getAssessmentSession(this.sessionId);
    if (!this.currentSession) {
      throw new AssessmentProcessingError('Assessment session not found', {
        sessionId: this.sessionId
      });
    }

    if (this.currentSession.assessment_type !== this.assessmentType) {
      throw new AssessmentProcessingError('Assessment type mismatch', {
        expected: this.assessmentType,
        actual: this.currentSession.assessment_type
      });
    }
  }

  /**
   * Get the current session
   */
  getSession(): AssessmentSession | null {
    return this.currentSession;
  }

  /**
   * Start the assessment
   */
  async start(): Promise<Question> {
    if (!this.currentSession) {
      await this.initialize();
    }

    // Update session status to in progress
    await this.repository.updateAssessmentSession(this.sessionId, {
      status: AssessmentStatus.IN_PROGRESS,
      metadata: {
        ...this.currentSes