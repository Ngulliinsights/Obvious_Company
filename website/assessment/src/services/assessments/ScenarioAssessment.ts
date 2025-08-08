import { BaseAssessment } from './BaseAssessment';
import { 
  Question, 
  AssessmentResponse, 
  UserContext,
  PersonaType
} from '../../models/types';
import { AssessmentSession } from '../../models/AssessmentSession';

interface Scenario {
  id: string;
  title: string;
  context: string;
  situation: string;
  stakeholders: string[];
  constraints: string[];
  culturalAdaptations?: Record<string, {
    context: string;
    situation: string;
    stakeholders: string[];
  }>;
  industrySpecific?: boolean;
}

interface ScenarioChoice {
  id: string;
  text: string;
  reasoning?: string;
  implications: string[];
  personaAlignment: PersonaType[];
  culturalAdaptations?: Record<string, string>;
}

export class ScenarioAssessment extends BaseAssessment {
  private scenarios: Scenario[] = [];
  private scenarioChoices: Record<string, ScenarioChoice[]> = {};

  constructor(userContext: UserContext, session: AssessmentSession) {
    super('scenario-based', userContext, session);
  }

  /**
   * Initialize scenario-based questions
   */
  protected async initializeQuestions(): Promise<Question[]> {
    await this.buildScenarios();
    return this.createScenarioQuestions();
  }

