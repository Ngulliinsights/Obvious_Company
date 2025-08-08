import { BaseAssessment } from './BaseAssessment';
import { 
  Question, 
  AssessmentResponse, 
  UserContext,
  PersonaType
} from '../../models/types';
import { AssessmentSession } from '../../models/AssessmentSession';

interface BehavioralMetric {
  id: string;
  name: string;
  description: string;
  measurementType: 'time_based' | 'interaction_based' | 'pattern_based';
  personaIndicators: Record<PersonaType, number[]>; // threshold ranges
}

interface BehavioralObservation {
  timestamp: Date;
  metricId: string;
  value: number;
  context: string;
  sessionPhase: 'start' | 'middle' | 'end';
}

export class BehavioralAssessment extends BaseAssessment {
  private behavioralMetrics: BehavioralMetric[] = [];
  private observations: BehavioralObservation[] = [];
  private sessionStartTime: Date;
  private interactionCount: number = 0;

  constructor(userContext: UserContext, session: AssessmentSession) {
    super('behavioral-observation', userContext, session);
    this.sessionStartTime = new Date();
  }

  /**
   * Initialize behavioral assessment
   */
  protected async initializeQuestions(): Promise<Question[]> {
    await this.setupBehavioralMetrics();
    return this.createBehavioralQuestions();
  }

  /**
   * Setup behavioral metrics for observation
   */
  private async setupBehavioralMetrics(): Promise<void> {
    this.behavioralMetrics = [
      {
        id: 'response_time',
        name: 'Response Time',
        description: 'Time taken to respond to questions',
        measurementType: 'time_based',
        personaIndicators: {
          'Strategic Architect': [10, 30], // Quick, decisive responses
          'Strategic Catalyst': [15, 45], // Thoughtful but timely
          'Strategic Contributor': [20, 60], // Careful consideration
          'Strategic Explorer': [30, 90], // Thorough exploration
          'Strategic Observer': [45, 120] // Cautious, detailed analysis
        }
      },
      {
        id: 'question_revisits',
        name: 'Question Revisits',
        description: 'Number of times user revisits or changes responses',
        measurementType: 'interaction_based',
        personaIndicators: {
          'Strategic Architect': [0, 1], // Confident, minimal changes
          'Strategic Catalyst': [1, 2], // Some refinement
          'Strategic Contributor': [1, 3], // Moderate adjustments
          'Strategic Explorer': [2, 5], // Exploration and refinement
          'Strategic Observer': [3, 7] // Careful reconsideration
        }
      },
      {
        id: 'engagement_depth',
        name: 'Engagement Depth',
        description: 'Depth of engagement with assessment content',
        measurementType: 'pattern_based',
        personaIndicators: {
          'Strategic Architect': [3, 5], // High-level focus
          'Strategic Catalyst': [4, 7], // Balanced engagement
          'Strategic Contributor': [5, 8], // Detailed engagement
          'Strategic Explorer': [6, 9], // Deep exploration
          'Strategic Observer': [7, 10] // Comprehensive analysis
        }
      },
      {
        id: 'decision_confidence',
        name: 'Decision Confidence',
        description: 'Confidence level in responses based on interaction patterns',
        measurementType: 'pattern_based',
        personaIndicators: {
          'Strategic Architect': [8, 10], // High confidence
          'Strategic Catalyst': [7, 9], // Strong confidence
          'Strategic Contributor': [6, 8], // Moderate confidence
          'Strategic Explorer': [5, 7], // Exploratory confidence
          'Strategic Observer': [4, 6] // Cautious confidence
        }
      }
    ];
  }

