import { 
  AssessmentResponse, 
  DimensionScores, 
  PersonaClassification, 
  PersonaType,
  IndustryInsights,
  UserContext 
} from '../models/types';
import { UserProfile } from '../models/UserProfile';

export interface ScoringWeights {
  strategicAuthority: number;
  organizationalInfluence: number;
  resourceAvailability: number;
  implementationReadiness: number;
  culturalAlignment: number;
}

export interface IndustryAdjustments {
  [industry: string]: {
    weights: Partial<ScoringWeights>;
    bonusFactors: Record<string, number>;
    penalties: Record<string, number>;
  };
}

export interface CulturalFactors {
  [region: string]: {
    communicationStyle: number; // Adjustment factor for directness vs. indirect communication
    hierarchyRespect: number; // Adjustment for hierarchical vs. flat organizational preferences
    riskTolerance: number; // Cultural risk tolerance adjustment
    timeOrientation: number; // Long-term vs. short-term orientation
  };
}

export class ScoringEngine {
  private static readonly DEFAULT_WEIGHTS: ScoringWeights = {
    strategicAuthority: 0.25,
    organizationalInfluence: 0.20,
    resourceAvailability: 0.20,
    implementationReadiness: 0.25,
    culturalAlignment: 0.10
  };

  private static readonly INDUSTRY_ADJUSTMENTS: IndustryAdjustments = {
    'financial-services': {
      weights: { strategicAuthority: 0.30, implementationReadiness: 0.20 },
      bonusFactors: { 'regulatory_awareness': 1.2, 'risk_management': 1.15 },
      penalties: { 'rapid_implementation': 0.9 }
    },
    'manufacturing': {
      weights: { resourceAvailability: 0.25, implementationReadiness: 0.30 },
      bonusFactors: { 'process_optimization': 1.2, 'supply_chain': 1.15 },
      penalties: { 'theoretical_approach': 0.85 }
    },
    'healthcare': {
      weights: { culturalAlignment: 0.15, strategicAuthority: 0.20 },
      bonusFactors: { 'ethical_considerations': 1.25, 'patient_outcomes': 1.2 },
      penalties: { 'cost_cutting_focus': 0.8 }
    },
    'government': {
      weights: { culturalAlignment: 0.20, organizationalInfluence: 0.25 },
      bonusFactors: { 'transparency': 1.2, 'public_service': 1.15 },
      penalties: { 'private_sector_approach': 0.9 }
    },
    'technology': {
      weights: { implementationReadiness: 0.30, resourceAvailability: 0.15 },
      bonusFactors: { 'innovation_focus': 1.25, 'technical_depth': 1.2 },
      penalties: { 'traditional_methods': 0.85 }
    }
  };

  private static readonly CULTURAL_FACTORS: CulturalFactors = {
    'east-africa': {
      communicationStyle: 1.1, // Preference for relationship-building communication
      hierarchyRespect: 1.2, // Strong respect for organizational hierarchy
      riskTolerance: 0.9, // More conservative approach to new technology
      timeOrientation: 1.15 // Long-term relationship and outcome focus
    },
    'kenya': {
      communicationStyle: 1.05,
      hierarchyRespect: 1.15,
      riskTolerance: 0.95,
      timeOrientation: 1.1
    },
    'western': {
      communicationStyle: 0.95,
      hierarchyRespect: 0.9,
      riskTolerance: 1.1,
      timeOrientation: 0.95
    }
  };

  /**
   * Calculate strategic readiness scores with weighted dimensions
   */
  static calculateDimensionScores(
    responses: AssessmentResponse[],
    userProfile: UserProfile,
    userContext: UserContext
  ): DimensionScores {
    const rawScores = this.calculateRawDimensionScores(responses);
    const weights = this.getAdjustedWeights(userProfile, userContext);
    const culturalAdjustments = this.getCulturalAdjustments(userContext);
    const industryAdjustments = this.getIndustryAdjustments(userProfile.professional.industry);

    // Apply cultural adjustments
    const culturallyAdjustedScores = this.applyCulturalAdjustments(rawScores, culturalAdjustments);

    // Apply industry-specific adjustments
    const industryAdjustedScores = this.applyIndustryAdjustments(
      culturallyAdjustedScores, 
      industryAdjustments
    );

    // Normalize scores to 0-100 range
    return this.normalizeScores(industryAdjustedScores);
  }