  /**
   * Build comprehensive scenario bank
   */
  private async buildScenarios(): Promise<void> {
    this.scenarios = [
      {
        id: 'sc_001',
        title: 'AI Implementation Decision',
        context: 'Your organization is considering implementing an AI-powered customer service system.',
        situation: 'The IT department has proposed a solution that could reduce response times by 60% and cut customer service costs by 40%. However, it requires significant upfront investment, staff retraining, and may initially disrupt current operations. Some team members are concerned about job displacement, while others worry about maintaining service quality during the transition.',
        stakeholders: ['IT Department', 'Customer Service Team', 'Finance Department', 'Senior Management', 'Customers'],
        constraints: ['Limited budget', 'Tight timeline', 'Staff concerns', 'Service quality requirements'],
        culturalAdaptations: {
          'kenyan': {
            context: 'Your organization is considering implementing an AI system to improve customer service.',
            situation: 'The technology team has suggested a solution that could make customer service much faster and cheaper. But it needs a big investment upfront, training for staff, and might cause problems at first. Some workers worry about losing their jobs, while others are concerned about keeping good service quality.',
            stakeholders: ['Technology Team', 'Customer Service Staff', 'Finance Team', 'Management', 'Customers']
          },
          'east_african': {
            context: 'Your company is thinking about using AI technology for better customer service.',
            situation: 'The technical team has recommended a system that could improve response times significantly and reduce costs. However, it requires substantial investment, employee training, and may cause initial disruptions. Team members have concerns about employment security and maintaining service standards.',
            stakeholders: ['Technical Team', 'Service Staff', 'Finance Team', 'Leadership', 'Clients']
          }
        },
        industrySpecific: true
      },
      {
        id: 'sc_002',
        title: 'Strategic Technology Investment',
        context: 'Your organization has received approval for a major technology investment.',
        situation: 'You have been allocated a significant budget to implement a strategic technology initiative that will transform how your organization operates. You must choose between three options: 1) A comprehensive AI platform that automates multiple processes, 2) A data analytics system that provides deep business insights, or 3) A digital transformation platform that modernizes all customer-facing operations. Each option has different implementation timelines, resource requirements, and potential returns.',
        stakeholders: ['Board of Directors', 'Department Heads', 'IT Team', 'Operations Team', 'External Consultants'],
        constraints: ['Fixed budget', '12-month timeline', 'Limited technical expertise', 'Regulatory compliance'],
        culturalAdaptations: {
          'kenyan': {
            context: 'Your organization has been given money for a major technology upgrade.',
            situation: 'You have a good budget to implement a big technology project that will change how your organization works. You can choose between: 1) An AI system that automates many tasks, 2) A data system that gives business insights, or 3) A digital platform that improves customer services. Each choice has different costs, time needs, and benefits.',
            stakeholders: ['Board Members', 'Department Leaders', 'IT Staff', 'Operations Staff', 'External Advisors']
          }
        },
        industrySpecific: true
      },
      {
        id: 'sc_003',
        title: 'Change Management Challenge',
        context: 'Your organization is facing resistance to a new AI initiative.',
        situation: 'Six months into implementing an AI-powered workflow system, you\'re encountering significant resistance from middle management and frontline staff. Productivity has temporarily decreased, some employees are actively avoiding the new system, and there are concerns about data accuracy. Senior leadership is questioning the investment, and you need to decide how to proceed.',
        stakeholders: ['Senior Leadership', 'Middle Management', 'Frontline Staff', 'IT Support', 'Training Team'],
        constraints: ['Declining morale', 'Productivity concerns', 'Budget pressures', 'Timeline expectations'],
        culturalAdaptations: {
          'kenyan': {
            context: 'Your organization is having problems with a new AI system.',
            situation: 'After six months of using a new AI workflow system, many managers and workers are not happy with it. Work has become slower temporarily, some people refuse to use the new system, and there are worries about whether the data is correct. Senior leaders are questioning if the investment was worth it.',
            stakeholders: ['Senior Leaders', 'Managers', 'Workers', 'IT Support', 'Training Team']
          }
        }
      },
      {
        id: 'sc_004',
        title: 'Competitive Advantage Opportunity',
        context: 'A competitor has just announced a major AI breakthrough in your industry.',
        situation: 'Your main competitor has launched an AI-powered service that is gaining significant market attention and customer interest. Early reports suggest it could disrupt traditional business models in your sector. You need to decide how to respond: develop a competing solution, partner with an AI vendor, acquire a startup with relevant technology, or focus on your existing strengths while monitoring the situation.',
        stakeholders: ['Executive Team', 'Product Development', 'Marketing Team', 'Sales Team', 'Customers'],
        constraints: ['Competitive pressure', 'Market expectations', 'Resource allocation', 'Time to market'],
        culturalAdaptations: {
          'kenyan': {
            context: 'A competitor has introduced a new AI service that is getting a lot of attention.',
            situation: 'Your main competitor has launched an AI service that customers are very interested in. It might change how business is done in your industry. You need to decide what to do: create your own competing solution, work with an AI company, buy a startup with the right technology, or stick to what you do best while watching what happens.',
            stakeholders: ['Executive Team', 'Product Team', 'Marketing Team', 'Sales Team', 'Customers']
          }
        },
        industrySpecific: true
      }
    ];

    // Build scenario choices
    this.scenarioChoices = {
      'sc_001': [
        {
          id: 'sc_001_a',
          text: 'Proceed with full implementation immediately',
          reasoning: 'Maximize benefits and competitive advantage',
          implications: ['High risk', 'Potential for significant returns', 'Requires strong change management'],
          personaAlignment: ['Strategic Architect', 'Strategic Catalyst'],
          culturalAdaptations: {
            'kenyan': 'Go ahead with the full system right away',
            'east_african': 'Implement the complete solution immediately'
          }
        },
        {
          id: 'sc_001_b',
          text: 'Start with a pilot program in one department',
          reasoning: 'Reduce risk while testing effectiveness',
          implications: ['Lower risk', 'Slower benefits realization', 'Learning opportunity'],
          personaAlignment: ['Strategic Contributor', 'Strategic Explorer'],
          culturalAdaptations: {
            'kenyan': 'Test it first in one department only',
            'east_african': 'Begin with a trial in one department'
          }
        },
        {
          id: 'sc_001_c',
          text: 'Delay implementation until staff concerns are addressed',
          reasoning: 'Ensure organizational readiness and buy-in',
          implications: ['Delayed benefits', 'Better change management', 'Potential competitive disadvantage'],
          personaAlignment: ['Strategic Observer', 'Strategic Contributor'],
          culturalAdaptations: {
            'kenyan': 'Wait until workers are more comfortable with the change',
            'east_african': 'Postpone until staff concerns are resolved'
          }
        },
        {
          id: 'sc_001_d',
          text: 'Seek additional stakeholder input before deciding',
          reasoning: 'Gather more information and build consensus',
          implications: ['More informed decision', 'Slower decision-making', 'Broader buy-in'],
          personaAlignment: ['Strategic Explorer', 'Strategic Observer'],
          culturalAdaptations: {
            'kenyan': 'Ask more people for their opinions before deciding',
            'east_african': 'Consult with more stakeholders before making a decision'
          }
        }
      ],
      'sc_002': [
        {
          id: 'sc_002_a',
          text: 'Choose the comprehensive AI platform for maximum automation',
          reasoning: 'Achieve the greatest operational transformation',
          implications: ['Highest complexity', 'Maximum long-term benefits', 'Significant change management needs'],
          personaAlignment: ['Strategic Architect'],
          culturalAdaptations: {
            'kenyan': 'Pick the complete AI system for maximum automation'
          }
        },
        {
          id: 'sc_002_b',
          text: 'Select the data analytics system for better decision-making',
          reasoning: 'Focus on intelligence and insights',
          implications: ['Moderate complexity', 'Enhanced decision-making capability', 'Requires data literacy'],
          personaAlignment: ['Strategic Catalyst', 'Strategic Contributor'],
          culturalAdaptations: {
            'kenyan': 'Choose the data system for better business decisions'
          }
        },
        {
          id: 'sc_002_c',
          text: 'Implement the digital transformation platform',
          reasoning: 'Improve customer experience and market position',
          implications: ['Customer-focused benefits', 'Market differentiation', 'External visibility'],
          personaAlignment: ['Strategic Catalyst', 'Strategic Explorer'],
          culturalAdaptations: {
            'kenyan': 'Go with the digital platform to improve customer service'
          }
        },
        {
          id: 'sc_002_d',
          text: 'Split the budget across multiple smaller initiatives',
          reasoning: 'Diversify risk and address multiple needs',
          implications: ['Lower individual impact', 'Reduced risk', 'Broader organizational benefit'],
          personaAlignment: ['Strategic Observer', 'Strategic Contributor'],
          culturalAdaptations: {
            'kenyan': 'Use the money for several smaller technology projects'
          }
        }
      ],
      'sc_003': [
        {
          id: 'sc_003_a',
          text: 'Double down with additional training and support',
          reasoning: 'Overcome resistance through education and assistance',
          implications: ['Additional investment required', 'Potential for breakthrough', 'Continued short-term challenges'],
          personaAlignment: ['Strategic Architect', 'Strategic Catalyst'],
          culturalAdaptations: {
            'kenyan': 'Provide more training and support to help people use the system'
          }
        },
        {
          id: 'sc_003_b',
          text: 'Modify the system based on user feedback',
          reasoning: 'Address specific concerns and improve usability',
          implications: ['Development costs', 'Better user adoption', 'Delayed full benefits'],
          personaAlignment: ['Strategic Contributor', 'Strategic Explorer'],
          culturalAdaptations: {
            'kenyan': 'Change the system based on what users are saying'
          }
        },
        {
          id: 'sc_003_c',
          text: 'Pause implementation and reassess the approach',
          reasoning: 'Prevent further damage and develop a better strategy',
          implications: ['Sunk costs', 'Opportunity to restart properly', 'Loss of momentum'],
          personaAlignment: ['Strategic Observer'],
          culturalAdaptations: {
            'kenyan': 'Stop for now and think of a better way to do this'
          }
        },
        {
          id: 'sc_003_d',
          text: 'Implement a hybrid approach with manual and AI processes',
          reasoning: 'Balance innovation with user comfort',
          implications: ['Compromise solution', 'Easier adoption', 'Reduced efficiency gains'],
          personaAlignment: ['Strategic Contributor', 'Strategic Observer'],
          culturalAdaptations: {
            'kenyan': 'Use both the old way and the new AI system together'
          }
        }
      ],
      'sc_004': [
        {
          id: 'sc_004_a',
          text: 'Rapidly develop a competing AI solution',
          reasoning: 'Match competitor capabilities quickly',
          implications: ['High resource commitment', 'Fast response', 'Technical and market risks'],
          personaAlignment: ['Strategic Architect', 'Strategic Catalyst'],
          culturalAdaptations: {
            'kenyan': 'Quickly create our own AI solution to compete'
          }
        },
        {
          id: 'sc_004_b',
          text: 'Partner with an established AI vendor',
          reasoning: 'Leverage existing expertise and technology',
          implications: ['Faster time to market', 'Dependency on partner', 'Shared value creation'],
          personaAlignment: ['Strategic Catalyst', 'Strategic Contributor'],
          culturalAdaptations: {
            'kenyan': 'Work together with an AI company that already has the technology'
          }
        },
        {
          id: 'sc_004_c',
          text: 'Acquire a startup with relevant AI technology',
          reasoning: 'Gain technology and talent quickly',
          implications: ['High acquisition cost', 'Integration challenges', 'Immediate capability gain'],
          personaAlignment: ['Strategic Architect'],
          culturalAdaptations: {
            'kenyan': 'Buy a small company that has the AI technology we need'
          }
        },
        {
          id: 'sc_004_d',
          text: 'Focus on existing strengths while monitoring the market',
          reasoning: 'Avoid hasty decisions and maintain current advantages',
          implications: ['Lower risk', 'Potential market share loss', 'Time to develop better strategy'],
          personaAlignment: ['Strategic Observer', 'Strategic Explorer'],
          culturalAdaptations: {
            'kenyan': 'Keep doing what we do best while watching what happens in the market'
          }
        }
      ]
    };
  }

