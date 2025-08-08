import { Question, AssessmentResponse, UserContext, IndustryInsights, PersonaType } from '../models/types';
import { IndustryAdapter } from './IndustryAdapter';

export interface IndustryAssessmentResult {
  industryId: string;
  sectorReadiness: number;
  specificInsights: IndustryInsights;
  recommendedActions: string[];
  complianceGaps: string[];
  implementationRoadmap: string[];
}

export abstract class BaseIndustryAssessment {
  protected industryAdapter: IndustryAdapter;
  protected industryId: string;

  constructor(industryId: string) {
    this.industryId = industryId;
    this.industryAdapter = new IndustryAdapter();
  }

  abstract generateQuestions(userContext: UserContext): Question[];
  abstract analyzeResponses(responses: AssessmentResponse[], userContext: UserContext): IndustryAssessmentResult;
  abstract getImplementationGuidance(result: IndustryAssessmentResult, persona: PersonaType): string[];

  protected calculateDimensionScore(responses: AssessmentResponse[], dimension: string): number {
    const relevantResponses = responses.filter(r => r.questionId.includes(dimension));
    if (relevantResponses.length === 0) return 0;

    const totalScore = relevantResponses.reduce((sum, response) => {
      if (typeof response.responseValue === 'number') {
        return sum + response.responseValue;
      }
      return sum;
    }, 0);

    return totalScore / relevantResponses.length;
  }

  protected identifyComplianceGaps(responses: AssessmentResponse[], industryId: string): string[] {
    const gaps: string[] = [];
    const config = this.industryAdapter.getIndustryConfig(industryId);
    
    if (!config) return gaps;

    // Check regulatory readiness
    const regulatoryResponse = responses.find(r => r.questionId.includes('regulatory'));
    if (regulatoryResponse && typeof regulatoryResponse.responseValue === 'number' && regulatoryResponse.responseValue < 3) {
      gaps.push('Regulatory compliance framework needs strengthening');
    }

    // Check data management
    const dataResponse = responses.find(r => r.questionId.includes('data'));
    if (dataResponse && typeof dataResponse.responseValue === 'number' && dataResponse.responseValue < 3) {
      gaps.push('Data governance and security protocols require enhancement');
    }

    return gaps;
  }
}

export class FinancialServicesAssessment extends BaseIndustryAssessment {
  constructor() {
    super('financial-services');
  }

  generateQuestions(userContext: UserContext): Question[] {
    const baseQuestions = this.industryAdapter.getIndustryQuestions(
      this.industryId, 
      userContext.culturalContext
    );

    // Add financial services specific questions
    const specificQuestions: Question[] = [
      {
        id: 'fs-cbk-relationship',
        type: 'scale_rating',
        text: 'How would you rate your organization\'s relationship with Central Bank of Kenya regarding innovation initiatives?',
        scaleRange: { min: 1, max: 5, labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] },
        industrySpecific: true,
        culturalAdaptations: {
          'kenyan': 'How well does your institution work with CBK on new technology approvals?',
          'swahili': 'Je, shirika lako linashirikiana vipi na Benki Kuu kuhusu miradi ya ubunifu?'
        }
      },
      {
        id: 'fs-mobile-money-integration',
        type: 'multiple_choice',
        text: 'How integrated is your system with mobile money platforms like M-Pesa?',
        options: [
          'Not integrated at all',
          'Basic integration for payments',
          'Moderate integration with transaction data',
          'Advanced integration with analytics',
          'Full ecosystem integration'
        ],
        industrySpecific: true
      },
      {
        id: 'fs-financial-inclusion',
        type: 'scale_rating',
        text: 'How important is financial inclusion in your AI strategy?',
        scaleRange: { min: 1, max: 5, labels: ['Not important', 'Slightly important', 'Moderately important', 'Very important', 'Critical'] },
        industrySpecific: true,
        culturalAdaptations: {
          'kenyan': 'How does your AI strategy support reaching unbanked populations?'
        }
      },
      {
        id: 'fs-risk-model-explainability',
        type: 'scale_rating',
        text: 'How important is model explainability for your risk management processes?',
        scaleRange: { min: 1, max: 5, labels: ['Not important', 'Slightly important', 'Moderately important', 'Very important', 'Critical'] },
        industrySpecific: true
      },
      {
        id: 'fs-alternative-data-sources',
        type: 'multiple_choice',
        text: 'Which alternative data sources are you most interested in leveraging for credit decisions?',
        options: [
          'Mobile money transaction patterns',
          'Social media and digital footprint',
          'Utility payment history',
          'Agricultural and seasonal data',
          'Educational and employment records'
        ],
        industrySpecific: true
      }
    ];

