import { ContextualRecommendationEngine } from '../../services/ContextualRecommendationEngine';
import { CulturalAdapter } from '../../services/CulturalAdapter';
import { LocalizationEngine } from '../../services/LocalizationEngine';
import { UserContext, AssessmentResults } from '../../models/types';

describe('ContextualRecommendationEngine', () => {
  let contextualEngine: ContextualRecommendationEngine;
  let culturalAdapter: CulturalAdapter;
  let localizationEngine: LocalizationEngine;

  beforeEach(() => {
    culturalAdapter = new CulturalAdapter();
    localizationEngine = new LocalizationEngine(culturalAdapter);
    contextualEngine = new ContextualRecommendationEngine(culturalAdapter, localizationEngine);
  });

  describe('Basic Functionality', () => {
    it('should generate contextual recommendations', () => {
      const assessmentResults: AssessmentResults = {
        sessionId: 'test-session',
        overallScore: 0.75,
        dimensionScores: {
          strategicAuthority: 0.8,
          organizationalInfluence: 0.7,
          resourceAvailability: 0.6,
          implementationReadiness: 0.5,
          culturalAlignment: 0.8
        },
        personaClassification: {
          primaryPersona: 'Strategic Catalyst',
          confidenceScore: 0.85,
          secondaryCharacteristics: ['innovation-focused']
        },
        industryInsights: {
          sectorReadiness: 0.7,
          regulatoryConsiderations: ['Kenya Data Protection Act'],
          implementationPriorities: ['infrastructure', 'skills']
        },
        recommendations: {
          programRecommendation: 'Strategic Systems',
          nextSteps: ['infrastructure assessment'],
          timelineSuggestion: '6-12 months',
          resourceRequirements: ['technical expertise']
        },
        curriculumPathway: {
          pathwayId: 'test-pathway',
          foundationModules: [],
          industryModules: [],
          roleSpecificModules: [],
          culturalAdaptationModules: [],
          estimatedDuration: {
            totalHours: 40,
            weeklyCommitment: 5,
            completionTimeline: '8 weeks'
          },
          learningObjectives: [],
          successMetrics: [],
          prerequisites: [],
          optionalEnhancements: []
        }
      };

      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'technology',
        organizationSize: 'medium'
      };

      const recommendations = contextualEngine.generateContextualRecommendations(
        assessmentResults,
        userContext
      );

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Enhanced Market Analysis', () => {
    it('should assess local market conditions comprehensively', () => {
      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'financial-services',
        organizationSize: 'large'
      };

      const marketAssessment = contextualEngine.assessLocalMarketConditions(
        userContext,
        'financial-services'
      );

      expect(marketAssessment).toBeDefined();
      expect(marketAssessment.marketReadiness).toBeGreaterThan(0);
      expect(marketAssessment.competitiveAdvantage).toBeGreaterThan(0);
      expect(marketAssessment.implementationRisk).toBeGreaterThan(0);
      expect(marketAssessment.resourceAvailability).toBeGreaterThan(0);
      expect(Array.isArray(marketAssessment.marketOpportunities)).toBe(true);
      expect(Array.isArray(marketAssessment.marketChallenges)).toBe(true);
      expect(typeof marketAssessment.recommendedStrategy).toBe('string');
      expect(Array.isArray(marketAssessment.partnershipOpportunities)).toBe(true);
    });

    it('should provide different market assessments for different regions', () => {
      const kenyaContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'technology',
        organizationSize: 'medium'
      };

      const westAfricaContext: UserContext = {
        geographicRegion: 'nigeria',
        industry: 'technology',
        organizationSize: 'medium'
      };

      const kenyaAssessment = contextualEngine.assessLocalMarketConditions(kenyaContext);
      const westAfricaAssessment = contextualEngine.assessLocalMarketConditions(westAfricaContext);

      expect(kenyaAssessment.marketReadiness).not.toEqual(westAfricaAssessment.marketReadiness);
      expect(kenyaAssessment.partnershipOpportunities).not.toEqual(westAfricaAssessment.partnershipOpportunities);
    });
  });

  describe('Enhanced Infrastructure Assessment', () => {
    it('should assess technology infrastructure comprehensively', () => {
      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'manufacturing',
        organizationSize: 'large'
      };

      const infrastructureAssessment = contextualEngine.assessTechnologyInfrastructure(
        userContext,
        ['high-availability', 'real-time-processing']
      );

      expect(infrastructureAssessment).toBeDefined();
      expect(infrastructureAssessment.infrastructureReadiness).toBeGreaterThan(0);
      expect(Array.isArray(infrastructureAssessment.criticalGaps)).toBe(true);
      expect(Array.isArray(infrastructureAssessment.improvementPriorities)).toBe(true);
      expect(infrastructureAssessment.investmentRequirements).toBeDefined();
      expect(Array.isArray(infrastructureAssessment.investmentRequirements.immediate)).toBe(true);
      expect(Array.isArray(infrastructureAssessment.investmentRequirements.shortTerm)).toBe(true);
      expect(Array.isArray(infrastructureAssessment.investmentRequirements.longTerm)).toBe(true);
      expect(infrastructureAssessment.riskAssessment).toBeDefined();
      expect(Array.isArray(infrastructureAssessment.riskAssessment.technical)).toBe(true);
      expect(Array.isArray(infrastructureAssessment.riskAssessment.operational)).toBe(true);
      expect(Array.isArray(infrastructureAssessment.riskAssessment.security)).toBe(true);
      expect(Array.isArray(infrastructureAssessment.mitigationStrategies)).toBe(true);
    });

    it('should identify different infrastructure needs for different regions', () => {
      const kenyaContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'technology',
        organizationSize: 'medium'
      };

      const westAfricaContext: UserContext = {
        geographicRegion: 'nigeria',
        industry: 'technology',
        organizationSize: 'medium'
      };

      const kenyaInfrastructure = contextualEngine.assessTechnologyInfrastructure(kenyaContext);
      const westAfricaInfrastructure = contextualEngine.assessTechnologyInfrastructure(westAfricaContext);

      expect(kenyaInfrastructure.infrastructureReadiness).not.toEqual(westAfricaInfrastructure.infrastructureReadiness);
      expect(kenyaInfrastructure.criticalGaps.length).not.toEqual(westAfricaInfrastructure.criticalGaps.length);
    });
  });

  describe('Enhanced Stakeholder Engagement', () => {
    it('should generate comprehensive stakeholder engagement framework', () => {
      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'healthcare',
        organizationSize: 'large'
      };

      const framework = contextualEngine.generateStakeholderEngagementFramework(
        userContext,
        'executive'
      );

      expect(framework).toBeDefined();
      expect(typeof framework.approach).toBe('string');
      expect(Array.isArray(framework.keyMessages)).toBe(true);
      expect(typeof framework.communicationStyle).toBe('string');
      expect(typeof framework.meetingStructure).toBe('string');
      expect(typeof framework.decisionMaking).toBe('string');
      expect(Array.isArray(framework.culturalConsiderations)).toBe(true);
      expect(Array.isArray(framework.culturalProtocols)).toBe(true);
      expect(Array.isArray(framework.riskMitigation)).toBe(true);
      expect(Array.isArray(framework.successMetrics)).toBe(true);
      expect(Array.isArray(framework.timeline)).toBe(true);
    });

    it('should provide different engagement approaches for different cultures', () => {
      const kenyaContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'technology',
        organizationSize: 'medium'
      };

      const westAfricaContext: UserContext = {
        geographicRegion: 'nigeria',
        industry: 'technology',
        organizationSize: 'medium'
      };

      const southernAfricaContext: UserContext = {
        geographicRegion: 'south-africa',
        industry: 'technology',
        organizationSize: 'medium'
      };

      const kenyaFramework = contextualEngine.generateStakeholderEngagementFramework(kenyaContext);
      const westAfricaFramework = contextualEngine.generateStakeholderEngagementFramework(westAfricaContext);
      const southernAfricaFramework = contextualEngine.generateStakeholderEngagementFramework(southernAfricaContext);

      expect(kenyaFramework.approach).not.toEqual(westAfricaFramework.approach);
      expect(westAfricaFramework.approach).not.toEqual(southernAfricaFramework.approach);
      expect(kenyaFramework.culturalProtocols).not.toEqual(westAfricaFramework.culturalProtocols);
    });
  });

  describe('Implementation Feasibility Assessment', () => {
    it('should assess feasibility for different contexts', () => {
      const assessmentResults: AssessmentResults = {
        sessionId: 'test-session',
        overallScore: 0.7,
        dimensionScores: {
          strategicAuthority: 0.8,
          organizationalInfluence: 0.7,
          resourceAvailability: 0.6,
          implementationReadiness: 0.5,
          culturalAlignment: 0.8
        },
        personaClassification: {
          primaryPersona: 'Strategic Catalyst',
          confidenceScore: 0.85,
          secondaryCharacteristics: []
        },
        industryInsights: {
          sectorReadiness: 0.7,
          regulatoryConsiderations: [],
          implementationPriorities: []
        },
        recommendations: {
          programRecommendation: 'Strategic Systems',
          nextSteps: [],
          timelineSuggestion: '6-12 months',
          resourceRequirements: []
        },
        curriculumPathway: {
          pathwayId: 'test-pathway',
          foundationModules: [],
          industryModules: [],
          roleSpecificModules: [],
          culturalAdaptationModules: [],
          estimatedDuration: {
            totalHours: 40,
            weeklyCommitment: 5,
            completionTimeline: '8 weeks'
          },
          learningObjectives: [],
          successMetrics: [],
          prerequisites: [],
          optionalEnhancements: []
        }
      };

      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'technology',
        organizationSize: 'medium'
      };

      const feasibility = contextualEngine.assessImplementationFeasibility(
        assessmentResults,
        userContext
      );

      expect(feasibility).toBeDefined();
      expect(feasibility.overallFeasibility).toBeGreaterThan(0);
      expect(feasibility.feasibilityFactors).toBeDefined();
      expect(Array.isArray(feasibility.recommendations)).toBe(true);
      expect(Array.isArray(feasibility.riskMitigation)).toBe(true);
    });
  });
});