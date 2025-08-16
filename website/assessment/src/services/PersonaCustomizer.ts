import {
  PersonaType,
  PersonaClassification,
  ServiceRecommendation,
  UserContext,
  IndustryInsights,
} from '../models/types';
import { UserProfile } from '../models/UserProfile';

export interface PersonaContent {
  language: {
    tone: string;
    vocabulary: string[];
    communicationStyle: string;
  };
  examples: {
    useCases: string[];
    roiScenarios: string[];
    implementationApproaches: string[];
  };
  recommendations: {
    serviceAlignment: string;
    nextSteps: string[];
    timelineApproach: string;
    resourceFocus: string[];
  };
}

export interface PersonaCustomization {
  content: PersonaContent;
  serviceRecommendation: ServiceRecommendation;
  customizedMessaging: {
    valueProposition: string;
    implementationFocus: string;
    successMetrics: string[];
    riskMitigation: string[];
  };
}

export class PersonaCustomizer {
  private static readonly PERSONA_CONTENT: Record<PersonaType, PersonaContent> = {
    'Strategic Architect': {
      language: {
        tone: 'executive',
        vocabulary: [
          'strategic transformation',
          'enterprise-wide impact',
          'competitive advantage',
          'organizational evolution',
        ],
        communicationStyle: 'direct, high-level, outcome-focused',
      },
      examples: {
        useCases: [
          'Enterprise-wide AI strategy development',
          'Board-level AI governance frameworks',
          'Competitive intelligence and market positioning',
          'Organizational transformation through AI adoption',
        ],
        roiScenarios: [
          '25-40% operational efficiency gains across business units',
          'Strategic market positioning through AI-driven innovation',
          'Risk mitigation through predictive analytics and scenario planning',
          'Revenue growth through AI-enabled product and service innovation',
        ],
        implementationApproaches: [
          'Top-down strategic mandate with clear governance structure',
          'Phased enterprise rollout with pilot programs and scaling',
          'Cross-functional leadership team with dedicated AI transformation office',
          'Strategic partnerships with AI vendors and implementation partners',
        ],
      },
      recommendations: {
        serviceAlignment: 'Strategic Advantage tier - comprehensive transformation',
        nextSteps: [
          'Executive AI readiness assessment and strategic planning session',
          'Enterprise AI strategy development with governance framework',
          'Leadership team alignment and change management planning',
          'Pilot program design with measurable success criteria',
        ],
        timelineApproach: '6-18 month strategic transformation with quarterly milestones',
        resourceFocus: [
          'Executive sponsorship and change leadership',
          'Dedicated AI transformation team and budget allocation',
          'Strategic technology partnerships and vendor relationships',
          'Organizational culture and capability development',
        ],
      },
    },
    'Strategic Catalyst': {
      language: {
        tone: 'collaborative',
        vocabulary: [
          'change leadership',
          'organizational alignment',
          'capability building',
          'strategic implementation',
        ],
        communicationStyle: 'engaging, solution-oriented, team-focused',
      },
      examples: {
        useCases: [
          'Cross-departmental AI integration initiatives',
          'Change management for AI adoption programs',
          'Team capability building and AI literacy development',
          'Process optimization through intelligent automation',
        ],
        roiScenarios: [
          '15-30% productivity improvements through process optimization',
          'Enhanced decision-making quality through data-driven insights',
          'Improved team collaboration and knowledge sharing',
          'Accelerated innovation cycles through AI-assisted workflows',
        ],
        implementationApproaches: [
          'Collaborative implementation with stakeholder engagement',
          'Iterative approach with continuous feedback and adjustment',
          'Team-based learning and capability development programs',
          'Cross-functional project teams with clear accountability',
        ],
      },
      recommendations: {
        serviceAlignment: 'Strategic Systems tier - implementation and change management',
        nextSteps: [
          'Stakeholder alignment workshop and readiness assessment',
          'Change management strategy development',
          'Team capability assessment and training program design',
          'Pilot implementation with success metrics and feedback loops',
        ],
        timelineApproach: '3-12 month implementation with iterative improvements',
        resourceFocus: [
          'Change management expertise and stakeholder engagement',
          'Team training and capability development resources',
          'Cross-functional collaboration and communication tools',
          'Performance measurement and continuous improvement systems',
        ],
      },
    },
    'Strategic Contributor': {
      language: {
        tone: 'practical',
        vocabulary: [
          'tactical implementation',
          'operational efficiency',
          'process improvement',
          'team productivity',
        ],
        communicationStyle: 'detailed, action-oriented, results-focused',
      },
      examples: {
        useCases: [
          'Department-specific AI tool implementation',
          'Workflow automation and process optimization',
          'Team productivity enhancement through AI assistance',
          'Data analysis and reporting automation',
        ],
        roiScenarios: [
          '10-25% efficiency gains in specific processes',
          'Reduced manual work and improved accuracy',
          'Enhanced data-driven decision making at department level',
          'Improved customer service and response times',
        ],
        implementationApproaches: [
          'Focused implementation within specific department or function',
          'Practical, hands-on approach with immediate value demonstration',
          'Step-by-step rollout with clear success metrics',
          'Integration with existing systems and workflows',
        ],
      },
      recommendations: {
        serviceAlignment: 'Strategic Clarity tier - focused implementation support',
        nextSteps: [
          'Department-specific needs assessment and opportunity identification',
          'Tactical implementation planning with clear deliverables',
          'Tool selection and integration strategy development',
          'Team training and adoption support program',
        ],
        timelineApproach: '1-6 month focused implementation with quick wins',
        resourceFocus: [
          'Practical implementation expertise and hands-on support',
          'Tool integration and technical implementation resources',
          'Team training and adoption support materials',
          'Performance tracking and optimization guidance',
        ],
      },
    },
    'Strategic Explorer': {
      language: {
        tone: 'educational',
        vocabulary: [
          'learning journey',
          'skill development',
          'exploration',
          'growth opportunities',
        ],
        communicationStyle: 'supportive, developmental, growth-oriented',
      },
      examples: {
        useCases: [
          'Personal AI literacy and skill development',
          'Exploration of AI applications in current role',
          'Preparation for future leadership opportunities',
          'Innovation and experimentation with AI tools',
        ],
        roiScenarios: [
          'Enhanced personal productivity and effectiveness',
          'Improved problem-solving and analytical capabilities',
          'Increased value contribution to team and organization',
          'Career advancement through AI expertise development',
        ],
        implementationApproaches: [
          'Learning-focused approach with experimentation and practice',
          'Gradual skill building with practical application opportunities',
          'Mentorship and guidance from AI implementation experts',
          'Community-based learning and peer collaboration',
        ],
      },
      recommendations: {
        serviceAlignment: 'Strategic Clarity tier - learning and development focus',
        nextSteps: [
          'Personal AI readiness assessment and learning path development',
          'Foundational AI literacy training and skill building',
          'Practical experimentation with AI tools and applications',
          'Mentorship and guidance for career development planning',
        ],
        timelineApproach: '3-9 month learning journey with milestone achievements',
        resourceFocus: [
          'Educational content and learning resources',
          'Practical experimentation opportunities and tools',
          'Mentorship and guidance from AI experts',
          'Community access and peer learning opportunities',
        ],
      },
    },
    'Strategic Observer': {
      language: {
        tone: 'informational',
        vocabulary: ['assessment', 'exploration', 'understanding', 'preparation'],
        communicationStyle: 'clear, informative, non-pressured',
      },
      examples: {
        useCases: [
          'AI landscape understanding and awareness building',
          'Assessment of organizational AI readiness',
          'Exploration of AI potential in specific context',
          'Preparation for future AI initiatives',
        ],
        roiScenarios: [
          'Improved understanding of AI opportunities and risks',
          'Better preparation for future AI initiatives',
          'Enhanced ability to contribute to AI discussions',
          'Informed decision-making about AI investments',
        ],
        implementationApproaches: [
          'Assessment-focused approach with no immediate implementation pressure',
          'Educational and awareness-building activities',
          'Consultation and guidance for future planning',
          'Flexible engagement based on evolving needs and readiness',
        ],
      },
      recommendations: {
        serviceAlignment: 'Assessment-based consultation - flexible engagement',
        nextSteps: [
          'Comprehensive AI readiness assessment and gap analysis',
          'Educational consultation on AI opportunities and considerations',
          'Strategic planning support for future AI initiatives',
          'Ongoing advisory relationship with flexible engagement',
        ],
        timelineApproach: 'Flexible timeline based on readiness and organizational needs',
        resourceFocus: [
          'Assessment and consultation expertise',
          'Educational resources and awareness-building materials',
          'Strategic planning and advisory support',
          'Flexible engagement model with scalable support',
        ],
      },
    },
  };

