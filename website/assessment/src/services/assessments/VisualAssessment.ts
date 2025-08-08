import { BaseAssessment } from './BaseAssessment';
import { 
  Question, 
  AssessmentResponse, 
  UserContext,
  PersonaType
} from '../../models/types';
import { AssessmentSession } from '../../models/AssessmentSession';

interface VisualPattern {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  patternType: 'workflow' | 'hierarchy' | 'network' | 'process' | 'system';
  complexity: 'simple' | 'moderate' | 'complex';
  industryRelevance: string[];
  culturalAdaptations?: Record<string, {
    title: string;
    description: string;
  }>;
}

interface PatternChoice {
  id: string;
  text: string;
  visualDescription: string;
  strategicImplication: string;
  personaAlignment: PersonaType[];
  culturalAdaptations?: Record<string, string>;
}

export class VisualAssessment extends BaseAssessment {
  private visualPatterns: VisualPattern[] = [];
  private patternChoices: Record<string, PatternChoice[]> = {};

  constructor(userContext: UserContext, session: AssessmentSession) {
    super('visual-pattern', userContext, session);
  }

  /**
   * Initialize visual pattern questions
   */
  protected async initializeQuestions(): Promise<Question[]> {
    await this.buildVisualPatterns();
    return this.createVisualQuestions();
  }

  /**
   * Build visual pattern library
   */
  private async buildVisualPatterns(): Promise<void> {
    this.visualPatterns = [
      {
        id: 'vp_001',
        title: 'Organizational Decision Flow',
        description: 'How do strategic decisions typically flow through your organization?',
        patternType: 'workflow',
        complexity: 'moderate',
        industryRelevance: ['all'],
        culturalAdaptations: {
          'kenyan': {
            title: 'How Decisions Are Made',
            description: 'How do important business decisions move through your organization?'
          },
          'east_african': {
            title: 'Decision-Making Process',
            description: 'What is the typical process for making strategic decisions in your organization?'
          }
        }
      },
      {
        id: 'vp_002',
        title: 'Information Architecture',
        description: 'How does information and data flow through your organization?',
        patternType: 'network',
        complexity: 'complex',
        industryRelevance: ['technology', 'financial_services', 'healthcare'],
        culturalAdaptations: {
          'kenyan': {
            title: 'Information Flow',
            description: 'How does information move around in your organization?'
          }
        }
      },
      {
        id: 'vp_003',
        title: 'Change Implementation Pattern',
        description: 'How does your organization typically implement new initiatives?',
        patternType: 'process',
        complexity: 'moderate',
        industryRelevance: ['all'],
        culturalAdaptations: {
          'kenyan': {
            title: 'How Changes Are Made',
            description: 'How does your organization usually bring in new ways of doing things?'
          }
        }
      },
      {
        id: 'vp_004',
        title: 'Technology Integration Model',
        description: 'How does your organization approach integrating new technologies?',
        patternType: 'system',
        complexity: 'complex',
        industryRelevance: ['technology', 'manufacturing', 'financial_services'],
        culturalAdaptations: {
          'kenyan': {
            title: 'Technology Integration',
            description: 'How does your organization add new technology to existing systems?'
          }
        }
      }
    ];

    // Build pattern choices
    this.patternChoices = {
      'vp_001': [
        {
          id: 'vp_001_a',
          text: 'Top-down hierarchical flow',
          visualDescription: 'Decisions start at the top and cascade down through clear reporting lines',
          strategicImplication: 'Centralized control with clear authority structure',
          personaAlignment: ['Strategic Architect', 'Strategic Observer'],
          culturalAdaptations: {
            'kenyan': 'Decisions come from the top and go down through the organization',
            'east_african': 'Leadership makes decisions that flow down through management levels'
          }
        },
        {
          id: 'vp_001_b',
          text: 'Collaborative consensus building',
          visualDescription: 'Multiple stakeholders contribute input before decisions are finalized',
          strategicImplication: 'Inclusive decision-making with broader buy-in',
          personaAlignment: ['Strategic Catalyst', 'Strategic Contributor'],
          culturalAdaptations: {
            'kenyan': 'Everyone gives their opinion before decisions are made',
            'east_african': 'Decisions involve input from multiple team members'
          }
        },
        {
          id: 'vp_001_c',
          text: 'Matrix-based cross-functional',
          visualDescription: 'Decisions involve multiple departments and expertise areas',
          strategicImplication: 'Complex coordination with specialized input',
          personaAlignment: ['Strategic Catalyst', 'Strategic Explorer'],
          culturalAdaptations: {
            'kenyan': 'Different departments work together to make decisions',
            'east_african': 'Decisions involve coordination across different areas of expertise'
          }
        },
        {
          id: 'vp_001_d',
          text: 'Agile iterative cycles',
          visualDescription: 'Quick decisions with regular review and adjustment cycles',
          strategicImplication: 'Flexible and adaptive approach to decision-making',
          personaAlignment: ['Strategic Catalyst', 'Strategic Explorer'],
          culturalAdaptations: {
            'kenyan': 'Quick decisions that can be changed based on results',
            'east_african': 'Fast decision-making with regular reviews and adjustments'
          }
        }
      ]
    };
  }  /*
*
   * Create visual pattern questions
   */
  private createVisualQuestions(): Question[] {
    const questions: Question[] = [];

    for (const pattern of this.visualPatterns) {
      const choices = this.patternChoices[pattern.id] || [];
      
      questions.push({
        id: pattern.id,
        type: 'visual_pattern',
        text: this.formatVisualPatternText(pattern),
        options: choices.map(choice => choice.text),
        culturalAdaptations: this.buildVisualCulturalAdaptations(pattern, choices),
        industrySpecific: pattern.industryRelevance.length > 1
      });
    }

    return questions;
  }