    return [...baseQuestions, ...specificQuestions];
  }

  analyzeResponses(responses: AssessmentResponse[], userContext: UserContext): IndustryAssessmentResult {
    const regulatoryReadiness = this.calculateDimensionScore(responses, 'regulatory');
    const riskManagement = this.calculateDimensionScore(responses, 'risk');
    const digitalIntegration = this.calculateDimensionScore(responses, 'mobile-money');
    const inclusionFocus = this.calculateDimensionScore(responses, 'inclusion');

    const sectorReadiness = (regulatoryReadiness + riskManagement + digitalIntegration + inclusionFocus) / 4;

    const specificInsights = this.industryAdapter.generateIndustryInsights(
      this.industryId,
      {
        regulatoryReadiness,
        riskManagement,
        digitalIntegration,
        inclusionFocus
      },
      userContext.culturalContext
    );

    const complianceGaps = this.identifyComplianceGaps(responses, this.industryId);
    
    // Add financial services specific compliance gaps
    const cbkResponse = responses.find(r => r.questionId === 'fs-cbk-relationship');
    if (cbkResponse && typeof cbkResponse.responseValue === 'number' && cbkResponse.responseValue < 3) {
      complianceGaps.push('Central Bank of Kenya engagement and approval processes need attention');
    }

    const explainabilityResponse = responses.find(r => r.questionId === 'fs-risk-model-explainability');
    if (explainabilityResponse && typeof explainabilityResponse.responseValue === 'number' && explainabilityResponse.responseValue >= 4) {
      complianceGaps.push('Model explainability and transparency frameworks required');
    }

    const recommendedActions = this.generateRecommendedActions(responses, sectorReadiness);
    const implementationRoadmap = this.generateImplementationRoadmap(responses, userContext);

    return {
      industryId: this.industryId,
      sectorReadiness,
      specificInsights,
      recommendedActions,
      complianceGaps,
      implementationRoadmap
    };
  }

  getImplementationGuidance(result: IndustryAssessmentResult, persona: PersonaType): string[] {
    const baseGuidance = [
      'Establish regulatory compliance framework with CBK',
      'Develop model governance and explainability protocols',
      'Create data security and privacy protection measures'
    ];

    switch (persona) {
      case 'Strategic Architect':
        return [
          ...baseGuidance,
          'Lead industry transformation through regulatory innovation partnerships',
          'Establish enterprise-wide AI governance framework',
          'Drive strategic partnerships with fintech ecosystem'
        ];
      
      case 'Strategic Catalyst':
        return [
          ...baseGuidance,
          'Champion AI adoption across business units',
          'Build cross-functional AI implementation teams',
          'Develop change management strategies for digital transformation'
        ];
      
      case 'Strategic Contributor':
        return [
          ...baseGuidance,
          'Implement pilot projects in specific business areas',
          'Focus on operational efficiency and customer experience improvements',
          'Build technical capabilities within existing teams'
        ];
      
      case 'Strategic Explorer':
        return [
          ...baseGuidance,
          'Participate in industry AI learning initiatives',
          'Explore partnership opportunities with AI vendors',
          'Develop foundational AI literacy across the organization'
        ];
      
      case 'Strategic Observer':
        return [
          ...baseGuidance,
          'Monitor industry AI developments and regulatory changes',
          'Assess organizational readiness for future AI adoption',
          'Build awareness and understanding of AI implications'
        ];
      
      default:
        return baseGuidance;
    }
  }

  private generateRecommendedActions(responses: AssessmentResponse[], sectorReadiness: number): string[] {
    const actions: string[] = [];

    if (sectorReadiness < 2.5) {
      actions.push(
        'Establish AI governance committee with regulatory expertise',
        'Conduct comprehensive data audit and security assessment',
        'Develop AI strategy aligned with business objectives'
      );
    } else if (sectorReadiness < 3.5) {
      actions.push(
        'Launch pilot AI projects in low-risk areas',
        'Strengthen partnerships with technology vendors',
        'Enhance staff AI literacy through training programs'
      );
    } else {
      actions.push(
        'Scale successful AI implementations across business units',
        'Develop proprietary AI capabilities and intellectual property',
        'Lead industry initiatives and regulatory discussions'
      );
    }

    // Add mobile money specific actions
    const mobileMoneyResponse = responses.find(r => r.questionId === 'fs-mobile-money-integration');
    if (mobileMoneyResponse && typeof mobileMoneyResponse.responseValue === 'string') {
      const integrationLevel = mobileMoneyResponse.responseValue;
      if (integrationLevel.includes('Not integrated') || integrationLevel.includes('Basic')) {
        actions.push('Enhance mobile money platform integration for comprehensive customer insights');
      }
    }

    return actions;
  }

  private generateImplementationRoadmap(responses: AssessmentResponse[], userContext: UserContext): string[] {
    const roadmap = [
      'Phase 1 (0-6 months): Regulatory framework establishment and data governance',
      'Phase 2 (6-12 months): Pilot project implementation and staff training',
      'Phase 3 (12-18 months): Scaled deployment and performance optimization',
      'Phase 4 (18-24 months): Advanced AI capabilities and innovation leadership'
    ];

    // Customize based on responses
    const regulatoryResponse = responses.find(r => r.questionId.includes('regulatory'));
    if (regulatoryResponse && typeof regulatoryResponse.responseValue === 'number' && regulatoryResponse.responseValue < 2) {
      roadmap[0] = 'Phase 1 (0-9 months): Extended regulatory compliance and stakeholder engagement';
    }

    return roadmap;
  }
}

