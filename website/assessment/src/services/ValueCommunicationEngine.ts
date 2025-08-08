import { AssessmentResults, PersonaType } from '../models/types';
import { StrategicIntelligenceInsight } from './StrategicIntelligenceFramework';

/**
 * Value Communication Engine
 * 
 * Frames automation within strategic context, emphasizing strategic positioning,
 * competitive advantage, organizational transformation, and strategic value over cost savings.
 * 
 * Core Philosophy: Transform cost-focused automation discussions into strategic value conversations.
 */

export interface ValueCommunicationMessage {
  message_type: 'strategic_positioning' | 'competitive_advantage' | 'organizational_transformation' | 'roi_strategic';
  primary_message: string;
  supporting_points: string[];
  automation_context: string;
  strategic_framing: string;
  value_emphasis: string;
  implementation_narrative: string;
}

export interface StrategicValueCommunication {
  executive_summary: string;
  strategic_positioning_messages: ValueCommunicationMessage[];
  competitive_advantage_narrative: string;
  transformation_story: string;
  roi_strategic_framework: {
    strategic_value_drivers: string[];
    capability_building_metrics: string[];
    competitive_advantage_indicators: string[];
    transformation_milestones: string[];
  };
  automation_strategic_context: string;
}

export class ValueCommunicationEngine {
  private readonly STRATEGIC_VALUE_THEMES = {
    INTELLIGENCE_AMPLIFICATION: 'Strategic Intelligence Amplification',
    COMPETITIVE_DIFFERENTIATION: 'Sustainable Competitive Differentiation',
    ORGANIZATIONAL_CAPABILITY: 'Organizational Capability Building',
    MARKET_POSITIONING: 'Strategic Market Positioning',
    INNOVATION_ACCELERATION: 'Innovation and Growth Acceleration'
  };

  private readonly ROI_STRATEGIC_DIMENSIONS = {
    CAPABILITY_BUILDING: 'Long-term capability building and strategic readiness',
    COMPETITIVE_MOATS: 'Competitive advantage creation and market differentiation',
    INNOVATION_VELOCITY: 'Innovation speed and strategic agility enhancement',
    DECISION_QUALITY: 'Strategic decision-making quality and speed improvement',
    MARKET_EXPANSION: 'Market opportunity identification and expansion capability'
  };

  /**
   * Generate comprehensive strategic value communication framework
   */
  public generateStrategicValueCommunication(
    assessmentResults: AssessmentResults,
    industryContext: string,
    automationOpportunities: string[]
  ): StrategicValueCommunication {
    const persona = assessmentResults.persona_classification.primary_persona;
    const strategicMessages = this.generateStrategicPositioningMessages(assessmentResults, industryContext);
    const competitiveNarrative = this.generateCompetitiveAdvantageNarrative(assessmentResults, persona, industryContext);
    const transformationStory = this.generateTransformationStory(assessmentResults, automationOpportunities);
    const roiFramework = this.generateROIStrategicFramework(assessmentResults, industryContext);

    return {
      executive_summary: this.generateExecutiveSummary(assessmentResults, persona, industryContext),
      strategic_positioning_messages: strategicMessages,
      competitive_advantage_narrative: competitiveNarrative,
      transformation_story: transformationStory,
      roi_strategic_framework: roiFramework,
      automation_strategic_context: this.frameAutomationStrategically(automationOpportunities, industryContext)
    };
  }

  /**
   * Frame automation within strategic context rather than cost reduction
   */
  public frameAutomationWithinStrategicContext(
    automationOpportunities: string[],
    strategicContext: string,
    persona: PersonaType
  ): ValueCommunicationMessage[] {
    return automationOpportunities.map(opportunity => {
      const strategicFraming = this.determineStrategicFraming(opportunity, strategicContext);
      const valueEmphasis = this.determineValueEmphasis(opportunity, persona);
      
      return {
        message_type: 'strategic_positioning',
        primary_message: `Transform ${opportunity} into ${strategicFraming} that drives competitive advantage`,
        supporting_points: this.generateSupportingPoints(opportunity, strategicFraming),
        automation_context: `${opportunity} automation serves as foundation for ${strategicFraming.toLowerCase()}`,
        strategic_framing: strategicFraming,
        value_emphasis: valueEmphasis,
        implementation_narrative: this.generateImplementationNarrative(opportunity, strategicFraming, persona)
      };
    });
  }

