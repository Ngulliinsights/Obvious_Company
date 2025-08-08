import { UserContext, Question, AssessmentResponse } from '../models/types';
import { CulturalAdapter } from './CulturalAdapter';

export interface LocalizedContent {
  originalText: string;
  localizedText: string;
  culturalContext: string;
  localizationRules: string[];
  confidence: number;
}

export interface ScenarioTemplate {
  id: string;
  baseScenario: string;
  culturalAdaptations: Record<string, {
    scenario: string;
    context: string[];
    businessPractices: string[];
    stakeholders: string[];
  }>;
  industry?: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
}

export interface CommunicationTemplate {
  templateId: string;
  purpose: string;
  baseTemplate: string;
  culturalVariations: Record<string, {
    template: string;
    formalityLevel: 'formal' | 'semi-formal' | 'casual';
    keyPhrases: string[];
    avoidPhrases: string[];
  }>;
}

export class LocalizationEngine {
  private culturalAdapter: CulturalAdapter;
  private scenarioTemplates: Map<string, ScenarioTemplate>;
  private communicationTemplates: Map<string, CommunicationTemplate>;
  private culturalExamples: Map<string, Record<string, string[]>>;

  constructor(culturalAdapter: CulturalAdapter) {
    this.culturalAdapter = culturalAdapter;
    this.scenarioTemplates = new Map();
    this.communicationTemplates = new Map();
    this.culturalExamples = new Map();
    this.initializeScenarioTemplates();
    this.initializeCommunicationTemplates();
    this.initializeCulturalExamples();
  }

  /**
   * Initialize culturally appropriate scenario templates
   */
  private initializeScenarioTemplates(): void {
    // AI Implementation Decision Scenario
    this.scenarioTemplates.set('ai-implementation-decision', {
      id: 'ai-implementation-decision',
      baseScenario: 'Your organization is considering implementing AI to improve customer service efficiency.',
      culturalAdaptations: {
        'east-africa-kenya': {
          scenario: 'Your organization wants to use AI to better serve customers while maintaining the personal relationships that are central to Kenyan business culture. The board includes respected community leaders who value both innovation and tradition.',
          context: ['relationship-preservation', 'community-respect', 'gradual-change'],
          businessPractices: ['consensus-building', 'elder-consultation', 'community-impact-assessment'],
          stakeholders: ['board-elders', 'community-representatives', 'customer-advocates', 'staff-representatives']
        },
        'west-africa': {
          scenario: 'Your organization is exploring AI to enhance customer service while honoring the storytelling and personal connection traditions that define West African business relationships.',
          context: ['storytelling-tradition', 'extended-consultation', 'community-benefit'],
          businessPractices: ['extended-family-consultation', 'community-endorsement', 'wisdom-seeking'],
          stakeholders: ['extended-family-network', 'community-elders', 'traditional-leaders', 'customer-community']
        },
        'southern-africa': {
          scenario: 'Your organization is evaluating AI implementation to improve customer service efficiency while maintaining the ubuntu philosophy of collective benefit and human dignity.',
          context: ['ubuntu-philosophy', 'collective-benefit', 'human-dignity'],
          businessPractices: ['stakeholder-inclusion', 'ubuntu-consensus', 'merit-consideration'],
          stakeholders: ['all-affected-parties', 'community-representatives', 'employee-unions', 'customer-groups']
        }
      },
      complexity: 'intermediate'
    });

    // Budget Allocation Scenario
    this.scenarioTemplates.set('budget-allocation', {
      id: 'budget-allocation',
      baseScenario: 'You have a limited budget and must choose between AI training for staff or new AI software.',
      culturalAdaptations: {
        'east-africa-kenya': {
          scenario: 'Your organization has KSH 2.5M to invest in AI development. You must choose between comprehensive staff training (building internal capacity) or purchasing AI software (immediate capability). Consider the Kenyan preference for building local expertise.',
          context: ['capacity-building', 'local-expertise', 'sustainable-development'],
          businessPractices: ['investment-in-people', 'knowledge-transfer', 'community-development'],
          stakeholders: ['staff-development-committee', 'training-coordinators', 'local-experts', 'management-team']
        },
        'west-africa': {
          scenario: 'Your organization has resources to either invest in extensive community-based AI training or acquire advanced AI tools. Consider how each choice affects the broader community and aligns with collective prosperity values.',
          context: ['community-development', 'collective-prosperity', 'knowledge-sharing'],
          businessPractices: ['community-benefit-first', 'knowledge-sharing', 'collective-investment'],
          stakeholders: ['community-development-board', 'training-cooperatives', 'local-institutions', 'beneficiary-communities']
        },
        'southern-africa': {
          scenario: 'Your organization must allocate resources between AI skills development for your team or acquiring AI technology. Consider the ubuntu principle of collective growth and the importance of building sustainable capabilities.',
          context: ['collective-growth', 'sustainable-capabilities', 'ubuntu-development'],
          businessPractices: ['collective-benefit', 'sustainable-development', 'skills-transfer'],
          stakeholders: ['skills-development-committee', 'employee-representatives', 'community-partners', 'sustainability-advisors']
        }
      },
      complexity: 'advanced'
    });

    // Change Management Scenario
    this.scenarioTemplates.set('change-management', {
      id: 'change-management',
      baseScenario: 'Some employees are resistant to AI implementation. How do you address their concerns?',
      culturalAdaptations: {
        'east-africa-kenya': {
          scenario: 'Some team members are concerned about AI implementation, citing respect for traditional ways of working and fear of job displacement. How do you address these concerns while honoring both innovation needs and cultural values?',
          context: ['tradition-respect', 'job-security', 'cultural-values', 'innovation-balance'],
          businessPractices: ['respectful-dialogue', 'consensus-building', 'gradual-introduction', 'security-assurance'],
          stakeholders: ['concerned-employees', 'traditional-leaders', 'union-representatives', 'change-champions']
        },
        'west-africa': {
          scenario: 'Community members and employees express concerns about AI replacing human wisdom and disrupting traditional business relationships. How do you address these concerns through storytelling and community engagement?',
          context: ['wisdom-preservation', 'relationship-protection', 'community-engagement', 'tradition-innovation-balance'],
          businessPractices: ['storytelling-explanation', 'community-dialogue', 'wisdom-integration', 'relationship-assurance'],
          stakeholders: ['community-elders', 'concerned-families', 'traditional-business-partners', 'cultural-advisors']
        },
        'southern-africa': {
          scenario: 'Team members are concerned that AI implementation might undermine the ubuntu philosophy of human interconnectedness and collective decision-making. How do you address these concerns while moving forward with necessary changes?',
          context: ['ubuntu-preservation', 'human-interconnectedness', 'collective-decision-making', 'change-adaptation'],
          businessPractices: ['ubuntu-dialogue', 'collective-problem-solving', 'human-dignity-assurance', 'inclusive-planning'],
          stakeholders: ['employee-collectives', 'ubuntu-advocates', 'change-facilitators', 'community-representatives']
        }
      },
      complexity: 'advanced'
    });
  }