  /**
   * Create scenario-based questions
   */
  private createScenarioQuestions(): Question[] {
    const questions: Question[] = [];

    for (const scenario of this.scenarios) {
      const choices = this.scenarioChoices[scenario.id] || [];
      
      questions.push({
        id: scenario.id,
        type: 'scenario_selection',
        text: this.formatScenarioText(scenario),
        options: choices.map(choice => choice.text),
        culturalAdaptations: this.buildScenarioCulturalAdaptations(scenario, choices),
        industrySpecific: scenario.industrySpecific
      });
    }

    return questions;
  }

  /**
   * Format scenario text for presentation
   */
  private formatScenarioText(scenario: Scenario): string {
    return `**${scenario.title}**\n\n${scenario.context}\n\n**Situation:** ${scenario.situation}\n\n**Key Stakeholders:** ${scenario.stakeholders.join(', ')}\n\n**Constraints:** ${scenario.constraints.join(', ')}\n\nWhat would be your approach?`;
  }

  /**
   * Build cultural adaptations for scenarios
   */
  private buildScenarioCulturalAdaptations(
    scenario: Scenario, 
    choices: ScenarioChoice[]
  ): Record<string, string> {
    const adaptations: Record<string, string> = {};

    if (scenario.culturalAdaptations) {
      for (const [culture, adaptation] of Object.entries(scenario.culturalAdaptations)) {
        const adaptedChoices = choices.map((choice, index) => {
          const adaptedText = choice.culturalAdaptations?.[culture] || choice.text;
          return `${index + 1}. ${adaptedText}`;
        }).join('\n');

        adaptations[culture] = `**${scenario.title}**\n\n${adaptation.context}\n\n**Situation:** ${adaptation.situation}\n\n**Key People Involved:** ${adaptation.stakeholders.join(', ')}\n\nWhat would you do?\n\n${adaptedChoices}`;
      }
    }

    return adaptations;
  }