  /**
   * Create behavioral observation questions
   */
  private createBehavioralQuestions(): Question[] {
    return [
      {
        id: 'beh_001',
        type: 'behavioral_observation',
        text: 'This assessment will observe your interaction patterns to better understand your decision-making style. Please proceed naturally through the following scenarios.',
        culturalAdaptations: {
          'kenyan': 'This assessment will watch how you interact to understand your decision-making style. Please go through the scenarios normally.',
          'east_african': 'This assessment observes your interaction patterns to understand how you make decisions. Please proceed naturally.'
        }
      },
      {
        id: 'beh_002',
        type: 'multiple_choice',
        text: 'When faced with a complex business decision, what is your typical first step?',
        options: [
          'Make a quick decision based on experience',
          'Gather additional information and data',
          'Consult with key stakeholders',
          'Analyze potential risks and benefits',
          'Look for similar past situations for guidance'
        ],
        culturalAdaptations: {
          'kenyan': 'When you have a difficult business decision to make, what do you usually do first?',
          'east_african': 'What is your first step when facing a complex business decision?'
        }
      },
      {
        id: 'beh_003',
        type: 'scale_rating',
        text: 'How comfortable are you with making decisions under uncertainty?',
        scaleRange: { 
          min: 1, 
          max: 10, 
          labels: ['Very uncomfortable', 'Neutral', 'Very comfortable'] 
        },
        culturalAdaptations: {
          'kenyan': 'How comfortable are you making decisions when you don\'t have all the information?',
          'east_african': 'Rate your comfort level with making decisions in uncertain situations.'
        }
      }
    ];
  }  
/**
   * Process behavioral response with observation tracking
   */
  protected async processResponse(
    response: AssessmentResponse,
    currentQuestion: Question
  ): Promise<void> {
    this.interactionCount++;
    
    // Record behavioral observations
    await this.recordBehavioralObservations(response, currentQuestion);
    
    // Analyze behavioral patterns
    const behavioralAnalysis = await this.analyzeBehavioralPatterns();
    
    // Enhanced response with behavioral data
    const enhancedResponse: AssessmentResponse = {
      ...response,
      responseValue: {
        originalResponse: response.responseValue,
        behavioralMetrics: this.getCurrentMetrics(),
        behavioralAnalysis: behavioralAnalysis,
        interactionCount: this.interactionCount
      }
    };

    this.session = {
      ...this.session,
      responses: [...this.session.responses, enhancedResponse],
      currentQuestionIndex: this.session.currentQuestionIndex + 1,
      updatedAt: new Date()
    };
  }

  /**
   * Record behavioral observations
   */
  private async recordBehavioralObservations(
    response: AssessmentResponse,
    currentQuestion: Question
  ): Promise<void> {
    const now = new Date();
    const sessionDuration = now.getTime() - this.sessionStartTime.getTime();
    const sessionPhase = this.determineSessionPhase(sessionDuration);

    // Record response time
    if (response.responseTimeSeconds) {
      this.observations.push({
        timestamp: now,
        metricId: 'response_time',
        value: response.responseTimeSeconds,
        context: `Question: ${currentQuestion.id}`,
        sessionPhase: sessionPhase
      });
    }

    // Record engagement depth based on response complexity
    const engagementDepth = this.calculateEngagementDepth(response, currentQuestion);
    this.observations.push({
      timestamp: now,
      metricId: 'engagement_depth',
      value: engagementDepth,
      context: `Question type: ${currentQuestion.type}`,
      sessionPhase: sessionPhase
    });

    // Record decision confidence based on response patterns
    const decisionConfidence = this.calculateDecisionConfidence(response);
    this.observations.push({
      timestamp: now,
      metricId: 'decision_confidence',
      value: decisionConfidence,
      context: `Response pattern analysis`,
      sessionPhase: sessionPhase
    });
  }

  /**
   * Determine current session phase
   */
  private determineSessionPhase(sessionDuration: number): 'start' | 'middle' | 'end' {
    const durationMinutes = sessionDuration / (1000 * 60);
    
    if (durationMinutes < 5) return 'start';
    if (durationMinutes < 15) return 'middle';
    return 'end';
  }

