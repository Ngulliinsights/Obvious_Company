import { BaseAssessment } from './BaseAssessment';
import { 
  Question, 
  AssessmentResponse, 
  UserContext,
  PersonaType
} from '../../models/types';
import { AssessmentSession } from '../../models/AssessmentSession';

interface ConversationTurn {
  id: string;
  type: 'question' | 'follow_up' | 'clarification';
  text: string;
  expectedResponseType: 'open_ended' | 'structured' | 'confirmation';
  analysisKeywords: string[];
  culturalAdaptations?: Record<string, string>;
  followUpTriggers?: string[];
}

export class ConversationalAssessment extends BaseAssessment {
  private conversationFlow: ConversationTurn[] = [];
  private currentTurn: number = 0;
  private conversationContext: Record<string, any> = {};
  private extractedInsights: Record<string, any> = {};

  constructor(userContext: UserContext, session: AssessmentSession) {
    super('conversational', userContext, session);
  }

  /**
   * Initialize conversational assessment flow
   */
  protected async initializeQuestions(): Promise<Question[]> {
    await this.buildConversationFlow();
    return this.createConversationalQuestions();
  }

  /**
   * Build conversational flow
   */
  private async buildConversationFlow(): Promise<void> {
    this.conversationFlow = [
      {
        id: 'conv_001',
        type: 'question',
        text: 'Tell me about your role and how you typically approach strategic decisions in your organization.',
        expectedResponseType: 'open_ended',
        analysisKeywords: ['decision', 'strategic', 'role', 'authority', 'influence', 'team', 'leadership'],
        culturalAdaptations: {
          'kenyan': 'Please describe your position and how you usually make important business decisions.',
          'east_african': 'Can you explain your role and your approach to making strategic business decisions?'
        },
        followUpTriggers: ['leadership', 'team', 'decisions', 'authority']
      },
      {
        id: 'conv_002',
        type: 'question',
        text: 'What challenges does your organization currently face that you think technology could help solve?',
        expectedResponseType: 'open_ended',
        analysisKeywords: ['challenges', 'problems', 'technology', 'automation', 'efficiency', 'costs', 'competition'],
        culturalAdaptations: {
          'kenyan': 'What problems does your organization have that technology might be able to fix?',
          'east_african': 'What are the main challenges your organization faces that technology could address?'
        },
        followUpTriggers: ['efficiency', 'costs', 'competition', 'automation']
      },
      {
        id: 'conv_003',
        type: 'question',
        text: 'How familiar are you with artificial intelligence, and what interests you most about its potential applications?',
        expectedResponseType: 'structured',
        analysisKeywords: ['AI', 'artificial intelligence', 'automation', 'data', 'insights', 'efficiency', 'innovation'],
        culturalAdaptations: {
          'kenyan': 'How well do you know about AI, and what do you find most interesting about how it could be used?',
          'east_african': 'What is your understanding of AI, and what applications interest you the most?'
        },
        followUpTriggers: ['automation', 'data', 'insights', 'innovation']
      }
    ];
  }

  /**
   * Create conversational questions from flow
   */
  private createConversationalQuestions(): Question[] {
    return this.conversationFlow.map(turn => ({
      id: turn.id,
      type: 'text_input' as const,
      text: turn.text,
      culturalAdaptations: turn.culturalAdaptations,
      industrySpecific: false
    }));
  }

