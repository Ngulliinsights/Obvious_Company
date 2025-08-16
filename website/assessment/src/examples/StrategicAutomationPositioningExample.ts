import { StrategicIntelligenceFramework } from '../services/StrategicIntelligenceFramework';
import { ValueCommunicationEngine } from '../services/ValueCommunicationEngine';
import { AssessmentResults, PersonaType } from '../models/types';

/**
 * Example demonstrating how to use the Strategic Intelligence Framework
 * and Value Communication Engine together to position automation within
 * strategic context rather than cost reduction.
 */

export class StrategicAutomationPositioningExample {
  private strategicFramework: StrategicIntelligenceFramework;
  private valueEngine: ValueCommunicationEngine;

  constructor() {
    this.strategicFramework = new StrategicIntelligenceFramework();
    this.valueEngine = new ValueCommunicationEngine();
  }

  /**
   * Demonstrate complete strategic positioning of automation opportunities
   */
  public demonstrateStrategicPositioning(): void {
    console.log('=== Strategic Automation Positioning Example ===\n');

    // Sample assessment results for a Strategic Architect in Financial Services
    const assessmentResults: AssessmentResults = {
      sessionId: 'demo-session',
      overallScore: 82,
      dimensionScores: {
        strategicAuthority: 85,
        organizationalInfluence: 80,
        resourceAvailability: 85,
        implementationReadiness: 75,
        culturalAlignment: 80,
      },
      personaClassification: {
        primaryPersona: 'Strategic Architect' as PersonaType,
        confidenceScore: 0.88,
        secondaryCharacteristics: ['Strategic Catalyst'],
      },
      industryInsights: {
        sectorReadiness: 78,
        regulatoryConsiderations: ['Financial regulations', 'Data privacy'],
        implementationPriorities: [
          'Risk management enhancement',
          'Customer experience optimization',
        ],
      },
      recommendations: {
        programRecommendation: 'Strategic Advantage',
        nextSteps: ['Develop comprehensive AI strategy', 'Build executive alignment'],
        timelineSuggestion: '12-18 months',
        resourceRequirements: ['Executive sponsorship', 'Dedicated team', 'Technology investment'],
      },
      curriculumPathway: {
        pathwayId: 'strategic-architect-financial',
        foundationModules: [],
        industryModules: [],
        roleSpecificModules: [],
        culturalAdaptationModules: [],
        estimatedDuration: {
          totalHours: 60,
          weeklyCommitment: 5,
          completionTimeline: '12 weeks',
        },
        learningObjectives: [],
        successMetrics: [],
        prerequisites: [],
        optionalEnhancements: [],
      },
    };

    const industryContext = 'financial_services';
    const culturalContext = ['kenyan', 'english'];
    const automationOpportunities = [
      'Risk Assessment Automation',
      'Customer Service Enhancement',
      'Regulatory Compliance Monitoring',
      'Investment Decision Support',
    ];

    // Step 1: Generate Strategic Intelligence Insights
    console.log('1. STRATEGIC INTELLIGENCE FRAMEWORK INSIGHTS:\n');
    const strategicInsights = this.strategicFramework.generateStrategicInsights(
      assessmentResults,
      industryContext,
      culturalContext
    );

    console.log('Strategic Positioning:');
    strategicInsights.strategic_positioning.forEach((insight, index) => {
      console.log(`  ${index + 1}. ${insight.title}`);
      console.log(`     ${insight.description}`);
      console.log(`     Implementation: ${insight.implementation_approach}\n`);
    });

    console.log('Strategic Value Proposition:');
    console.log(`  ${strategicInsights.strategic_value_proposition}\n`);

    // Step 2: Position Automation Strategically
    console.log('2. STRATEGIC AUTOMATION POSITIONING:\n');
    const strategicallyPositioned = this.strategicFramework.positionAutomationStrategically(
      automationOpportunities,
      strategicInsights
    );

    strategicallyPositioned.forEach((positioned, index) => {
      console.log(`  ${automationOpportunities[index]}:`);
      console.log(`    Strategic Framing: ${positioned.title}`);
      console.log(`    Value Creation: ${positioned.strategic_value}`);
      console.log(`    Automation Context: ${positioned.automation_context}\n`);
    });

    // Step 3: Generate Value Communication Framework
    console.log('3. STRATEGIC VALUE COMMUNICATION:\n');
    const valueCommunication = this.valueEngine.generateStrategicValueCommunication(
      assessmentResults,
      industryContext,
      automationOpportunities
    );

    console.log('Executive Summary:');
    console.log(`  ${valueCommunication.executive_summary}\n`);

    console.log('Competitive Advantage Narrative:');
    console.log(`  ${valueCommunication.competitive_advantage_narrative}\n`);

    console.log('Strategic ROI Framework:');
    console.log('  Strategic Value Drivers:');
    valueCommunication.roi_strategic_framework.strategic_value_drivers.forEach(driver => {
      console.log(`    • ${driver}`);
    });
    console.log('\n  Capability Building Metrics:');
    valueCommunication.roi_strategic_framework.capability_building_metrics.forEach(metric => {
      console.log(`    • ${metric}`);
    });

    // Step 4: Frame Automation within Strategic Context
    console.log('\n4. AUTOMATION STRATEGIC FRAMING:\n');
    const automationFraming = this.valueEngine.frameAutomationWithinStrategicContext(
      automationOpportunities,
      industryContext,
      assessmentResults.personaClassification.primaryPersona
    );

    automationFraming.forEach((framing, index) => {
      console.log(`  ${automationOpportunities[index]}:`);
      console.log(`    Message: ${framing.primary_message}`);
      console.log(`    Strategic Framing: ${framing.strategic_framing}`);
      console.log(`    Value Emphasis: ${framing.value_emphasis}`);
      console.log(`    Implementation: ${framing.implementation_narrative}\n`);
    });

    // Step 5: Demonstrate Human-AI Collaboration Emphasis
    console.log('5. HUMAN-AI COLLABORATION EMPHASIS:\n');
    const collaborationInsights = this.strategicFramework.emphasizeHumanAICollaboration(
      assessmentResults,
      industryContext
    );

    collaborationInsights.forEach(insight => {
      console.log(`  ${insight.title}:`);
      console.log(`    ${insight.description}`);
      console.log(`    Strategic Value: ${insight.strategic_value}\n`);
    });

    console.log('=== Key Principles Demonstrated ===');
    console.log('✓ Automation positioned as strategic enablement, not cost reduction');
    console.log('✓ Human-AI collaboration emphasized over replacement');
    console.log('✓ Competitive advantage focus over operational efficiency');
    console.log('✓ Strategic intelligence amplification over task automation');
    console.log('✓ Organizational capability building over job displacement');
    console.log('✓ Cultural sensitivity and change management integration');
    console.log('✓ Industry-specific strategic positioning and value creation');
  }

