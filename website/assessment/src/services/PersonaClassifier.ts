import { 
  PersonaClassification, 
  PersonaType, 
  DimensionScores,
  UserContext 
} from '../models/types';
import { UserProfile } from '../models/UserProfile';

export interface DecisionNode {
  condition: (scores: DimensionScores, profile: UserProfile) => boolean;
  trueNode?: DecisionNode | PersonaType;
  falseNode?: DecisionNode | PersonaType;
  description: string;
}

export interface PersonaCharacteristics {
  [key: string]: {
    authorityRange: [number, number];
    influenceRange: [number, number];
    resourceRange: [number, number];
    readinessRange: [number, number];
    culturalRange: [number, number];
    investmentCapacity: string;
    decisionMakingPower: string;
    implementationFocus: string;
  };
}

export class PersonaClassifier {
  private static readonly PERSONA_CHARACTERISTICS: PersonaCharacteristics = {
    'Strategic Architect': {
      authorityRange: [80, 100],
      influenceRange: [75, 100],
      resourceRange: [70, 100],
      readinessRange: [60, 100],
      culturalRange: [50, 100],
      investmentCapacity: '$25K-$75K',
      decisionMakingPower: 'Enterprise-wide authority',
      implementationFocus: 'Strategic transformation'
    },
    'Strategic Catalyst': {
      authorityRange: [60, 85],
      influenceRange: [70, 90],
      resourceRange: [50, 80],
      readinessRange: [70, 95],
      culturalRange: [60, 90],
      investmentCapacity: '$15K-$40K',
      decisionMakingPower: 'Significant influence with change leadership',
      implementationFocus: 'Organizational change management'
    },
    'Strategic Contributor': {
      authorityRange: [40, 70],
      influenceRange: [50, 75],
      resourceRange: [40, 70],
      readinessRange: [50, 80],
      culturalRange: [40, 80],
      investmentCapacity: '$150K-250K KSH',
      decisionMakingPower: 'Department-level authority',
      implementationFocus: 'Tactical implementation'
    },
    'Strategic Explorer': {
      authorityRange: [20, 50],
      influenceRange: [30, 60],
      resourceRange: [20, 50],
      readinessRange: [60, 90],
      culturalRange: [50, 85],
      investmentCapacity: '$75K-150K KSH',
      decisionMakingPower: 'Emerging leadership potential',
      implementationFocus: 'Learning and development'
    },
    'Strategic Observer': {
      authorityRange: [0, 40],
      influenceRange: [0, 50],
      resourceRange: [0, 40],
      readinessRange: [20, 70],
      culturalRange: [30, 70],
      investmentCapacity: 'Assessment-based consultation',
      decisionMakingPower: 'Functional specialist',
      implementationFocus: 'Knowledge acquisition'
    }
  };

  /**
   * Decision tree for persona classification
   */
  private static readonly DECISION_TREE: DecisionNode = {
    description: "Root: Check strategic authority level",
    condition: (scores) => scores.strategicAuthority >= 80,
    trueNode: {
      description: "High Authority: Check resource availability",
      condition: (scores) => scores.resourceAvailability >= 70,
      trueNode: {
        description: "High Authority + High Resources: Check influence",
        condition: (scores) => scores.organizationalInfluence >= 75,
        trueNode: 'Strategic Architect',
        falseNode: {
          description: "High Authority + High Resources + Medium Influence: Check readiness",
          condition: (scores) => scores.implementationReadiness >= 60,
          trueNode: 'Strategic Architect',
          falseNode: 'Strategic Catalyst'
        }
      },
      falseNode: {
        description: "High Authority + Medium Resources: Check influence and readiness",
        condition: (scores) => scores.organizationalInfluence >= 70 && scores.implementationReadiness >= 70,
        trueNode: 'Strategic Catalyst',
        falseNode: 'Strategic Contributor'
      }
    },
    falseNode: {
      description: "Medium/Low Authority: Check influence level",
      condition: (scores) => scores.organizationalInfluence >= 60,
      trueNode: {
        description: "Medium Authority + Good Influence: Check readiness",
        condition: (scores) => scores.implementationReadiness >= 70,
        trueNode: 'Strategic Catalyst',
        falseNode: {
          description: "Medium Authority + Good Influence + Medium Readiness: Check authority range",
          condition: (scores) => scores.strategicAuthority >= 40,
          trueNode: 'Strategic Contributor',
          falseNode: 'Strategic Explorer'
        }
      },
      falseNode: {
        description: "Low/Medium Authority + Low/Medium Influence: Check readiness and learning orientation",
        condition: (scores) => scores.implementationReadiness >= 60,
        trueNode: {
          description: "Good readiness: Check authority for Explorer vs Contributor",
          condition: (scores) => scores.strategicAuthority >= 20,
          trueNode: 'Strategic Explorer',
          falseNode: 'Strategic Observer'
        },
        falseNode: {
          description: "Low readiness: Check if has any authority",
          condition: (scores) => scores.strategicAuthority >= 20,
          trueNode: 'Strategic Contributor',
          falseNode: 'Strategic Observer'
        }
      }
    }
  };