  /**
   * Initialize culturally sensitive communication templates
   */
  private initializeCommunicationTemplates(): void {
    // Assessment Results Communication
    this.communicationTemplates.set('assessment-results', {
      templateId: 'assessment-results',
      purpose: 'Communicate assessment results and recommendations',
      baseTemplate: 'Based on your assessment, we recommend the following AI integration approach...',
      culturalVariations: {
        'east-africa-kenya': {
          template: 'Asante for taking time to complete this comprehensive assessment. Based on your responses and considering your organization\'s unique context, we have identified opportunities that align with Kenyan business values and practices. Our recommendations honor both innovation potential and cultural wisdom...',
          formalityLevel: 'semi-formal',
          keyPhrases: ['Asante (Thank you)', 'cultural wisdom', 'community benefit', 'sustainable growth', 'respectful innovation'],
          avoidPhrases: ['disruptive change', 'rapid transformation', 'Western best practices', 'industry standards']
        },
        'west-africa': {
          template: 'We deeply appreciate the time and thoughtfulness you brought to this assessment. Like the wisdom of our ancestors who adapted to new opportunities while preserving essential values, your organization can embrace AI in ways that strengthen rather than replace human connections...',
          formalityLevel: 'formal',
          keyPhrases: ['ancestral wisdom', 'community strength', 'collective prosperity', 'traditional values', 'respectful progress'],
          avoidPhrases: ['efficiency gains', 'cost reduction', 'automation benefits', 'competitive advantage']
        },
        'southern-africa': {
          template: 'Thank you for your thoughtful participation in this assessment. In the spirit of ubuntu - recognizing that we are interconnected - we have developed recommendations that honor both your organization\'s growth aspirations and the collective well-being of all stakeholders...',
          formalityLevel: 'semi-formal',
          keyPhrases: ['ubuntu spirit', 'collective well-being', 'interconnected growth', 'stakeholder benefit', 'sustainable progress'],
          avoidPhrases: ['individual advantage', 'competitive edge', 'market dominance', 'rapid scaling']
        }
      }
    });

    // Service Recommendation Communication
    this.communicationTemplates.set('service-recommendation', {
      templateId: 'service-recommendation',
      purpose: 'Recommend appropriate service tier based on assessment',
      baseTemplate: 'Based on your assessment results, we recommend our [SERVICE_TIER] program...',
      culturalVariations: {
        'east-africa-kenya': {
          template: 'Considering your organization\'s readiness level and cultural context, we believe our [SERVICE_TIER] program would provide the most respectful and effective path forward. This approach allows for gradual implementation while building internal capacity - values that align well with Kenyan business wisdom...',
          formalityLevel: 'semi-formal',
          keyPhrases: ['respectful path', 'gradual implementation', 'internal capacity', 'business wisdom', 'sustainable development'],
          avoidPhrases: ['aggressive timeline', 'rapid deployment', 'immediate transformation', 'disruptive innovation']
        },
        'west-africa': {
          template: 'After careful consideration of your assessment responses and cultural context, we recommend our [SERVICE_TIER] program. This approach honors the West African tradition of thorough consultation and community benefit, ensuring that AI implementation strengthens rather than disrupts your valuable business relationships...',
          formalityLevel: 'formal',
          keyPhrases: ['thorough consultation', 'community benefit', 'business relationships', 'collective wisdom', 'respectful implementation'],
          avoidPhrases: ['quick wins', 'efficiency optimization', 'cost savings', 'competitive positioning']
        },
        'southern-africa': {
          template: 'In alignment with ubuntu principles and your assessment results, we recommend our [SERVICE_TIER] program. This approach ensures that AI implementation benefits all stakeholders while respecting the interconnected nature of your business ecosystem...',
          formalityLevel: 'semi-formal',
          keyPhrases: ['ubuntu principles', 'stakeholder benefit', 'interconnected ecosystem', 'collective growth', 'sustainable transformation'],
          avoidPhrases: ['individual optimization', 'market advantage', 'competitive superiority', 'rapid scaling']
        }
      }
    });

    // Follow-up Communication
    this.communicationTemplates.set('follow-up', {
      templateId: 'follow-up',
      purpose: 'Follow up after assessment completion',
      baseTemplate: 'Thank you for completing the assessment. Here are your next steps...',
      culturalVariations: {
        'east-africa-kenya': {
          template: 'Asante sana for your time and thoughtful responses. We understand that implementing AI is a significant decision that affects not just your organization but your entire community. We\'re here to support you at whatever pace feels right for your context...',
          formalityLevel: 'semi-formal',
          keyPhrases: ['Asante sana', 'thoughtful responses', 'community impact', 'right pace', 'contextual support'],
          avoidPhrases: ['urgent action needed', 'limited time offer', 'competitive pressure', 'immediate decision']
        },
        'west-africa': {
          template: 'We are honored that you chose to share your organization\'s story with us through this assessment. Like the baobab tree that grows slowly but stands for centuries, sustainable AI implementation requires patience, wisdom, and community support...',
          formalityLevel: 'formal',
          keyPhrases: ['honored', 'organization\'s story', 'baobab wisdom', 'sustainable implementation', 'community support'],
          avoidPhrases: ['quick results', 'immediate benefits', 'fast track', 'accelerated timeline']
        },
        'southern-africa': {
          template: 'Thank you for taking this important step in your AI journey. We recognize that true transformation happens when it benefits the collective, not just the individual organization. We\'re committed to supporting your ubuntu-centered approach to AI integration...',
          formalityLevel: 'semi-formal',
          keyPhrases: ['important step', 'collective benefit', 'ubuntu-centered approach', 'committed support', 'true transformation'],
          avoidPhrases: ['personal advantage', 'organizational superiority', 'market leadership', 'competitive edge']
        }
      }
    });
  }

