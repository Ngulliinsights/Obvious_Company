import { describe, it, expect, beforeEach } from 'vitest';
import { IndustryInsightsEngine } from '../../services/IndustryInsightsEngine';
import { 
  DimensionScores, 
  PersonaType,
  UserContext 
} from '../../models/types';
import { UserProfile, UserProfileModel } from '../../models/UserProfile';

describe('IndustryInsightsEngine', () => {
  let mockUserProfile: UserProfile;
  let mockUserContext: UserContext;
  let mockDimensionScores: DimensionScores;

  beforeEach(() => {
    mockUserProfile = UserProfileModel.create({
      id: 'test-user',
      email: 'test@example.com',
      demographics: {
        geographicRegion: 'kenya',
        culturalContext: ['east-africa'],
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
        learningStyle: 'visual'
      }
    });

    mockUserContext = {
      userId: 'test-user',
      industry: 'financial-services',
      geographicRegion: 'kenya',
      culturalContext: ['east-africa'],
      preferredLanguage: 'english'
    };

    mockDimensionScores = {
      strategicAuthority: 75,
      organizationalInfluence: 70,
      resourceAvailability: 65,
      implementationReadiness: 70,
      culturalAlignment: 80
    };
  });

  describe('generateIndustryInsights', () => {
    it('should generate insights for financial services industry', () => {
      const insights = IndustryInsightsEngine.generateIndustryInsights(
        mockDimensionScores,
        mockUserProfile,
        mockUserContext,
        'Strategic Catalyst'
      );

      expect(insights).toBeDefined();
      expect(insights.sectorReadiness).toBeGreaterThan(0);
      expect(insights.sectorReadiness).toBeLessThanOrEqual(100);
      expect(insights.regulatoryConsiderations).toContain('Regulatory compliance requirements');
      expect(insights.implementationPriorities).toContain('Regulatory compliance validation');
    });

    it('should generate insights for manufacturing industry', () => {
      const manufacturingProfile = {
        ...mockUserProfile,