  /**
   * Calculate engagement depth from response
   */
  private calculateEngagementDepth(response: AssessmentResponse, question: Question): number {
    let depth = 5; // Base engagement level

    // Adjust based on question type
    switch (question.type) {
      case 'text_input':
        const textLength = (response.responseValue as string)?.length || 0;
        depth += Math.min(textLength / 50, 3); // Up to 3 points for longer responses
        break;
      case 'multiple_choice':
        depth += 1; // Standard engagement
        break;
      case 'scale_rating':
        depth += 2; // Thoughtful rating
        break;
      case 'scenario_selection':
        depth += 3; // Complex scenario analysis
        break;
      case 'visual_pattern':
        depth += 2; // Visual analysis
        break;
    }

    // Adjust based on response time
    if (response.responseTimeSeconds) {
      if (response.responseTimeSeconds > 30) {
        depth += 1; // Thoughtful consideration
      }
      if (response.responseTimeSeconds > 60) {
        depth += 1; // Deep consideration
      }
    }

    return Math.min(depth, 10);
  }

  /**
   * Calculate decision confidence from response patterns
   */
  private calculateDecisionConfidence(response: AssessmentResponse): number {
    let confidence = 5; // Base confidence level

    // Analyze response characteristics
    if (response.responseTimeSeconds) {
      // Quick responses may indicate high confidence
      if (response.responseTimeSeconds < 15) {
        confidence += 2;
      }
      // Very slow responses may indicate uncertainty
      else if (response.responseTimeSeconds > 90) {
        confidence -= 1;
      }
    }

    // Analyze response content for confidence indicators
    if (typeof response.responseValue === 'string') {
      const responseText = response.responseValue.toLowerCase();
      
      // Confidence indicators
      const confidenceWords = ['definitely', 'certainly', 'absolutely', 'clearly', 'obviously'];
      const uncertaintyWords = ['maybe', 'perhaps', 'possibly', 'might', 'unsure', 'not sure'];
      
      if (confidenceWords.some(word => responseText.includes(word))) {
        confidence += 2;
      }
      if (uncertaintyWords.some(word => responseText.includes(word))) {
        confidence -= 2;
      }
    }

    return Math.max(1, Math.min(confidence, 10));
  }

  /**
   * Get current behavioral metrics
   */
  private getCurrentMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};

    for (const metric of this.behavioralMetrics) {
      const relevantObservations = this.observations.filter(obs => obs.metricId === metric.id);
      
      if (relevantObservations.length > 0) {
        const values = relevantObservations.map(obs => obs.value);
        metrics[metric.id] = values.reduce((sum, val) => sum + val, 0) / values.length;
      }
    }

    return metrics;
  }  /*
*
   * Analyze behavioral patterns for persona prediction
   */
  private async analyzeBehavioralPatterns(): Promise<Record<string, any>> {
    const currentMetrics = this.getCurrentMetrics();
    const personaScores: Record<PersonaType, number> = {
      'Strategic Architect': 0,
      'Strategic Catalyst': 0,
      'Strategic Contributor': 0,
      'Strategic Explorer': 0,
      'Strategic Observer': 0
    };

    // Score each persona based on behavioral metrics
    for (const metric of this.behavioralMetrics) {
      const currentValue = currentMetrics[metric.id];
      
      if (currentValue !== undefined) {
        for (const [persona, range] of Object.entries(metric.personaIndicators)) {
          const [min, max] = range;
          
          // Calculate how well the current value fits this persona's range
          if (currentValue >= min && currentValue <= max) {
            // Perfect fit
            personaScores[persona as PersonaType] += 3;
          } else {
            // Calculate proximity score
            const distance = Math.min(
              Math.abs(currentValue - min),
              Math.abs(currentValue - max)
            );
            const maxDistance = Math.max(max - min, 10);
            const proximityScore = Math.max(0, 2 - (distance / maxDistance) * 2);
            personaScores[persona as PersonaType] += proximityScore;
          }
        }
      }
    }

    // Determine likely persona
    const likelyPersona = Object.entries(personaScores).reduce((max, [persona, score]) => 
      score > max.score ? { persona: persona as PersonaType, score } : max,
      { persona: 'Strategic Observer' as PersonaType, score: 0 }
    );

    return {
      personaScores,
      likelyPersona: likelyPersona.persona,
      confidence: Math.min(likelyPersona.score / 12, 1), // Normalize to 0-1
      behavioralProfile: this.generateBehavioralProfile(currentMetrics),
      observationCount: this.observations.length
    };
  }

  /**
   * Generate behavioral profile summary
   */
  private generateBehavioralProfile(metrics: Record<string, number>): Record<string, string> {
    const profile: Record<string, string> = {};

    // Response time profile
    const avgResponseTime = metrics['response_time'] || 0;
    if (avgResponseTime < 20) {
      profile.responseStyle = 'Quick and decisive';
    } else if (avgResponseTime < 45) {
      profile.responseStyle = 'Thoughtful and balanced';
    } else {
      profile.responseStyle = 'Careful and deliberate';
    }

    // Engagement profile
    const engagementDepth = metrics['engagement_depth'] || 5;
    if (engagementDepth > 7) {
      profile.engagementStyle = 'Deep and thorough';
    } else if (engagementDepth > 5) {
      profile.engagementStyle = 'Balanced and focused';
    } else {
      profile.engagementStyle = 'Efficient and direct';
    }

    // Confidence profile
    const confidence = metrics['decision_confidence'] || 5;
    if (confidence > 7) {
      profile.confidenceLevel = 'High confidence in decisions';
    } else if (confidence > 5) {
      profile.confidenceLevel = 'Moderate confidence with consideration';
    } else {
      profile.confidenceLevel = 'Cautious and analytical approach';
    }

    return profile;
  }  