  /**
   * Initialize culturally appropriate examples and case studies
   */
  private initializeCulturalExamples(): void {
    // East Africa - Kenya examples
    this.culturalExamples.set('east-africa-kenya', {
      'financial-services': [
        'M-Pesa integration with AI for fraud detection while maintaining user privacy',
        'Sacco societies using AI for member risk assessment and loan optimization',
        'Microfinance institutions leveraging AI for community-based lending decisions'
      ],
      'agriculture': [
        'Smallholder farmers using AI-powered weather prediction for crop planning',
        'Cooperative societies implementing AI for supply chain optimization',
        'Agricultural extension services using AI to provide localized farming advice'
      ],
      'healthcare': [
        'Community health workers using AI tools for diagnostic support in rural areas',
        'Hospitals implementing AI while maintaining patient-doctor relationship focus',
        'Health insurance providers using AI for community-based risk assessment'
      ],
      'education': [
        'Universities integrating AI while preserving Ubuntu learning philosophies',
        'Technical training institutes using AI for skills development programs',
        'Community education centers leveraging AI for adult literacy programs'
      ],
      'manufacturing': [
        'Local manufacturers using AI for quality control while maintaining employment',
        'Textile cooperatives implementing AI for production optimization',
        'Food processing companies using AI for safety and quality assurance'
      ]
    });

    // West Africa examples
    this.culturalExamples.set('west-africa', {
      'financial-services': [
        'Mobile money platforms using AI while preserving community trust networks',
        'Community banks implementing AI for collective lending decisions',
        'Microfinance cooperatives using AI to support traditional savings groups'
      ],
      'agriculture': [
        'Farmer cooperatives using AI for collective crop planning and marketing',
        'Traditional farming communities integrating AI with indigenous knowledge',
        'Agricultural markets using AI for fair price determination and distribution'
      ],
      'trade': [
        'Traditional markets implementing AI for inventory and customer relationship management',
        'Cross-border trade networks using AI for logistics while maintaining personal relationships',
        'Artisan cooperatives leveraging AI for global market access'
      ],
      'healthcare': [
        'Community health systems using AI to complement traditional healing practices',
        'Regional hospitals implementing AI while respecting cultural health beliefs',
        'Health cooperatives using AI for community-wide health monitoring'
      ]
    });

    // Southern Africa examples
    this.culturalExamples.set('southern-africa', {
      'mining': [
        'Mining cooperatives using AI for safety monitoring while preserving worker dignity',
        'Community-owned mines implementing AI for environmental protection',
        'Mining companies using AI for equitable resource distribution'
      ],
      'financial-services': [
        'Community banks using AI for ubuntu-based lending decisions',
        'Stokvels (savings clubs) integrating AI for collective financial planning',
        'Credit unions implementing AI while maintaining member-focused approaches'
      ],
      'manufacturing': [
        'Worker-owned cooperatives using AI for production optimization',
        'Community manufacturing hubs implementing AI for skills development',
        'Local manufacturers using AI while preserving traditional craftsmanship'
      ],
      'tourism': [
        'Community-based tourism using AI for sustainable visitor management',
        'Cultural heritage sites implementing AI for preservation and education',
        'Eco-tourism cooperatives using AI for environmental monitoring'
      ]
    });
  }