  /**
   * Emphasize strategic positioning and competitive advantage
   */
  public emphasizeStrategicPositioning(
    assessmentResults: AssessmentResults,
    industryContext: string
  ): ValueCommunicationMessage[] {
    const positioningMessages: ValueCommunicationMessage[] = [];

    // Strategic Intelligence Amplification positioning
    positioningMessages.push({
      message_type: 'strategic_positioning',
      primary_message: 'Position your organization as a Strategic Intelligence leader in your industry',
      supporting_points: [
        'Develop proprietary AI capabilities that competitors cannot easily replicate',
        'Build strategic decision-making advantages through enhanced intelligence',
        'Create market differentiation through superior strategic insights',
        'Establish thought leadership in AI-driven strategic excellence'
      ],
      automation_context: 'Automation enables strategic intelligence by freeing human capacity for higher-value strategic thinking',
      strategic_framing: this.STRATEGIC_VALUE_THEMES.INTELLIGENCE_AMPLIFICATION,
      value_emphasis: 'Strategic differentiation and market leadership',
      implementation_narrative: 'Transform from operational efficiency focus to strategic intelligence leadership'
    });

    // Competitive Differentiation positioning
    positioningMessages.push({
      message_type: 'competitive_advantage',
      primary_message: 'Build sustainable competitive advantages that create long-term market barriers',
      supporting_points: [
        'Develop unique AI-human collaboration models specific to your industry',
        'Create proprietary strategic intelligence capabilities',
        'Build customer experience advantages through AI-enhanced service delivery',
        'Establish innovation velocity that outpaces competitors'
      ],
      automation_context: 'Automation provides operational foundation for strategic differentiation initiatives',
      strategic_framing: 'Strategic ' + this.STRATEGIC_VALUE_THEMES.COMPETITIVE_DIFFERENTIATION,
      value_emphasis: 'Sustainable competitive moats and market differentiation',
      implementation_narrative: 'Move beyond cost competition to value-based competitive positioning'
    });

    return positioningMessages;
  }

  /**
   * Build organizational transformation and capability building focus
   */
  public buildOrganizationalTransformationFocus(
    assessmentResults: AssessmentResults,
    culturalContext: string[]
  ): ValueCommunicationMessage[] {
    return [
      {
        message_type: 'organizational_transformation',
        primary_message: 'Transform your organization into a Strategic Intelligence powerhouse',
        supporting_points: [
          'Build organizational AI collaboration capabilities that enhance human potential',
          'Develop strategic thinking skills across all levels of the organization',
          'Create culture of continuous learning and strategic adaptation',
          'Establish organizational resilience through enhanced strategic capabilities'
        ],
        automation_context: 'Automation handles routine tasks, enabling focus on strategic capability development',
        strategic_framing: this.STRATEGIC_VALUE_THEMES.ORGANIZATIONAL_CAPABILITY,
        value_emphasis: 'Long-term organizational capability and strategic readiness',
        implementation_narrative: 'Build an organization that thrives in an AI-enhanced future through strategic capability development'
      },
      {
        message_type: 'organizational_transformation',
        primary_message: 'Accelerate innovation and strategic agility through AI-human collaboration',
        supporting_points: [
          'Enhance innovation speed through AI-augmented creative processes',
          'Improve strategic agility through faster insight generation and decision-making',
          'Build adaptive capacity for rapid market response and opportunity capture',
          'Create innovation culture that leverages both human creativity and AI capabilities'
        ],
        automation_context: 'Automation provides operational stability that enables innovation focus',
        strategic_framing: this.STRATEGIC_VALUE_THEMES.INNOVATION_ACCELERATION,
        value_emphasis: 'Innovation velocity and strategic agility enhancement',
        implementation_narrative: 'Transform from reactive operations to proactive strategic innovation leadership'
      }
    ];
  }

