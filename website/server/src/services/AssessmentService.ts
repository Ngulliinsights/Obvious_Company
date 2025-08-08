/**
 * Assessment Service
 * Core business logic for assessment functionality
 * Requirements: 5.4, 9.4, 10.1
 */

import { v4 as uuidv4 } from 'uuid';
import { AssessmentRepository } from '../repositories/assessmentRepository';
import { 
  AssessmentType, 
  AssessmentStatus,
  Question,
  QuestionType,
  AssessmentSession,
  AssessmentResponse,
  UserProfile
} from '../types/assessment';
import { AssessmentProcessingError } from '../utils/errorHandler';

export class AssessmentService {
  private repository = new AssessmentRepository();

  /**
   * Create a new assessment session
   */
  async createAssessment(
    sessionId: string,
    userId: string,
    assessmentType: AssessmentType,
    userProfile?: Partial<UserProfile>
  ): Promise<AssessmentSession> {
    try {
      // Get initial question for the assessment type
      const firstQuestion = await this.getFirstQuestion(assessmentType, userProfile);
      
      // Create session metadata
      const metadata = {
        start_time: new Date(),
        modality_used: assessmentType,
        cultural_adaptations: this.determineCulturalAdaptations(userProfile),
        progress_percentage: 0,
        current_question_index: 0
      };

      // Create assessment session
      const session: AssessmentSession = {
        id: sessionId,
        user_id: userId,
        assessment_type: assessmentType,
        status: AssessmentStatus.IN_PROGRESS,
        responses: [],
        metadata,
        created_at: new Date(),
        updated_at: new Date()
      };

      return session;
    } catch (error) {
      throw new AssessmentProcessingError(
        `Failed to create assessment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { sessionId, userId, assessmentType }
      );
    }
  }

  /**
   * Get the first question for an assessment type
   */
  async getFirstQuestion(
    assessmentType: AssessmentType,
    userProfile?: Partial<UserProfile>
  ): Promise<Question> {
    const questions = await this.getQuestionsForType(assessmentType, userProfile);
    return questions[0];
  }

  /**
   * Get questions for a specific assessment type
   */
  async getQuestionsForType(
    assessmentType: AssessmentType,
    userProfile?: Partial<UserProfile>
  ): Promise<Question[]> {
    const baseQuestions = this.getBaseQuestions(assessmentType);
    
    // Apply cultural adaptations if needed
    if (userProfile?.demographics?.cultural_context) {
      return this.applyCulturalAdaptations(baseQuestions, userProfile.demographics.cultural_context);
    }

    return baseQuestions;
  }

  /**
   * Process a response and get the next question
   */
  async processResponse(
    sessionId: string,
    questionId: string,
    responseValue: any,
    confidenceLevel?: number,
    interactionMetadata?: any
  ): Promise<{ nextQuestion?: Question; isComplete: boolean; progress: any }> {
    try {
      // Store the response
      const response: AssessmentResponse = {
        id: uuidv4(),
        question_id: questionId,
        user_id: '', // Will be filled by repository
        session_id: sessionId,
        response_value: responseValue,
        response_time_ms: interactionMetadata?.responseTime || 0,
        confidence_level: confidenceLevel,
        metadata: {
          timestamp: new Date(),
          user_agent: interactionMetadata?.userAgent,
          interaction_data: interactionMetadata
        }
      };

      await this.repository.saveResponse(response);

      // Get session to determine next question
      const session = await this.repository.getSession(sessionId);
      const allQuestions = await this.getQuestionsForType(session.assessment_type);
      
      const currentIndex = session.metadata.current_question_index;
      const nextIndex = currentIndex + 1;
      
      // Calculate progress
      const progress = {
        current_step: nextIndex,
        total_steps: allQuestions.length,
        percentage: Math.round((nextIndex / allQuestions.length) * 100)
      };

      // Check if assessment is complete
      if (nextIndex >= allQuestions.length) {
        await this.repository.updateSessionStatus(sessionId, AssessmentStatus.COMPLETED);
        return { isComplete: true, progress };
      }

      // Get next question
      const nextQuestion = allQuestions[nextIndex];
      
      // Update session progress
      await this.repository.updateSessionProgress(sessionId, nextIndex, progress.percentage);

      return { nextQuestion, isComplete: false, progress };
    } catch (error) {
      throw new AssessmentProcessingError(
        `Failed to process response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { sessionId, questionId }
      );
    }
  }

  /**
   * Get base questions for assessment type
   */
  private getBaseQuestions(assessmentType: AssessmentType): Question[] {
    const baseQuestions: { [key in AssessmentType]: Question[] } = {
      [AssessmentType.QUESTIONNAIRE]: this.getQuestionnaireQuestions(),
      [AssessmentType.SCENARIO_BASED]: this.getScenarioQuestions(),
      [AssessmentType.CONVERSATIONAL]: this.getConversationalQuestions(),
      [AssessmentType.VISUAL_PATTERN]: this.getVisualQuestions(),
      [AssessmentType.BEHAVIORAL]: this.getBehavioralQuestions()
    };

    return baseQuestions[assessmentType] || [];
  }

