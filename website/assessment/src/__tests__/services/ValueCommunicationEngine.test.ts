import { ValueCommunicationEngine } from '../../services/ValueCommunicationEngine';
import { AssessmentResults, PersonaType } from '../../models/types';

describe('ValueCommunicationEngine', () => {
  let engine: ValueCommunicationEngine;
  let mockAssessmentResults: AssessmentResults;

  beforeEach(() => {
    engine = new ValueCommunicationEngine();
    
    mockAssessmentResults = {
      session_id: 'test-session',
      overall_score: 75,
      dimension_scores: {
        strategic_authority: 80,
        organizational_influence: 70,
        resource_availability: 75,
        implementation_readiness: 80,
        cultural_alignment: 85
      },
      persona_classification: {
        primary_persona: 'strategic_architect' as PersonaType,
        confidence_score: 0.85,
        secondary_characteristics: ['strategic_catalyst']
      },
      industry_insights: {
        sector_readiness: 75,
        regulatory_considerations: ['Data privacy compliance'],
        implementation_priorities: ['Strategic planning enhancement']
      },
      recommendations: {
        program_recommendation: 'Strategic Advantage',
        next_steps: ['Develop AI strategy'],
        timeline_suggestion: '6-12 months',
        resource_requirements: ['Executive sponsorship']
      },
      curriculum_pathway: {
        pathway_id: 'strategic-architect-path',
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
  });

  describe('generateStrategicValueCommunication', () => {
    it('should generate comprehensive strategic value communication framework', () => {
      const communication = engine.generateStrategicValueCommunication(
        mockAssessmentResults,
        'financial_services',
        ['Process Automation', 'Customer Service']
      );

      expect(communication).toHaveProperty('executive_summary');
      expect(communication).toHaveProperty('strategic_positioning_messages');
      expect(communication).toHaveProperty('competitive_advantage_narrative');
      expect(communication).toHaveProperty('transformation_story');
      expect(communication).toHaveProperty('roi_strategic_framework');
      expect(communication).toHaveProperty('automation_strategic_context');

      expect(communication.strategic_positioning_messages).toHaveLength(4);
      expect(communication.roi_strategic_framework).toHaveProperty('strategic_value_drivers');
      expect(communication.roi_strategic_framework).toHaveProperty('capability_building_metrics');
      expect(communication.roi_strategic_framework).toHaveProperty('competitive_advantage_indicators');
      expect(communication.roi_strategic_framework).toHaveProperty('transformation_milestones');
    });

    it('should emphasize strategic value over cost savings', () => {
      const communication = engine.generateStrategicValueCommunication(
        mockAssessmentResults,
        'manufacturing',
        ['Quality Control', 'Supply Chain']
      );

      expect(communication.executive_summary).toContain('Strategic Intelligence Amplification');
      expect(communication.executive_summary).toContain('competitive advantage');
      expect(communication.executive_summary).not.toContain('cost reduction');
      expect(communication.executive_summary).not.toContain('cost savings');
    });

    it('should include industry-specific strategic positioning', () => {
      const communication = engine.generateStrategicValueCommunication(
        mockAssessmentResults,
        'healthcare',
        ['Patient Management']
      );

      expect(communication.competitive_advantage_narrative).toContain('healthcare');
      expect(communication.roi_strategic_framework.strategic_value_drivers).toContain('Patient Outcome Optimization');
      expect(communication.roi_strategic_framework.competitive_advantage_indicators).toContain('Patient Outcome Improvement');
    });
  });

  describe('frameAutomationWithinStrategicContext', () => {
    it('should frame automation as strategic enablement rather than cost reduction', () => {
      const framed = engine.frameAutomationWithinStrategicContext(
        ['Customer Service', 'Data Processing'],
        'financial_services',
        'strategic_architect'
      );

      expect(framed).toHaveLength(2);
      expect(framed[0]).toHaveProperty('message_type', 'strategic_positioning');
      expect(framed[0].primary_message).toContain('competitive advantage');
      expect(framed[0].primary_message).not.toContain('cost');
      expect(framed[0].automation_context).toContain('foundation for');
      expect(framed[0].value_emphasis).toContain('competitive advantage');
    });

    it('should provide persona-specific value emphasis', () => {
      const architectFramed = engine.frameAutomationWithinStrategicContext(
        ['Process Optimization'],
        'technology',
        'strategic_architect'
      );

      const catalystFramed = engine.frameAutomationWithinStrategicContext(
        ['Process Optimization'],
        'technology',
        'strategic_catalyst'
      );

      expect(architectFramed[0].value_emphasis).toContain('Enterprise-wide');
      expect(catalystFramed[0].value_emphasis).toContain('Organizational capability');
    });

    it('should include strategic framing for each automation opportunity', () => {
      const framed = engine.frameAutomationWithinStrategicContext(
        ['Decision Support', 'Customer Experience', 'Process Management'],
        'professional_services',
        'strategic_contributor'
      );

      expect(framed[0].strategic_framing).toContain('Strategic Decision Enhancement');
      expect(framed[1].strategic_framing).toContain('Customer Experience Excellence');
      expect(framed[2].strategic_framing).toContain('Operational Strategic Foundation');
    });
  });

  describe('emphasizeStrategicPositioning', () => {
    it('should generate strategic positioning messages that emphasize competitive advantage', () => {
      const positioning = engine.emphasizeStrategicPositioning(
        mockAssessmentResults,
        'government'
      );

      expect(positioning).toHaveLength(2);
      expect(positioning[0]).toHaveProperty('message_type', 'strategic_positioning');
      expect(positioning[0].primary_message).toContain('Strategic Intelligence leader');
      expect(positioning[0].supporting_points).toContain('Develop proprietary AI capabilities that competitors cannot easily replicate');
      
      expect(positioning[1]).toHaveProperty('message_type', 'competitive_advantage');
      expect(positioning[1].primary_message).toContain('sustainable competitive advantages');
      expect(positioning[1].value_emphasis).toContain('competitive moats');
    });

    it('should position automation as strategic enabler', () => {
      const positioning = engine.emphasizeStrategicPositioning(
        mockAssessmentResults,
        'technology'
      );

      positioning.forEach(message => {
        expect(message.automation_context).toContain('strategic');
        expect(message.automation_context).not.toContain('cost');
        expect(message.strategic_framing).toContain('Strategic');
      });
    });
  });

  describe('buildOrganizationalTransformationFocus', () => {
    it('should focus on capability building rather than job displacement', () => {
      const transformation = engine.buildOrganizationalTransformationFocus(
        mockAssessmentResults,
        ['kenyan', 'english']
      );

      expect(transformation).toHaveLength(2);
      expect(transformation[0]).toHaveProperty('message_type', 'organizational_transformation');
      expect(transformation[0].primary_message).toContain('Strategic Intelligence powerhouse');
      expect(transformation[0].supporting_points).toContain('Build organizational AI collaboration capabilities that enhance human potential');
      expect(transformation[0].automation_context).toContain('enabling focus on strategic capability development');
    });

    it('should emphasize innovation and strategic agility', () => {
      const transformation = engine.buildOrganizationalTransformationFocus(
        mockAssessmentResults,
        ['strategic']
      );

      const innovationMessage = transformation.find(t => t.primary_message.includes('innovation'));
      expect(innovationMessage).toBeDefined();
      expect(innovationMessage?.supporting_points).toContain('Enhance innovation speed through AI-augmented creative processes');
      expect(innovationMessage?.value_emphasis).toContain('Innovation velocity');
    });
  });

  describe('developStrategicROICommunication', () => {
    it('should emphasize strategic value over cost savings', () => {
      const roiCommunication = engine.developStrategicROICommunication(
        mockAssessmentResults,
        'financial_services',
        '18 months'
      );

      expect(roiCommunication).toHaveProperty('message_type', 'roi_strategic');
      expect(roiCommunication.primary_message).toContain('strategic ROI');
      expect(roiCommunication.primary_message).toContain('capability building');
      expect(roiCommunication.primary_message).toContain('competitive advantage');
      expect(roiCommunication.primary_message).not.toContain('cost savings');
      expect(roiCommunication.value_emphasis).toContain('strategic value creation over short-term cost reduction');
    });

    it('should include capability building and competitive advantage metrics', () => {
      const roiCommunication = engine.developStrategicROICommunication(
        mockAssessmentResults,
        'manufacturing'
      );

      expect(roiCommunication.supporting_points).toContain('Develop proprietary AI-human collaboration models that competitors cannot easily replicate');
      expect(roiCommunication.supporting_points).toContain('Create market differentiation through superior strategic intelligence and decision-making');
      expect(roiCommunication.implementation_narrative).toContain('capability building journey');
    });

    it('should adapt timeframe messaging', () => {
      const shortTerm = engine.developStrategicROICommunication(
        mockAssessmentResults,
        'technology',
        '6 months'
      );

      const longTerm = engine.developStrategicROICommunication(
        mockAssessmentResults,
        'technology',
        '24 months'
      );

      expect(shortTerm.primary_message).toContain('6 months');
      expect(longTerm.primary_message).toContain('24 months');
      expect(shortTerm.implementation_narrative).toContain('6 months');
      expect(longTerm.implementation_narrative).toContain('24 months');
    });
  });

  describe('industry-specific adaptations', () => {
    it('should provide industry-specific strategic value drivers', () => {
      const financialCommunication = engine.generateStrategicValueCommunication(
        mockAssessmentResults,
        'financial_services',
        ['Risk Assessment']
      );

      const healthcareCommunication = engine.generateStrategicValueCommunication(
        mockAssessmentResults,
        'healthcare',
        ['Patient Care']
      );

      expect(financialCommunication.roi_strategic_framework.strategic_value_drivers).toContain('Risk Intelligence Excellence');
      expect(healthcareCommunication.roi_strategic_framework.strategic_value_drivers).toContain('Patient Outcome Optimization');
    });

    it('should adapt competitive advantage narratives by industry', () => {
      const govCommunication = engine.generateStrategicValueCommunication(
        mockAssessmentResults,
        'government',
        ['Public Service']
      );

      const techCommunication = engine.generateStrategicValueCommunication(
        mockAssessmentResults,
        'technology',
        ['Product Development']
      );

      expect(govCommunication.competitive_advantage_narrative).toContain('Service delivery excellence');
      expect(techCommunication.competitive_advantage_narrative).toContain('Innovation velocity');
    });
  });

  describe('persona-specific messaging', () => {
    it('should adapt executive summary based on persona', () => {
      const architectResults = { 
        ...mockAssessmentResults,
        persona_classification: {
          ...mockAssessmentResults.persona_classification,
          primary_persona: 'strategic_architect' as PersonaType
        }
      };

      const explorerResults = { 
        ...mockAssessmentResults,
        persona_classification: {
          ...mockAssessmentResults.persona_classification,
          primary_persona: 'strategic_explorer' as PersonaType
        }
      };

      const architectCommunication = engine.generateStrategicValueCommunication(
        architectResults,
        'professional_services',
        ['Client Management']
      );

      const explorerCommunication = engine.generateStrategicValueCommunication(
        explorerResults,
        'professional_services',
        ['Client Management']
      );

      expect(architectCommunication.executive_summary).toContain('strategic architect');
      expect(architectCommunication.executive_summary).toContain('enterprise-wide transformation');
      expect(explorerCommunication.executive_summary).toContain('strategic explorer');
      expect(explorerCommunication.executive_summary).toContain('develop capabilities');
    });
  });

  describe('strategic themes consistency', () => {
    it('should consistently emphasize strategic intelligence amplification', () => {
      const communication = engine.generateStrategicValueCommunication(
        mockAssessmentResults,
        'manufacturing',
        ['Production Planning', 'Quality Control']
      );

      expect(communication.executive_summary).toContain('Strategic Intelligence Amplification');
      expect(communication.transformation_story).toContain('strategic intelligence');
      expect(communication.automation_strategic_context).toContain('strategic');
    });

    it('should maintain competitive advantage focus throughout', () => {
      const communication = engine.generateStrategicValueCommunication(
        mockAssessmentResults,
        'financial_services',
        ['Risk Management']
      );

      const hasCompetitiveFocus = communication.strategic_positioning_messages.some(
        message => message.primary_message.includes('competitive advantage') || 
                  message.value_emphasis.includes('competitive')
      );

      expect(hasCompetitiveFocus).toBe(true);
      expect(communication.competitive_advantage_narrative).toContain('competitive advantages');
      expect(communication.roi_strategic_framework.competitive_advantage_indicators.length).toBeGreaterThan(0);
    });

    it('should avoid cost-focused language throughout', () => {
      const communication = engine.generateStrategicValueCommunication(
        mockAssessmentResults,
        'healthcare',
        ['Patient Management', 'Administrative Tasks']
      );

      // Check that cost-focused language is avoided
      expect(communication.executive_summary).not.toContain('cost reduction');
      expect(communication.executive_summary).not.toContain('cost savings');
      expect(communication.competitive_advantage_narrative).not.toContain('reduce costs');
      expect(communication.transformation_story).not.toContain('cost cutting');
      
      // Ensure strategic language is used instead
      expect(communication.executive_summary).toContain('competitive advantage');
      expect(communication.transformation_story).toContain('strategic');
    });
  });
});