  /**
   * Calculate raw dimension scores from responses
   */
  private static calculateRawDimensionScores(responses: AssessmentResponse[]): DimensionScores {
    const dimensionTotals = {
      strategicAuthority: 0,
      organizationalInfluence: 0,
      resourceAvailability: 0,
      implementationReadiness: 0,
      culturalAlignment: 0
    };

    const dimensionCounts = {
      strategicAuthority: 0,
      organizationalInfluence: 0,
      resourceAvailability: 0,
      implementationReadiness: 0,
      culturalAlignment: 0
    };

    responses.forEach(response => {
      const dimension = this.mapQuestionToDimension(response.questionId);
      if (dimension) {
        const score = this.extractNumericScore(response.responseValue);
        dimensionTotals[dimension] += score;
        dimensionCounts[dimension]++;
      }
    });

    // Calculate averages
    return {
      strategicAuthority: dimensionCounts.strategicAuthority > 0 
        ? dimensionTotals.strategicAuthority / dimensionCounts.strategicAuthority 
        : 0,
      organizationalInfluence: dimensionCounts.organizationalInfluence > 0 
        ? dimensionTotals.organizationalInfluence / dimensionCounts.organizationalInfluence 
        : 0,
      resourceAvailability: dimensionCounts.resourceAvailability > 0 
        ? dimensionTotals.resourceAvailability / dimensionCounts.resourceAvailability 
        : 0,
      implementationReadiness: dimensionCounts.implementationReadiness > 0 
        ? dimensionTotals.implementationReadiness / dimensionCounts.implementationReadiness 
        : 0,
      culturalAlignment: dimensionCounts.culturalAlignment > 0 
        ? dimensionTotals.culturalAlignment / dimensionCounts.culturalAlignment 
        : 0
    };
  }

  /**
   * Map question ID to scoring dimension
   */
  private static mapQuestionToDimension(questionId: string): keyof DimensionScores | null {
    // Strategic Authority questions
    if (questionId.includes('authority') || questionId.includes('decision') || questionId.includes('budget')) {
      return 'strategicAuthority';
    }
    
    // Organizational Influence questions
    if (questionId.includes('influence') || questionId.includes('team') || questionId.includes('stakeholder')) {
      return 'organizationalInfluence';
    }
    
    // Resource Availability questions
    if (questionId.includes('resource') || questionId.includes('investment') || questionId.includes('capacity')) {
      return 'resourceAvailability';
    }
    
    // Implementation Readiness questions
    if (questionId.includes('implementation') || questionId.includes('timeline') || questionId.includes('change')) {
      return 'implementationReadiness';
    }
    
    // Cultural Alignment questions
    if (questionId.includes('culture') || questionId.includes('communication') || questionId.includes('collaboration')) {
      return 'culturalAlignment';
    }

    return null;
  }

  /**
   * Extract numeric score from response value
   */
  private static extractNumericScore(responseValue: unknown): number {
    if (typeof responseValue === 'number') {
      return responseValue;
    }
    
    if (typeof responseValue === 'string') {
      // Handle scale responses like "strongly_agree" -> 5
      const scaleMap: Record<string, number> = {
        'strongly_disagree': 1,
        'disagree': 2,
        'neutral': 3,
        'agree': 4,
        'strongly_agree': 5,
        'never': 1,
        'rarely': 2,
        'sometimes': 3,
        'often': 4,
        'always': 5,
        'very_low': 1,
        'low': 2,
        'medium': 3,
        'high': 4,
        'very_high': 5
      };
      
      return scaleMap[responseValue.toLowerCase()] || 3; // Default to neutral
    }
    
    return 3; // Default neutral score
  }

  /**
   * Get adjusted weights based on user profile and context
   */
  private static getAdjustedWeights(userProfile: UserProfile, userContext: UserContext): ScoringWeights {
    let weights = { ...this.DEFAULT_WEIGHTS };
    
    // Adjust based on industry
    const industry = userProfile.professional.industry;
    if (industry && this.INDUSTRY_ADJUSTMENTS[industry]) {
      const industryWeights = this.INDUSTRY_ADJUSTMENTS[industry].weights;
      weights = { ...weights, ...industryWeights };
    }
    
    return weights;
  }