  /**
   * Generate persona-specific customization based on classification
   */
  static generateCustomization(
    classification: PersonaClassification,
    userProfile: UserProfile,
    userContext: UserContext,
    industryInsights?: IndustryInsights
  ): PersonaCustomization {
    const personaContent = this.PERSONA_CONTENT[classification.primaryPersona];

    // Generate service recommendation
    const serviceRecommendation = this.generateServiceRecommendation(
      classification,
      userProfile,
      industryInsights
    );

    // Generate customized messaging
    const customizedMessaging = this.generateCustomizedMessaging(
      classification,
      userContext,
      industryInsights
    );

    // Apply cultural and industry adaptations
    const adaptedContent = this.applyContextualAdaptations(
      personaContent,
      userContext,
      industryInsights
    );

    return {
      content: adaptedContent,
      serviceRecommendation,
      customizedMessaging,
    };
  }

  /**
   * Generate service recommendation based on persona and context
   */
  private static generateServiceRecommendation(
    classification: PersonaClassification,
    userProfile: UserProfile,
    industryInsights?: IndustryInsights
  ): ServiceRecommendation {
    const persona = classification.primaryPersona;
    const orgSize = userProfile.professional.organizationSize;

    // Base service tier mapping
    let tier: ServiceRecommendation['tier'];
    let priceRange: string;
    let timelineEstimate: string;

    switch (persona) {
      case 'Strategic Architect':
        tier = 'Strategic Advantage';
        priceRange = '$50K-75K';
        timelineEstimate = '6-18 months';
        break;
      case 'Strategic Catalyst':
        tier = 'Strategic Systems';
        priceRange = '$25K-40K';
        timelineEstimate = '3-12 months';
        break;
      case 'Strategic Contributor':
        tier = 'Strategic Clarity';
        priceRange = '$10K-15K';
        timelineEstimate = '1-6 months';
        break;
      case 'Strategic Explorer':
        tier = 'Strategic Clarity';
        priceRange = '$75K-150K KSH';
        timelineEstimate = '3-9 months';
        break;
      case 'Strategic Observer':
        tier = 'Strategic Clarity';
        priceRange = 'Assessment-based consultation';
        timelineEstimate = 'Flexible based on readiness';
        break;
    }

    // Adjust for organization size and industry complexity
    if (orgSize === 'large' && persona !== 'Strategic Observer') {
      if (tier === 'Strategic Clarity') tier = 'Strategic Systems';
      else if (tier === 'Strategic Systems') tier = 'Strategic Advantage';
    }

    // Generate rationale
    const rationale = this.generateServiceRationale(
      classification,
      userProfile,
      tier,
      industryInsights
    );

    // Generate next steps
    const nextSteps = this.generateNextSteps(persona, tier);

    return {
      tier,
      priceRange,
      rationale,
      nextSteps,
      timelineEstimate,
    };
  }