  /**
   * Process scenario response
   */
  protected async processResponse(
    response: AssessmentResponse,
    currentQuestion: Question
  ): Promise<void> {
    const scenarioId = response.questionId;
    const selectedOption = response.responseValue as string;
    const choices = this.scenarioChoices[scenarioId] || [];
    
    // Find the selected choice
    const selectedIndex = currentQuestion.options?.indexOf(selectedOption) || 0;
    const selectedChoice = choices[selectedIndex];

    if (selectedChoice) {
      // Analyze the choice for persona alignment and reasoning
      const analysisResponse: AssessmentResponse = {
        ...response,
        responseValue: {
          selectedOption,
          choiceId: selectedChoice.id,
          reasoning: selectedChoice.reasoning,
          implications: selectedChoice.implications,
          personaAlignment: selectedChoice.personaAlignment
        }
      };

      // Update session with enhanced response
      this.session = {
        ...this.session,
        responses: [...this.session.responses, analysisResponse],
        currentQuestionIndex: this.session.currentQuestionIndex + 1,
        updatedAt: new Date()
      };
    } else {
      // Fallback to original response
      this.session = {
        ...this.session,
        responses: [...this.session.responses, response],
        currentQuestionIndex: this.session.currentQuestionIndex + 1,
        updatedAt: new Date()
      };
    }
  }