  /**
   * Get cultural adjustment factors
   */
  private static getCulturalAdjustments(userContext: UserContext): CulturalFactors[string] | null {
    const region = userContext.geographicRegion?.toLowerCase();
    if (region && this.CULTURAL_FACTORS[region]) {
      return this.CULTURAL_FACTORS[region];
    }
    
    // Check cultural context for regional indicators
    const culturalContext = userContext.culturalContext || [];
    for (const context of culturalContext) {
      const contextKey = context.toLowerCase();
      if (this.CULTURAL_FACTORS[contextKey]) {
        return this.CULTURAL_FACTORS[contextKey];
      }
    }
    
    return null;
  }

  /**
   * Get industry-specific adjustments
   */
  private static getIndustryAdjustments(industry?: string): IndustryAdjustments[string] | null {
    if (industry && this.INDUSTRY_ADJUSTMENTS[industry]) {
      return this.INDUSTRY_ADJUSTMENTS[industry];
    }
    return null;
  }

  /**
   * Apply cultural adjustments to scores
   */
  private static applyCulturalAdjustments(
    scores: DimensionScores, 
    culturalFactors: CulturalFactors[string] | null
  ): DimensionScores {
    if (!culturalFactors) {
      return scores;
    }

    return {
      strategicAuthority: scores.strategicAuthority * culturalFactors.hierarchyRespect,
      organizationalInfluence: scores.organizationalInfluence * culturalFactors.communicationStyle,
      resourceAvailability: scores.resourceAvailability * culturalFactors.riskTolerance,
      implementationReadiness: scores.implementationReadiness * culturalFactors.timeOrientation,
      culturalAlignment: scores.culturalAlignment * 1.0 // Cultural alignment is already culturally adjusted
    };
  }

  /**
   * Apply industry-specific adjustments to scores
   */
  private static applyIndustryAdjustments(
    scores: DimensionScores,
    industryAdjustments: IndustryAdjustments[string] | null
  ): DimensionScores {
    if (!industryAdjustments) {
      return scores;
    }

    let adjustedScores = { ...scores };

    // Apply bonus factors and penalties based on response patterns
    // This would be enhanced with actual response analysis
    Object.entries(industryAdjustments.bonusFactors).forEach(([factor, multiplier]) => {
      // Apply bonus to relevant dimensions based on factor
      if (factor.includes('regulatory') || factor.includes('risk')) {
        adjustedScores.strategicAuthority *= multiplier;
      }
      if (factor.includes('process') || factor.includes('optimization')) {
        adjustedScores.implementationReadiness *= multiplier;
      }
    });

    return adjustedScores;
  }

  /**
   * Normalize scores to 0-100 range
   */
  private static normalizeScores(scores: DimensionScores): DimensionScores {
    const normalize = (score: number): number => {
      // Assuming raw scores are on 1-5 scale, convert to 0-100
      return Math.max(0, Math.min(100, ((score - 1) / 4) * 100));
    };

    return {
      strategicAuthority: normalize(scores.strategicAuthority),
      organizationalInfluence: normalize(scores.organizationalInfluence),
      resourceAvailability: normalize(scores.resourceAvailability),
      implementationReadiness: normalize(scores.implementationReadiness),
      culturalAlignment: normalize(scores.culturalAlignment)
    };
  }

  /**
   * Calculate overall strategic readiness score
   */
  static calculateOverallScore(
    dimensionScores: DimensionScores,
    weights: ScoringWeights = this.DEFAULT_WEIGHTS
  ): number {
    return (
      dimensionScores.strategicAuthority * weights.strategicAuthority +
      dimensionScores.organizationalInfluence * weights.organizationalInfluence +
      dimensionScores.resourceAvailability * weights.resourceAvailability +
      dimensionScores.implementationReadiness * weights.implementationReadiness +
      dimensionScores.culturalAlignment * weights.culturalAlignment
    );
  }
}