  /**
   * Classify user persona based on dimension scores and profile
   */
  static classifyPersona(
    dimensionScores: DimensionScores,
    userProfile: UserProfile,
    userContext: UserContext
  ): PersonaClassification {
    // Apply cultural adjustments to classification logic
    const adjustedScores = this.applyCulturalClassificationAdjustments(
      dimensionScores, 
      userContext
    );

    // Traverse decision tree
    const primaryPersona = this.traverseDecisionTree(
      this.DECISION_TREE, 
      adjustedScores, 
      userProfile
    );

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(
      adjustedScores, 
      primaryPersona
    );

    // Identify secondary characteristics
    const secondaryCharacteristics = this.identifySecondaryCharacteristics(
      adjustedScores, 
      primaryPersona
    );

    // Generate reasoning
    const reasoning = this.generateClassificationReasoning(
      adjustedScores, 
      primaryPersona, 
      userProfile
    );

    return {
      primaryPersona,
      confidenceScore,
      secondaryCharacteristics,
      reasoning
    };
  }

  /**
   * Traverse decision tree to determine persona
   */
  private static traverseDecisionTree(
    node: DecisionNode,
    scores: DimensionScores,
    profile: UserProfile
  ): PersonaType {
    const conditionResult = node.condition(scores, profile);
    const nextNode = conditionResult ? node.trueNode : node.falseNode;

    if (typeof nextNode === 'string') {
      return nextNode as PersonaType;
    }

    if (nextNode) {
      return this.traverseDecisionTree(nextNode, scores, profile);
    }

    // Fallback to Strategic Observer if tree traversal fails
    return 'Strategic Observer';
  }

  /**
   * Apply cultural adjustments to classification logic
   */
  private static applyCulturalClassificationAdjustments(
    scores: DimensionScores,
    userContext: UserContext
  ): DimensionScores {
    const region = userContext.geographicRegion?.toLowerCase();
    
    // East African cultural adjustments
    if (region === 'east-africa' || region === 'kenya') {
      return {
        ...scores,
        // Adjust for cultural tendency to understate authority
        strategicAuthority: Math.min(100, scores.strategicAuthority * 1.1),
        // Adjust for relationship-focused influence style
        organizationalInfluence: Math.min(100, scores.organizationalInfluence * 1.05),
        // Adjust for conservative resource assessment
        resourceAvailability: Math.min(100, scores.resourceAvailability * 1.15)
      };
    }

    return scores;
  }

  /**
   * Calculate confidence score for persona classification
   */
  private static calculateConfidenceScore(
    scores: DimensionScores,
    persona: PersonaType
  ): number {
    const characteristics = this.PERSONA_CHARACTERISTICS[persona];
    if (!characteristics) return 0.5;

    // Calculate how well scores fit within persona ranges
    const fits = [
      this.scoreInRange(scores.strategicAuthority, characteristics.authorityRange),
      this.scoreInRange(scores.organizationalInfluence, characteristics.influenceRange),
      this.scoreInRange(scores.resourceAvailability, characteristics.resourceRange),
      this.scoreInRange(scores.implementationReadiness, characteristics.readinessRange),
      this.scoreInRange(scores.culturalAlignment, characteristics.culturalRange)
    ];

    // Average fit score
    const averageFit = fits.reduce((sum, fit) => sum + fit, 0) / fits.length;
    
    // Convert to confidence score (0.5 to 1.0 range)
    return 0.5 + (averageFit * 0.5);
  }