  /**
   * Format visual pattern text for presentation
   */
  private formatVisualPatternText(pattern: VisualPattern): string {
    return `**${pattern.title}**\n\n${pattern.description}\n\nPlease select the pattern that best represents your organization's approach:`;
  }

  /**
   * Build cultural adaptations for visual patterns
   */
  private buildVisualCulturalAdaptations(
    pattern: VisualPattern, 
    choices: PatternChoice[]
  ): Record<string, string> {
    const adaptations: Record<string, string> = {};

    if (pattern.culturalAdaptations) {
      for (const [culture, adaptation] of Object.entries(pattern.culturalAdaptations)) {
        const adaptedChoices = choices.map((choice, index) => {
          const adaptedText = choice.culturalAdaptations?.[culture] || choice.text;
          return `${index + 1}. ${adaptedText}`;
        }).join('\n');

        adaptations[culture] = `**${adaptation.title}**\n\n${adaptation.description}\n\nPlease choose the option that best fits your organization:\n\n${adaptedChoices}`;
      }
    }

    return adaptations;
  }

  /**
   * Process visual pattern response
   */
  protected async processResponse(
    response: AssessmentResponse,
    currentQuestion: Question
  ): Promise<void> {
    const patternId = response.questionId;
    const selectedOption = response.responseValue as string;
    const choices = this.patternChoices[patternId] || [];
    
    // Find the selected choice
    const selectedIndex = currentQuestion.options?.indexOf(selectedOption) || 0;
    const selectedChoice = choices[selectedIndex];

    if (selectedChoice) {
      // Analyze the visual pattern choice
      const analysisResponse: AssessmentResponse = {
        ...response,
        responseValue: {
          selectedOption,
          choiceId: selectedChoice.id,
          visualDescription: selectedChoice.visualDescription,
          strategicImplication: selectedChoice.strategicImplication,
          personaAlignment: selectedChoice.personaAlignment,
          patternType: this.visualPatterns.find(p => p.id === patternId)?.patternType
        }
      };

      this.session = {
        ...this.session,
        responses: [...this.session.responses, analysisResponse],
        currentQuestionIndex: this.session.currentQuestionIndex + 1,
        updatedAt: new Date()
      };
    } else {
      this.session = {
        ...this.session,
        responses: [...this.session.responses, response],
        currentQuestionIndex: this.session.currentQuestionIndex + 1,
        updatedAt: new Date()
      };
    }
  }  
/**
   * Determine next visual pattern question
   */
  protected async determineNextQuestion(
    responses: AssessmentResponse[],
    currentIndex: number
  ): Promise<Question | null> {
    // Analyze visual pattern preferences
    const patternPreferences = this.analyzePatternPreferences(responses);
    
    // Select next pattern that provides complementary insights
    const remainingPatterns = this.visualPatterns.filter(pattern => 
      !responses.some(r => r.questionId === pattern.id)
    );

    if (remainingPatterns.length === 0) {
      return null;
    }

    // Prioritize patterns based on complexity and previous responses
    const nextPattern = this.selectOptimalPattern(remainingPatterns, patternPreferences);
    
    if (nextPattern) {
      const choices = this.patternChoices[nextPattern.id] || [];
      return {
        id: nextPattern.id,
        type: 'visual_pattern',
        text: this.formatVisualPatternText(nextPattern),
        options: choices.map(choice => choice.text),
        culturalAdaptations: this.buildVisualCulturalAdaptations(nextPattern, choices),
        industrySpecific: nextPattern.industryRelevance.length > 1
      };
    }

    return null;
  }

