import { AssessmentType, SessionStatus, AssessmentResponse } from './types';

export interface AssessmentSession {
  id: string;
  userId: string;
  assessmentType: AssessmentType;
  status: SessionStatus;
  
  // Timing
  startTime: Date;
  completionTime?: Date;
  durationMinutes?: number;
  
  // Assessment metadata
  modalityUsed?: string;
  culturalAdaptations?: string[];
  
  // Progress tracking
  currentQuestionIndex: number;
  totalQuestions?: number;
  responses: AssessmentResponse[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export class AssessmentSessionModel {
  constructor(private data: AssessmentSession) {}

  static create(sessionData: {
    id: string;
    userId: string;
    assessmentType: AssessmentType;
    modalityUsed?: string;
    culturalAdaptations?: string[];
  }): AssessmentSession {
    const now = new Date();
    return {
      id: sessionData.id,
      userId: sessionData.userId,
      assessmentType: sessionData.assessmentType,
      status: 'in_progress',
      startTime: now,
      modalityUsed: sessionData.modalityUsed,
      culturalAdaptations: sessionData.culturalAdaptations || [],
      currentQuestionIndex: 0,
      responses: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  getId(): string {
    return this.data.id;
  }

  getUserId(): string {
    return this.data.userId;
  }

  getStatus(): SessionStatus {
    return this.data.status;
  }

  getAssessmentType(): AssessmentType {
    return this.data.assessmentType;
  }

  getCurrentQuestionIndex(): number {
    return this.data.currentQuestionIndex;
  }

  getResponses(): AssessmentResponse[] {
    return [...this.data.responses];
  }

  addResponse(response: AssessmentResponse): AssessmentSession {
    const updatedResponses = [...this.data.responses, response];
    return {
      ...this.data,
      responses: updatedResponses,
      currentQuestionIndex: this.data.currentQuestionIndex + 1,
      updatedAt: new Date(),
    };
  }

  updateProgress(questionIndex: number, totalQuestions?: number): AssessmentSession {
    return {
      ...this.data,
      currentQuestionIndex: questionIndex,
      totalQuestions: totalQuestions || this.data.totalQuestions,
      updatedAt: new Date(),
    };
  }

  complete(): AssessmentSession {
    const completionTime = new Date();
    const durationMinutes = Math.round(
      (completionTime.getTime() - this.data.startTime.getTime()) / (1000 * 60)
    );

    return {
      ...this.data,
      status: 'completed',
      completionTime,
      durationMinutes,
      updatedAt: completionTime,
    };
  }

  abandon(): AssessmentSession {
    return {
      ...this.data,
      status: 'abandoned',
      updatedAt: new Date(),
    };
  }

  getProgress(): { current: number; total: number; percentage: number } {
    const total = this.data.totalQuestions || 1;
    const current = this.data.currentQuestionIndex;
    const percentage = Math.round((current / total) * 100);

    return { current, total, percentage };
  }

  getDuration(): number | undefined {
    if (this.data.completionTime) {
      return Math.round(
        (this.data.completionTime.getTime() - this.data.startTime.getTime()) / (1000 * 60)
      );
    }
    return undefined;
  }

  getCulturalAdaptations(): string[] {
    return this.data.culturalAdaptations || [];
  }

  toJSON(): AssessmentSession {
    return { ...this.data };
  }
}