  /**
   * Check if score falls within expected range for persona
   */
  private static scoreInRange(score: number, range: [number, number]): number {
    const [min, max] = range;
    if (score >= min && score <= max) {
      return 1.0; // Perfect fit
    }
    
    // Calculate distance from range
    const distanceFromRange = score < min ? min - score : score - max;
    const maxDistance = 50; // Maximum meaningful distance
    
    return Math.max(0, 1 - (distanceFromRange / maxDistance));
  }

  /**
   * Identify secondary characteristics that don't fit primary persona
   */
  private static identifySecondaryCharacteristics(
    scores: DimensionScores,
    primaryPersona: PersonaType
  ): string[] {
    const characteristics: string[] = [];
    
    // Check for characteristics from other personas
    Object.entries(this.PERSONA_CHARACTERISTICS).forEach(([persona, traits]) => {
      if (persona === primaryPersona) return;
      
      // Check if any dimensions strongly align with other personas
      if (this.scoreInRange(scores.strategicAuthority, traits.authorityRange) > 0.8) {
        characteristics.push(`${persona} authority level`);
      }
      if (this.scoreInRange(scores.organizationalInfluence, traits.influenceRange) > 0.8) {
        characteristics.push(`${persona} influence style`);
      }
      if (this.scoreInRange(scores.implementationReadiness, traits.readinessRange) > 0.8) {
        characteristics.push(`${persona} implementation approach`);
      }
    });

    return characteristics.slice(0, 3); // Limit to top 3 secondary characteristics
  }

  /**
   * Generate human-readable reasoning for classification
   */
  private static generateClassificationReasoning(
    scores: DimensionScores,
    persona: PersonaType,
    profile: UserProfile
  ): string {
    const characteristics = this.PERSONA_CHARACTERISTICS[persona];
    const roleLevel = profile.professional.roleLevel || 'professional';
    const industry = profile.professional.industry || 'organization';

    const reasoningParts = [
      `Classified as ${persona} based on`,
      `strategic authority level of ${Math.round(scores.strategicAuthority)}%`,
      `and organizational influence of ${Math.round(scores.organizationalInfluence)}%.`
    ];

    // Add specific reasoning based on persona
    switch (persona) {
      case 'Strategic Architect':
        reasoningParts.push(
          `High scores across authority (${Math.round(scores.strategicAuthority)}%) and resources (${Math.round(scores.resourceAvailability)}%) indicate enterprise-wide decision-making capability.`
        );
        break;
      case 'Strategic Catalyst':
        reasoningParts.push(
          `Strong influence (${Math.round(scores.organizationalInfluence)}%) and implementation readiness (${Math.round(scores.implementationReadiness)}%) suggest change leadership potential.`
        );
        break;
      case 'Strategic Contributor':
        reasoningParts.push(
          `Moderate authority and influence levels indicate department-level implementation focus.`
        );
        break;
      case 'Strategic Explorer':
        reasoningParts.push(
          `High implementation readiness (${Math.round(scores.implementationReadiness)}%) with emerging authority suggests learning and development orientation.`
        );
        break;
      case 'Strategic Observer':
        reasoningParts.push(
          `Current scores suggest assessment and consultation approach would be most beneficial.`
        );
        break;
    }

    return reasoningParts.join(' ');
  }

  /**
   * Get persona characteristics for a given persona type
   */
  static getPersonaCharacteristics(persona: PersonaType): PersonaCharacteristics[string] | null {
    return this.PERSONA_CHARACTERISTICS[persona] || null;
  }

  /**
   * Get all available personas with their characteristics
   */
  static getAllPersonaCharacteristics(): PersonaCharacteristics {
    return { ...this.PERSONA_CHARACTERISTICS };
  }

  /**
   * Validate persona classification against business rules
   */
  static validateClassification(
    classification: PersonaClassification,
    userProfile: UserProfile
  ): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    // Check for inconsistencies
    const characteristics = this.PERSONA_CHARACTERISTICS[classification.primaryPersona];
    if (!characteristics) {
      return { isValid: false, warnings: ['Invalid persona type'] };
    }

    // Warn if confidence is low
    if (classification.confidenceScore < 0.7) {
      warnings.push('Low confidence in classification - consider additional assessment');
    }

    // Check role level consistency
    const roleLevel = userProfile.professional.roleLevel?.toLowerCase();
    if (classification.primaryPersona === 'Strategic Architect' && 
        roleLevel && !['ceo', 'cto', 'cfo', 'executive', 'director'].includes(roleLevel)) {
      warnings.push('Strategic Architect classification may not align with reported role level');
    }

    return { isValid: true, warnings };
  }
}