  /**
   * Determine next scenario question
   */
  protected async determineNextQuestion(
    responses: AssessmentResponse[],
    currentIndex: number
  ): Promise<Question | null> {
    // Analyze responses to determine persona tendencies
    const personaScores = this.analyzePersonaAlignment(responses);
    
    // Select next scenario that would provide the most insight
    const remainingScenarios = this.scenarios.filter(scenario => 
      !responses.some(r => r.questionId === scenario.id)
    );

    if (remainingScenarios.length === 0) {
      return null;
    }

    // Prioritize scenarios that test different persona dimensions
    const nextScenario = this.selectOptimalScenario(remainingScenarios, personaScores);
    
    if (nextScenario) {
      const choices = this.scenarioChoices[nextScenario.id] || [];
      return {
        id: nextScenario.id,
        type: 'scenario_selection',
        text: this.formatScenarioText(nextScenario),
        options: choices.map(choice => choice.text),
        culturalAdaptations: this.buildScenarioCulturalAdaptations(nextScenario, choices),
        industrySpecific: nextScenario.industrySpecific
      };
    }

    return null;
  }

  /**
   * Analyze persona alignment from scenario responses
   */
  private analyzePersonaAlignment(responses: AssessmentResponse[]): Record<PersonaType, number> {
    const personaScores: Record<PersonaType, number> = {
      'Strategic Architect': 0,
      'Strategic Catalyst': 0,
      'Strategic Contributor': 0,
      'Strategic Explorer': 0,
      'Strategic Observer': 0
    };

    for (const response of responses) {
      const responseData = response.responseValue as any;
      if (responseData?.personaAlignment) {
        for (const persona of responseData.personaAlignment) {
          personaScores[persona as PersonaType] += 1;
        }
      }
    }

    return personaScores;
  }

  /**
   * Select optimal scenario for maximum insight
   */
  private selectOptimalScenario(
    remainingScenarios: Scenario[],
    personaScores: Record<PersonaType, number>
  ): Scenario | null {
    if (remainingScenarios.length === 0) return null;

    // For now, return the first remaining scenario
    // This could be enhanced with more sophisticated selection logic
    return remainingScenarios[0];
  }

  /**
   * Apply industry-specific adaptations for scenarios
   */
  protected override async applyIndustryAdaptations(question: Question): Promise<Question> {
    const industry = this.userContext.industry?.toLowerCase();
    
    if (!industry || !question.industrySpecific) return question;

    const adaptedQuestion = { ...question };
    const scenarioId = question.id;
    const scenario = this.scenarios.find(s => s.id === scenarioId);

    if (!scenario) return question;

    // Apply industry-specific context modifications
    switch (industry) {
      case 'financial_services':
        if (scenarioId === 'sc_001') {
          adaptedQuestion.text = adaptedQuestion.text.replace(
            'customer service system',
            'regulatory-compliant customer service system with audit trails'
          );
        }
        break;
        
      case 'healthcare':
        if (scenarioId === 'sc_001') {
          adaptedQuestion.text = adaptedQuestion.text.replace(
            'customer service system',
            'patient communication system with HIPAA compliance'
          );
        }
        break;
        
      case 'manufacturing':
        if (scenarioId === 'sc_002') {
          adaptedQuestion.text = adaptedQuestion.text.replace(
            'customer-facing operations',
            'production and supply chain operations'
          );
        }
        break;
        
      case 'government':
        if (scenarioId === 'sc_004') {
          adaptedQuestion.text = adaptedQuestion.text.replace(
            'competitor',
            'another government agency or private sector organization'
          );
        }
        break;
    }

    return adaptedQuestion;
  }
}