  /**
   * Develop ROI communication that emphasizes strategic value over cost savings
   */
  public developStrategicROICommunication(
    assessmentResults: AssessmentResults,
    industryContext: string,
    timeframe: string = '12-24 months'
  ): ValueCommunicationMessage {
    const strategicValueDrivers = this.identifyStrategicValueDrivers(assessmentResults, industryContext);
    const capabilityMetrics = this.generateCapabilityBuildingMetrics(assessmentResults);
    const competitiveIndicators = this.generateCompetitiveAdvantageIndicators(industryContext);

    return {
      message_type: 'roi_strategic',
      primary_message: `Generate strategic ROI through capability building and competitive advantage creation over ${timeframe}`,
      supporting_points: [
        `Build ${strategicValueDrivers.length} strategic capabilities that create long-term competitive advantages`,
        'Develop proprietary AI-human collaboration models that competitors cannot easily replicate',
        'Create market differentiation through superior strategic intelligence and decision-making',
        'Establish innovation velocity that accelerates growth and market expansion opportunities'
      ],
      automation_context: 'Automation ROI provides foundation for strategic value creation and competitive positioning',
      strategic_framing: 'Strategic ROI through capability building and competitive advantage creation',
      value_emphasis: 'Long-term strategic value creation over short-term cost reduction',
      implementation_narrative: `Transform ROI focus from cost savings to strategic value creation through ${timeframe} capability building journey`
    };
  }

  // Private helper methods

  private generateExecutiveSummary(
    assessmentResults: AssessmentResults,
    persona: PersonaType,
    industryContext: string
  ): string {
    const personaContext = this.getPersonaContext(persona);
    const industrySpecific = this.getIndustrySpecificValue(industryContext);
    
    return `Transform your ${industryContext} organization through Strategic Intelligence Amplification that positions automation as a foundation for competitive advantage and strategic value creation. ${personaContext} ${industrySpecific} This approach builds sustainable competitive moats through enhanced strategic capabilities while leveraging automation for operational excellence.`;
  }

  private generateStrategicPositioningMessages(
    assessmentResults: AssessmentResults,
    industryContext: string
  ): ValueCommunicationMessage[] {
    const messages = this.emphasizeStrategicPositioning(assessmentResults, industryContext);
    const transformationMessages = this.buildOrganizationalTransformationFocus(assessmentResults, ['strategic']);
    
    return [...messages, ...transformationMessages];
  }

  private generateCompetitiveAdvantageNarrative(
    assessmentResults: AssessmentResults,
    persona: PersonaType,
    industryContext: string
  ): string {
    const industryAdvantages = this.getIndustryCompetitiveAdvantages(industryContext);
    const personaFocus = this.getPersonaCompetitiveFocus(persona);
    
    return `Create sustainable competitive advantages in ${industryContext} through ${personaFocus}. ${industryAdvantages} This positions your organization as a strategic intelligence leader while using automation as an operational foundation for strategic differentiation.`;
  }

  private generateTransformationStory(
    assessmentResults: AssessmentResults,
    automationOpportunities: string[]
  ): string {
    const transformationPhases = [
      'Operational Foundation: Implement automation to create operational excellence and free strategic capacity',
      'Capability Building: Develop AI-human collaboration skills and strategic intelligence capabilities',
      'Strategic Differentiation: Create unique competitive advantages through proprietary AI-enhanced processes',
      'Market Leadership: Establish thought leadership and market positioning through strategic intelligence excellence'
    ];

    return `Transform your organization through a strategic four-phase journey: ${transformationPhases.join(' → ')}. This approach ensures that automation serves strategic objectives rather than just cost reduction, building long-term competitive advantages and organizational capabilities.`;
  }

  private generateROIStrategicFramework(
    assessmentResults: AssessmentResults,
    industryContext: string
  ): any {
    return {
      strategic_value_drivers: this.identifyStrategicValueDrivers(assessmentResults, industryContext),
      capability_building_metrics: this.generateCapabilityBuildingMetrics(assessmentResults),
      competitive_advantage_indicators: this.generateCompetitiveAdvantageIndicators(industryContext),
      transformation_milestones: this.generateTransformationMilestones(assessmentResults)
    };
  }

  private frameAutomationStrategically(
    automationOpportunities: string[],
    industryContext: string
  ): string {
    return `Position automation in ${industryContext} as strategic enablement rather than cost reduction: ${automationOpportunities.map(opp => `${opp} automation enables strategic focus and competitive differentiation`).join('; ')}. This framing transforms automation discussions from cost-focused to value-creation focused.`;
  }