  /**
   * Generate service recommendation rationale
   */
  private static generateServiceRationale(
    classification: PersonaClassification,
    userProfile: UserProfile,
    tier: ServiceRecommendation['tier'],
    industryInsights?: IndustryInsights
  ): string {
    const persona = classification.primaryPersona;
    const confidence = Math.round(classification.confidenceScore * 100);
    const industry = userProfile.professional.industry;
    const roleLevel = userProfile.professional.roleLevel;

    const rationale = [
      `Based on your ${persona} classification (${confidence}% confidence)`,
      `and ${roleLevel} role in ${industry},`,
      `the ${tier} tier provides the optimal balance of strategic depth and practical implementation.`,
    ];

    // Add persona-specific rationale
    switch (persona) {
      case 'Strategic Architect':
        rationale.push(
          'Your enterprise-wide authority and strategic focus require comprehensive transformation support with governance frameworks and change management expertise.'
        );
        break;
      case 'Strategic Catalyst':
        rationale.push(
          'Your change leadership capabilities and organizational influence align with systematic implementation and team capability building approaches.'
        );
        break;
      case 'Strategic Contributor':
        rationale.push(
          'Your tactical implementation focus and department-level authority benefit from targeted, practical solutions with clear ROI demonstration.'
        );
        break;
      case 'Strategic Explorer':
        rationale.push(
          'Your learning orientation and growth potential are best served through educational approaches with practical experimentation opportunities.'
        );
        break;
      case 'Strategic Observer':
        rationale.push(
          'Your current assessment needs and exploration focus are optimally addressed through flexible consultation and educational support.'
        );
        break;
    }

    // Add industry-specific considerations
    if (industryInsights) {
      rationale.push(
        `Industry-specific considerations for ${industry} include regulatory compliance, sector-specific use cases, and implementation best practices.`
      );
    }

    return rationale.join(' ');
  }