export class ManufacturingAssessment extends BaseIndustryAssessment {
  constructor() {
    super('manufacturing');
  }

  generateQuestions(userContext: UserContext): Question[] {
    const baseQuestions = this.industryAdapter.getIndustryQuestions(
      this.industryId, 
      userContext.culturalContext
    );

    const specificQuestions: Question[] = [
      {
        id: 'mfg-iot-infrastructure',
        type: 'scale_rating',
        text: 'How developed is your IoT sensor infrastructure across production facilities?',
        scaleRange: { min: 1, max: 5, labels: ['No IoT sensors', 'Basic sensors', 'Moderate coverage', 'Comprehensive coverage', 'Advanced IoT ecosystem'] },
        industrySpecific: true,
        culturalAdaptations: {
          'kenyan': 'How well connected are your production facilities with smart sensors and monitoring?'
        }
      },
      {
        id: 'mfg-local-supplier-network',
        type: 'scale_rating',
        text: 'How integrated is your local supplier network in your supply chain planning?',
        scaleRange: { min: 1, max: 5, labels: ['Not integrated', 'Minimally integrated', 'Moderately integrated', 'Well integrated', 'Fully integrated'] },
        industrySpecific: true,
        culturalAdaptations: {
          'kenyan': 'How well do you work with local Kenyan suppliers in your supply chain planning?'
        }
      },
      {
        id: 'mfg-sustainability-focus',
        type: 'multiple_choice',
        text: 'What is your primary sustainability focus for AI implementation?',
        options: [
          'Energy efficiency optimization',
          'Waste reduction and circular economy',
          'Carbon footprint monitoring',
          'Sustainable sourcing and procurement',
          'Environmental compliance automation'
        ],
        industrySpecific: true
      },
      {
        id: 'mfg-workforce-development',
        type: 'scale_rating',
        text: 'How prepared is your workforce for AI-enhanced manufacturing processes?',
        scaleRange: { min: 1, max: 5, labels: ['Not prepared', 'Minimally prepared', 'Somewhat prepared', 'Well prepared', 'Fully prepared'] },
        industrySpecific: true,
        culturalAdaptations: {
          'kenyan': 'How ready are your workers for new AI-powered manufacturing technologies?'
        }
      },
      {
        id: 'mfg-export-compliance',
        type: 'scale_rating',
        text: 'How important is AI-assisted export compliance and quality certification for your business?',
        scaleRange: { min: 1, max: 5, labels: ['Not important', 'Slightly important', 'Moderately important', 'Very important', 'Critical'] },
        industrySpecific: true
      }
    ];

    return [...baseQuestions, ...specificQuestions];
  }