  private determineStrategicFraming(opportunity: string, strategicContext: string): string {
    const lowerOpportunity = opportunity.toLowerCase();
    if (lowerOpportunity.includes('decision') || lowerOpportunity.includes('support')) {
      return 'Strategic Decision Enhancement';
    }
    if (lowerOpportunity.includes('customer') || lowerOpportunity.includes('experience')) {
      return 'Customer Experience Excellence';
    }
    if (lowerOpportunity.includes('process') || lowerOpportunity.includes('management')) {
      return 'Operational Strategic Foundation';
    }
    return 'Strategic Capability Building';
  }

  private determineValueEmphasis(opportunity: string, persona: PersonaType): string {
    const emphasisMap = {
      strategic_architect: 'Enterprise-wide competitive advantage and strategic transformation',
      strategic_catalyst: 'Organizational capability building and change leadership',
      strategic_contributor: 'Departmental excellence and strategic contribution',
      strategic_explorer: 'Skill development and strategic readiness',
      strategic_observer: 'Strategic awareness and future preparation'
    };

    return emphasisMap[persona] || 'Strategic value creation and competitive positioning';
  }

  private generateSupportingPoints(opportunity: string, strategicFraming: string): string[] {
    return [
      `Transform ${opportunity.toLowerCase()} from cost center to strategic advantage creator`,
      `Build competitive differentiation through enhanced ${opportunity.toLowerCase()} capabilities`,
      `Create market positioning advantages through superior ${opportunity.toLowerCase()} performance`,
      `Establish ${strategicFraming.toLowerCase()} that competitors cannot easily replicate`
    ];
  }

  private generateImplementationNarrative(
    opportunity: string,
    strategicFraming: string,
    persona: PersonaType
  ): string {
    const personaApproach = this.getPersonaImplementationApproach(persona);
    return `Implement ${opportunity} automation as foundation for ${strategicFraming.toLowerCase()} through ${personaApproach}, creating sustainable competitive advantages rather than just cost savings.`;
  }

  private getPersonaContext(persona: PersonaType): string {
    const contexts = {
      strategic_architect: 'As a strategic architect, you can drive enterprise-wide transformation that creates sustainable competitive advantages.',
      strategic_catalyst: 'As a strategic catalyst, you can lead organizational change that builds strategic capabilities across teams.',
      strategic_contributor: 'As a strategic contributor, you can implement solutions that enhance departmental strategic effectiveness.',
      strategic_explorer: 'As a strategic explorer, you can develop capabilities that position you for strategic leadership.',
      strategic_observer: 'As a strategic observer, you can build understanding that prepares you for strategic implementation opportunities.'
    };

    return contexts[persona] || 'You can leverage strategic intelligence to create competitive advantages.';
  }

  private getIndustrySpecificValue(industryContext: string): string {
    const values = {
      financial_services: 'Build competitive advantages through enhanced risk intelligence and customer relationship excellence.',
      manufacturing: 'Create supply chain intelligence and operational excellence that drives market differentiation.',
      healthcare: 'Develop patient outcome optimization and operational efficiency that establishes market leadership.',
      government: 'Enhance public service delivery and transparency that builds citizen trust and operational excellence.',
      technology: 'Accelerate innovation velocity and product development that creates market leadership.',
      professional_services: 'Build client relationship excellence and service delivery that creates competitive differentiation.'
    };

    return values[industryContext as keyof typeof values] || 'Create industry-specific competitive advantages through strategic intelligence.';
  }

  private getIndustryCompetitiveAdvantages(industryContext: string): string {
    const advantages = {
      financial_services: 'Superior risk assessment, customer intelligence, and regulatory compliance create sustainable competitive moats.',
      manufacturing: 'Supply chain optimization, quality excellence, and operational intelligence establish market leadership.',
      healthcare: 'Patient outcome optimization, operational efficiency, and care quality create competitive differentiation.',
      government: 'Service delivery excellence, transparency, and citizen engagement build trust and effectiveness.',
      technology: 'Innovation velocity, product quality, and market responsiveness create competitive advantages.',
      professional_services: 'Client relationship excellence, service quality, and expertise delivery create market differentiation.'
    };

    return advantages[industryContext as keyof typeof advantages] || 'Industry-specific strategic intelligence creates competitive advantages.';
  }

