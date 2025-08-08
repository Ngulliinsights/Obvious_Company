import { 
  IndustryInsights, 
  DimensionScores, 
  PersonaType,
  UserContext 
} from '../models/types';
import { UserProfile } from '../models/UserProfile';

export interface IndustryProfile {
  name: string;
  maturityLevel: number; // 0-100 scale of AI adoption maturity
  regulatoryComplexity: number; // 0-100 scale of regulatory requirements
  culturalFactors: string[];
  commonChallenges: string[];
  opportunityAreas: string[];
  implementationPriorities: string[];
  riskFactors: string[];
}

export interface CulturalSensitivityFactors {
  communicationStyle: 'direct' | 'indirect' | 'mixed';
  hierarchyImportance: 'high' | 'medium' | 'low';
  consensusBuilding: 'required' | 'preferred' | 'optional';
  timeOrientation: 'long-term' | 'short-term' | 'balanced';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  relationshipFocus: 'high' | 'medium' | 'low';
}

export class IndustryInsightsEngine {
  private static readonly INDUSTRY_PROFILES: Record<string, IndustryProfile> = {
    'financial-services': {
      name: 'Financial Services',
      maturityLevel: 75,
      regulatoryComplexity: 90,
      culturalFactors: ['risk-averse', 'compliance-focused', 'data-sensitive'],
      commonChallenges: [
        'Regulatory compliance requirements',
        'Data privacy and security concerns',
        'Legacy system integration',
        'Risk management protocols'
      ],
      opportunityAreas: [
        'Fraud detection and prevention',
        'Customer risk assessment',
        'Automated compliance monitoring',
        'Personalized financial advice'
      ],
      implementationPriorities: [
        'Regulatory compliance validation',
        'Security framework establishment',
        'Pilot program with limited scope',
        'Stakeholder education and buy-in'
      ],
      riskFactors: [
        'Regulatory non-compliance',
        'Data breach vulnerabilities',
        'Customer trust erosion',
        'Operational disruption'
      ]
    },
    'manufacturing': {
      name: 'Manufacturing',
      maturityLevel: 65,
      regulatoryComplexity: 60,
      culturalFactors: ['efficiency-focused', 'safety-conscious', 'process-oriented'],
      commonChallenges: [
        'Legacy equipment integration',
        'Workforce skill gaps',
        'Supply chain complexity',
        'Quality control standards'
      ],
      opportunityAreas: [
        'Predictive maintenance',
        'Quality control automation',
        'Supply chain optimization',
        'Production planning enhancement'
      ],
      implementationPriorities: [
        'Process optimization identification',
        'Equipment compatibility assessment',
        'Workforce training programs',
        'Phased implementation approach'
      ],
      riskFactors: [
        'Production disruption',
        'Safety protocol violations',
        'Quality degradation',
        'Workforce resistance'
      ]
    },
    'healthcare': {
      name: 'Healthcare',
      maturityLevel: 55,
      regulatoryComplexity: 95,
      culturalFactors: ['patient-centered', 'evidence-based', 'ethical-focused'],
      commonChallenges: [
        'Patient privacy regulations',
        'Clinical validation requirements',
        'Ethical considerations',
        'Integration with existing systems'
      ],
      opportunityAreas: [
        'Diagnostic support systems',
        'Patient outcome prediction',
        'Treatment personalization',
        'Administrative efficiency'
      ],
      implementationPriorities: [
        'Ethical framework development',
        'Clinical validation studies',
        'Privacy protection measures',
        'Healthcare professional training'
      ],
      riskFactors: [
        'Patient safety concerns',
        'Regulatory violations',
        'Ethical breaches',
        'Professional liability'
      ]
    },
    'government': {
      name: 'Government',
      maturityLevel: 45,
      regulatoryComplexity: 85,
      culturalFactors: ['transparency-focused', 'accountability-driven', 'public-service-oriented'],
      commonChallenges: [
        'Public transparency requirements',
        'Budget constraints',
        'Political considerations',
        'Citizen privacy concerns'
      ],
      opportunityAreas: [
        'Public service delivery improvement',
        'Resource allocation optimization',
        'Citizen engagement enhancement',
        'Policy impact analysis'
      ],
      implementationPriorities: [
        'Transparency framework establishment',
        'Public consultation processes',
        'Pilot program development',
        'Stakeholder engagement strategy'
      ],
      riskFactors: [
        'Public trust erosion',
        'Political backlash',
        'Privacy violations',
        'Accountability gaps'
      ]
    },
    'technology': {
      name: 'Technology',
      maturityLevel: 85,
      regulatoryComplexity: 40,
      culturalFactors: ['innovation-driven', 'agile-focused', 'data-centric'],
      commonChallenges: [
        'Rapid technology evolution',
        'Talent acquisition and retention',
        'Scalability requirements',
        'Competitive pressure'
      ],
      opportunityAreas: [
        'Product development acceleration',
        'Customer experience enhancement',
        'Operational efficiency gains',
        'Market intelligence improvement'
      ],
      implementationPriorities: [
        'Innovation strategy alignment',
        'Technical infrastructure scaling',
        'Team capability development',
        'Competitive advantage identification'
      ],
      riskFactors: [
        'Technology obsolescence',
        'Talent shortage',
        'Market disruption',
        'Security vulnerabilities'
      ]
    }
  };