  analyzeResponses(responses: AssessmentResponse[], userContext: UserContext): IndustryAssessmentResult {
    const iotReadiness = this.calculateDimensionScore(responses, 'iot');
    const supplyChainIntegration = this.calculateDimensionScore(responses, 'supplier');
    const sustainabilityFocus = this.calculateDimensionScore(responses, 'sustainability');
    const workforceReadiness = this.calculateDimensionScore(responses, 'workforce');

    const sectorReadiness = (iotReadiness + supplyChainIntegration + sustainabilityFocus + workforceReadiness) / 4;

    const specificInsights = this.industryAdapter.generateIndustryInsights(
      this.industryId,
      {
        iotReadiness,
        supplyChainIntegration,
        sustainabilityFocus,
        workforceReadiness
      },
      userContext.culturalContext
    );

    const complianceGaps = this.identifyComplianceGaps(responses, this.industryId);
    
    // Add manufacturing specific compliance gaps
    const exportResponse = responses.find(r => r.questionId === 'mfg-export-compliance');
    if (exportResponse && typeof exportResponse.responseValue === 'number' && exportResponse.responseValue >= 4) {
      complianceGaps.push('Export compliance and quality certification systems need AI integration');
    }

    const recommendedActions = this.generateManufacturingActions(responses, sectorReadiness);
    const implementationRoadmap = this.generateManufacturingRoadmap(responses, userContext);

    return {
      industryId: this.industryId,
      sectorReadiness,
      specificInsights,
      recommendedActions,
      complianceGaps,
      implementationRoadmap
    };
  }

  getImplementationGuidance(result: IndustryAssessmentResult, persona: PersonaType): string[] {
    const baseGuidance = [
      'Develop IoT infrastructure for comprehensive data collection',
      'Implement predictive maintenance systems for critical equipment',
      'Establish supply chain visibility and optimization platforms'
    ];

    switch (persona) {
      case 'Strategic Architect':
        return [
          ...baseGuidance,
          'Lead Industry 4.0 transformation across all facilities',
          'Establish strategic partnerships with technology providers',
          'Drive sustainability and circular economy initiatives'
        ];
      
      case 'Strategic Catalyst':
        return [
          ...baseGuidance,
          'Champion smart manufacturing adoption across production lines',
          'Build cross-functional teams for AI implementation',
          'Develop workforce transformation and reskilling programs'
        ];
      
      case 'Strategic Contributor':
        return [
          ...baseGuidance,
          'Implement AI solutions in specific production areas',
          'Focus on operational efficiency and quality improvements',
          'Build technical capabilities within manufacturing teams'
        ];
      
      case 'Strategic Explorer':
        return [
          ...baseGuidance,
          'Explore AI applications through pilot projects',
          'Participate in manufacturing innovation networks',
          'Develop foundational understanding of smart manufacturing'
        ];
      
      case 'Strategic Observer':
        return [
          ...baseGuidance,
          'Monitor Industry 4.0 trends and best practices',
          'Assess organizational readiness for smart manufacturing',
          'Build awareness of AI implications for manufacturing'
        ];
      
      default:
        return baseGuidance;
    }
  }

