import { 
  AssessmentType, 
  Question, 
  AssessmentResponse, 
  NextQuestion, 
  UserContext,
  ResponsePattern,
  QuestionType
} from '../../models/types';
import { AssessmentSession } from '../../models/AssessmentSession';

export abstract class BaseAssessment {
  protected assessmentType: AssessmentType;
  protected questions: Question[] = [];
  protected currentQuestionIndex: number = 0;
  protected userContext: UserContext;
  protected session: AssessmentSession;

  constructor(
    assessmentType: AssessmentType,
    userContext: UserContext,
    session: AssessmentSession
  ) {
    this.assessmentType = assessmentType;
    this.userContext = userContext;
    this.session = session;
  }

  /**
   * Abstract method to initialize assessment-specific questions
   */
  protected abstract initializeQuestions(): Promise<Question[]>;

  /**
   * Abstract method to process responses in assessment-specific way
   */
  protected abstract processResponse(
    response: AssessmentResponse,
    currentQuestion: Question
  ): Promise<void>;

  /**
   * Abstract method to determine next question based on assessment logic
   */
  protected abstract determineNextQuestion(
    responses: AssessmentResponse[],
    currentIndex: number
  ): Promise<Question | null>;

  /**
   * Initialize the assessment with questions
   */
  async initialize(): Promise<void> {
    this.questions = await this.initializeQuestions();
    this.currentQuestionIndex = this.session.currentQuestionIndex;
  }

  /**
   * Get the current question with progress information
   */
  async getCurrentQuestion(): Promise<NextQuestion | null> {
    if (this.currentQuestionIndex >= this.questions.length) {
      return null; // Assessment complete
    }

    const question = this.questions[this.currentQuestionIndex];
    const adaptedQuestion = await this.applyAdaptations(question);

    return {
      question: adaptedQuestion,
      progress: {
        current: this.currentQuestionIndex + 1,
        total: this.questions.length,
        percentage: Math.round(((this.currentQuestionIndex + 1) / this.questions.length) * 100)
      },
      adaptations: {
        culturalContext: this.userContext.culturalContext?.[0],
        industryFocus: this.userContext.industry,
      }
    };
  }

  /**
   * Submit a response and get the next question
   */
  async submitResponse(response: AssessmentResponse): Promise<NextQuestion | null> {
    const currentQuestion = this.questions[this.currentQuestionIndex];
    
    // Validate response
    if (!this.validateResponse(response, currentQuestion)) {
      throw new Error('Invalid response for current question');
    }

    // Process the response
    await this.processResponse(response, currentQuestion);

    // Move to next question
    this.currentQuestionIndex++;

    // Determine next question (may be adaptive)
    const nextQuestion = await this.determineNextQuestion(
      this.session.responses,
      this.currentQuestionIndex
    );

    if (nextQuestion) {
      // Replace or insert adaptive question
      if (this.currentQuestionIndex < this.questions.length) {
        this.questions[this.currentQuestionIndex] = nextQuestion;
      } else {
        this.questions.push(nextQuestion);
      }
    }

    return this.getCurrentQuestion();
  }

  /**
   * Get assessment progress
   */
  getProgress(): { current: number; total: number; percentage: number } {
    return {
      current: this.currentQuestionIndex,
      total: this.questions.length,
      percentage: Math.round((this.currentQuestionIndex / this.questions.length) * 100)
    };
  }

  /**
   * Check if assessment is complete
   */
  isComplete(): boolean {
    return this.currentQuestionIndex >= this.questions.length;
  }

  /**
   * Get assessment type
   */
  getAssessmentType(): AssessmentType {
    return this.assessmentType;
  }

  /**
   * Get all questions (for analysis)
   */
  getQuestions(): Question[] {
    return [...this.questions];
  }

  /**
   * Apply cultural and industry adaptations to questions
   */
  protected async applyAdaptations(question: Question): Promise<Question> {
    let adaptedQuestion = { ...question };

    // Apply cultural adaptations
    if (this.userContext.culturalContext && question.culturalAdaptations) {
      for (const context of this.userContext.culturalContext) {
        if (question.culturalAdaptations[context]) {
          adaptedQuestion.text = question.culturalAdaptations[context];
          break;
        }
      }
    }

    // Apply industry-specific adaptations
    if (this.userContext.industry && question.industrySpecific) {
      adaptedQuestion = await this.applyIndustryAdaptations(adaptedQuestion);
    }

    return adaptedQuestion;
  }