  private static readonly CULTURAL_PROFILES: Record<string, CulturalSensitivityFactors> = {
    'east-africa': {
      communicationStyle: 'indirect',
      hierarchyImportance: 'high',
      consensusBuilding: 'required',
      timeOrientation: 'long-term',
      riskTolerance: 'conservative',
      relationshipFocus: 'high'
    },
    'kenya': {
      communicationStyle: 'mixed',
      hierarchyImportance: 'high',
      consensusBuilding: 'preferred',
      timeOrientation: 'long-term',
      riskTolerance: 'moderate',
      relationshipFocus: 'high'
    },
    'western': {
      communicationStyle: 'direct',
      hierarchyImportance: 'medium',
      consensusBuilding: 'optional',
      timeOrientation: 'short-term',
      riskTolerance: 'moderate',
      relationshipFocus: 'medium'
    }
  };

  /**
   * Generate industry-specific insights based on scores and context
   */
  static generateIndustryInsights(
    dimensionScores: DimensionScores,
    userProfile: UserProfile,
    userContext: UserContext,
    personaType: PersonaType
  ): IndustryInsights {
    const industry = userProfile.professional.industry;
    const industryProfile = industry ? this.INDUSTRY_PROFILES[industry] : null;
    
    if (!industryProfile) {
      return this.generateGenericInsights(dimensionScores, personaType);
    }

    // Calculate sector readiness based on industry maturity and user scores
    const sectorReadiness = this.calculateSectorReadiness(
      dimensionScores, 
      industryProfile, 
      userContext
    );

    // Get culturally-sensitive regulatory considerations
    const regulatoryConsiderations = this.getCulturallyAdaptedRegulatory(
      industryProfile, 
      userContext
    );

    // Generate implementation priorities based on persona and industry
    const implementationPriorities = this.generateImplementationPriorities(
      industryProfile,
      personaType,
      dimensionScores,
      userContext
    );

    // Add cultural factors specific to the region
    const culturalFactors = this.getCulturalFactors(userContext, industryProfile);

    return {
      sectorReadiness,
      regulatoryConsiderations,
      implementationPriorities,
      culturalFactors
    };
  }

  /**
   * Calculate sector readiness score
   */
  private static calculateSectorReadiness(
    scores: DimensionScores,
    industryProfile: IndustryProfile,
    userContext: UserContext
  ): number {
    // Base readiness from user scores
    const userReadiness = (
      scores.strategicAuthority * 0.25 +
      scores.organizationalInfluence * 0.20 +
      scores.resourceAvailability * 0.25 +
      scores.implementationReadiness * 0.30
    );

    // Industry maturity factor
    const industryFactor = industryProfile.maturityLevel / 100;

    // Cultural adjustment
    const culturalProfile = this.getCulturalProfile(userContext);
    const culturalAdjustment = culturalProfile ? 
      (culturalProfile.riskTolerance === 'conservative' ? 0.9 : 
       culturalProfile.riskTolerance === 'aggressive' ? 1.1 : 1.0) : 1.0;

    // Regulatory complexity penalty
    const regulatoryPenalty = 1 - (industryProfile.regulatoryComplexity / 200);

    return Math.round(userReadiness * industryFactor * culturalAdjustment * regulatoryPenalty);
  }

