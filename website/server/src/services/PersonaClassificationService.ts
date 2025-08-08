/**
 * Persona Classification Service
 * Implements the five strategic personas framework
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { 
  PersonaType, 
  AssessmentResponse, 
  AssessmentResults,
  UserProfile 
} from '../types/assessment';

export interface PersonaClassification {
  primary_persona: PersonaType;
  confidence_score: number;
  secondary_characteristics: string[];
  persona_description: string;
}

export class PersonaClassificationService {
  
  /**
   * Classify user into strategic persona based on responses
   */
  async classifyPersona(
    responses: AssessmentResponse[],
    userProfile?: Partial<UserProfile>
  ): Promise<PersonaClassification> {
    
    // Calculate dimension scores
    const dimensionScores = this.calculateDimensionScores(responses);
    
    // Apply persona classification algorithm
    const persona = this.determinePersona(dimensionScores, userProfile);
    
    return persona;
  }

  /**
   * Calculate scores for each assessment dimension
   */
  private calculateDimensionScores(responses: AssessmentResponse[]): {
    strategic_authority: number;
    organizational_influence: number;
    resource_availability: number;
    implementation_readiness: number;
    cultural_alignment: number;
  } {
    const dimensionTotals = {
      strategic_authority: { total: 0, count: 0 },
      organizational_influence: { total: 0, count: 0 },
      resource_availability: { total: 0, count: 0 },
      implementation_readiness: { total: 0, count: 0 },
      cultural_alignment: { total: 0, count: 0 }
    };

    // Process each response
    responses.forEach(response => {
      const dimension = this.getResponseDimension(response.question_id);
      const score = this.normalizeResponseValue(response.response_value);
      
      if (dimension && dimensionTotals[dimension]) {
        dimensionTotals[dimension].total += score;
        dimensionTotals[dimension].count += 1;
      }
    });

    // Calculate averages
    return {
      strategic_authority: this.calculateAverage(dimensionTotals.strategic_authority),
      organizational_influence: this.calculateAverage(dimensionTotals.organizational_influence),
      resource_availability: this.calculateAverage(dimensionTotals.resource_availability),
      implementation_readiness: this.calculateAverage(dimensionTotals.implementation_readiness),
      cultural_alignment: this.calculateAverage(dimensionTotals.cultural_alignment)
    };
  }

  /**
   * Determine persona based on dimension scores
   */
  private determinePersona(
    dimensionScores: any,
    userProfile?: Partial<UserProfile>
  ): PersonaClassification {
    
    const { strategic_authority, organizational_influence, resource_availability, implementation_readiness } = dimensionScores;
    
    // Strategic Architect: High authority, high resources, strategic focus
    if (strategic_authority >= 8 && resource_availability >= 7 && organizational_influence >= 8) {
      return {
        primary_persona: PersonaType.STRATEGIC_ARCHITECT,
        confidence_score: this.calculateConfidence([strategic_authority, resource_availability, organizational_influence]),
        secondary_characteristics: this.getSecondaryCharacteristics(dimensionScores, PersonaType.STRATEGIC_ARCHITECT),
        persona_description: "C-suite executive with enterprise-wide authority and significant investment capacity. Focused on strategic transformation and competitive advantage."
      };
    }

    // Strategic Catalyst: High influence, good readiness, change leadership
    if (organizational_influence >= 7 && implementation_readiness >= 7 && strategic_authority >= 6) {
      return {
        primary_persona: PersonaType.STRATEGIC_CATALYST,
        confidence_score: this.calculateConfidence([organizational_influence, implementation_readiness, strategic_authority]),
        secondary_characteristics: this.getSecondaryCharacteristics(dimensionScores, PersonaType.STRATEGIC_CATALYST),
        persona_description: "Senior leader with significant influence and change leadership capability. Drives AI adoption across departments."
      };
    }

    // Strategic Contributor: Moderate authority, tactical focus, implementation-oriented
    if (strategic_authority >= 4 && strategic_authority < 7 && implementation_readiness >= 6) {
      return {
        primary_persona: PersonaType.STRATEGIC_CONTRIBUTOR,
        confidence_score: this.calculateConfidence([strategic_authority, implementation_readiness]),
        secondary_characteristics: this.getSecondaryCharacteristics(dimensionScores, PersonaType.STRATEGIC_CONTRIBUTOR),
        persona_description: "Department leader with tactical implementation focus. Manages specific AI initiatives within defined scope."
      };
    }

    // Strategic Explorer: Learning-oriented, emerging leadership, development potential
    if (implementation_readiness >= 5 && strategic_authority >= 3 && strategic_authority < 6) {
      return {
        primary_persona: PersonaType.STRATEGIC_EXPLORER,
        confidence_score: this.calculateConfidence([implementation_readiness, strategic_authority]),
        secondary_characteristics: this.getSecondaryCharacteristics(dimensionScores, PersonaType.STRATEGIC_EXPLORER),
        persona_description: "Emerging leader with development potential. Actively learning about AI applications and building capabilities."
      };
    }

    // Strategic Observer: Lower authority, assessment-focused, consultation needs
    return {
      primary_persona: PersonaType.STRATEGIC_OBSERVER,
      confidence_score: this.calculateConfidence([strategic_authority, organizational_influence]),
      secondary_characteristics: this.getSecondaryCharacteristics(dimensionScores, PersonaType.STRATEGIC_OBSERVER),
      persona_description: "Functional specialist seeking to understand AI implications. Benefits from assessment-based consultation and guidance."
    };
  }

  /**
   * Get secondary characteristics for a persona
   */
  private getSecondaryCharacteristics(dimensionScores: any, primaryPersona: PersonaType): string[] {
    const characteristics: string[] = [];
    
    // Add characteristics based on dimension scores
    if (dimensionScores.cultural_alignment >= 7) {
      characteristics.push("culturally_adaptive");
    }
    
    if (dimensionScores.resource_availability >= 8) {
      characteristics.push("well_resourced");
    }
    
    if (dimensionScores.implementation_readiness >= 8) {
      characteristics.push("implementation_ready");
    }
    
    if (dimensionScores.organizational_influence >= 8) {
      characteristics.push("high_influence");
    }

    // Add persona-specific characteristics
    switch (primaryPersona) {
      case PersonaType.STRATEGIC_ARCHITECT:
        characteristics.push("enterprise_focused", "transformation_leader");
        break;
      case PersonaType.STRATEGIC_CATALYST:
        characteristics.push("change_agent", "cross_functional");
        break;
      case PersonaType.STRATEGIC_CONTRIBUTOR:
        characteristics.push("tactical_implementer", "department_focused");
        break;
      case PersonaType.STRATEGIC_EXPLORER:
        characteristics.push("learning_oriented", "growth_potential");
        break;
      case PersonaType.STRATEGIC_OBSERVER:
        characteristics.push("assessment_focused", "guidance_seeking");
        break;
    }

    return characteristics;
  }

  /**
   * Calculate confidence score for persona classification
   */
  private calculateConfidence(scores: number[]): number {
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Higher confidence when scores are high and consistent (low variance)
    const baseConfidence = Math.min(average / 10, 1);
    const consistencyBonus = Math.max(0, (2 - standardDeviation) / 2);
    
    return Math.min(baseConfidence + (consistencyBonus * 0.2), 1);
  }

  /**
   * Get the dimension that a question measures
   */
  private getResponseDimension(questionId: string): keyof typeof this.calculateDimensionScores | null {
    // This would typically be stored in the database with the question
    // For now, we'll use a simple mapping based on question patterns
    // In a real implementation, this would be retrieved from the question metadata
    
    // This is a simplified mapping - in practice, this would be stored with each question
    const dimensionMap: { [key: string]: keyof typeof this.calculateDimensionScores } = {
      // These would be actual question IDs from the database
    };
    
    return dimensionMap[questionId] || 'strategic_authority';
  }

  /**
   * Normalize response value to 0-10 scale
   */
  private normalizeResponseValue(responseValue: any): number {
    if (typeof responseValue === 'number') {
      return Math.max(0, Math.min(10, responseValue));
    }
    
    if (typeof responseValue === 'string') {
      // Map string responses to numeric values
      const stringMap: { [key: string]: number } = {
        'decision_maker': 10,
        'influencer': 7,
        'contributor': 5,
        'observer': 3,
        'strategic_analysis': 8,
        'pilot_project': 6,
        'competitive_research': 4,
        'expert_consultation': 7,
        'hierarchical': 8,
        'collaborative': 6,
        'agile': 7,
        'data_driven': 9,
        'research_first': 7,
        'hands_on': 8,
        'peer_consultation': 5,
        'expert_guidance': 6
      };
      
      return stringMap[responseValue] || 5;
    }
    
    return 5; // Default middle value
  }

  /**
   * Calculate average from total and count
   */
  private calculateAverage(data: { total: number; count: number }): number {
    return data.count > 0 ? data.total / data.count : 0;
  }

  /**
   * Get service tier recommendation based on persona
   */
  getServiceTierRecommendation(persona: PersonaType, resourceScore: number): {
    tier: string;
    investment_range: string;
    rationale: string;
  } {
    switch (persona) {
      case PersonaType.STRATEGIC_ARCHITECT:
        return {
          tier: "Strategic Advantage",
          investment_range: "$50K-$75K",
          rationale: "Enterprise-wide transformation requires comprehensive strategic guidance and implementation support."
        };
        
      case PersonaType.STRATEGIC_CATALYST:
        if (resourceScore >= 7) {
          return {
            tier: "Strategic Systems",
            investment_range: "$25K-$40K",
            rationale: "Cross-functional leadership role benefits from systematic approach to AI integration."
          };
        } else {
          return {
            tier: "Strategic Clarity",
            investment_range: "$10K-$15K",
            rationale: "Build foundational understanding before scaling to larger initiatives."
          };
        }
        
      case PersonaType.STRATEGIC_CONTRIBUTOR:
        return {
          tier: "Strategic Clarity",
          investment_range: "$10K-$15K",
          rationale: "Tactical implementation focus aligns with foundational strategic clarity program."
        };
        
      case PersonaType.STRATEGIC_EXPLORER:
        return {
          tier: "Strategic Clarity",
          investment_range: "$10K-$15K",
          rationale: "Learning-oriented approach benefits from structured foundational program."
        };
        
      case PersonaType.STRATEGIC_OBSERVER:
        return {
          tier: "Assessment Consultation",
          investment_range: "$2K-$5K",
          rationale: "Assessment-based consultation provides targeted guidance for specific needs."
        };
        
      default:
        return {
          tier: "Strategic Clarity",
          investment_range: "$10K-$15K",
          rationale: "Foundational program provides comprehensive introduction to strategic AI integration."
        };
    }
  }
}