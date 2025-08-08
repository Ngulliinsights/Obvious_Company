import { Question, UserContext, IndustryInsights, Module } from '../models/types';

export interface IndustryConfig {
  id: string;
  name: string;
  description: string;
  regulatoryFramework: string[];
  keyUseCases: string[];
  roiExamples: string[];
  implementationConsiderations: string[];
  culturalFactors: string[];
  complianceRequirements: string[];
}

export interface IndustryQuestionSet {
  industryId: string;
  questions: Question[];
  scoringWeights: Record<string, number>;
  culturalAdaptations: Record<string, Record<string, string>>;
}

export interface IndustryROIExample {
  title: string;
  description: string;
  expectedROI: string;
  timeframe: string;
  implementationComplexity: 'Low' | 'Medium' | 'High';
  regulatoryConsiderations: string[];
}

export class IndustryAdapter {
  private industryConfigs: Map<string, IndustryConfig> = new Map();
  private questionSets: Map<string, IndustryQuestionSet> = new Map();
  private roiExamples: Map<string, IndustryROIExample[]> = new Map();

  constructor() {
    this.initializeIndustryConfigs();
    this.initializeQuestionSets();
    this.initializeROIExamples();
  }

  /**
   * Get industry-specific configuration
   */
  getIndustryConfig(industryId: string): IndustryConfig | null {
    return this.industryConfigs.get(industryId) || null;
  }

  /**
   * Get industry-specific question set
   */
  getIndustryQuestions(industryId: string, culturalContext?: string[]): Question[] {
    const questionSet = this.questionSets.get(industryId);
    if (!questionSet) {
      return this.getGenericQuestions();
    }

    return questionSet.questions.map(question => {
      if (culturalContext && culturalContext.length > 0) {
        return this.applyCulturalAdaptations(question, culturalContext, questionSet.culturalAdaptations);
      }
      return question;
    });
  }

  /**
   * Get industry-specific ROI examples
   */
  getIndustryROIExamples(industryId: string): IndustryROIExample[] {
    return this.roiExamples.get(industryId) || [];
  }

  /**
   * Generate industry insights based on assessment results
   */
  generateIndustryInsights(
    industryId: string, 
    scores: Record<string, number>,
    culturalContext?: string[]
  ): IndustryInsights {
    const config = this.getIndustryConfig(industryId);
    if (!config) {
      return this.generateGenericInsights(scores);
    }

    const sectorReadiness = this.calculateSectorReadiness(industryId, scores);
    const regulatoryConsiderations = this.getRegulatoryConsiderations(config, culturalContext);
    const implementationPriorities = this.getImplementationPriorities(config, scores);
    const culturalFactors = this.getCulturalFactors(config, culturalContext);

    return {
      sectorReadiness,
      regulatoryConsiderations,
      implementationPriorities,
      culturalFactors
    };
  }

  /**
   * Adapt content for cultural context
   */
  adaptForCulture(
    content: string, 
    culturalContext: string[], 
    industryId?: string
  ): string {
    let adaptedContent = content;

    // Apply cultural adaptations based on context
    for (const context of culturalContext) {
      adaptedContent = this.applyCulturalContextAdaptation(adaptedContent, context, industryId);
    }

    return adaptedContent;
  }

  /**
   * Get industry-specific modules for curriculum
   */
  getIndustryModules(industryId: string, culturalContext?: string[]): Module[] {
    const config = this.getIndustryConfig(industryId);
    if (!config) {
      return [];
    }

    return this.generateIndustryModules(config, culturalContext);
  }

  /**
   * Check regulatory compliance requirements
   */
  getComplianceRequirements(industryId: string, region?: string): string[] {
    const config = this.getIndustryConfig(industryId);
    if (!config) {
      return [];
    }

    let requirements = [...config.complianceRequirements];

    // Add region-specific requirements
    if (region) {
      requirements = requirements.concat(this.getRegionalCompliance(industryId, region));
    }

    return requirements;
  }