  /**
   * Get culturally adapted regulatory considerations
   */
  private static getCulturallyAdaptedRegulatory(
    industryProfile: IndustryProfile,
    userContext: UserContext
  ): string[] {
    const baseRegulatory = [...industryProfile.riskFactors];
    const culturalProfile = this.getCulturalProfile(userContext);

    if (!culturalProfile) return baseRegulatory;

    // Add cultural-specific considerations
    const culturalRegulatory: string[] = [];

    if (culturalProfile.hierarchyImportance === 'high') {
      culturalRegulatory.push('Stakeholder approval and sign-off processes');
      culturalRegulatory.push('Hierarchical decision-making protocols');
    }

    if (culturalProfile.consensusBuilding === 'required') {
      culturalRegulatory.push('Community and team consensus requirements');
      culturalRegulatory.push('Extended consultation periods');
    }

    if (culturalProfile.relationshipFocus === 'high') {
      culturalRegulatory.push('Relationship impact assessments');
      culturalRegulatory.push('Trust-building and communication strategies');
    }

    // Regional regulatory considerations
    const region = userContext.geographicRegion?.toLowerCase();
    if (region === 'kenya' || region === 'east-africa') {
      culturalRegulatory.push('Local data sovereignty requirements');
      culturalRegulatory.push('Community impact considerations');
      culturalRegulatory.push('Local partnership and capacity building');
    }

    return [...baseRegulatory, ...culturalRegulatory];
  }

  /**
   * Generate implementation priorities based on persona and context
   */
  private static generateImplementationPriorities(
    industryProfile: IndustryProfile,
    personaType: PersonaType,
    scores: DimensionScores,
    userContext: UserContext
  ): string[] {
    const basePriorities = [...industryProfile.implementationPriorities];
    const personaAdjustments: string[] = [];

    // Persona-specific priorities
    switch (personaType) {
      case 'Strategic Architect':
        personaAdjustments.push(
          'Enterprise-wide strategic alignment',
          'Board and executive stakeholder engagement',
          'Organizational transformation roadmap'
        );
        break;
      case 'Strategic Catalyst':
        personaAdjustments.push(
          'Change management strategy development',
          'Cross-functional team coordination',
          'Cultural transformation initiatives'
        );
        break;
      case 'Strategic Contributor':
        personaAdjustments.push(
          'Department-specific implementation planning',
          'Team training and capability building',
          'Process optimization identification'
        );
        break;
      case 'Strategic Explorer':
        personaAdjustments.push(
          'Learning and development program design',
          'Pilot project identification',
          'Skill gap assessment and training'
        );
        break;
      case 'Strategic Observer':
        personaAdjustments.push(
          'Assessment and consultation approach',
          'Knowledge acquisition and understanding',
          'Readiness evaluation and preparation'
        );
        break;
    }

    // Cultural adjustments
    const culturalProfile = this.getCulturalProfile(userContext);
    if (culturalProfile) {
      if (culturalProfile.consensusBuilding === 'required') {
        personaAdjustments.push('Stakeholder consensus building processes');
      }
      if (culturalProfile.relationshipFocus === 'high') {
        personaAdjustments.push('Relationship preservation and enhancement');
      }
      if (culturalProfile.timeOrientation === 'long-term') {
        personaAdjustments.push('Long-term value and relationship focus');
      }
    }

    // Score-based adjustments
    if (scores.resourceAvailability < 50) {
      personaAdjustments.push('Resource optimization and efficiency focus');
    }
    if (scores.culturalAlignment < 60) {
      personaAdjustments.push('Cultural adaptation and sensitivity measures');
    }

    return [...basePriorities, ...personaAdjustments].slice(0, 8); // Limit to 8 priorities
  }

