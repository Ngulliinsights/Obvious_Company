import { describe, it, expect, beforeEach } from 'vitest';
import { PersonaClassifier } from '../../services/PersonaClassifier';
import { PersonaCustomizer } from '../../services/PersonaCustomizer';
import { 
  DimensionScores, 
  UserContext,
  IndustryInsights
} from '../../models/types';
import { UserProfile, UserProfileModel } from '../../models/UserProfile';

describe('Persona System Integration', () => {
  let mockUserProfile: UserProfile;
  let mockUserContext: UserContext;
  let mockIndustryInsights: IndustryInsights;

  beforeEach(() => {
    mockUserProfile = UserProfileModel.create({
      id: 'integration-test-user',
      email: 'integration@example.com',
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
      userId: 'integration-test-user',
      industry: 'financial-services',
      geographicRegion: 'kenya',
      culturalContext: ['east-africa'],
      preferredLanguage: 'english'
    };

    mockIndustryInsights = {
      sectorReadiness: 75,
      regulatoryConsiderations: ['Financial regulations', 'Data privacy'],
      implementationPriorities: ['Risk management', 'Customer analytics'],
      culturalFactors: ['Local banking practices', 'Regulatory compliance']
    };
  });

  describe('End-to-End Persona Classification and Customization', () => {
    it('should classify and customize for Strategic Architect persona', () => {
      // High-level executive scores
      const executiveScores: DimensionScores = {
        strategicAuthority: 90,
        organizationalInfluence: 85,
        resourceAvailability: 80,
        implementationReadiness: 75,
        culturalAlignment: 70
      };

      // Step 1: Classify persona
      const classification = PersonaClassifier.classifyPersona(
        executiveScores,
        mockUserProfile,
        mockUserContext
      );

      expect(classification.primaryPersona).toBe('Strategic Architect');
      expect(classification.confidenceScore).toBeGreaterThan(0.7);

      // Step 2: Generate customization
      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      // Verify customization aligns with persona
      expect(customization.content.language.tone).toBe('executive');
      expect(customization.serviceRecommendation.tier).toBe('Strategic Advantage');
      expect(customization.customizedMessaging.valueProposition).toContain('Transform your financial-services organization');

      // Step 3: Validate the complete system
      const validation = PersonaCustomizer.validateCustomization(
        customization,
        classification
      );

      expect(validation.isValid).toBe(true);
      expect(validation.warnings.length).toBeLessThanOrEqual(1);
    });

    it('should classify and customize for Strategic Catalyst persona', () => {
      // Change leader scores
      const catalystScores: DimensionScores = {
        strategicAuthority: 65,
        organizationalInfluence: 80,
        resourceAvailability: 60,
        implementationReadiness: 85,
        culturalAlignment: 75
      };

      // Complete workflow
      const classification = PersonaClassifier.classifyPersona(
        catalystScores,
        mockUserProfile,
        mockUserContext
      );

      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      // Verify end-to-end consistency
      expect(classification.primaryPersona).toBe('Strategic Catalyst');
      expect(customization.content.language.tone).toBe('collaborative');
      expect(customization.serviceRecommendation.tier).toBe('Strategic Advantage'); // Adjusted for large org
      expect(customization.customizedMessaging.implementationFocus).toContain('change management');
    });

    it('should classify and customize for Strategic Contributor persona', () => {
      // Department-level manager scores
      const contributorScores: DimensionScores = {
        strategicAuthority: 50,
        organizationalInfluence: 60,
        resourceAvailability: 55,
        implementationReadiness: 65,
        culturalAlignment: 60
      };

      const classification = PersonaClassifier.classifyPersona(
        contributorScores,
        mockUserProfile,
        mockUserContext
      );

      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      expect(classification.primaryPersona).toBe('Strategic Contributor');
      expect(customization.content.language.tone).toBe('practical');
      expect(customization.serviceRecommendation.tier).toBe('Strategic Systems'); // Adjusted for large org
      expect(customization.customizedMessaging.implementationFocus).toContain('Tactical implementation');
    });

    it('should classify and customize for Strategic Explorer persona', () => {
      // Learning-oriented professional scores
      const explorerScores: DimensionScores = {
        strategicAuthority: 30,
        organizationalInfluence: 45,
        resourceAvailability: 35,
        implementationReadiness: 80,
        culturalAlignment: 75
      };

      const classification = PersonaClassifier.classifyPersona(
        explorerScores,
        mockUserProfile,
        mockUserContext
      );

      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      expect(classification.primaryPersona).toBe('Strategic Explorer');
      expect(customization.content.language.tone).toBe('educational');
      expect(customization.serviceRecommendation.tier).toBe('Strategic Systems'); // Adjusted for large org
      expect(customization.customizedMessaging.implementationFocus).toContain('Learning and development');
    });

    it('should classify and customize for Strategic Observer persona', () => {
      // Assessment-focused professional scores
      const observerScores: DimensionScores = {
        strategicAuthority: 15,
        organizationalInfluence: 25,
        resourceAvailability: 20,
        implementationReadiness: 40,
        culturalAlignment: 45
      };

      const classification = PersonaClassifier.classifyPersona(
        observerScores,
        mockUserProfile,
        mockUserContext
      );

      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      expect(classification.primaryPersona).toBe('Strategic Observer');
      expect(customization.content.language.tone).toBe('informational');
      expect(customization.serviceRecommendation.tier).toBe('Strategic Clarity');
      expect(customization.customizedMessaging.implementationFocus).toContain('Assessment and exploration');
    });
  });

  describe('Cultural and Industry Adaptations', () => {
    it('should apply consistent cultural adaptations across the system', () => {
      const scores: DimensionScores = {
        strategicAuthority: 75,
        organizationalInfluence: 70,
        resourceAvailability: 65,
        implementationReadiness: 70,
        culturalAlignment: 60
      };

      const eastAfricanContext = {
        ...mockUserContext,
        geographicRegion: 'east-africa',
        culturalContext: ['east-africa']
      };

      // Classification with cultural adjustments
      const classification = PersonaClassifier.classifyPersona(
        scores,
        mockUserProfile,
        eastAfricanContext
      );

      // Customization with cultural adaptations
      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        eastAfricanContext,
        mockIndustryInsights
      );

      // Verify cultural sensitivity is maintained throughout
      expect(customization.customizedMessaging.implementationFocus).toContain('cultural sensitivity');
      expect(customization.content.examples.useCases.some(useCase => 
        useCase.includes('local business practices')
      )).toBe(true);
    });

    it('should incorporate industry insights consistently', () => {
      const scores: DimensionScores = {
        strategicAuthority: 80,
        organizationalInfluence: 75,
        resourceAvailability: 70,
        implementationReadiness: 65,
        culturalAlignment: 60
      };

      const classification = PersonaClassifier.classifyPersona(
        scores,
        mockUserProfile,
        mockUserContext
      );

      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      // Verify industry insights are incorporated
      expect(customization.serviceRecommendation.rationale).toContain('Industry-specific considerations');
      expect(customization.content.recommendations.resourceFocus.some(resource => 
        resource.includes('financial-services-specific expertise')
      )).toBe(true);
    });
  });

  describe('Service Tier Alignment', () => {
    it('should provide consistent service tier recommendations', () => {
      const testCases = [
        {
          scores: { strategicAuthority: 90, organizationalInfluence: 85, resourceAvailability: 80, implementationReadiness: 75, culturalAlignment: 70 },
          expectedPersona: 'Strategic Architect',
          expectedTier: 'Strategic Advantage'
        },
        {
          scores: { strategicAuthority: 65, organizationalInfluence: 80, resourceAvailability: 60, implementationReadiness: 85, culturalAlignment: 75 },
          expectedPersona: 'Strategic Catalyst',
          expectedTier: 'Strategic Advantage' // Adjusted for large org
        },
        {
          scores: { strategicAuthority: 50, organizationalInfluence: 60, resourceAvailability: 55, implementationReadiness: 65, culturalAlignment: 60 },
          expectedPersona: 'Strategic Contributor',
          expectedTier: 'Strategic Systems' // Adjusted for large org
        }
      ];

      testCases.forEach(({ scores, expectedPersona, expectedTier }) => {
        const classification = PersonaClassifier.classifyPersona(
          scores,
          mockUserProfile,
          mockUserContext
        );

        const customization = PersonaCustomizer.generateCustomization(
          classification,
          mockUserProfile,
          mockUserContext,
          mockIndustryInsights
        );

        expect(classification.primaryPersona).toBe(expectedPersona);
        expect(customization.serviceRecommendation.tier).toBe(expectedTier);
      });
    });
  });

  describe('System Validation and Quality Assurance', () => {
    it('should maintain data consistency across classification and customization', () => {
      const scores: DimensionScores = {
        strategicAuthority: 70,
        organizationalInfluence: 75,
        resourceAvailability: 65,
        implementationReadiness: 80,
        culturalAlignment: 70
      };

      const classification = PersonaClassifier.classifyPersona(
        scores,
        mockUserProfile,
        mockUserContext
      );

      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      // Validate classification
      const classificationValidation = PersonaClassifier.validateClassification(
        classification,
        mockUserProfile
      );

      // Validate customization
      const customizationValidation = PersonaCustomizer.validateCustomization(
        customization,
        classification
      );

      expect(classificationValidation.isValid).toBe(true);
      expect(customizationValidation.isValid).toBe(true);

      // Ensure persona consistency
      const personaCharacteristics = PersonaClassifier.getPersonaCharacteristics(classification.primaryPersona);
      const customizationOptions = PersonaCustomizer.getPersonaCustomizationOptions(classification.primaryPersona);

      expect(personaCharacteristics).toBeDefined();
      expect(customizationOptions).toBeDefined();
    });

    it('should handle edge cases gracefully', () => {
      // Test with extreme scores
      const extremeScores: DimensionScores = {
        strategicAuthority: 0,
        organizationalInfluence: 100,
        resourceAvailability: 50,
        implementationReadiness: 0,
        culturalAlignment: 100
      };

      const classification = PersonaClassifier.classifyPersona(
        extremeScores,
        mockUserProfile,
        mockUserContext
      );

      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      // System should handle extreme cases without errors
      expect(classification.primaryPersona).toBeDefined();
      expect(customization.serviceRecommendation.tier).toBeDefined();
      expect(customization.customizedMessaging.valueProposition).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should process multiple classifications efficiently', () => {
      const testScores = [
        { strategicAuthority: 90, organizationalInfluence: 85, resourceAvailability: 80, implementationReadiness: 75, culturalAlignment: 70 },
        { strategicAuthority: 65, organizationalInfluence: 80, resourceAvailability: 60, implementationReadiness: 85, culturalAlignment: 75 },
        { strategicAuthority: 50, organizationalInfluence: 60, resourceAvailability: 55, implementationReadiness: 65, culturalAlignment: 60 },
        { strategicAuthority: 30, organizationalInfluence: 45, resourceAvailability: 35, implementationReadiness: 80, culturalAlignment: 75 },
        { strategicAuthority: 15, organizationalInfluence: 25, resourceAvailability: 20, implementationReadiness: 40, culturalAlignment: 45 }
      ];

      const startTime = Date.now();

      const results = testScores.map(scores => {
        const classification = PersonaClassifier.classifyPersona(
          scores,
          mockUserProfile,
          mockUserContext
        );

        const customization = PersonaCustomizer.generateCustomization(
          classification,
          mockUserProfile,
          mockUserContext,
          mockIndustryInsights
        );

        return { classification, customization };
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should process all classifications quickly (under 100ms)
      expect(processingTime).toBeLessThan(100);
      expect(results.length).toBe(5);
      expect(results.every(result => result.classification.primaryPersona)).toBe(true);
      expect(results.every(result => result.customization.serviceRecommendation.tier)).toBe(true);
    });
  });
});