  /**
   * Process conversational response with NLP analysis
   */
  protected async processResponse(
    response: AssessmentResponse,
    currentQuestion: Question
  ): Promise<void> {
    const responseText = response.responseValue as string;
    const turn = this.conversationFlow.find(t => t.id === response.questionId);
    
    if (!turn) return;

    // Analyze response content
    const analysis = await this.analyzeResponse(responseText, turn);
    
    // Store insights
    this.extractedInsights[turn.id] = analysis;
    
    // Update conversation context
    this.conversationContext[turn.id] = {
      response: responseText,
      analysis: analysis,
      timestamp: new Date()
    };

    // Enhanced response with analysis
    const enhancedResponse: AssessmentResponse = {
      ...response,
      responseValue: {
        originalText: responseText,
        analysis: analysis,
        extractedInsights: this.extractInsights(responseText, turn)
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
   * Analyze response using keyword matching and pattern recognition
   */
  private async analyzeResponse(responseText: string, turn: ConversationTurn): Promise<any> {
    const text = responseText.toLowerCase();
    const analysis = {
      keywordMatches: [] as string[],
      sentimentIndicators: [] as string[],
      personaSignals: [] as PersonaType[],
      confidenceLevel: 0,
      followUpNeeded: false
    };

    // Keyword analysis
    for (const keyword of turn.analysisKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        analysis.keywordMatches.push(keyword);
      }
    }

    // Persona signal detection
    analysis.personaSignals = this.detectPersonaSignals(text);
    
    // Sentiment analysis (basic)
    analysis.sentimentIndicators = this.detectSentiment(text);
    
    // Determine if follow-up is needed
    analysis.followUpNeeded = this.shouldFollowUp(text, turn);
    
    // Calculate confidence level
    analysis.confidenceLevel = this.calculateConfidence(analysis);

    return analysis;
  }

  /**
   * Extract structured insights from response
   */
  private extractInsights(responseText: string, turn: ConversationTurn): Record<string, any> {
    const insights: Record<string, any> = {};
    const text = responseText.toLowerCase();

    switch (turn.id) {
      case 'conv_001':
        insights.authorityLevel = this.extractAuthorityLevel(text);
        insights.teamSize = this.extractTeamSize(text);
        insights.decisionMakingStyle = this.extractDecisionMakingStyle(text);
        break;
        
      case 'conv_002':
        insights.challengeTypes = this.extractChallengeTypes(text);
        insights.technologyReadiness = this.extractTechnologyReadiness(text);
        insights.urgencyLevel = this.extractUrgencyLevel(text);
        break;
        
      case 'conv_003':
        insights.aiKnowledgeLevel = this.extractAIKnowledgeLevel(text);
        insights.interestAreas = this.extractInterestAreas(text);
        insights.implementationConcerns = this.extractConcerns(text);
        break;
    }

    return insights;
  }

  /**
   * Detect persona signals in text
   */
  private detectPersonaSignals(text: string): PersonaType[] {
    const signals: PersonaType[] = [];
    
    // Strategic Architect signals
    if (text.includes('ceo') || text.includes('executive') || text.includes('final decision') || 
        text.includes('strategic vision') || text.includes('board')) {
      signals.push('Strategic Architect');
    }
    
    // Strategic Catalyst signals
    if (text.includes('influence') || text.includes('drive change') || text.includes('lead initiatives') ||
        text.includes('cross-functional') || text.includes('transformation')) {
      signals.push('Strategic Catalyst');
    }
    
    // Strategic Contributor signals
    if (text.includes('department') || text.includes('team lead') || text.includes('implement') ||
        text.includes('execute') || text.includes('manage team')) {
      signals.push('Strategic Contributor');
    }
    
    // Strategic Explorer signals
    if (text.includes('learn') || text.includes('explore') || text.includes('interested in') ||
        text.includes('curious') || text.includes('potential')) {
      signals.push('Strategic Explorer');
    }
    
    // Strategic Observer signals
    if (text.includes('watch') || text.includes('monitor') || text.includes('assess') ||
        text.includes('evaluate') || text.includes('cautious')) {
      signals.push('Strategic Observer');
    }

    return signals;
  }

  /**
   * Detect sentiment indicators
   */
  private detectSentiment(text: string): string[] {
    const indicators: string[] = [];
    
    // Positive indicators
    const positiveWords = ['excited', 'optimistic', 'confident', 'enthusiastic', 'positive', 'great', 'excellent'];
    if (positiveWords.some(word => text.includes(word))) {
      indicators.push('positive');
    }
    
    // Negative indicators
    const negativeWords = ['concerned', 'worried', 'skeptical', 'doubtful', 'challenging', 'difficult'];
    if (negativeWords.some(word => text.includes(word))) {
      indicators.push('negative');
    }
    
    // Neutral indicators
    const neutralWords = ['considering', 'evaluating', 'exploring', 'assessing'];
    if (neutralWords.some(word => text.includes(word))) {
      indicators.push('neutral');
    }

    return indicators;
  }

  /**
   * Determine if follow-up question is needed
   */
  private shouldFollowUp(text: string, turn: ConversationTurn): boolean {
    // Check if response is too brief
    if (text.split(' ').length < 10) return true;
    
    // Check if key triggers are present
    if (turn.followUpTriggers) {
      const hasKeyTriggers = turn.followUpTriggers.some(trigger => 
        text.includes(trigger.toLowerCase())
      );
      if (!hasKeyTriggers) return true;
    }
    
    return false;
  }

  /**
   * Calculate confidence level of analysis
   */
  private calculateConfidence(analysis: any): number {
    let confidence = 0;
    
    // Keyword matches contribute to confidence
    confidence += Math.min(analysis.keywordMatches.length * 0.2, 0.6);
    
    // Persona signals contribute to confidence
    confidence += Math.min(analysis.personaSignals.length * 0.15, 0.3);
    
    // Sentiment detection contributes to confidence
    confidence += analysis.sentimentIndicators.length > 0 ? 0.1 : 0;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Extract authority level from response
   */
  private extractAuthorityLevel(text: string): string {
    if (text.includes('ceo') || text.includes('president') || text.includes('final decision')) {
      return 'high';
    } else if (text.includes('manager') || text.includes('director') || text.includes('influence')) {
      return 'medium';
    } else if (text.includes('team lead') || text.includes('supervisor')) {
      return 'low';
    }
    return 'unknown';
  }

  /**
   * Extract team size indicators
   */
  private extractTeamSize(text: string): string {
    if (text.includes('large team') || text.includes('department') || text.includes('100')) {
      return 'large';
    } else if (text.includes('small team') || text.includes('few people')) {
      return 'small';
    } else if (text.includes('individual') || text.includes('alone')) {
      return 'individual';
    }
    return 'unknown';
  }

  /**
   * Extract decision-making style
   */
  private extractDecisionMakingStyle(text: string): string {
    if (text.includes('collaborative') || text.includes('team input')) {
      return 'collaborative';
    } else if (text.includes('data') || text.includes('analysis')) {
      return 'analytical';
    } else if (text.includes('quick') || text.includes('fast')) {
      return 'decisive';
    }
    return 'unknown';
  }

  /**
   * Extract challenge types
   */
  private extractChallengeTypes(text: string): string[] {
    const challenges: string[] = [];
    
    if (text.includes('efficiency') || text.includes('slow')) challenges.push('efficiency');
    if (text.includes('cost') || text.includes('expensive')) challenges.push('cost');
    if (text.includes('competition') || text.includes('competitor')) challenges.push('competition');
    if (text.includes('data') || text.includes('information')) challenges.push('data_management');
    if (text.includes('customer') || text.includes('client')) challenges.push('customer_service');
    
    return challenges;
  }  /*
*
   * Extract technology readiness level
   */
  private extractTechnologyReadiness(text: string): string {
    if (text.includes('advanced') || text.includes('cutting edge') || text.includes('latest')) {
      return 'high';
    } else if (text.includes('basic') || text.includes('traditional') || text.includes('manual')) {
      return 'low';
    } else if (text.includes('some technology') || text.includes('moderate')) {
      return 'medium';
    }
    return 'unknown';
  }

  /**
   * Extract urgency level
   */
  private extractUrgencyLevel(text: string): string {
    if (text.includes('urgent') || text.includes('immediately') || text.includes('critical')) {
      return 'high';
    } else if (text.includes('soon') || text.includes('important')) {
      return 'medium';
    } else if (text.includes('eventually') || text.includes('future')) {
      return 'low';
    }
    return 'unknown';
  }

  /**
   * Extract AI knowledge level
   */
  private extractAIKnowledgeLevel(text: string): string {
    if (text.includes('expert') || text.includes('extensive') || text.includes('deep knowledge')) {
      return 'expert';
    } else if (text.includes('familiar') || text.includes('some experience')) {
      return 'intermediate';
    } else if (text.includes('basic') || text.includes('heard of') || text.includes('new to')) {
      return 'beginner';
    }
    return 'unknown';
  }

  /**
   * Extract interest areas
   */
  private extractInterestAreas(text: string): string[] {
    const interests: string[] = [];
    
    if (text.includes('automation')) interests.push('automation');
    if (text.includes('data') || text.includes('analytics')) interests.push('data_analytics');
    if (text.includes('customer') || text.includes('service')) interests.push('customer_service');
    if (text.includes('decision') || text.includes('insights')) interests.push('decision_support');
    if (text.includes('efficiency') || text.includes('optimization')) interests.push('optimization');
    
    return interests;
  } 
 /**
   * Extract implementation concerns
   */
  private extractConcerns(text: string): string[] {
    const concerns: string[] = [];
    
    if (text.includes('cost') || text.includes('expensive')) concerns.push('cost');
    if (text.includes('job') || text.includes('employment')) concerns.push('job_displacement');
    if (text.includes('security') || text.includes('privacy')) concerns.push('security');
    if (text.includes('complex') || text.includes('difficult')) concerns.push('complexity');
    if (text.includes('change') || text.includes('resistance')) concerns.push('change_management');
    
    return concerns;
  }

  /**
   * Determine next conversational question
   */
  protected async determineNextQuestion(
    responses: AssessmentResponse[],
    currentIndex: number
  ): Promise<Question | null> {
    // Check if we need follow-up questions
    const lastResponse = responses[responses.length - 1];
    if (lastResponse) {
      const analysis = this.extractedInsights[lastResponse.questionId];
      if (analysis && this.shouldGenerateFollowUp(lastResponse, analysis)) {
        return this.generateFollowUpQuestion(lastResponse, analysis);
      }
    }

    // Continue with standard flow or end assessment
    return null;
  }

  /**
   * Check if follow-up question should be generated
   */
  private shouldGenerateFollowUp(response: AssessmentResponse, analysis: any): boolean {
    const responseData = response.responseValue as any;
    return responseData?.analysis?.followUpNeeded || false;
  }

  /**
   * Generate follow-up question based on response
   */
  private generateFollowUpQuestion(response: AssessmentResponse, analysis: any): Question {
    const followUpId = `${response.questionId}_followup`;
    let followUpText = '';

    switch (response.questionId) {
      case 'conv_001':
        followUpText = 'Can you tell me more about the specific types of strategic decisions you\'re involved in?';
        break;
      case 'conv_002':
        followUpText = 'Which of these challenges would you say is the most critical for your organization right now?';
        break;
      case 'conv_003':
        followUpText = 'What specific AI applications do you think would have the biggest impact on your organization?';
        break;
      default:
        followUpText = 'Could you elaborate on that a bit more?';
    }

    return {
      id: followUpId,
      type: 'text_input',
      text: followUpText,
      culturalAdaptations: {
        'kenyan': followUpText.replace('Could you elaborate', 'Can you explain more about'),
        'east_african': followUpText.replace('Could you elaborate', 'Please tell us more about')
      }
    };
  }
}