  /**
   * Get cultural factors for the region and industry
   */
  private static getCulturalFactors(
    userContext: UserContext,
    industryProfile: IndustryProfile
  ): string[] {
    const culturalFactors = [...industryProfile.culturalFactors];
    const culturalProfile = this.getCulturalProfile(userContext);

    if (!culturalProfile) return culturalFactors;

    // Add region-specific cultural factors
    const region = userContext.geographicRegion?.toLowerCase();
    if (region === 'kenya' || region === 'east-africa') {
      culturalFactors.push(
        'Ubuntu philosophy and community focus',
        'Respect for hierarchy and experience',
        'Relationship-building importance',
        'Long-term partnership orientation'
      );
    }

    // Add cultural context factors
    const contextFactors = userContext.culturalContext || [];
    contextFactors.forEach(context => {
      if (context.toLowerCase().includes('swahili')) {
        culturalFactors.push('Multilingual communication considerations');
      }
      if (context.toLowerCase().includes('traditional')) {
        culturalFactors.push('Traditional business practice integration');
      }
    });

    return [...new Set(culturalFactors)]; // Remove duplicates
  }

  /**
   * Get cultural profile for region
   */
  private static getCulturalProfile(userContext: UserContext): CulturalSensitivityFactors | null {
    const region = userContext.geographicRegion?.toLowerCase();
    if (region && this.CULTURAL_PROFILES[region]) {
      return this.CULTURAL_PROFILES[region];
    }

    // Check cultural context for regional indicators
    const culturalContext = userContext.culturalContext || [];
    for (const context of culturalContext) {
      const contextKey = context.toLowerCase();
      if (this.CULTURAL_PROFILES[contextKey]) {
        return this.CULTURAL_PROFILES[contextKey];
      }
    }

    return null;
  }

  /**
   * Generate generic insights when industry is not specified
   */
  private static generateGenericInsights(
    scores: DimensionScores,
    personaType: PersonaType
  ): IndustryInsights {
    const averageScore = (
      scores.strategicAuthority + 
      scores.organizationalInfluence + 
      scores.resourceAvailability + 
      scores.implementationReadiness
    ) / 4;

    return {
      sectorReadiness: Math.round(averageScore),
      regulatoryConsiderations: [
        'Data privacy and security requirements',
        'Organizational policy compliance',
        'Stakeholder approval processes',
        'Risk management protocols'
      ],
      implementationPriorities: [
        'Strategic alignment assessment',
        'Stakeholder engagement planning',
        'Pilot program development',
        'Success metrics definition'
      ],
      culturalFactors: [
        'Organizational culture assessment',
        'Change management considerations',
        'Communication strategy development'
      ]
    };
  }

  /**
   * Get industry profile by name
   */
  static getIndustryProfile(industry: string): IndustryProfile | null {
    return this.INDUSTRY_PROFILES[industry] || null;
  }

  /**
   * Get all available industry profiles
   */
  static getAllIndustryProfiles(): Record<string, IndustryProfile> {
    return { ...this.INDUSTRY_PROFILES };
  }

  /**
   * Get cultural sensitivity factors for region
   */
  static getCulturalSensitivityFactors(region: string): CulturalSensitivityFactors | null {
    return this.CULTURAL_PROFILES[region.toLowerCase()] || null;
  }

  /**
   * Validate industry insights against business rules
   */
  static validateInsights(
    insights: IndustryInsights,
    userProfile: UserProfile
  ): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Check sector readiness reasonableness
    if (insights.sectorReadiness < 20) {
      warnings.push('Very low sector readiness - consider foundational preparation');
    }
    if (insights.sectorReadiness > 90) {
      warnings.push('Very high sector readiness - validate against actual capabilities');
    }

    // Check for missing critical considerations
    if (insights.regulatoryConsiderations.length === 0) {
      warnings.push('No regulatory considerations identified - review may be needed');
    }

    if (insights.implementationPriorities.length < 3) {
      warnings.push('Limited implementation priorities - consider additional assessment');
    }

    return { isValid: true, warnings };
  }
}