  /**
   * Generate next steps based on persona and service tier
   */
  private static generateNextSteps(
    persona: PersonaType,
    tier: ServiceRecommendation['tier']
  ): string[] {
    const baseSteps = this.PERSONA_CONTENT[persona].recommendations.nextSteps;

    // Add tier-specific steps
    const tierSteps: string[] = [];

    switch (tier) {
      case 'Strategic Advantage':
        tierSteps.push(
          'Executive stakeholder alignment and strategic planning session',
          'Comprehensive organizational readiness assessment',
          'Enterprise AI strategy and governance framework development'
        );
        break;
      case 'Strategic Systems':
        tierSteps.push(
          'Cross-functional team formation and capability assessment',
          'Implementation roadmap development with success metrics',
          'Change management and adoption strategy planning'
        );
        break;
      case 'Strategic Clarity':
        tierSteps.push(
          'Focused needs assessment and opportunity identification',
          'Tactical implementation planning with quick wins',
          'Tool selection and integration strategy development'
        );
        break;
    }

    // Combine and deduplicate
    const allSteps = [...baseSteps, ...tierSteps];
    return Array.from(new Set(allSteps)).slice(0, 5); // Limit to 5 most relevant steps
  }

  /**
   * Generate customized messaging based on persona and context
   */
  private static generateCustomizedMessaging(
    classification: PersonaClassification,
    userContext: UserContext,
    industryInsights?: IndustryInsights
  ): PersonaCustomization['customizedMessaging'] {
    const persona = classification.primaryPersona;
    const industry = userContext.industry || 'business';

    // Base messaging templates
    const messaging = {
      valueProposition: this.generateValueProposition(persona, industry),
      implementationFocus: this.generateImplementationFocus(persona, userContext),
      successMetrics: this.generateSuccessMetrics(persona, industryInsights),
      riskMitigation: this.generateRiskMitigation(persona),
    };

    return messaging;
  }

  /**
   * Generate persona-specific value proposition
   */
  private static generateValueProposition(persona: PersonaType, industry: string): string {
    const baseProps = {
      'Strategic Architect': `Transform your ${industry} organization through strategic AI implementation that delivers enterprise-wide competitive advantage and sustainable growth.`,
      'Strategic Catalyst': `Lead successful AI adoption across your ${industry} teams with proven change management approaches and collaborative implementation strategies.`,
      'Strategic Contributor': `Achieve immediate productivity gains and operational efficiency in your ${industry} department through targeted AI solutions and practical implementation.`,
      'Strategic Explorer': `Develop AI expertise and leadership capabilities that position you for career advancement and increased value contribution in ${industry}.`,
      'Strategic Observer': `Gain comprehensive understanding of AI opportunities and strategic considerations specific to ${industry} through expert assessment and consultation.`,
    };

    return baseProps[persona];
  }

  /**
   * Generate persona-specific implementation focus
   */
  private static generateImplementationFocus(
    persona: PersonaType,
    userContext: UserContext
  ): string {
    const region = userContext.geographicRegion;
    const culturalContext =
      region === 'kenya' || region === 'east-africa'
        ? 'with cultural sensitivity and local market understanding'
        : '';

    const focusAreas = {
      'Strategic Architect': `Enterprise transformation ${culturalContext}, emphasizing strategic intelligence amplification over simple automation`,
      'Strategic Catalyst': `Organizational change management ${culturalContext}, focusing on team alignment and capability building`,
      'Strategic Contributor': `Tactical implementation ${culturalContext}, prioritizing immediate value and process optimization`,
      'Strategic Explorer': `Learning and development ${culturalContext}, emphasizing skill building and career advancement`,
      'Strategic Observer': `Assessment and exploration ${culturalContext}, providing flexible consultation and strategic guidance`,
    };

    return focusAreas[persona];
  }

  /**
   * Generate persona-specific success metrics
   */
  private static generateSuccessMetrics(
    persona: PersonaType,
    industryInsights?: IndustryInsights
  ): string[] {
    const baseMetrics = {
      'Strategic Architect': [
        'Enterprise-wide efficiency gains of 25-40%',
        'Strategic market positioning improvement',
        'ROI achievement within 12-18 months',
        'Organizational transformation success rate',
      ],
      'Strategic Catalyst': [
        'Team productivity improvement of 15-30%',
        'Change adoption success rate above 80%',
        'Cross-functional collaboration enhancement',
        'Implementation timeline adherence',
      ],
      'Strategic Contributor': [
        'Process efficiency gains of 10-25%',
        'Error reduction and quality improvement',
        'Time-to-value achievement within 3 months',
        'User adoption rate above 85%',
      ],
      'Strategic Explorer': [
        'AI literacy and competency development',
        'Career advancement opportunities',
        'Personal productivity enhancement',
        'Innovation contribution increase',
      ],
      'Strategic Observer': [
        'Comprehensive AI readiness understanding',
        'Strategic planning capability improvement',
        'Informed decision-making enhancement',
        'Future initiative preparation success',
      ],
    };

    let metrics = baseMetrics[persona];

    // Add industry-specific metrics if available
    if (industryInsights) {
      metrics = [
        ...metrics,
        'Industry-specific compliance achievement',
        'Sector benchmark performance',
      ];
    }

    return metrics.slice(0, 4); // Limit to 4 most relevant metrics
  }