  /**
   * Get questionnaire-style questions
   */
  private getQuestionnaireQuestions(): Question[] {
    return [
      {
        id: uuidv4(),
        type: QuestionType.SCALE_RATING,
        text: "How would you rate your organization's current AI readiness?",
        description: "Consider your technology infrastructure, team capabilities, and strategic alignment.",
        options: [
          { id: uuidv4(), text: "Not ready at all", value: 1 },
          { id: uuidv4(), text: "Somewhat ready", value: 3 },
          { id: uuidv4(), text: "Moderately ready", value: 5 },
          { id: uuidv4(), text: "Very ready", value: 7 },
          { id: uuidv4(), text: "Completely ready", value: 10 }
        ],
        validation_rules: [{ type: 'required', message: 'Please select a rating' }],
        weight: 1.0,
        dimension: 'strategic_authority'
      },
      {
        id: uuidv4(),
        type: QuestionType.MULTIPLE_CHOICE,
        text: "What is your primary role in AI decision-making within your organization?",
        options: [
          { id: uuidv4(), text: "Final decision maker", value: "decision_maker" },
          { id: uuidv4(), text: "Strong influencer", value: "influencer" },
          { id: uuidv4(), text: "Implementer/contributor", value: "contributor" },
          { id: uuidv4(), text: "Observer/learner", value: "observer" }
        ],
        validation_rules: [{ type: 'required', message: 'Please select your role' }],
        weight: 1.2,
        dimension: 'organizational_influence'
      },
      {
        id: uuidv4(),
        type: QuestionType.SCALE_RATING,
        text: "What is your organization's budget range for AI initiatives?",
        options: [
          { id: uuidv4(), text: "Under $10K", value: 1 },
          { id: uuidv4(), text: "$10K - $25K", value: 3 },
          { id: uuidv4(), text: "$25K - $50K", value: 5 },
          { id: uuidv4(), text: "$50K - $100K", value: 7 },
          { id: uuidv4(), text: "Over $100K", value: 10 }
        ],
        validation_rules: [{ type: 'required', message: 'Please select a budget range' }],
        weight: 1.0,
        dimension: 'resource_availability'
      }
    ];
  }

  /**
   * Get scenario-based questions
   */
  private getScenarioQuestions(): Question[] {
    return [
      {
        id: uuidv4(),
        type: QuestionType.SCENARIO_RESPONSE,
        text: "Your team is considering implementing AI to automate a key business process. What's your first step?",
        description: "Consider this scenario and choose the approach that best matches your leadership style.",
        options: [
          { id: uuidv4(), text: "Conduct a comprehensive strategic analysis", value: "strategic_analysis" },
          { id: uuidv4(), text: "Start with a small pilot project", value: "pilot_project" },
          { id: uuidv4(), text: "Research what competitors are doing", value: "competitive_research" },
          { id: uuidv4(), text: "Consult with external experts", value: "expert_consultation" }
        ],
        validation_rules: [{ type: 'required', message: 'Please select an approach' }],
        weight: 1.5,
        dimension: 'implementation_readiness'
      }
    ];
  }

  /**
   * Get conversational questions
   */
  private getConversationalQuestions(): Question[] {
    return [
      {
        id: uuidv4(),
        type: QuestionType.TEXT_INPUT,
        text: "Tell me about your biggest challenge in implementing AI in your organization.",
        description: "Please describe in your own words what obstacles you face.",
        validation_rules: [
          { type: 'required', message: 'Please provide a response' },
          { type: 'min_length', value: 20, message: 'Please provide at least 20 characters' }
        ],
        weight: 1.0,
        dimension: 'implementation_readiness'
      }
    ];
  }

  /**
   * Get visual pattern questions
   */
  private getVisualQuestions(): Question[] {
    return [
      {
        id: uuidv4(),
        type: QuestionType.VISUAL_SELECTION,
        text: "Which workflow diagram best represents your current decision-making process?",
        description: "Select the pattern that most closely matches your organization's approach.",
        options: [
          { id: uuidv4(), text: "Hierarchical (top-down)", value: "hierarchical" },
          { id: uuidv4(), text: "Collaborative (consensus)", value: "collaborative" },
          { id: uuidv4(), text: "Agile (iterative)", value: "agile" },
          { id: uuidv4(), text: "Data-driven (analytical)", value: "data_driven" }
        ],
        validation_rules: [{ type: 'required', message: 'Please select a pattern' }],
        weight: 1.0,
        dimension: 'organizational_influence'
      }
    ];
  }

  /**
   * Get behavioral observation questions
   */
  private getBehavioralQuestions(): Question[] {
    return [
      {
        id: uuidv4(),
        type: QuestionType.BEHAVIORAL_OBSERVATION,
        text: "How do you typically approach learning about new technologies?",
        description: "Your interaction pattern will help us understand your learning preferences.",
        options: [
          { id: uuidv4(), text: "Deep research first", value: "research_first" },
          { id: uuidv4(), text: "Hands-on experimentation", value: "hands_on" },
          { id: uuidv4(), text: "Peer consultation", value: "peer_consultation" },
          { id: uuidv4(), text: "Expert guidance", value: "expert_guidance" }
        ],
        validation_rules: [{ type: 'required', message: 'Please select an approach' }],
        weight: 0.8,
        dimension: 'cultural_alignment'
      }
    ];
  }

  /**
   * Determine cultural adaptations needed
   */
  private determineCulturalAdaptations(userProfile?: Partial<UserProfile>): string[] {
    const adaptations: string[] = [];
    
    if (userProfile?.demographics?.cultural_context) {
      adaptations.push(...userProfile.demographics.cultural_context);
    }
    
    if (userProfile?.demographics?.geographic_region) {
      adaptations.push(userProfile.demographics.geographic_region);
    }

    return adaptations;
  }

  /**
   * Apply cultural adaptations to questions
   */
  private applyCulturalAdaptations(questions: Question[], culturalContext: string[]): Question[] {
    return questions.map(question => {
      if (question.cultural_adaptations) {
        const adaptation = question.cultural_adaptations.find(
          adapt => culturalContext.includes(adapt.culture)
        );
        
        if (adaptation) {
          return {
            ...question,
            text: adaptation.adapted_text,
            options: adaptation.adapted_options || question.options
          };
        }
      }
      
      return question;
    });
  }
}