  /**
   * Localize content based on user's cultural context
   */
  localizeContent(
    content: string, 
    userContext: UserContext, 
    contentType: 'question' | 'scenario' | 'example' | 'communication' = 'question'
  ): LocalizedContent {
    const culturalContext = this.determineCulturalContext(userContext);
    const localizationRules: string[] = [];
    let confidence = 0.8; // Base confidence

    let localizedText = content;

    // Apply cultural adaptation through CulturalAdapter
    if (contentType === 'question') {
      // This would typically involve creating a Question object and using CulturalAdapter
      localizedText = this.culturalAdapter.applyCulturalTerminology(content, culturalContext);
      localizationRules.push('cultural-terminology');
    }

    // Apply scenario-specific localization
    if (contentType === 'scenario') {
      localizedText = this.localizeScenario(content, culturalContext);
      localizationRules.push('scenario-adaptation');
      confidence = 0.9;
    }

    // Apply communication template localization
    if (contentType === 'communication') {
      localizedText = this.localizeCommunication(content, culturalContext);
      localizationRules.push('communication-template');
      confidence = 0.95;
    }

    return {
      originalText: content,
      localizedText,
      culturalContext,
      localizationRules,
      confidence
    };
  }

  /**
   * Get culturally appropriate scenario for assessment
   */
  getCulturalScenario(scenarioId: string, userContext: UserContext): string {
    const culturalContext = this.determineCulturalContext(userContext);
    const template = this.scenarioTemplates.get(scenarioId);

    if (!template || !template.culturalAdaptations[culturalContext]) {
      return template?.baseScenario || 'Scenario not available';
    }

    return template.culturalAdaptations[culturalContext].scenario;
  }

  /**
   * Get culturally appropriate examples for a specific industry
   */
  getCulturalExamples(industry: string, userContext: UserContext, count: number = 3): string[] {
    const culturalContext = this.determineCulturalContext(userContext);
    const examples = this.culturalExamples.get(culturalContext);

    if (!examples || !examples[industry]) {
      return [];
    }

    return examples[industry].slice(0, count);
  }