  /**
   * Analyze pattern preferences from responses
   */
  private analyzePatternPreferences(responses: AssessmentResponse[]): Record<string, any> {
    const preferences = {
      complexityPreference: 'moderate',
      patternTypes: [] as string[],
      personaAlignment: {} as Record<string, number>,
      strategicStyle: 'balanced'
    };

    for (const response of responses) {
      const responseData = response.responseValue as any;
      if (responseData?.patternType) {
        preferences.patternTypes.push(responseData.patternType);
      }
      
      if (responseData?.personaAlignment) {
        for (const persona of responseData.personaAlignment) {
          preferences.personaAlignment[persona] = 
            (preferences.personaAlignment[persona] || 0) + 1;
        }
      }
    }

    return preferences;
  }

  /**
   * Select optimal pattern for maximum insight
   */
  private selectOptimalPattern(
    remainingPatterns: VisualPattern[],
    preferences: Record<string, any>
  ): VisualPattern | null {
    if (remainingPatterns.length === 0) return null;

    // Filter by industry relevance if applicable
    let candidatePatterns = remainingPatterns;
    if (this.userContext.industry) {
      const industryPatterns = remainingPatterns.filter(pattern => 
        pattern.industryRelevance.includes(this.userContext.industry!) ||
        pattern.industryRelevance.includes('all')
      );
      
      if (industryPatterns.length > 0) {
        candidatePatterns = industryPatterns;
      }
    }

    // Select based on complexity progression
    const simplePatterns = candidatePatterns.filter(p => p.complexity === 'simple');
    const moderatePatterns = candidatePatterns.filter(p => p.complexity === 'moderate');
    const complexPatterns = candidatePatterns.filter(p => p.complexity === 'complex');

    // Start with simple, progress to complex
    if (simplePatterns.length > 0) return simplePatterns[0];
    if (moderatePatterns.length > 0) return moderatePatterns[0];
    if (complexPatterns.length > 0) return complexPatterns[0];

    return candidatePatterns[0];
  }

  /**
   * Apply industry-specific adaptations for visual patterns
   */
  protected override async applyIndustryAdaptations(question: Question): Promise<Question> {
    const industry = this.userContext.industry?.toLowerCase();
    
    if (!industry || !question.industrySpecific) return question;

    const adaptedQuestion = { ...question };
    const patternId = question.id;

    // Apply industry-specific modifications
    switch (industry) {
      case 'financial_services':
        if (patternId === 'vp_002') {
          adaptedQuestion.text = adaptedQuestion.text.replace(
            'information and data flow',
            'regulatory-compliant information and data flow with audit trails'
          );
        }
        break;
        
      case 'healthcare':
        if (patternId === 'vp_002') {
          adaptedQuestion.text = adaptedQuestion.text.replace(
            'information and data flow',
            'patient information and clinical data flow with privacy protection'
          );
        }
        break;
        
      case 'manufacturing':
        if (patternId === 'vp_004') {
          adaptedQuestion.text = adaptedQuestion.text.replace(
            'integrating new technologies',
            'integrating new production and automation technologies'
          );
        }
        break;
        
      case 'government':
        if (patternId === 'vp_001') {
          adaptedQuestion.text = adaptedQuestion.text.replace(
            'strategic decisions',
            'policy decisions with public accountability'
          );
        }
        break;
    }

    return adaptedQuestion;
  }
}