  private generateManufacturingActions(responses: AssessmentResponse[], sectorReadiness: number): string[] {
    const actions: string[] = [];

    if (sectorReadiness < 2.5) {
      actions.push(
        'Conduct comprehensive assessment of current manufacturing processes',
        'Develop IoT infrastructure deployment plan',
        'Establish data collection and management systems'
      );
    } else if (sectorReadiness < 3.5) {
      actions.push(
        'Implement predictive maintenance pilots on critical equipment',
        'Deploy quality control automation systems',
        'Enhance supply chain visibility and analytics'
      );
    } else {
      actions.push(
        'Scale AI implementations across all production facilities',
        'Develop advanced analytics and optimization capabilities',
        'Lead industry innovation and sustainability initiatives'
      );
    }

    // Add local supplier specific actions
    const supplierResponse = responses.find(r => r.questionId === 'mfg-local-supplier-network');
    if (supplierResponse && typeof supplierResponse.responseValue === 'number' && supplierResponse.responseValue < 3) {
      actions.push('Strengthen local supplier integration and development programs');
    }

    return actions;
  }

  private generateManufacturingRoadmap(responses: AssessmentResponse[], userContext: UserContext): string[] {
    return [
      'Phase 1 (0-6 months): IoT infrastructure deployment and data collection setup',
      'Phase 2 (6-12 months): Predictive maintenance and quality control implementation',
      'Phase 3 (12-18 months): Supply chain optimization and advanced analytics',
      'Phase 4 (18-24 months): Fully integrated smart manufacturing ecosystem'
    ];
  }
}

export class HealthcareAssessment extends BaseIndustryAssessment {
  constructor() {
    super('healthcare');
  }

  generateQuestions(userContext: UserContext): Question[] {
    const baseQuestions = this.industryAdapter.getIndustryQuestions(
      this.industryId, 
      userContext.culturalContext
    );

    const specificQuestions: Question[] = [
      {
        id: 'hc-nhif-integration',
        type: 'scale_rating',
        text: 'How integrated are your systems with NHIF and other health insurance platforms?',
        scaleRange: { min: 1, max: 5, labels: ['Not integrated', 'Basic integration', 'Moderate integration', 'Well integrated', 'Fully integrated'] },
        industrySpecific: true,
        culturalAdaptations: {
          'kenyan': 'How well do your patient systems work with NHIF for claims and coverage?'
        }
      },
      {
        id: 'hc-community-health-workers',
        type: 'scale_rating',
        text: 'How involved are community health workers in your AI-enhanced care delivery model?',
        scaleRange: { min: 1, max: 5, labels: ['Not involved', 'Minimally involved', 'Moderately involved', 'Significantly involved', 'Fully integrated'] },
        industrySpecific: true,
        culturalAdaptations: {
          'kenyan': 'How do you work with community health volunteers (CHVs) in your AI strategy?'
        }
      },
      {
        id: 'hc-traditional-medicine-integration',
        type: 'multiple_choice',
        text: 'How do you approach integration of traditional medicine practices with AI-enhanced healthcare?',
        options: [
          'No integration planned',
          'Acknowledge but keep separate',
          'Limited integration in patient history',
          'Moderate integration in treatment planning',
          'Full integration and collaboration'
        ],
        industrySpecific: true,
        culturalAdaptations: {
          'kenyan': 'How do you work with traditional healers and herbal medicine in your AI approach?'
        }
      },
      {
        id: 'hc-telemedicine-infrastructure',
        type: 'scale_rating',
        text: 'How developed is your telemedicine infrastructure for rural and remote areas?',
        scaleRange: { min: 1, max: 5, labels: ['No telemedicine', 'Basic capabilities', 'Moderate coverage', 'Good coverage', 'Comprehensive coverage'] },
        industrySpecific: true
      },
      {
        id: 'hc-ethical-ai-framework',
        type: 'scale_rating',
        text: 'How developed is your ethical AI framework for healthcare applications?',
        scaleRange: { min: 1, max: 5, labels: ['No framework', 'Basic guidelines', 'Moderate framework', 'Comprehensive framework', 'Advanced ethical AI system'] },
        industrySpecific: true
      }
    ];

    return [...baseQuestions, ...specificQuestions];
  }