  private initializeIndustryConfigs(): void {
    // Financial Services
    this.industryConfigs.set('financial-services', {
      id: 'financial-services',
      name: 'Financial Services',
      description: 'Banking, insurance, investment, and fintech organizations',
      regulatoryFramework: ['KBA', 'CBK', 'IRA', 'CMA', 'SASRA'],
      keyUseCases: [
        'Risk assessment and modeling',
        'Fraud detection and prevention',
        'Customer analytics and personalization',
        'Regulatory compliance automation',
        'Credit scoring and underwriting',
        'Algorithmic trading optimization'
      ],
      roiExamples: [
        'Fraud reduction: 40-60% decrease in false positives',
        'Risk modeling: 25-35% improvement in prediction accuracy',
        'Customer service: 50-70% reduction in response time'
      ],
      implementationConsiderations: [
        'Data privacy and security requirements',
        'Regulatory approval processes',
        'Integration with legacy systems',
        'Staff training and change management',
        'Audit trail and explainability requirements'
      ],
      culturalFactors: [
        'Trust and relationship-based banking culture',
        'Mobile money ecosystem integration',
        'Informal financial sector considerations',
        'Community-based financial practices'
      ],
      complianceRequirements: [
        'Data Protection Act compliance',
        'Anti-Money Laundering (AML) regulations',
        'Know Your Customer (KYC) requirements',
        'Basel III capital requirements',
        'Consumer protection guidelines'
      ]
    });

    // Manufacturing
    this.industryConfigs.set('manufacturing', {
      id: 'manufacturing',
      name: 'Manufacturing',
      description: 'Production, supply chain, and industrial operations',
      regulatoryFramework: ['KEBS', 'NEMA', 'KAM', 'EAC'],
      keyUseCases: [
        'Predictive maintenance optimization',
        'Supply chain intelligence',
        'Quality control automation',
        'Production planning optimization',
        'Energy efficiency management',
        'Inventory optimization'
      ],
      roiExamples: [
        'Maintenance costs: 20-30% reduction through predictive analytics',
        'Production efficiency: 15-25% improvement in throughput',
        'Quality defects: 30-50% reduction in defect rates'
      ],
      implementationConsiderations: [
        'Integration with existing ERP systems',
        'IoT sensor deployment and connectivity',
        'Worker training and safety protocols',
        'Environmental compliance monitoring',
        'Supply chain partner coordination'
      ],
      culturalFactors: [
        'Hierarchical decision-making structures',
        'Emphasis on relationship-based partnerships',
        'Local supplier preference and development',
        'Community impact considerations'
      ],
      complianceRequirements: [
        'Environmental impact assessments',
        'Occupational safety standards',
        'Product quality certifications',
        'Export compliance requirements',
        'Local content regulations'
      ]
    });

    // Healthcare
    this.industryConfigs.set('healthcare', {
      id: 'healthcare',
      name: 'Healthcare',
      description: 'Hospitals, clinics, pharmaceutical, and health services',
      regulatoryFramework: ['MOH', 'PPB', 'NHIF', 'KMPDC'],
      keyUseCases: [
        'Diagnostic support systems',
        'Patient outcome prediction',
        'Drug discovery acceleration',
        'Healthcare resource optimization',
        'Telemedicine enhancement',
        'Epidemic surveillance and response'
      ],
      roiExamples: [
        'Diagnostic accuracy: 20-40% improvement in early detection',
        'Treatment outcomes: 15-30% improvement in patient recovery',
        'Operational efficiency: 25-45% reduction in administrative costs'
      ],
      implementationConsiderations: [
        'Patient privacy and data security',
        'Clinical workflow integration',
        'Medical professional training',
        'Ethical AI implementation',
        'Interoperability with health systems'
      ],
      culturalFactors: [
        'Traditional medicine integration',
        'Community health worker networks',
        'Family-centered care approaches',
        'Religious and cultural health beliefs'
      ],
      complianceRequirements: [
        'Patient data protection regulations',
        'Medical device approval processes',
        'Clinical trial ethical guidelines',
        'Healthcare professional licensing',
        'Public health reporting requirements'
      ]
    });

    // Government
    this.industryConfigs.set('government', {
      id: 'government',
      name: 'Government & Public Sector',
      description: 'National, county, and local government agencies',
      regulatoryFramework: ['Constitution', 'Public Service Commission', 'EACC', 'Auditor General'],
      keyUseCases: [
        'Citizen service delivery optimization',
        'Policy impact analysis',
        'Resource allocation optimization',
        'Fraud detection in public programs',
        'Digital government services',
        'Public safety and security enhancement'
      ],
      roiExamples: [
        'Service delivery: 40-60% reduction in processing time',
        'Resource efficiency: 20-35% improvement in budget utilization',
        'Transparency: 50-70% increase in public data accessibility'
      ],
      implementationConsiderations: [
        'Public procurement processes',
        'Transparency and accountability requirements',
        'Citizen privacy protection',
        'Inter-agency coordination',
        'Digital divide considerations'
      ],
      culturalFactors: [
        'Participatory governance expectations',
        'Community consultation requirements',
        'Multi-lingual service delivery',
        'Traditional authority integration'
      ],
      complianceRequirements: [
        'Public procurement regulations',
        'Access to information laws',
        'Public participation requirements',
        'Audit and oversight compliance',
        'Anti-corruption measures'
      ]
    });
  }