  /**
   * Apply industry-specific adaptations
   */
  protected async applyIndustryAdaptations(question: Question): Promise<Question> {
    // This can be overridden by specific assessment types
    // Default implementation returns question unchanged
    return question;
  }

  /**
   * Validate response against question requirements
   */
  protected validateResponse(response: AssessmentResponse, question: Question): boolean {
    if (response.questionId !== question.id) {
      return false;
    }

    if (response.questionType !== question.type) {
      return false;
    }

    // Type-specific validation
    switch (question.type) {
      case 'multiple_choice':
        return this.validateMultipleChoiceResponse(response, question);
      case 'scale_rating':
        return this.validateScaleRatingResponse(response, question);
      case 'text_input':
        return this.validateTextInputResponse(response, question);
      default:
        return true; // Allow other types to be validated by subclasses
    }
  }

  /**
   * Validate multiple choice response
   */
  private validateMultipleChoiceResponse(response: AssessmentResponse, question: Question): boolean {
    if (!question.options || !Array.isArray(question.options)) {
      return false;
    }
    
    const responseValue = response.responseValue as string;
    return question.options.includes(responseValue);
  }

  /**
   * Validate scale rating response
   */
  private validateScaleRatingResponse(response: AssessmentResponse, question: Question): boolean {
    if (!question.scaleRange) {
      return false;
    }

    const responseValue = response.responseValue as number;
    return responseValue >= question.scaleRange.min && responseValue <= question.scaleRange.max;
  }

  /**
   * Validate text input response
   */
  private validateTextInputResponse(response: AssessmentResponse, _question: Question): boolean {
    const responseValue = response.responseValue as string;
    return typeof responseValue === 'string' && responseValue.trim().length > 0;
  }

  /**
   * Analyze response patterns for adaptive questioning
   */
  protected analyzeResponsePattern(responses: AssessmentResponse[]): ResponsePattern {
    if (responses.length === 0) {
      return {
        averageResponseTime: 0,
        consistencyScore: 1,
        engagementLevel: 1,
        preferredQuestionTypes: [],
        culturalAdaptationsUsed: []
      };
    }

    const responseTimes = responses
      .filter(r => r.responseTimeSeconds !== undefined)
      .map(r => r.responseTimeSeconds!);

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const questionTypes = responses.map(r => r.questionType);
    const typeFrequency = questionTypes.reduce((freq, type) => {
      freq[type] = (freq[type] || 0) + 1;
      return freq;
    }, {} as Record<QuestionType, number>);

    const preferredQuestionTypes = Object.entries(typeFrequency)
      .sort(([, a], [, b]) => b - a)
      .map(([type]) => type as QuestionType);

    // Calculate consistency score based on response time variance
    const consistencyScore = this.calculateConsistencyScore(responseTimes);

    // Calculate engagement level based on response completeness and time
    const engagementLevel = this.calculateEngagementLevel(responses, averageResponseTime);

    return {
      averageResponseTime,
      consistencyScore,
      engagementLevel,
      preferredQuestionTypes,
      culturalAdaptationsUsed: this.session.culturalAdaptations || []
    };
  }

  /**
   * Calculate consistency score based on response time variance
   */
  private calculateConsistencyScore(responseTimes: number[]): number {
    if (responseTimes.length < 2) return 1;

    const mean = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const variance = responseTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / responseTimes.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Normalize to 0-1 scale (lower variance = higher consistency)
    const normalizedVariance = Math.min(standardDeviation / mean, 1);
    return Math.max(0, 1 - normalizedVariance);
  }

  /**
   * Calculate engagement level based on response quality
   */
  private calculateEngagementLevel(responses: AssessmentResponse[], averageResponseTime: number): number {
    let engagementScore = 0;
    let factors = 0;

    // Factor 1: Response completeness
    const completeResponses = responses.filter(r => 
      r.responseValue !== null && 
      r.responseValue !== undefined && 
      r.responseValue !== ''
    ).length;
    
    if (responses.length > 0) {
      engagementScore += (completeResponses / responses.length);
      factors++;
    }

    // Factor 2: Response time appropriateness (not too fast, not too slow)
    if (averageResponseTime > 0) {
      const optimalTime = 30; // 30 seconds as optimal
      const timeScore = Math.max(0, 1 - Math.abs(averageResponseTime - optimalTime) / optimalTime);
      engagementScore += timeScore;
      factors++;
    }

    return factors > 0 ? engagementScore / factors : 1;
  }
}