  analyzeResponses(responses: AssessmentResponse[], userContext: UserContext): IndustryAssessmentResult {
    const systemIntegration = this.calculateDimensionScore(responses, 'nhif');
    const communityEngagement = this.calculateDimensionScore(responses, 'community');
    const culturalIntegration = this.calculateDimensionScore(responses, 'traditional');
    const ethicalFramework = this.calculateDimensionScore(responses, 'ethical');

    const sectorReadiness = (systemIntegration + communityEngagement + culturalIntegration + ethicalFramework) / 4;

    const specificInsights = this.industryAdapter.generateIndustryInsights(
      this.industryId,
      {
        systemIntegration,
        communityEngagement,
        culturalIntegration,
        ethicalFramework
      },
      userContext.culturalContext
    );

    const complianceGaps = this.identifyComplianceGaps(responses, this.industryId);
    
    // Add healthcare specific compliance gaps
    const ethicalResponse = responses.find(r => r.questionId === 'hc-ethical-ai-framework');
    if (ethicalResponse && typeof ethicalResponse.responseValue === 'number' && ethicalResponse.responseValue < 3) {
      complianceGaps.push('Ethical AI framework for healthcare applications needs development');
    }

    const recommendedActions = this.generateHealthcareActions(responses, sectorReadiness);
    const implementationRoadmap = this.generateHealthcareRoadmap(responses, userContext);

    return {
      industryId: this.industryId,
      sectorReadiness,
      specificInsights,
      recommendedActions,
      complianceGaps,
      implementationRoadmap
    };
  }

  getImplementationGuidance(result: IndustryAssessmentResult, persona: PersonaType): string[] {
    const baseGuidance = [
      'Establish ethical AI framework for healthcare applications',
      'Develop patient data privacy and security protocols',
      'Create clinical workflow integration strategies'
    ];

    switch (persona) {
      case 'Strategic Architect':
        return [
          ...baseGuidance,
          'Lead healthcare transformation through AI innovation',
          'Establish partnerships with medical research institutions',
          'Drive policy development for AI in healthcare'
        ];
      
      case 'Strategic Catalyst':
        return [
          ...baseGuidance,
          'Champion AI adoption across clinical departments',
          'Build interdisciplinary AI implementation teams',
          'Develop change management for healthcare professionals'
        ];
      
      case 'Strategic Contributor':
        return [
          ...baseGuidance,
          'Implement AI solutions in specific clinical areas',
          'Focus on patient outcomes and operational efficiency',
          'Build technical capabilities within healthcare teams'
        ];
      
      case 'Strategic Explorer':
        return [
          ...baseGuidance,
          'Explore AI applications through clinical pilots',
          'Participate in healthcare AI research initiatives',
          'Develop foundational understanding of medical AI'
        ];
      
      case 'Strategic Observer':
        return [
          ...baseGuidance,
          'Monitor healthcare AI developments and regulations',
          'Assess organizational readiness for medical AI',
          'Build awareness of AI implications for healthcare'
        ];
      
      default:
        return baseGuidance;
    }
  }

  private generateHealthcareActions(responses: AssessmentResponse[], sectorReadiness: number): string[] {
    const actions: string[] = [];

    if (sectorReadiness < 2.5) {
      actions.push(
        'Establish healthcare AI governance committee',
        'Develop patient data management and privacy protocols',
        'Create ethical AI guidelines for clinical applications'
      );
    } else if (sectorReadiness < 3.5) {
      actions.push(
        'Launch AI pilot projects in non-critical clinical areas',
        'Enhance telemedicine capabilities with AI support',
        'Strengthen integration with health insurance systems'
      );
    } else {
      actions.push(
        'Scale AI implementations across clinical departments',
        'Develop advanced diagnostic and treatment support systems',
        'Lead healthcare AI innovation and research initiatives'
      );
    }

    // Add community health worker specific actions
    const chvResponse = responses.find(r => r.questionId === 'hc-community-health-workers');
    if (chvResponse && typeof chvResponse.responseValue === 'number' && chvResponse.responseValue < 3) {
      actions.push('Develop AI tools and training for community health workers');
    }

    return actions;
  }