  private initializeQuestionSets(): void {
    // Financial Services Questions
    this.questionSets.set('financial-services', {
      industryId: 'financial-services',
      questions: [
        {
          id: 'fs-regulatory-readiness',
          type: 'scale_rating',
          text: 'How prepared is your organization to navigate AI regulatory requirements in financial services?',
          scaleRange: { min: 1, max: 5, labels: ['Not prepared', 'Somewhat prepared', 'Moderately prepared', 'Well prepared', 'Fully prepared'] },
          industrySpecific: true,
          culturalAdaptations: {
            'kenyan': 'How ready is your organization to work with CBK and other regulators on AI implementation?',
            'swahili': 'Je, shirika lako liko tayari vipi kushughulika na mahitaji ya udhibiti wa AI katika huduma za kifedha?'
          }
        },
        {
          id: 'fs-risk-management',
          type: 'multiple_choice',
          text: 'What is your primary concern regarding AI implementation in financial services?',
          options: [
            'Regulatory compliance and approval',
            'Data security and privacy',
            'Model explainability and transparency',
            'Integration with legacy systems',
            'Staff training and change management'
          ],
          industrySpecific: true,
          culturalAdaptations: {
            'kenyan': 'What worries you most about implementing AI in your financial institution?'
          }
        },
        {
          id: 'fs-use-case-priority',
          type: 'multiple_choice',
          text: 'Which AI use case would provide the most immediate value for your organization?',
          options: [
            'Fraud detection and prevention',
            'Credit risk assessment',
            'Customer service automation',
            'Regulatory compliance monitoring',
            'Investment portfolio optimization'
          ],
          industrySpecific: true
        }
      ],
      scoringWeights: {
        'strategicAuthority': 1.2,
        'regulatoryReadiness': 1.5,
        'riskManagement': 1.3
      },
      culturalAdaptations: {
        'kenyan': {
          'regulatory-focus': 'Central Bank of Kenya and local regulatory environment',
          'mobile-money': 'M-Pesa and mobile financial services integration',
          'relationship-banking': 'Community and relationship-based banking approaches'
        },
        'swahili': {
          'service-delivery': 'Utoaji wa huduma kwa jamii',
          'trust-building': 'Kujenga uaminifu na wateja'
        }
      }
    });

    // Manufacturing Questions
    this.questionSets.set('manufacturing', {
      industryId: 'manufacturing',
      questions: [
        {
          id: 'mfg-supply-chain-visibility',
          type: 'scale_rating',
          text: 'How much visibility do you currently have into your end-to-end supply chain?',
          scaleRange: { min: 1, max: 5, labels: ['Very limited', 'Limited', 'Moderate', 'Good', 'Excellent'] },
          industrySpecific: true,
          culturalAdaptations: {
            'kenyan': 'How well can you track your suppliers from local and regional partners?',
            'swahili': 'Je, unaweza kufuatilia vipi wauzaji wako kutoka kwa washirika wa ndani na wa kikanda?'
          }
        },
        {
          id: 'mfg-maintenance-approach',
          type: 'multiple_choice',
          text: 'What is your current approach to equipment maintenance?',
          options: [
            'Reactive - fix when broken',
            'Scheduled - regular intervals',
            'Condition-based - monitor indicators',
            'Predictive - use data analytics',
            'Mixed approach'
          ],
          industrySpecific: true
        },
        {
          id: 'mfg-quality-control',
          type: 'scale_rating',
          text: 'How automated is your current quality control process?',
          scaleRange: { min: 1, max: 5, labels: ['Fully manual', 'Mostly manual', 'Semi-automated', 'Mostly automated', 'Fully automated'] },
          industrySpecific: true
        }
      ],
      scoringWeights: {
        'operationalEfficiency': 1.4,
        'technologyReadiness': 1.3,
        'supplyChainMaturity': 1.2
      },
      culturalAdaptations: {
        'kenyan': {
          'local-suppliers': 'Local supplier development and partnership',
          'community-impact': 'Community employment and development considerations',
          'regional-integration': 'East African Community trade integration'
        }
      }
    });

    // Healthcare Questions
    this.questionSets.set('healthcare', {
      industryId: 'healthcare',
      questions: [
        {
          id: 'hc-patient-data-management',
          type: 'scale_rating',
          text: 'How digitized is your patient data management system?',
          scaleRange: { min: 1, max: 5, labels: ['Paper-based', 'Partially digital', 'Mostly digital', 'Fully digital', 'Integrated digital ecosystem'] },
          industrySpecific: true,
          culturalAdaptations: {
            'kenyan': 'How well integrated are your patient records with NHIF and other health systems?',
            'swahili': 'Je, rekodi za wagonjwa zimeunganishwa vipi na NHIF na mifumo mingine ya afya?'
          }
        },
        {
          id: 'hc-diagnostic-support',
          type: 'multiple_choice',
          text: 'What type of AI diagnostic support would be most valuable for your practice?',
          options: [
            'Medical imaging analysis',
            'Clinical decision support',
            'Drug interaction checking',
            'Epidemic surveillance',
            'Patient risk stratification'
          ],
          industrySpecific: true
        },
        {
          id: 'hc-ethical-considerations',
          type: 'scale_rating',
          text: 'How prepared is your organization to address ethical considerations in AI healthcare applications?',
          scaleRange: { min: 1, max: 5, labels: ['Not prepared', 'Somewhat prepared', 'Moderately prepared', 'Well prepared', 'Fully prepared'] },
          industrySpecific: true
        }
      ],
      scoringWeights: {
        'ethicalReadiness': 1.5,
        'dataMaturity': 1.3,
        'clinicalIntegration': 1.4
      },
      culturalAdaptations: {
        'kenyan': {
          'traditional-medicine': 'Integration with traditional healing practices',
          'community-health': 'Community health worker networks',
          'family-care': 'Family-centered care approaches'
        }
      }
    });

    // Government Questions
    this.questionSets.set('government', {
      industryId: 'government',
      questions: [
        {
          id: 'gov-digital-services',
          type: 'scale_rating',
          text: 'What percentage of your citizen services are currently digitized?',
          scaleRange: { min: 1, max: 5, labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'] },
          industrySpecific: true,
          culturalAdaptations: {
            'kenyan': 'How many of your services are available through eCitizen or similar platforms?',
            'swahili': 'Je, huduma ngapi za kiraia zinapatikana kupitia mifumo ya kidijitali?'
          }
        },
        {
          id: 'gov-transparency-priority',
          type: 'multiple_choice',
          text: 'What is your highest priority for AI implementation in government?',
          options: [
            'Improving citizen service delivery',
            'Enhancing transparency and accountability',
            'Optimizing resource allocation',
            'Strengthening public safety',
            'Supporting policy decision-making'
          ],
          industrySpecific: true
        },
        {
          id: 'gov-public-participation',
          type: 'scale_rating',
          text: 'How effectively does your organization currently engage citizens in decision-making processes?',
          scaleRange: { min: 1, max: 5, labels: ['Very limited', 'Limited', 'Moderate', 'Good', 'Excellent'] },
          industrySpecific: true
        }
      ],
      scoringWeights: {
        'transparencyCommitment': 1.5,
        'citizenEngagement': 1.4,
        'digitalMaturity': 1.3
      },
      culturalAdaptations: {
        'kenyan': {
          'devolution': 'County government and devolution considerations',
          'public-participation': 'Constitutional requirements for public participation',
          'accountability': 'Transparency and accountability expectations'
        }
      }
    });
  }

  private initializeROIExamples(): void {
    // Financial Services ROI Examples
    this.roiExamples.set('financial-services', [
      {
        title: 'AI-Powered Fraud Detection',
        description: 'Implement machine learning algorithms to detect fraudulent transactions in real-time',
        expectedROI: '300-500% within 18 months',
        timeframe: '6-12 months implementation',
        implementationComplexity: 'Medium',
        regulatoryConsiderations: ['CBK approval for algorithmic decision-making', 'Data privacy compliance', 'Model explainability requirements']
      },
      {
        title: 'Credit Risk Assessment Automation',
        description: 'Use AI to enhance credit scoring with alternative data sources including mobile money patterns',
        expectedROI: '200-400% within 24 months',
        timeframe: '9-15 months implementation',
        implementationComplexity: 'High',
        regulatoryConsiderations: ['Credit reference bureau integration', 'Fair lending compliance', 'Consumer protection guidelines']
      },
      {
        title: 'Customer Service Chatbots',
        description: 'Deploy multilingual AI chatbots for customer support in English, Swahili, and local languages',
        expectedROI: '150-250% within 12 months',
        timeframe: '3-6 months implementation',
        implementationComplexity: 'Low',
        regulatoryConsiderations: ['Customer data protection', 'Service quality standards', 'Accessibility requirements']
      }
    ]);

    // Manufacturing ROI Examples
    this.roiExamples.set('manufacturing', [
      {
        title: 'Predictive Maintenance System',
        description: 'IoT sensors and AI analytics to predict equipment failures before they occur',
        expectedROI: '400-600% within 24 months',
        timeframe: '6-12 months implementation',
        implementationComplexity: 'Medium',
        regulatoryConsiderations: ['Environmental monitoring compliance', 'Worker safety standards', 'Equipment certification requirements']
      },
      {
        title: 'Supply Chain Optimization',
        description: 'AI-driven demand forecasting and inventory optimization across East African supply networks',
        expectedROI: '250-400% within 18 months',
        timeframe: '9-15 months implementation',
        implementationComplexity: 'High',
        regulatoryConsiderations: ['Cross-border trade compliance', 'Local content requirements', 'Supplier verification standards']
      },
      {
        title: 'Quality Control Automation',
        description: 'Computer vision systems for automated quality inspection and defect detection',
        expectedROI: '200-350% within 15 months',
        timeframe: '4-8 months implementation',
        implementationComplexity: 'Medium',
        regulatoryConsiderations: ['Product quality certifications', 'Export compliance standards', 'Traceability requirements']
      }
    ]);

    // Healthcare ROI Examples
    this.roiExamples.set('healthcare', [
      {
        title: 'AI Diagnostic Support System',
        description: 'Machine learning models to assist in medical imaging analysis and diagnosis',
        expectedROI: '300-500% within 24 months',
        timeframe: '12-18 months implementation',
        implementationComplexity: 'High',
        regulatoryConsiderations: ['Medical device approval', 'Clinical validation requirements', 'Professional liability considerations']
      },
      {
        title: 'Patient Risk Stratification',
        description: 'AI models to identify high-risk patients for preventive care interventions',
        expectedROI: '200-400% within 18 months',
        timeframe: '6-12 months implementation',
        implementationComplexity: 'Medium',
        regulatoryConsiderations: ['Patient privacy protection', 'Clinical ethics approval', 'Insurance integration requirements']
      },
      {
        title: 'Telemedicine Enhancement',
        description: 'AI-powered triage and consultation support for remote healthcare delivery',
        expectedROI: '250-450% within 15 months',
        timeframe: '4-9 months implementation',
        implementationComplexity: 'Medium',
        regulatoryConsiderations: ['Telemedicine licensing', 'Data transmission security', 'Rural connectivity standards']
      }
    ]);

    // Government ROI Examples
    this.roiExamples.set('government', [
      {
        title: 'Citizen Service Automation',
        description: 'AI-powered processing of government applications and document verification',
        expectedROI: '400-700% within 24 months',
        timeframe: '9-15 months implementation',
        implementationComplexity: 'High',
        regulatoryConsiderations: ['Public procurement compliance', 'Data protection requirements', 'Accessibility standards']
      },
      {
        title: 'Resource Allocation Optimization',
        description: 'AI analytics for optimizing budget allocation and resource distribution',
        expectedROI: '300-500% within 18 months',
        timeframe: '6-12 months implementation',
        implementationComplexity: 'Medium',
        regulatoryConsiderations: ['Public financial management standards', 'Transparency requirements', 'Audit compliance']
      },
      {
        title: 'Public Safety Intelligence',
        description: 'AI systems for crime prediction and emergency response optimization',
        expectedROI: '250-400% within 20 months',
        timeframe: '8-14 months implementation',
        implementationComplexity: 'High',
        regulatoryConsiderations: ['Privacy protection laws', 'Constitutional rights compliance', 'Community policing integration']
      }
    ]);
  }

  private getGenericQuestions(): Question[] {
    return [
      {
        id: 'generic-ai-readiness',
        type: 'scale_rating',
        text: 'How ready is your organization to implement AI solutions?',
        scaleRange: { min: 1, max: 5, labels: ['Not ready', 'Somewhat ready', 'Moderately ready', 'Well prepared', 'Fully ready'] }
      },
      {
        id: 'generic-priority-area',
        type: 'multiple_choice',
        text: 'What is your primary area of interest for AI implementation?',
        options: [
          'Process automation',
          'Data analytics and insights',
          'Customer experience enhancement',
          'Decision support systems',
          'Operational efficiency'
        ]
      }
    ];
  }

  private applyCulturalAdaptations(
    question: Question, 
    culturalContext: string[], 
    adaptations: Record<string, Record<string, string>>
  ): Question {
    let adaptedQuestion = { ...question };

    for (const context of culturalContext) {
      if (question.culturalAdaptations && question.culturalAdaptations[context]) {
        adaptedQuestion.text = question.culturalAdaptations[context];
      }
      
      if (adaptations[context]) {
        // Apply additional contextual adaptations
        adaptedQuestion = this.applyContextualAdaptations(adaptedQuestion, adaptations[context]);
      }
    }

    return adaptedQuestion;
  }

  private applyContextualAdaptations(question: Question, contextAdaptations: Record<string, string>): Question {
    let adaptedText = question.text;
    
    // Replace contextual references
    Object.entries(contextAdaptations).forEach(([key, value]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      adaptedText = adaptedText.replace(regex, value);
    });

    return {
      ...question,
      text: adaptedText
    };
  }

  private calculateSectorReadiness(industryId: string, scores: Record<string, number>): number {
    const questionSet = this.questionSets.get(industryId);
    if (!questionSet) {
      return Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
    }

    let weightedScore = 0;
    let totalWeight = 0;

    Object.entries(questionSet.scoringWeights).forEach(([dimension, weight]) => {
      if (scores[dimension] !== undefined) {
        weightedScore += scores[dimension] * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  }

  private getRegulatoryConsiderations(config: IndustryConfig, culturalContext?: string[]): string[] {
    let considerations = [...config.regulatoryFramework];

    if (culturalContext?.includes('kenyan')) {
      considerations = considerations.concat([
        'Data Protection Act (2019) compliance',
        'Constitutional requirements for transparency',
        'County government coordination requirements'
      ]);
    }

    return considerations;
  }

  private getImplementationPriorities(config: IndustryConfig, scores: Record<string, number>): string[] {
    const priorities = [...config.implementationConsiderations];
    
    // Add score-based priorities
    if (scores.strategicAuthority && scores.strategicAuthority < 3) {
      priorities.unshift('Executive leadership alignment and buy-in');
    }
    
    if (scores.resourceAvailability && scores.resourceAvailability < 3) {
      priorities.unshift('Budget planning and resource allocation');
    }

    return priorities.slice(0, 5); // Return top 5 priorities
  }

  private getCulturalFactors(config: IndustryConfig, culturalContext?: string[]): string[] {
    let factors = [...config.culturalFactors];

    if (culturalContext?.includes('kenyan')) {
      factors = factors.concat([
        'Ubuntu philosophy and community-centered approaches',
        'Multi-lingual communication requirements',
        'Respect for traditional practices and knowledge'
      ]);
    }

    return factors;
  }

  private applyCulturalContextAdaptation(content: string, context: string, industryId?: string): string {
    let adaptedContent = content;

    switch (context) {
      case 'kenyan':
        adaptedContent = adaptedContent
          .replace(/\bcompliance\b/gi, 'regulatory compliance with Kenyan authorities')
          .replace(/\bstakeholders\b/gi, 'stakeholders including community representatives')
          .replace(/\bimplementation\b/gi, 'implementation with local capacity building');
        break;
      
      case 'swahili':
        // Add Swahili terminology where appropriate
        adaptedContent = adaptedContent
          .replace(/\bcommunity\b/gi, 'jamii')
          .replace(/\bservice\b/gi, 'huduma')
          .replace(/\bdevelopment\b/gi, 'maendeleo');
        break;
    }

    return adaptedContent;
  }

  private generateIndustryModules(config: IndustryConfig, culturalContext?: string[]): Module[] {
    const baseModules: Module[] = [
      {
        id: `${config.id}-fundamentals`,
        title: `AI Fundamentals for ${config.name}`,
        description: `Core AI concepts and applications specific to ${config.name.toLowerCase()}`,
        estimatedHours: 8,
        prerequisites: [],
        learningObjectives: [
          `Understand AI applications in ${config.name.toLowerCase()}`,
          'Identify implementation opportunities',
          'Assess regulatory and compliance requirements'
        ],
        industryRelevance: [config.id]
      },
      {
        id: `${config.id}-implementation`,
        title: `AI Implementation Strategy for ${config.name}`,
        description: `Strategic planning and implementation approaches for ${config.name.toLowerCase()} organizations`,
        estimatedHours: 12,
        prerequisites: [`${config.id}-fundamentals`],
        learningObjectives: [
          'Develop implementation roadmaps',
          'Manage change and adoption',
          'Ensure regulatory compliance'
        ],
        industryRelevance: [config.id]
      }
    ];

    // Add cultural adaptations
    if (culturalContext?.includes('kenyan')) {
      baseModules.forEach(module => {
        module.culturalAdaptations = {
          'kenyan': `Adapted for Kenyan ${config.name.toLowerCase()} context with local case studies and regulatory framework`
        };
      });
    }

    return baseModules;
  }

  private getRegionalCompliance(industryId: string, region: string): string[] {
    const regionalRequirements: Record<string, Record<string, string[]>> = {
      'kenya': {
        'financial-services': [
          'Central Bank of Kenya AI guidelines',
          'Kenya Bankers Association best practices',
          'National Payment System regulations'
        ],
        'healthcare': [
          'Ministry of Health digital health strategy',
          'Kenya Medical Practitioners and Dentists Council guidelines',
          'National Hospital Insurance Fund integration requirements'
        ],
        'manufacturing': [
          'Kenya Association of Manufacturers standards',
          'Export Processing Zones Authority requirements',
          'Kenya Bureau of Standards certifications'
        ],
        'government': [
          'Public Service Commission guidelines',
          'Ethics and Anti-Corruption Commission requirements',
          'Controller of Budget oversight standards'
        ]
      }
    };

    return regionalRequirements[region]?.[industryId] || [];
  }

  private generateGenericInsights(scores: Record<string, number>): IndustryInsights {
    const averageScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
    
    return {
      sectorReadiness: averageScore,
      regulatoryConsiderations: [
        'General data protection compliance',
        'Industry-specific regulations',
        'Ethical AI implementation guidelines'
      ],
      implementationPriorities: [
        'Leadership alignment and strategy development',
        'Technology infrastructure assessment',
        'Staff training and change management',
        'Pilot project identification and execution'
      ],
      culturalFactors: [
        'Organizational culture adaptation',
        'Stakeholder engagement and communication',
        'Local context considerations'
      ]
    };
  }
}