/**
 * Example usage of the ContextualRecommendationEngine
 * This demonstrates how to use the contextual recommendation system
 * to generate culturally sensitive, market-aware recommendations
 */

import { ContextualRecommendationEngine } from '../services/ContextualRecommendationEngine';
import { CulturalAdapter } from '../services/CulturalAdapter';
import { LocalizationEngine } from '../services/LocalizationEngine';
import { UserContext, AssessmentResults } from '../models/types';

export class ContextualRecommendationExample {
  private contextualEngine: ContextualRecommendationEngine;

  constructor() {
    const culturalAdapter = new CulturalAdapter();
    const localizationEngine = new LocalizationEngine(culturalAdapter);
    this.contextualEngine = new ContextualRecommendationEngine(culturalAdapter, localizationEngine);
  }

  /**
   * Example: Generate recommendations for a Kenyan financial services company
   */
  async generateKenyanFinancialRecommendations() {
    const userContext: UserContext = {
      userId: 'example-user',
      geographicRegion: 'Kenya',
      culturalContext: ['east-africa-kenya'],
      industry: 'financial-services',
      organizationSize: 'medium',
      roleLevel: 'senior-management'
    };

    const assessmentResults: AssessmentResults = {
      sessionId: 'example-session',
      overallScore: 0.75,
      dimensionScores: {
        strategicAuthority: 0.80,
        organizationalInfluence: 0.75,
        resourceAvailability: 0.70,
        implementationReadiness: 0.65,
        culturalAlignment: 0.85
      },
      personaClassification: {
        primaryPersona: 'strategic-catalyst',
        confidenceScore: 0.85,
        secondaryCharacteristics: ['change-leadership', 'technical-awareness']
      },
      industryInsights: {
        sectorReadiness: 0.70,
        regulatoryConsiderations: ['CBK compliance', 'Data protection'],
        implementationPriorities: ['Customer analytics', 'Risk modeling']
      },
      recommendations: {
        programRecommendation: 'Strategic Systems Program',
        nextSteps: ['Infrastructure assessment', 'Team training'],
        timelineSuggestion: '6-12 months',
        resourceRequirements: ['Technical team', 'Training budget']
      },
      curriculumPathway: {
        pathwayId: 'financial-ai-kenya',
        foundationModules: [],
        industryModules: [],
        roleSpecificModules: [],
        culturalAdaptationModules: [],
        estimatedDuration: {
          totalHours: 120,
          weeklyCommitment: 8,
          completionTimeline: '15 weeks'
        },
        learningObjectives: [],
        successMetrics: [],
        prerequisites: [],
        optionalEnhancements: []
      }
    };

    // Generate contextual recommendations
    const recommendations = this.contextualEngine.generateContextualRecommendations(
      assessmentResults,
      userContext
    );

    console.log('Generated Contextual Recommendations:');
    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.title}`);
      console.log(`   Priority: ${rec.priority}`);
      console.log(`   Category: ${rec.category}`);
      console.log(`   Feasibility Score: ${rec.feasibilityScore}`);
      console.log(`   Cultural Considerations: ${rec.culturalConsiderations.join(', ')}`);
    });

    return recommendations;
  }

  /**
   * Example: Assess local market conditions for different regions
   */
  async demonstrateMarketAssessment() {
    const regions = ['Kenya', 'Nigeria', 'South Africa'];
    
    console.log('\n=== Market Condition Assessment ===');
    
    for (const region of regions) {
      const userContext: UserContext = {
        userId: 'market-analysis',
        geographicRegion: region,
        culturalContext: [this.mapRegionToCulturalContext(region)],
        industry: 'technology'
      };

      const marketAnalysis = this.contextualEngine.assessLocalMarketConditions(
        userContext,
        'technology'
      );

      console.log(`\n${region} Market Analysis:`);
      console.log(`  Market Readiness: ${Math.round(marketAnalysis.marketReadiness * 100)}%`);
      console.log(`  Competitive Advantage: ${Math.round(marketAnalysis.competitiveAdvantage * 100)}%`);
      console.log(`  Implementation Risk: ${Math.round(marketAnalysis.implementationRisk * 100)}%`);
      console.log(`  Strategy: ${marketAnalysis.recommendedStrategy}`);
      console.log(`  Opportunities: ${marketAnalysis.opportunities?.slice(0, 2).join(', ') || 'None identified'}`);
    }
  }

  /**
   * Example: Generate stakeholder engagement framework
   */
  async demonstrateStakeholderEngagement() {
    const userContext: UserContext = {
      userId: 'stakeholder-demo',
      geographicRegion: 'Kenya',
      culturalContext: ['east-africa-kenya'],
      industry: 'manufacturing'
    };

    const engagementFramework = this.contextualEngine.generateStakeholderEngagementFramework(
      userContext,
      'executive'
    );

    console.log('\n=== Stakeholder Engagement Framework ===');
    console.log(`Approach: ${engagementFramework.approach}`);
    console.log(`Communication Style: ${engagementFramework.communicationStyle}`);
    console.log(`Key Messages:`);
    engagementFramework.keyMessages.forEach(message => {
      console.log(`  - ${message}`);
    });
    console.log(`Cultural Protocols:`);
    engagementFramework.culturalProtocols.forEach(protocol => {
      console.log(`  - ${protocol}`);
    });
  }

  /**
   * Example: Assess technology infrastructure
   */
  async demonstrateInfrastructureAssessment() {
    const userContext: UserContext = {
      userId: 'infrastructure-demo',
      geographicRegion: 'Kenya',
      culturalContext: ['east-africa-kenya'],
      industry: 'healthcare'
    };

    const requiredCapabilities = [
      'Real-time data processing',
      'Secure patient data storage',
      'Mobile device integration'
    ];

    const infrastructureAssessment = this.contextualEngine.assessTechnologyInfrastructure(
      userContext,
      requiredCapabilities
    );

    console.log('\n=== Technology Infrastructure Assessment ===');
    console.log(`Overall Readiness: ${Math.round(infrastructureAssessment.overallReadiness * 100)}%`);
    console.log(`Critical Gaps:`);
    infrastructureAssessment.criticalGaps.forEach(gap => {
      console.log(`  - ${gap}`);
    });
    console.log(`Investment Requirements:`);
    console.log(`  Immediate: ${infrastructureAssessment.investmentRequirements.immediate.join(', ')}`);
    console.log(`  Short-term: ${infrastructureAssessment.investmentRequirements.shortTerm.join(', ')}`);
  }

  private mapRegionToCulturalContext(region: string): string {
    const mapping: Record<string, string> = {
      'Kenya': 'east-africa-kenya',
      'Nigeria': 'west-africa',
      'South Africa': 'southern-africa'
    };
    return mapping[region] || 'east-africa-kenya';
  }
}

// Example usage
export async function runContextualRecommendationExamples() {
  const example = new ContextualRecommendationExample();
  
  console.log('=== Contextual Recommendation Engine Examples ===\n');
  
  // Generate recommendations for Kenyan financial services
  await example.generateKenyanFinancialRecommendations();
  
  // Demonstrate market assessment across regions
  await example.demonstrateMarketAssessment();
  
  // Show stakeholder engagement framework
  await example.demonstrateStakeholderEngagement();
  
  // Demonstrate infrastructure assessment
  await example.demonstrateInfrastructureAssessment();
}