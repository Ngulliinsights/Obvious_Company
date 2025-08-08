import { BaseAssessment } from './BaseAssessment';
import { 
  Question, 
  AssessmentResponse, 
  UserContext,
  PersonaType,
  QuestionType
} from '../../models/types';
import { AssessmentSession } from '../../models/AssessmentSession';

export class QuestionnaireAssessment extends BaseAssessment {
  private questionBank: Question[] = [];
  private adaptiveQuestioningEnabled: boolean = true;

  constructor(userContext: UserContext, session: AssessmentSession) {
    super('questionnaire', userContext, session);
  }

  /**
   * Initialize questionnaire-specific questions
   */
  protected async initializeQuestions(): Promise<Question[]> {
    this.questionBank = await this.buildQuestionBank();
    
    // Select initial questions based on user context
    const initialQuestions = await this.selectInitialQuestions();
    
    return initialQuestions;
  }

  /**
   * Build comprehensive question bank
   */
  private async buildQuestionBank(): Promise<Question[]> {
    return [
      // Strategic Authority Questions
      {
        id: 'sa_001',
        type: 'multiple_choice',
        text: 'What is your primary role in strategic decision-making within your organization?',
        options: [
          'I make final strategic decisions for the organization',
          'I significantly influence strategic decisions',
          'I contribute to strategic discussions',
          'I implement strategic decisions made by others',
          'I have limited involvement in strategic decisions'
        ],
        culturalAdaptations: {
          'kenyan': 'What is your role in making important business decisions in your organization?',
          'east_african': 'How do you participate in your organization\'s strategic planning?'
        },
        industrySpecific: true,
        requiredForPersona: ['Strategic Architect', 'Strategic Catalyst']
      },
      {
        id: 'sa_002',
        type: 'scale_rating',
        text: 'How much authority do you have to approve technology investments?',
        scaleRange: { 
          min: 1, 
          max: 5, 
          labels: ['No authority', 'Limited input', 'Some influence', 'Significant authority', 'Full authority'] 
        },
        culturalAdaptations: {
          'kenyan': 'How much say do you have in approving new technology purchases?',
          'east_african': 'What level of decision-making power do you have for technology investments?'
        },
        industrySpecific: true
      },
      {
        id: 'oi_001',
        type: 'multiple_choice',
        text: 'How many people report to you directly or indirectly?',
        options: [
          'None - I work independently',
          '1-5 people',
          '6-20 people',
          '21-100 people',
          'More than 100 people'
        ],
        culturalAdaptations: {
          'kenyan': 'How many team members do you supervise or manage?',
          'east_african': 'What is the size of your team or department?'
        }
      },
      {
        id: 'oi_002',
        type: 'scale_rating',
        text: 'How often do other departments seek your input on their initiatives?',
        scaleRange: { 
          min: 1, 
          max: 5, 
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] 
        },
        culturalAdaptations: {
          'kenyan': 'How often do colleagues from other departments ask for your advice?',
          'east_african': 'How frequently do you collaborate across different departments?'
        }
      },
      // Resource Availability Questions
      {
        id: 'ra_001',
        type: 'multiple_choice',
        text: 'What is your organization\'s typical budget range for strategic technology initiatives?',
        options: [
          'Less than $10,000',
          '$10,000 - $50,000',
          '$50,000 - $200,000',
          '$200,000 - $1,000,000',
          'More than $1,000,000'
        ],
        culturalAdaptations: {
          'kenyan': 'What budget range does your organization typically allocate for new technology projects? (in KSH)',
          'east_african': 'What is your organization\'s investment capacity for strategic technology initiatives?'
        },
        industrySpecific: true
      },
      {
        id: 'ra_002',
        type: 'scale_rating',
        text: 'How readily available are skilled technical resources in your organization?',
        scaleRange: { 
          min: 1, 
          max: 5, 
          labels: ['Very limited', 'Limited', 'Adequate', 'Good', 'Excellent'] 
        },
        culturalAdaptations: {
          'kenyan': 'How easy is it to find skilled technical people in your organization?',
          'east_african': 'What is the availability of technical expertise in your team?'
        }
      },
      // Implementation Readiness Questions
      {
        id: 'ir_001',
        type: 'multiple_choice',
        text: 'How would you describe your organization\'s approach to adopting new technologies?',
        options: [
          'We are early adopters and embrace new technologies quickly',
          'We adopt proven technologies after careful evaluation',
          'We follow industry standards and best practices',
          'We are cautious and prefer established solutions',
          'We are very conservative and slow to change'
        ],
        culturalAdaptations: {
          'kenyan': 'How does your organization typically approach new technology adoption?',
          'east_african': 'What is your organization\'s attitude toward implementing new technologies?'
        },
        industrySpecific: true
      },
      {
        id: 'ir_002',
        type: 'scale_rating',
        text: 'How prepared is your organization to manage significant technological change?',
        scaleRange: { 
          min: 1, 
          max: 5, 
          labels: ['Not prepared', 'Minimally prepared', 'Somewhat prepared', 'Well prepared', 'Fully prepared'] 
        },
        culturalAdaptations: {
          'kenyan': 'How ready is your organization to handle major technology changes?',
          'east_african': 'What is your organization\'s capacity for managing technological transformation?'
        }
      },
      // Cultural Alignment Questions
      {
        id: 'ca_001',
        type: 'multiple_choice',
        text: 'Which best describes your organization\'s decision-making culture?',
        options: [
          'Hierarchical - decisions flow from top leadership',
          'Collaborative - decisions involve multiple stakeholders',
          'Consensus-driven - we seek agreement from all parties',
          'Data-driven - decisions based on analysis and metrics',
          'Agile - quick decisions with iterative improvements'
        ],
        culturalAdaptations: {
          'kenyan': 'How are important decisions typically made in your organization?',
          'east_african': 'What is your organization\'s approach to making business decisions?'
        },
        industrySpecific: true
      },
      {
        id: 'ca_002',
        type: 'text_input',
        text: 'What are the biggest cultural or organizational barriers to implementing new technologies in your context?',
        culturalAdaptations: {
          'kenyan': 'What challenges do you face when trying to introduce new technologies in your organization?',
          'east_african': 'What obstacles typically prevent successful technology implementation in your environment?'
        }
      },
      // AI-Specific Questions
      {
        id: 'ai_001',
        type: 'scale_rating',
        text: 'How familiar are you with artificial intelligence and its business applications?',
        scaleRange: { 
          min: 1, 
          max: 5, 
          labels: ['Not familiar', 'Slightly familiar', 'Moderately familiar', 'Very familiar', 'Expert level'] 
        },
        culturalAdaptations: {
          'kenyan': 'How well do you understand AI and how it can be used in business?',
          'east_african': 'What is your level of knowledge about artificial intelligence applications?'
        }
      },
      {
        id: 'ai_002',
        type: 'multiple_choice',
        text: 'What is your primary interest in AI for your organization?',
        options: [
          'Automating routine tasks and processes',
          'Enhancing decision-making with data insights',
          'Improving customer experience and engagement',
          'Creating new products or services',
          'Gaining competitive advantage in the market'
        ],
        culturalAdaptations: {
          'kenyan': 'How do you see AI helping your organization the most?',
          'east_african': 'What would be the main benefit of AI for your business?'
        },
        industrySpecific: true
      }
    ];
  }

  /**
   * Select initial questions based on user context
   */
  private async selectInitialQuestions(): Promise<Question[]> {
    const coreQuestions = this.questionBank.filter(q => 
      q.id.startsWith('sa_') || q.id.startsWith('oi_') || q.id.startsWith('ai_001')
    );

    // Add industry-specific questions if available
    if (this.userContext.industry) {
      const industryQuestions = this.questionBank.filter(q => 
        q.industrySpecific && !coreQuestions.includes(q)
      );
      coreQuestions.push(...industryQuestions.slice(0, 3));
    }

    return coreQuestions;
  }

  /**
   * Process questionnaire response
   */
  protected async processResponse(
    response: AssessmentResponse,
    currentQuestion: Question
  ): Promise<void> {
    // Store response for analysis
    // This could include scoring logic specific to questionnaire responses
    
    // Update session with response
    this.session = {
      ...this.session,
      responses: [...this.session.responses, response],
      currentQuestionIndex: this.session.currentQuestionIndex + 1,
      updatedAt: new Date()
    };
  }

  /**
   * Determine next question based on adaptive logic
   */
  protected async determineNextQuestion(
    responses: AssessmentResponse[],
    currentIndex: number
  ): Promise<Question | null> {
    if (!this.adaptiveQuestioningEnabled) {
      return null; // Use predefined sequence
    }

    // Analyze response patterns
    const pattern = this.analyzeResponsePattern(responses);
    
    // Determine likely persona based on responses so far
    const likelyPersona = this.predictPersona(responses);
    
    // Select next question based on persona and gaps in information
    return this.selectAdaptiveQuestion(responses, likelyPersona, pattern);
  }

  /**
   * Predict persona based on current responses
   */
  private predictPersona(responses: AssessmentResponse[]): PersonaType | null {
    if (responses.length < 2) return null;

    let authorityScore = 0;
    let influenceScore = 0;
    let resourceScore = 0;

    for (const response of responses) {
      switch (response.questionId) {
        case 'sa_001':
          const roleResponse = response.responseValue as string;
          if (roleResponse.includes('make final strategic decisions')) {
            authorityScore += 5;
          } else if (roleResponse.includes('significantly influence')) {
            authorityScore += 4;
          } else if (roleResponse.includes('contribute to strategic')) {
            authorityScore += 3;
          }
          break;
          
        case 'sa_002':
          const authorityLevel = response.responseValue as number;
          authorityScore += authorityLevel;
          break;
          
        case 'oi_001':
          const teamSize = response.responseValue as string;
          if (teamSize.includes('More than 100')) {
            influenceScore += 5;
          } else if (teamSize.includes('21-100')) {
            influenceScore += 4;
          } else if (teamSize.includes('6-20')) {
            influenceScore += 3;
          }
          break;
          
        case 'ra_001':
          const budget = response.responseValue as string;
          if (budget.includes('More than $1,000,000')) {
            resourceScore += 5;
          } else if (budget.includes('$200,000 - $1,000,000')) {
            resourceScore += 4;
          } else if (budget.includes('$50,000 - $200,000')) {
            resourceScore += 3;
          }
          break;
      }
    }

    // Simple persona prediction logic
    if (authorityScore >= 8 && resourceScore >= 4) {
      return 'Strategic Architect';
    } else if (authorityScore >= 6 && influenceScore >= 3) {
      return 'Strategic Catalyst';
    } else if (authorityScore >= 4 || influenceScore >= 3) {
      return 'Strategic Contributor';
    } else if (authorityScore >= 2) {
      return 'Strategic Explorer';
    } else {
      return 'Strategic Observer';
    }
  }

  /**
   * Select adaptive question based on analysis
   */
  private async selectAdaptiveQuestion(
    responses: AssessmentResponse[],
    likelyPersona: PersonaType | null,
    pattern: any
  ): Promise<Question | null> {
    const answeredQuestionIds = responses.map(r => r.questionId);
    const unansweredQuestions = this.questionBank.filter(q => 
      !answeredQuestionIds.includes(q.id)
    );

    if (unansweredQuestions.length === 0) {
      return null; // No more questions available
    }

    // Prioritize questions based on persona
    if (likelyPersona) {
      const personaSpecificQuestions = unansweredQuestions.filter(q => 
        q.requiredForPersona?.includes(likelyPersona)
      );
      
      if (personaSpecificQuestions.length > 0) {
        return personaSpecificQuestions[0];
      }
    }

    // Fill information gaps
    const responsesByCategory = this.categorizeResponses(responses);
    
    // Prioritize categories with fewer responses
    const categories = ['ra_', 'ir_', 'ca_', 'ai_'];
    const leastAnsweredCategory = categories.reduce((min, category) => {
      const currentCount = responsesByCategory[category] || 0;
      const minCount = responsesByCategory[min] || 0;
      return currentCount < minCount ? category : min;
    });

    const categoryQuestions = unansweredQuestions.filter(q => 
      q.id.startsWith(leastAnsweredCategory)
    );

    return categoryQuestions.length > 0 ? categoryQuestions[0] : unansweredQuestions[0];
  }

  /**
   * Categorize responses by question type
   */
  private categorizeResponses(responses: AssessmentResponse[]): Record<string, number> {
    const categories: Record<string, number> = {};
    
    for (const response of responses) {
      const prefix = response.questionId.substring(0, 3);
      categories[prefix] = (categories[prefix] || 0) + 1;
    }
    
    return categories;
  }

  /**
   * Apply industry-specific adaptations for questionnaire
   */
  protected override async applyIndustryAdaptations(question: Question): Promise<Question> {
    const industry = this.userContext.industry?.toLowerCase();
    
    if (!industry) return question;

    // Industry-specific question modifications
    const adaptedQuestion = { ...question };

    switch (industry) {
      case 'financial_services':
        if (question.id === 'ra_001') {
          adaptedQuestion.text = 'What is your organization\'s typical budget range for regulatory-compliant technology initiatives?';
        }
        break;
        
      case 'healthcare':
        if (question.id === 'ir_001') {
          adaptedQuestion.text = 'How would you describe your organization\'s approach to adopting new healthcare technologies while maintaining patient safety?';
        }
        break;
        
      case 'manufacturing':
        if (question.id === 'ai_002') {
          adaptedQuestion.options = [
            'Optimizing production processes and quality control',
            'Predictive maintenance and equipment monitoring',
            'Supply chain optimization and demand forecasting',
            'Enhancing worker safety and training',
            'Reducing waste and improving efficiency'
          ];
        }
        break;
        
      case 'government':
        if (question.id === 'ca_001') {
          adaptedQuestion.text = 'Which best describes your organization\'s approach to public sector decision-making?';
          adaptedQuestion.options = [
            'Policy-driven - decisions follow established regulations',
            'Stakeholder consultation - involving citizens and partners',
            'Evidence-based - using data and research',
            'Transparent - with public accountability',
            'Collaborative - across government departments'
          ];
        }
        break;
    }

    return adaptedQuestion;
  }
}