  private generateHealthcareRoadmap(responses: AssessmentResponse[], userContext: UserContext): string[] {
    return [
      'Phase 1 (0-6 months): Ethical framework and data governance establishment',
      'Phase 2 (6-12 months): Clinical pilot projects and staff training',
      'Phase 3 (12-18 months): Scaled clinical AI deployment and integration',
      'Phase 4 (18-24 months): Advanced AI capabilities and research leadership'
    ];
  }
}

export class GovernmentAssessment extends BaseIndustryAssessment {
  constructor() {
    super('government');
  }

  generateQuestions(userContext: UserContext): Question[] {
    const baseQuestions = this.industryAdapter.getIndustryQuestions(
      this.industryId, 
      userContext.culturalContext
    );

    const specificQuestions: Question[] = [
      {
        id: 'gov-ecitizen-integration',
        type: 'scale_rating',
        text: 'How integrated are your services with the eCitizen platform and other digital government systems?',
        scaleRange: { min: 1, max: 5, labels: ['Not integrated', 'Basic integration', 'Moderate integration', 'Well integrated', 'Fully integrated'] },
        industrySpecific: true,
        culturalAdaptations: {
          'kenyan': 'How well do your services work with eCitizen and other government digital platforms?'
        }
      },
      {
        id: 'gov-public-participation',
        type: 'scale_rating',
        text: 'How effectively do you use AI to enhance public participation in government processes?',
        scaleRange: { min: 1, max: 5, labels: ['Not at all', 'Minimally', 'Moderately', 'Effectively', 'Very effectively'] },
        industrySpecific: true,
        culturalAdaptations: {
          'kenyan': 'How do you use technology to involve citizens in government decision-making?'
        }
      },
      {
        id: 'gov-devolution-support',
        type: 'multiple_choice',
        text: 'How does your AI strategy support devolution and county government coordination?',
        options: [
          'No specific devolution focus',
          'Basic coordination mechanisms',
          'Moderate inter-governmental integration',
          'Strong devolution support systems',
          'Comprehensive multi-level governance AI'
        ],
        industrySpecific: true,
        culturalAdaptations: {
          'kenyan': 'How does your AI approach support county governments and devolution?'
        }
      },
      {
        id: 'gov-transparency-accountability',
        type: 'scale_rating',
        text: 'How important is AI-enhanced transparency and accountability in your implementation strategy?',
        scaleRange: { min: 1, max: 5, labels: ['Not important', 'Slightly important', 'Moderately important', 'Very important', 'Critical'] },
        industrySpecific: true
      },
      {
        id: 'gov-multilingual-services',
        type: 'scale_rating',
        text: 'How well do your AI systems support multilingual service delivery (English, Swahili, local languages)?',
        scaleRange: { min: 1, max: 5, labels: ['English only', 'English + Swahili', 'Multiple languages', 'Comprehensive multilingual', 'Full linguistic accessibility'] },
        industrySpecific: true
      }
    ];

    return [...baseQuestions, ...specificQuestions];
  }

  analyzeResponses(responses: AssessmentResponse[], userContext: UserContext): IndustryAssessmentResult {
    const digitalIntegration = this.calculateDimensionScore(responses, 'ecitizen');
    const publicEngagement = this.calculateDimensionScore(responses, 'participation');
    const devolutionSupport = this.calculateDimensionScore(responses, 'devolution');
    const transparencyFocus = this.calculateDimensionScore(responses, 'transparency');

    const sectorReadiness = (digitalIntegration + publicEngagement + devolutionSupport + transparencyFocus) / 4;

    const specificInsights = this.industryAdapter.generateIndustryInsights(
      this.industryId,
      {
        digitalIntegration,
        publicEngagement,
        devolutionSupport,
        transparencyFocus
      },
      userContext.culturalContext
    );

    const complianceGaps = this.identifyComplianceGaps(responses, this.industryId);
    
    // Add government specific compliance gaps
    const transparencyResponse = responses.find(r => r.questionId === 'gov-transparency-accountability');
    if (transparencyResponse && typeof transparencyResponse.responseValue === 'number' && transparencyResponse.responseValue >= 4) {
      complianceGaps.push('Enhanced transparency and accountability mechanisms required for AI systems');
    }

    const recommendedActions = this.generateGovernmentActions(responses, sectorReadiness);
    const implementationRoadmap = this.generateGovernmentRoadmap(responses, userContext);

    return {
      industryId: this.industryId,
      sectorReadiness,
      specificInsights,
      recommendedActions,
      complianceGaps,
      implementationRoadmap
    };
  }