/**
   * Determine next behavioral question
   */
  protected async determineNextQuestion(
    responses: AssessmentResponse[],
    currentIndex: number
  ): Promise<Question | null> {
    // Analyze current behavioral patterns
    const behavioralAnalysis = await this.analyzeBehavioralPatterns();
    
    // Generate adaptive questions based on observed patterns
    if (this.shouldGenerateAdaptiveQuestion(behavioralAnalysis)) {
      return this.generateAdaptiveBehavioralQuestion(behavioralAnalysis);
    }

    return null;
  }

  /**
   * Check if adaptive question should be generated
   */
  private shouldGenerateAdaptiveQuestion(analysis: Record<string, any>): boolean {
    // Generate adaptive question if confidence is low or patterns are unclear
    return analysis.confidence < 0.7 && this.observations.length >= 3;
  }

  /**
   * Generate adaptive behavioral question
   */
  private generateAdaptiveBehavioralQuestion(analysis: Record<string, any>): Question {
    const likelyPersona = analysis.likelyPersona as PersonaType;
    
    // Generate question based on likely persona to confirm or refine understanding
    let questionText = '';
    let options: string[] = [];

    switch (likelyPersona) {
      case 'Strategic Architect':
        questionText = 'When implementing organization-wide changes, what is your primary focus?';
        options = [
          'Ensuring strategic alignment with long-term vision',
          'Managing stakeholder expectations and buy-in',
          'Optimizing resource allocation and ROI',
          'Minimizing operational disruption',
          'Building consensus among leadership team'
        ];
        break;
        
      case 'Strategic Catalyst':
        questionText = 'How do you typically drive adoption of new initiatives?';
        options = [
          'Lead by example and demonstrate value',
          'Build coalition of supporters across departments',
          'Create compelling business case with data',
          'Address concerns and resistance directly',
          'Provide training and support resources'
        ];
        break;
        
      default:
        questionText = 'What motivates you most when evaluating new business opportunities?';
        options = [
          'Potential for significant impact',
          'Alignment with personal values',
          'Learning and growth opportunities',
          'Risk-reward balance',
          'Team and organizational benefits'
        ];
    }

    return {
      id: `beh_adaptive_${Date.now()}`,
      type: 'multiple_choice',
      text: questionText,
      options: options,
      culturalAdaptations: {
        'kenyan': questionText.replace('organization-wide', 'company-wide'),
        'east_african': questionText
      }
    };
  }

  /**
   * Get behavioral assessment summary
   */
  getBehavioralSummary(): Record<string, any> {
    const currentMetrics = this.getCurrentMetrics();
    const sessionDuration = (new Date().getTime() - this.sessionStartTime.getTime()) / (1000 * 60);
    
    return {
      sessionDuration: Math.round(sessionDuration),
      totalInteractions: this.interactionCount,
      behavioralMetrics: currentMetrics,
      observationCount: this.observations.length,
      behavioralProfile: this.generateBehavioralProfile(currentMetrics)
    };
  }
}