  /**
   * Generate persona-specific risk mitigation strategies
   */
  private static generateRiskMitigation(persona: PersonaType): string[] {
    const baseRisks = {
      'Strategic Architect': [
        'Comprehensive change management and stakeholder alignment',
        'Phased implementation with clear governance and oversight',
        'Risk assessment and mitigation planning at enterprise level',
        'Cultural adaptation and organizational readiness validation',
      ],
      'Strategic Catalyst': [
        'Team engagement and adoption support strategies',
        'Continuous feedback loops and iterative improvement',
        'Cross-functional collaboration and communication protocols',
        'Performance monitoring and course correction mechanisms',
      ],
      'Strategic Contributor': [
        'Practical implementation with minimal disruption',
        'Clear success criteria and performance measurement',
        'Integration testing and rollback procedures',
        'User training and support system establishment',
      ],
      'Strategic Explorer': [
        'Learning-focused approach with low implementation risk',
        'Gradual skill building with practical application',
        'Mentorship and guidance support system',
        'Flexible timeline and expectation management',
      ],
      'Strategic Observer': [
        'No-pressure assessment and exploration approach',
        'Flexible engagement with scalable commitment',
        'Educational focus with minimal implementation risk',
        'Strategic planning support without immediate execution pressure',
      ],
    };

    return baseRisks[persona];
  }

  /**
   * Apply cultural and industry adaptations to content
   */
  private static applyContextualAdaptations(
    content: PersonaContent,
    userContext: UserContext,
    industryInsights?: IndustryInsights
  ): PersonaContent {
    const adaptedContent = JSON.parse(JSON.stringify(content)); // Deep copy

    // Apply cultural adaptations
    if (
      userContext.geographicRegion === 'kenya' ||
      userContext.geographicRegion === 'east-africa'
    ) {
      // Adjust language for East African context
      adaptedContent.language.vocabulary = adaptedContent.language.vocabulary.map(
        (term: string) => {
          if (term.includes('enterprise-wide'))
            return term.replace('enterprise-wide', 'organization-wide');
          return term;
        }
      );

      // Add culturally appropriate examples
      adaptedContent.examples.useCases = adaptedContent.examples.useCases.map((useCase: string) => {
        return (
          useCase + ' with consideration for local business practices and regulatory environment'
        );
      });
    }

    // Apply industry adaptations
    if (industryInsights && userContext.industry) {
      // Add industry-specific considerations to recommendations
      adaptedContent.recommendations.resourceFocus.push(
        `${userContext.industry}-specific expertise and regulatory compliance`,
        'Industry best practices and sector-specific implementation approaches'
      );
    }

    return adaptedContent;
  }

  /**
   * Get available customization options for a persona
   */
  static getPersonaCustomizationOptions(persona: PersonaType): PersonaContent {
    return this.PERSONA_CONTENT[persona];
  }

  /**
   * Validate customization against persona characteristics
   */
  static validateCustomization(
    customization: PersonaCustomization,
    classification: PersonaClassification
  ): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Check service tier alignment
    const expectedTiers = {
      'Strategic Architect': ['Strategic Advantage'],
      'Strategic Catalyst': ['Strategic Systems', 'Strategic Advantage'],
      'Strategic Contributor': ['Strategic Clarity', 'Strategic Systems'],
      'Strategic Explorer': ['Strategic Clarity'],
      'Strategic Observer': ['Strategic Clarity'],
    };

    const expectedTiersForPersona = expectedTiers[classification.primaryPersona];
    if (!expectedTiersForPersona.includes(customization.serviceRecommendation.tier)) {
      warnings.push(
        `Service tier ${customization.serviceRecommendation.tier} may not align with ${classification.primaryPersona} characteristics`
      );
    }

    // Check confidence alignment
    if (
      classification.confidenceScore < 0.7 &&
      customization.serviceRecommendation.tier === 'Strategic Advantage'
    ) {
      warnings.push(
        'High-tier service recommendation with low classification confidence - consider additional assessment'
      );
    }

    return { isValid: true, warnings };
  }
}
