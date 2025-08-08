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
      session_id: 'demo-session',
      overall_score: 82,
      dimension_scores: {
        strategic_authority: 85,
        organizational_influence: 80,
        resource_availability: 85,
        implementation_readiness: 75,
        cultural_alignment: 80
      },
      persona_classification: {
        primary_persona: 'strategic_architect' as PersonaType,
        confidence_score: 0.88,
        secondary_characteristics: ['strategic_catalyst']
      },
      industry_insights: {
        sector_readiness: 78,
        regulatory_considerations: ['Financial regulations', 'Data privacy'],
        implementation_priorities: ['Risk management enhancement', 'Customer experience optimization']
      },
      recommendations: {
        program_recommendation: 'Strategic Advantage',
        next_steps: ['Develop comprehensive AI strategy', 'Build executive alignment'],
        timeline_suggestion: '12-18 months',
        resource_requirements: ['Executive sponsorship', 'Dedicated team', 'Technology investment']
      },
      curriculum_pathway: {
        pathway_id: 'strategic-architect-financial',
        foundation_modules: [],
        industry_modules: [],
        role_specific_modules: [],
        cultural_adaptation_modules: [],
        estimated_duration: {
          total_hours: 60,
          weekly_commitment: 5,
          completion_timeline: '12 weeks'
        },
        learning_objectives: [],
        success_metrics: [],
        prerequisites: [],
        optional_enhancements: []
      }
    };

    const industryContext = 'financial_services';
    const culturalContext = ['kenyan', 'english'];
    const automationOpportunities = [
      'Risk Assessment Automation',
      'Customer Service Enhancement',
      'Regulatory Compliance Monitoring',
      'Investment Decision Support'
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
      assessmentResults.persona_classification.primary_persona
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

    const baseAssessment: Omit<AssessmentResults, 'persona_classification'> = {
      session_id: 'persona-demo',
      overall_score: 75,
      dimension_scores: {
        strategic_authority: 70,
        organizational_influence: 75,
        resource_availability: 70,
        implementation_readiness: 80,
        cultural_alignment: 75
      },
      industry_insights: {
        sector_readiness: 75,
        regulatory_considerations: ['Industry standards'],
        implementation_priorities: ['Process optimization']
      },
      recommendations: {
        program_recommendation: 'Strategic Systems',
        next_steps: ['Assessment completion'],
        timeline_suggestion: '6-12 months',
        resource_requirements: ['Team alignment']
      },
      curriculum_pathway: {
        pathway_id: 'demo-path',
        foundation_modules: [],
        industry_modules: [],
        role_specific_modules: [],
        cultural_adaptation_modules: [],
        estimated_duration: {
          total_hours: 40,
          weekly_commitment: 4,
          completion_timeline: '10 weeks'
        },
        learning_objectives: [],
        success_metrics: [],
        prerequisites: [],
        optional_enhancements: []
      }
    };

    const personas: PersonaType[] = ['strategic_architect', 'strategic_catalyst', 'strategic_contributor', 'strategic_explorer', 'strategic_observer'];
    const automationOpportunity = ['Process Optimization'];

    personas.forEach(persona => {
      const assessmentResults: AssessmentResults = {
        ...baseAssessment,
        persona_classification: {
          primary_persona: persona,
          confidence_score: 0.85,
          secondary_characteristics: []
        }
      };

      const strategicInsights = this.strategicFramework.generateStrategicInsights(
        assessmentResults,
        'technology',
        ['strategic']
      );

      const automationFraming = this.valueEngine.frameAutomationWithinStrategicContext(
        aut