import { StrategicIntelligenceFramework } from '../../services/StrategicIntelligenceFramework';
import { AssessmentResults, PersonaType } from '../../models/types';

describe('StrategicIntelligenceFramework', () => {
  let framework: StrategicIntelligenceFramework;
  let mockAssessmentResults: AssessmentResults;

  beforeEach(() => {
    framework = new StrategicIntelligenceFramework();
    
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

  describe('generateStrategicInsights', () => {
    it('should generate comprehensive strategic insights', () => {
      const insights = framework.generateStrategicInsights(
        mockAssessmentResults,
        'financial_services',
        ['kenyan', 'english']
      );

      expect(insights).toHaveProperty('strategic_positioning');
      expect(insights).toHaveProperty('collaboration_opportunities');
      expect(insights).toHaveProperty('decision_enhancement_areas');
      expect(insights).toHaveProperty('change_management_considerations');
      expect(insights).toHaveProperty('cultural_adaptation_factors');
      expect(insights).toHaveProperty('strategic_value_proposition');

      expect(insights.strategic_positioning).toHaveLength(2);
      expect(insights.strategic_positioning[0]).toHaveProperty('category', 'strategic_positioning');
      expect(insights.strategic_positioning[0]).toHaveProperty('title');
      expect(insights.strategic_positioning[0]).toHaveProperty('description');
      expect(insights.strategic_positioning[0]).toHaveProperty('implementation_approach');
      expect(insights.strategic_positioning[0]).toHaveProperty('strategic_value');
    });

    it('should include strategic intelligence amplification positioning', () => {
      const insights = framework.generateStrategicInsights(
        mockAssessmentResults,
        'financial_services',
        ['kenyan']
      );

      const intelligenceAmplification = insights.strategic_positioning.find(
        insight => insight.title.includes('Strategic Intelligence Amplification')
      );

      expect(intelligenceAmplification).toBeDefined();
      expect(intelligenceAmplification?.description).toContain('strategic intelligence amplifier');
      expect(intelligenceAmplification?.description).toContain('human decision-making capabilities');
    });

    it('should generate persona-specific value propositions', () => {
      const insights = framework.generateStrategicInsights(
        mockAssessmentResults,
        'financial_services',
        ['kenyan']
      );

      expect(insights.strategic_value_proposition).toContain('Strategic Intelligence Amplification');
      expect(insights.strategic_value_proposition).toContain('enterprise-wide AI capabilities');
    });
  });

  describe('positionAutomationStrategically', () => {
    it('should position automation within strategic context', () => {
      const automationOpportunities = ['Process Optimization', 'Decision Support'];
      const mockStrategicContext = {
        strategic_positioning: [],
        collaboration_opportunities: [],
        decision_enhancement_areas: [],
        change_management_considerations: [],
        cultural_adaptation_factors: [],
        strategic_value_proposition: ''
      };

      const positioned = framework.positionAutomationStrategically(
        automationOpportunities,
        mockStrategicContext
      );

      expect(positioned).toHaveLength(2);
      expect(positioned[0]).toHaveProperty('category', 'strategic_positioning');
      expect(positioned[0].title).toContain('Strategic Process Optimization Enhancement');
      expect(positioned[0].description).toContain('strategic capability building');
      expect(positioned[0]).toHaveProperty('automation_context');
    });

    it('should frame automation as strategic enhancement rather than replacement', () => {
      const automationOpportunities = ['Customer Service'];
      const mockStrategicContext = {
        strategic_positioning: [],
        collaboration_opportunities: [],
        decision_enhancement_areas: [],
        change_management_considerations: [],
        cultural_adaptation_factors: [],
        strategic_value_proposition: ''
      };

      const positioned = framework.positionAutomationStrategically(
        automationOpportunities,
        mockStrategicContext
      );

      expect(positioned[0].description).toContain('strategic capability building');
      expect(positioned[0].strategic_value).toContain('competitive advantage');
    });
  });

  describe('emphasizeHumanAICollaboration', () => {
    it('should generate human-AI collaboration insights', () => {
      const collaboration = framework.emphasizeHumanAICollaboration(
        mockAssessmentResults,
        'financial_services'
      );

      expect(collaboration).toHaveLength(2);
      expect(collaboration[0]).toHaveProperty('category', 'human_ai_collaboration');
      expect(collaboration[0].title).toContain('Human-AI Collaborative');
      expect(collaboration[0].description).toContain('AI augments');
      expect(collaboration[0].description).toContain('humans provide');
    });

    it('should emphasize human oversight and strategic direction', () => {
      const collaboration = framework.emphasizeHumanAICollaboration(
        mockAssessmentResults,
        'manufacturing'
      );

      const strategicPlanning = collaboration.find(c => c.title.includes('Strategic Planning'));
      expect(strategicPlanning?.description).toContain('humans provide vision, creativity');
      expect(strategicPlanning?.implementation_approach).toContain('human strategic thinking');
    });
  });

  describe('enhanceStrategicDecisionMaking', () => {
    it('should focus on decision enhancement rather than automation', () => {
      const decisionEnhancement = framework.enhanceStrategicDecisionMaking(
        mockAssessmentResults,
        'strategic_architect'
      );

      expect(decisionEnhancement.length).toBeGreaterThan(0);
      expect(decisionEnhancement[0]).toHaveProperty('category', 'decision_enhancement');
      expect(decisionEnhancement[0].title).toContain('Strategic Decision Enhancement');
      expect(decisionEnhancement[0].description).toContain('human strategic oversight');
    });
  });

  describe('integrateChangeManagement', () => {
    it('should address cultural adaptation and change management', () => {
      const changeManagement = framework.integrateChangeManagement(
        mockAssessmentResults,
        ['kenyan', 'english']
      );

      expect(changeManagement).toHaveLength(2);
      expect(changeManagement[0]).toHaveProperty('category', 'change_management');
      
      const culturalIntegration = changeManagement.find(c => c.title.includes('Cultural Integration'));
      expect(culturalIntegration).toBeDefined();
      expect(culturalIntegration?.description).toContain('cultural strengths');
      expect(culturalIntegration?.implementation_approach).toContain('culturally sensitive');
    });

    it('should frame AI as capability building rather than job displacement', () => {
      const changeManagement = framework.integrateChangeManagement(
        mockAssessmentResults,
        ['kenyan']
      );

      const capabilityBuilding = changeManagement.find(c => c.title.includes('Capability Building'));
      expect(capabilityBuilding).toBeDefined();
      expect(capabilityBuilding?.description).toContain('capability building rather than job displacement');
      expect(capabilityBuilding?.strategic_value).toContain('enhancing human capabilities');
    });
  });

  describe('industry-specific adaptations', () => {
    it('should provide industry-specific strategic positioning for financial services', () => {
      const insights = framework.generateStrategicInsights(
        mockAssessmentResults,
        'financial_services',
        ['kenyan']
      );

      expect(insights.cultural_adaptation_factors).toContain('Integration with traditional banking relationship models');
      expect(insights.cultural_adaptation_factors).toContain('Respect for established financial regulatory frameworks');
    });

    it('should adapt strategic value proposition based on persona', () => {
      const architectResults = { 
        ...mockAssessmentResults,
        persona_classification: {
          ...mockAssessmentResults.persona_classification,
          primary_persona: 'strategic_architect' as PersonaType
        }
      };

      const catalystResults = { 
        ...mockAssessmentResults,
        persona_classification: {
          ...mockAssessmentResults.persona_classification,
          primary_persona: 'strategic_catalyst' as PersonaType
        }
      };

      const architectInsights = framework.generateStrategicInsights(architectResults, 'technology', ['kenyan']);
      const catalystInsights = framework.generateStrategicInsights(catalystResults, 'technology', ['kenyan']);

      expect(architectInsights.strategic_value_proposition).toContain('enterprise-wide AI capabilities');
      expect(catalystInsights.strategic_value_proposition).toContain('team capabilities');
    });
  });

  describe('strategic themes integration', () => {
    it('should consistently emphasize strategic intelligence amplification over automation', () => {
      const insights = framework.generateStrategicInsights(
        mockAssessmentResults,
        'healthcare',
        ['kenyan']
      );

      const hasStrategicFocus = insights.strategic_positioning.some(
        insight => insight.description.includes('strategic intelligence') || 
                  insight.description.includes('strategic capability')
      );

      expect(hasStrategicFocus).toBe(true);
    });

    it('should maintain human-centric approach in all recommendations', () => {
      const collaboration = framework.emphasizeHumanAICollaboration(
        mockAssessmentResults,
        'government'
      );

      collaboration.forEach(insight => {
        expect(insight.description).toMatch(/humans? (provide|make|maintain)/i);
        expect(insight.implementation_approach).toMatch(/human (strategic|decision|oversight)/i);
      });
    });
  });
});