  private getPersonaCompetitiveFocus(persona: PersonaType): string {
    const focuses = {
      strategic_architect: 'enterprise-wide strategic intelligence and competitive positioning',
      strategic_catalyst: 'organizational capability building and change leadership excellence',
      strategic_contributor: 'departmental strategic excellence and operational differentiation',
      strategic_explorer: 'skill development and strategic readiness building',
      strategic_observer: 'strategic awareness and competitive intelligence development'
    };

    return focuses[persona] || 'strategic intelligence and competitive positioning';
  }

  private getPersonaImplementationApproach(persona: PersonaType): string {
    const approaches = {
      strategic_architect: 'enterprise-wide strategic transformation and capability building',
      strategic_catalyst: 'organizational change leadership and team empowerment',
      strategic_contributor: 'departmental excellence and strategic implementation',
      strategic_explorer: 'skill development and strategic learning',
      strategic_observer: 'strategic awareness building and readiness development'
    };

    return approaches[persona] || 'strategic capability building and competitive positioning';
  }

  private identifyStrategicValueDrivers(
    assessmentResults: AssessmentResults,
    industryContext: string
  ): string[] {
    const baseDrivers = [
      'Strategic Decision-Making Enhancement',
      'Competitive Intelligence Amplification',
      'Innovation Velocity Acceleration',
      'Market Positioning Optimization',
      'Organizational Capability Building'
    ];

    // Add industry-specific drivers
    const industryDrivers = {
      financial_services: ['Risk Intelligence Excellence', 'Customer Relationship Optimization'],
      manufacturing: ['Supply Chain Intelligence', 'Operational Excellence'],
      healthcare: ['Patient Outcome Optimization', 'Care Quality Enhancement'],
      government: ['Public Service Excellence', 'Transparency and Accountability'],
      technology: ['Innovation Acceleration', 'Product Development Excellence'],
      professional_services: ['Client Relationship Excellence', 'Service Delivery Optimization']
    };

    const specificDrivers = industryDrivers[industryContext as keyof typeof industryDrivers] || [];
    return [...baseDrivers, ...specificDrivers];
  }

  private generateCapabilityBuildingMetrics(assessmentResults: AssessmentResults): string[] {
    return [
      'Strategic Decision Quality Improvement (measured through outcome tracking)',
      'Innovation Velocity Enhancement (measured through time-to-market improvements)',
      'Competitive Intelligence Capability (measured through market insight generation)',
      'Organizational AI Collaboration Maturity (measured through capability assessments)',
      'Strategic Agility Enhancement (measured through response time to market changes)'
    ];
  }

  private generateCompetitiveAdvantageIndicators(industryContext: string): string[] {
    const baseIndicators = [
      'Market Differentiation Index (measured through competitive analysis)',
      'Strategic Intelligence Capability Score (measured through decision quality)',
      'Innovation Leadership Position (measured through market recognition)',
      'Customer Experience Excellence Rating (measured through satisfaction and retention)'
    ];

    const industryIndicators = {
      financial_services: ['Risk Assessment Accuracy', 'Customer Relationship Quality'],
      manufacturing: ['Supply Chain Efficiency', 'Quality Excellence Score'],
      healthcare: ['Patient Outcome Improvement', 'Care Quality Rating'],
      government: ['Public Service Satisfaction', 'Transparency Index'],
      technology: ['Innovation Velocity', 'Product Quality Score'],
      professional_services: ['Client Satisfaction', 'Service Excellence Rating']
    };

    const specificIndicators = industryIndicators[industryContext as keyof typeof industryIndicators] || [];
    return [...baseIndicators, ...specificIndicators];
  }

  private generateTransformationMilestones(assessmentResults: AssessmentResults): string[] {
    return [
      'Month 1-3: Operational Foundation - Implement automation and establish strategic capacity',
      'Month 4-6: Capability Building - Develop AI-human collaboration skills and strategic intelligence',
      'Month 7-9: Strategic Differentiation - Create unique competitive advantages and market positioning',
      'Month 10-12: Market Leadership - Establish thought leadership and strategic excellence recognition'
    ];
  }
}