  getImplementationGuidance(result: IndustryAssessmentResult, persona: PersonaType): string[] {
    const baseGuidance = [
      'Establish AI governance framework for public sector',
      'Develop citizen privacy and data protection protocols',
      'Create transparency and accountability mechanisms'
    ];

    switch (persona) {
      case 'Strategic Architect':
        return [
          ...baseGuidance,
          'Lead digital government transformation initiatives',
          'Establish inter-governmental AI coordination mechanisms',
          'Drive policy development for AI in public sector'
        ];
      
      case 'Strategic Catalyst':
        return [
          ...baseGuidance,
          'Champion AI adoption across government departments',
          'Build cross-agency AI implementation teams',
          'Develop change management for public servants'
        ];
      
      case 'Strategic Contributor':
        return [
          ...baseGuidance,
          'Implement AI solutions in specific government functions',
          'Focus on citizen service delivery improvements',
          'Build technical capabilities within government teams'
        ];
      
      case 'Strategic Explorer':
        return [
          ...baseGuidance,
          'Explore AI applications through government pilots',
          'Participate in public sector innovation networks',
          'Develop foundational understanding of GovTech AI'
        ];
      
      case 'Strategic Observer':
        return [
          ...baseGuidance,
          'Monitor government AI developments and policies',
          'Assess organizational readiness for public sector AI',
          'Build awareness of AI implications for governance'
        ];
      
      default:
        return baseGuidance;
    }
  }

  private generateGovernmentActions(responses: AssessmentResponse[], sectorReadiness: number): string[] {
    const actions: string[] = [];

    if (sectorReadiness < 2.5) {
      actions.push(
        'Establish government AI strategy and governance framework',
        'Develop citizen data protection and privacy policies',
        'Create public consultation mechanisms for AI implementation'
      );
    } else if (sectorReadiness < 3.5) {
      actions.push(
        'Launch AI pilot projects in citizen service delivery',
        'Enhance digital government platform capabilities',
        'Strengthen inter-governmental coordination systems'
      );
    } else {
      actions.push(
        'Scale AI implementations across government functions',
        'Develop advanced citizen engagement and participation tools',
        'Lead public sector AI innovation and policy development'
      );
    }

    // Add devolution specific actions
    const devolutionResponse = responses.find(r => r.questionId === 'gov-devolution-support');
    if (devolutionResponse && typeof devolutionResponse.responseValue === 'string' && 
        (devolutionResponse.responseValue.includes('No specific') || devolutionResponse.responseValue.includes('Basic'))) {
      actions.push('Strengthen AI systems for county government coordination and devolution support');
    }

    return actions;
  }

  private generateGovernmentRoadmap(responses: AssessmentResponse[], userContext: UserContext): string[] {
    return [
      'Phase 1 (0-6 months): AI governance framework and policy development',
      'Phase 2 (6-12 months): Citizen service delivery pilots and digital integration',
      'Phase 3 (12-18 months): Scaled government AI deployment and coordination',
      'Phase 4 (18-24 months): Advanced AI capabilities and innovation leadership'
    ];
  }
}

// Factory function to create industry-specific assessments
export function createIndustryAssessment(industryId: string): BaseIndustryAssessment | null {
  switch (industryId) {
    case 'financial-services':
      return new FinancialServicesAssessment();
    case 'manufacturing':
      return new ManufacturingAssessment();
    case 'healthcare':
      return new HealthcareAssessment();
    case 'government':
      return new GovernmentAssessment();
    default:
      return null;
  }
}