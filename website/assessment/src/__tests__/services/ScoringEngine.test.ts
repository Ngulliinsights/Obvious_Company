import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringEngine } from '../../services/ScoringEngine';
import { 
  AssessmentResponse, 
  DimensionScores,
  UserContext 
} from '../../models/types';
import { UserProfile, UserProfileModel } from '../../models/UserProfile';

describe('ScoringEngine', () => {
  let mockUserProfile: UserProfile;
  let mockUserContext: UserContext;
  let mockResponses: AssessmentResponse[];

  beforeEach(() => {
    mockUserProfile = UserProfileModel.create({
      id: 'test-user',
      email: 'test@example.com',
      demographics: {
        geographicRegion: 'kenya',
        culturalContext: ['east-africa', 'swahili'],
        languages: ['english', 'swahili']
      },
      professional: {
        industry: 'financial-services',
        roleLevel: 'director',
        organizationSize: 'large',
        decisionAuthority: 7,
        yearsExperience: 10
      },
      preferences: {
        assessmentModality: ['questionnaire'],
        learningStyle: 'visual',
        communicationPreference: 'direct'
      }
    });

    mockUserContext = {
      userId: 'test-user',
      industry: 'financial-services',
      geographicRegion: 'kenya',
      culturalContext: ['east-africa'],
      preferredLanguage: 'english'
    };

    mockResponses = [
      {
        questionId: 'authority_decision_making',
        questionType: 'scale_rating',
        responseValue: 4,
        responseTimeSeconds: 15
      },
      {
        questionId: 'authority_budget_control',
        questionType: 'scale_rating',
        responseValue: 5,
        responseTimeSeconds: 12
      },
      {
        questionId: 'influence_team_leadership',
        questionType: 'scale_rating',
        responseValue: 4,
        responseTimeSeconds: 18
      },
      {
        questionId: 'influence_stakeholder_management',
        questionType: 'scale_rating',
        responseValue: 3,
        responseTimeSeconds: 20
      },
      {
        questionId: 'resource_investment_capacity',
        questionType: 'scale_rating',
        responseValue: 3,
        responseTimeSeconds: 25
      },
      {
        questionId: 'resource_team_availability',
        questionType: 'scale_rating',
        responseValue: 4,
        responseTimeSeconds: 14
      },
      {
        questionId: 'implementation_timeline_preference',
        questionType: 'scale_rating',
        responseValue: 3,
        responseTimeSeconds: 22
      },
      {
        questionId: 'implementation_change_readiness',
        questionType: 'scale_rating',
        responseValue: 4,
        responseTimeSeconds: 16
      },
      {
        questionId: 'culture_communication_style',
        questionType: 'scale_rating',
        responseValue: 4,
        responseTimeSeconds: 19
      },
      {
        questionId: 'culture_collaboration_preference',
        questionType: 'scale_rating',
        responseValue: 5,
        responseTimeSeconds: 13
      }
    ];
  });

  describe('calculateDimensionScores', () => {
    it('should calculate dimension scores correctly', () => {
      const scores = ScoringEngine.calculateDimensionScores(
        mockResponses,
        mockUserProfile,
        mockUserContext
      );

      expect(scores).toHaveProperty('strategicAuthority');
      expect(scores).toHaveProperty('organizationalInfluence');
      expect(scores).toHaveProperty('resourceAvailability');
      expect(scores).toHaveProperty('implementationReadiness');
      expect(scores).toHaveProperty('culturalAlignment');

      // All scores should be between 0 and 100
      Object.values(scores).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('should apply cultural adjustments for East African context', () => {
      const eastAfricanContext = {
        ...mockUserContext,
        geographicRegion: 'east-africa',
        culturalContext: ['east-africa']
      };

      const scores = ScoringEngine.calculateDimensionScores(
        mockResponses,
        mockUserProfile,
        eastAfricanContext
      );

      // Should have valid scores with cultural adjustments applied
      expect(scores.strategicAuthority).toBeGreaterThan(0);
      expect(scores.culturalAlignment).toBeGreaterThan(0);
    });

    it('should apply industry-specific adjustments for financial services', () => {
      const financialProfile = {
        ...mockUserProfile,
        professional: {
          ...mockUserProfile.professional,
          industry: 'financial-services'
        }
      };

      const scores = ScoringEngine.calculateDimensionScores(
        mockResponses,
        financialProfile,
        mockUserContext
      );

      // Financial services should emphasize strategic authority
      expect(scores.strategicAuthority).toBeGreaterThan(0);
      expect(scores.implementationReadiness).toBeGreaterThan(0);
    });

    it('should handle empty responses gracefully', () => {
      const scores = ScoringEngine.calculateDimensionScores(
        [],
        mockUserProfile,
        mockUserContext
      );

      // Should return zero scores for empty responses
      Object.values(scores).forEach(score => {
        expect(score).toBe(0);
      });
    });

    it('should handle different response value types', () => {
      const mixedResponses: AssessmentResponse[] = [
        {
          questionId: 'authority_decision_making',
          questionType: 'scale_rating',
          responseValue: 'strongly_agree',
          responseTimeSeconds: 15
        },
        {
          questionId: 'influence_team_leadership',
          questionType: 'scale_rating',
          responseValue: 4,
          responseTimeSeconds: 18
        },
        {
          questionId: 'resource_investment_capacity',
          questionType: 'multiple_choice',
          responseValue: 'high',
          responseTimeSeconds: 25
        }
      ];

      const scores = ScoringEngine.calculateDimensionScores(
        mixedResponses,
        mockUserProfile,
        mockUserContext
      );

      // Should handle mixed response types
      expect(scores.strategicAuthority).toBeGreaterThan(0);
      expect(scores.organizationalInfluence).toBeGreaterThan(0);
      expect(scores.resourceAvailability).toBeGreaterThan(0);
    });
  });

  describe('calculateOverallScore', () => {
    it('should calculate weighted overall score correctly', () => {
      const dimensionScores: DimensionScores = {
        strategicAuthority: 80,
        organizationalInfluence: 70,
        resourceAvailability: 60,
        implementationReadiness: 75,
        culturalAlignment: 85
      };

      const overallScore = ScoringEngine.calculateOverallScore(dimensionScores);

      expect(overallScore).toBeGreaterThan(0);
      expect(overallScore).toBeLessThanOrEqual(100);
      
      // Should be weighted average
      const expectedScore = (
        80 * 0.25 + // strategicAuthority
        70 * 0.20 + // organizationalInfluence
        60 * 0.20 + // resourceAvailability
        75 * 0.25 + // implementationReadiness
        85 * 0.10   // culturalAlignment
      );
      
      expect(overallScore).toBeCloseTo(expectedScore, 1);
    });

    it('should handle custom weights', () => {
      const dimensionScores: DimensionScores = {
        strategicAuthority: 80,
        organizationalInfluence: 70,
        resourceAvailability: 60,
        implementationReadiness: 75,
        culturalAlignment: 85
      };

      const customWeights = {
        strategicAuthority: 0.4,
        organizationalInfluence: 0.2,
        resourceAvailability: 0.1,
        implementationReadiness: 0.2,
        culturalAlignment: 0.1
      };

      const overallScore = ScoringEngine.calculateOverallScore(
        dimensionScores, 
        customWeights
      );

      const expectedScore = (
        80 * 0.4 + 
        70 * 0.2 + 
        60 * 0.1 + 
        75 * 0.2 + 
        85 * 0.1
      );

      expect(overallScore).toBeCloseTo(expectedScore, 1);
    });

    it('should handle edge case scores', () => {
      const edgeCaseScores: DimensionScores = {
        strategicAuthority: 0,
        organizationalInfluence: 100,
        resourceAvailability: 0,
        implementationReadiness: 100,
        culturalAlignment: 50
      };

      const overallScore = ScoringEngine.calculateOverallScore(edgeCaseScores);

      expect(overallScore).toBeGreaterThanOrEqual(0);
      expect(overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Industry-specific adjustments', () => {
    it('should apply manufacturing industry adjustments', () => {
      const manufacturingProfile = {
        ...mockUserProfile,
        professional: {
          ...mockUserProfile.professional,
          industry: 'manufacturing'
        }
      };

      const manufacturingContext = {
        ...mockUserContext,
        industry: 'manufacturing'
      };

      const scores = ScoringEngine.calculateDimensionScores(
        mockResponses,
        manufacturingProfile,
        manufacturingContext
      );

      // Manufacturing should emphasize resource availability and implementation readiness
      expect(scores).toBeDefined();
      expect(scores.resourceAvailability).toBeGreaterThanOrEqual(0);
      expect(scores.implementationReadiness).toBeGreaterThanOrEqual(0);
    });

    it('should apply healthcare industry adjustments', () => {
      const healthcareProfile = {
        ...mockUserProfile,
        professional: {
          ...mockUserProfile.professional,
          industry: 'healthcare'
        }
      };

      const healthcareContext = {
        ...mockUserContext,
        industry: 'healthcare'
      };

      const scores = ScoringEngine.calculateDimensionScores(
        mockResponses,
        healthcareProfile,
        healthcareContext
      );

      // Healthcare should emphasize cultural alignment and ethical considerations
      expect(scores).toBeDefined();
      expect(scores.culturalAlignment).toBeGreaterThanOrEqual(0);
    });

    it('should handle unknown industry gracefully', () => {
      const unknownIndustryProfile = {
        ...mockUserProfile,
        professional: {
          ...mockUserProfile.professional,
          industry: 'unknown-industry'
        }
      };

      const scores = ScoringEngine.calculateDimensionScores(
        mockResponses,
        unknownIndustryProfile,
        mockUserContext
      );

      // Should still calculate scores without industry adjustments
      expect(scores).toBeDefined();
      Object.values(scores).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Cultural sensitivity', () => {
    it('should apply Western cultural adjustments', () => {
      const westernContext = {
        ...mockUserContext,
        geographicRegion: 'western',
        culturalContext: ['western']
      };

      const scores = ScoringEngine.calculateDimensionScores(
        mockResponses,
        mockUserProfile,
        westernContext
      );

      expect(scores).toBeDefined();
      Object.values(scores).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('should handle missing cultural context', () => {
      const noCulturalContext = {
        ...mockUserContext,
        geographicRegion: undefined,
        culturalContext: undefined
      };

      const scores = ScoringEngine.calculateDimensionScores(
        mockResponses,
        mockUserProfile,
        noCulturalContext
      );

      // Should still calculate scores without cultural adjustments
      expect(scores).toBeDefined();
      Object.values(scores).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed responses', () => {
      const malformedResponses: AssessmentResponse[] = [
        {
          questionId: '',
          questionType: 'scale_rating',
          responseValue: null,
          responseTimeSeconds: 0
        },
        {
          questionId: 'authority_test',
          questionType: 'scale_rating',
          responseValue: undefined,
          responseTimeSeconds: -1
        }
      ];

      const scores = ScoringEngine.calculateDimensionScores(
        malformedResponses,
        mockUserProfile,
        mockUserContext
      );

      // Should handle malformed data gracefully
      expect(scores).toBeDefined();
      Object.values(scores).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('should handle extreme response values', () => {
      const extremeResponses: AssessmentResponse[] = [
        {
          questionId: 'authority_decision_making',
          questionType: 'scale_rating',
          responseValue: 999,
          responseTimeSeconds: 15
        },
        {
          questionId: 'influence_team_leadership',
          questionType: 'scale_rating',
          responseValue: -100,
          responseTimeSeconds: 18
        }
      ];

      const scores = ScoringEngine.calculateDimensionScores(
        extremeResponses,
        mockUserProfile,
        mockUserContext
      );

      // Should normalize extreme values
      expect(scores).toBeDefined();
      Object.values(scores).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('should maintain consistency across multiple calculations', () => {
      const scores1 = ScoringEngine.calculateDimensionScores(
        mockResponses,
        mockUserProfile,
        mockUserContext
      );

      const scores2 = ScoringEngine.calculateDimensionScores(
        mockResponses,
        mockUserProfile,
        mockUserContext
      );

      // Should produce consistent results
      expect(scores1).toEqual(scores2);
    });
  });
});