  /**
   * Generate culturally appropriate communication
   */
  generateCulturalCommunication(
    templateId: string, 
    userContext: UserContext, 
    variables: Record<string, string> = {}
  ): string {
    const culturalContext = this.determineCulturalContext(userContext);
    const template = this.communicationTemplates.get(templateId);

    if (!template || !template.culturalVariations[culturalContext]) {
      return template?.baseTemplate || 'Communication template not available';
    }

    let communication = template.culturalVariations[culturalContext].template;

    // Replace variables in template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `[${key.toUpperCase()}]`;
      communication = communication.replace(new RegExp(placeholder, 'g'), value);
    }

    return communication;
  }

  /**
   * Validate cultural appropriateness of content
   */
  validateCulturalAppropriateness(
    content: string, 
    userContext: UserContext
  ): {
    isAppropriate: boolean;
    issues: string[];
    suggestions: string[];
    culturalContext: string;
  } {
    const culturalContext = this.determineCulturalContext(userContext);
    const validation = this.culturalAdapter.validateCulturalSensitivity(content);

    // Additional localization-specific validation
    const localizationIssues: string[] = [];
    const localizationSuggestions: string[] = [];

    // Check for inappropriate urgency language in relationship-first cultures
    if (['east-africa-kenya', 'west-africa'].includes(culturalContext)) {
      if (content.includes('urgent') || content.includes('immediate') || content.includes('ASAP')) {
        localizationIssues.push('Content uses urgency language inappropriate for relationship-first cultures');
        localizationSuggestions.push('Consider using phrases like "when convenient" or "at your preferred pace"');
      }
    }

    // Check for individualistic language in collective cultures
    if (content.includes('your competitive advantage') || content.includes('outperform competitors')) {
      localizationIssues.push('Content emphasizes individual advantage over collective benefit');
      localizationSuggestions.push('Consider framing benefits in terms of community or collective improvement');
    }

    return {
      isAppropriate: validation.isValid && localizationIssues.length === 0,
      issues: [...validation.issues, ...localizationIssues],
      suggestions: [...validation.suggestions, ...localizationSuggestions],
      culturalContext
    };
  }

  /**
   * Determine cultural context from user context
   */
  private determineCulturalContext(userContext: UserContext): string {
    // This would typically use the same logic as CulturalAdapter
    if (userContext.geographicRegion) {
      const regionMapping: Record<string, string> = {
        'kenya': 'east-africa-kenya',
        'uganda': 'east-africa-kenya',
        'tanzania': 'east-africa-kenya',
        'rwanda': 'east-africa-kenya',
        'nigeria': 'west-africa',
        'ghana': 'west-africa',
        'senegal': 'west-africa',
        'south-africa': 'southern-africa',
        'botswana': 'southern-africa',
        'zimbabwe': 'southern-africa'
      };

      return regionMapping[userContext.geographicRegion.toLowerCase()] || 'east-africa-kenya';
    }

    return 'east-africa-kenya';
  }

  /**
   * Localize scenario content
   */
  private localizeScenario(content: string, culturalContext: string): string {
    // Apply scenario-specific localization rules
    let localizedContent = content;

    // Replace generic business terms with culturally appropriate ones
    const replacements: Record<string, Record<string, string>> = {
      'east-africa-kenya': {
        'stakeholders': 'community members and stakeholders',
        'decision makers': 'respected leaders and decision makers',
        'implementation': 'gradual introduction',
        'efficiency': 'improved service to our community'
      },
      'west-africa': {
        'stakeholders': 'extended family and community network',
        'decision makers': 'elders and community leaders',
        'implementation': 'thoughtful integration',
        'efficiency': 'better service to our people'
      },
      'southern-africa': {
        'stakeholders': 'all affected community members',
        'decision makers': 'collective leadership',
        'implementation': 'ubuntu-centered adoption',
        'efficiency': 'enhanced collective benefit'
      }
    };

    const contextReplacements = replacements[culturalContext];
    if (contextReplacements) {
      for (const [original, replacement] of Object.entries(contextReplacements)) {
        const regex = new RegExp(original, 'gi');
        localizedContent = localizedContent.replace(regex, replacement);
      }
    }

    return localizedContent;
  }

  /**
   * Localize communication content
   */
  private localizeCommunication(content: string, culturalContext: string): string {
    // This would apply communication-specific localization
    // For now, return the content as-is since specific templates handle this
    return content;
  }
}