  /**
   * Demonstrate persona-specific strategic positioning
   */
  public demonstratePersonaSpecificPositioning(): void {
    console.log('\n=== Persona-Specific Strategic Positioning ===\n');

    const baseAssessment: Omit<AssessmentResults, 'personaClassification'> = {
      sessionId: 'persona-demo',
      overallScore: 75,
      dimensionScores: {
        strategicAuthority: 70,
        organizationalInfluence: 75,
        resourceAvailability: 70,
        implementationReadiness: 80,
        culturalAlignment: 75,
      },
      industryInsights: {
        sectorReadiness: 75,
        regulatoryConsiderations: ['Industry standards'],
        implementationPriorities: ['Process optimization'],
      },
      recommendations: {
        programRecommendation: 'Strategic Systems',
        nextSteps: ['Assessment completion'],
        timelineSuggestion: '6-12 months',
        resourceRequirements: ['Team alignment'],
      },
      curriculumPathway: {
        pathwayId: 'demo-path',
        foundationModules: [],
        industryModules: [],
        roleSpecificModules: [],
        culturalAdaptationModules: [],
        estimatedDuration: {
          totalHours: 40,
          weeklyCommitment: 4,
          completionTimeline: '10 weeks',
        },
        learningObjectives: [],
        successMetrics: [],
        prerequisites: [],
        optionalEnhancements: [],
      },
    };

    const personas: PersonaType[] = [
      'Strategic Architect',
      'Strategic Catalyst',
      'Strategic Contributor',
      'Strategic Explorer',
      'Strategic Observer',
    ];
    const automationOpportunity = ['Process Optimization'];

    personas.forEach(persona => {
      const assessmentResults: AssessmentResults = {
        ...baseAssessment,
        personaClassification: {
          primaryPersona: persona,
          confidenceScore: 0.85,
          secondaryCharacteristics: [],
        },
      };

      const strategicInsights = this.strategicFramework.generateStrategicInsights(
        assessmentResults,
        'technology',
        ['strategic']
      );

      const automationFraming = this.valueEngine.frameAutomationWithinStrategicContext(
        automationOpportunity,
        'technology',
        persona
      );

      // Use the automation framing results
      console.log(`\nStrategic Positioning for ${persona}:`);
      automationFraming.forEach((framing, index) => {
        console.log(`  ${automationOpportunity[index]}:`);
        console.log(`    Message: ${framing.primary_message}`);
        console.log(`    Strategic Framing: ${framing.strategic_framing}`);
        console.log(`    Value Emphasis: ${framing.value_emphasis}`);
        console.log(`    Implementation: ${framing.implementation_narrative}\n`);
      });

      // Use the strategic insights
      console.log('Strategic Insights:');
      strategicInsights.strategic_positioning.forEach((insight: any, index: number) => {
        console.log(`  ${index + 1}. ${insight.title}`);
        console.log(`     ${insight.description}\n`);
      });
    });
  }
}
