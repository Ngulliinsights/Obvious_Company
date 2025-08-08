import { describe, it, expect, beforeEach } from 'vitest';
import { PersonaCustomizer } from '../../services/PersonaCustomizer';
import { 
  PersonaClassification,
  PersonaType,
  UserContext,
  IndustryInsights
} from '../../models/types';
import { UserProfile, UserProfileModel } from '../../models/UserProfile';

describe('PersonaCustomizer', () => {
  let mockUserProfile: UserProfile;
  let mockUserContext: UserContext;
  let mockIndustryInsights: IndustryInsights;

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

    mockIndustryInsights = {
      sectorReadiness: 75,
      regulatoryConsiderations: ['Financial regulations', 'Data privacy'],
      implementationPriorities: ['Risk management', 'Customer analytics'],
      culturalFactors: ['Local banking practices', 'Regulatory compliance']
    };
  });

  describe('generateCustomization', () => {
    it('should generate appropriate customization for Strategic Architect', () => {
      const classification: PersonaClassification = {
        primaryPersona: 'Strategic Architect',
        confidenceScore: 0.85,
        secondaryCharacteristics: ['Strategic Catalyst influence style'],
        reasoning: 'High authority and influence scores indicate Strategic Architect classification.'
      };

      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      expect(customization.content.language.tone).toBe('executive');
      expect(customization.content.language.vocabulary).toContain('strategic transformation');
      expect(customization.serviceRecommendation.tier).toBe('Strategic Advantage');
      expect(customization.serviceRecommendation.priceRange).toBe('$50K-75K');
      expect(customization.customizedMessaging.valueProposition).toContain('Transform your financial-services organization');
    });

    it('should generate appropriate customization for Strategic Catalyst', () => {
      const classification: PersonaClassification = {
        primaryPersona: 'Strategic Catalyst',
        confidenceScore: 0.78,
        secondaryCharacteristics: ['Strategic Architect authority level'],
        reasoning: 'Strong influence and implementation readiness suggest change leadership potential.'
      };

      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      expect(customization.content.language.tone).toBe('collaborative');
      expect(customization.content.language.vocabulary).toContain('change leadership');
      expect(customization.serviceRecommendation.tier).toBe('Strategic Advantage'); // Adjusted for large org
      expect(customization.serviceRecommendation.priceRange).toBe('$25K-40K');
      expect(customization.customizedMessaging.implementationFocus).toContain('change management');
    });

    it('should generate appropriate customization for Strategic Contributor', () => {
      const classification: PersonaClassification = {
        primaryPersona: 'Strategic Contributor',
        confidenceScore: 0.72,
        secondaryCharacteristics: [],
        reasoning: 'Moderate authority and influence levels indicate department-level implementation focus.'
      };

      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      expect(customization.content.language.tone).toBe('practical');
      expect(customization.content.language.vocabulary).toContain('tactical implementation');
      expect(customization.serviceRecommendation.tier).toBe('Strategic Systems'); // Adjusted for large org
      expect(customization.customizedMessaging.implementationFocus).toContain('Tactical implementation');
    });

    it('should generate appropriate customization for Strategic Explorer', () => {
      const classification: PersonaClassification = {
        primaryPersona: 'Strategic Explorer',
        confidenceScore: 0.68,
        secondaryCharacteristics: ['Strategic Contributor authority level'],
        reasoning: 'High implementation readiness with emerging authority suggests learning orientation.'
      };

      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      expect(customization.content.language.tone).toBe('educational');
      expect(customization.content.language.vocabulary).toContain('learning journey');
      expect(customization.serviceRecommendation.tier).toBe('Strategic Systems'); // Adjusted for large org
      expect(customization.serviceRecommendation.priceRange).toBe('$75K-150K KSH');
      expect(customization.customizedMessaging.implementationFocus).toContain('Learning and development');
    });

    it('should generate appropriate customization for Strategic Observer', () => {
      const classification: PersonaClassification = {
        primaryPersona: 'Strategic Observer',
        confidenceScore: 0.65,
        secondaryCharacteristics: [],
        reasoning: 'Current scores suggest assessment and consultation approach would be most beneficial.'
      };

      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      expect(customization.content.language.tone).toBe('informational');
      expect(customization.content.language.vocabulary).toContain('assessment');
      expect(customization.serviceRecommendation.tier).toBe('Strategic Clarity');
      expect(customization.serviceRecommendation.priceRange).toBe('Assessment-based consultation');
      expect(customization.customizedMessaging.implementationFocus).toContain('Assessment and exploration');
    });

    it('should apply cultural adaptations for East African context', () => {
      const classification: PersonaClassification = {
        primaryPersona: 'Strategic Architect',
        confidenceScore: 0.85,
        secondaryCharacteristics: [],
        reasoning: 'High authority scores indicate Strategic Architect classification.'
      };

      const eastAfricanContext = {
        ...mockUserContext,
        geographicRegion: 'east-africa',
        culturalContext: ['east-africa']
      };

      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        eastAfricanContext,
        mockIndustryInsights
      );

      expect(customization.customizedMessaging.implementationFocus).toContain('cultural sensitivity');
      expect(customization.content.examples.useCases.some(useCase => 
        useCase.includes('local business practices')
      )).toBe(true);
    });

    it('should incorporate industry insights when provided', () => {
      const classification: PersonaClassification = {
        primaryPersona: 'Strategic Catalyst',
        confidenceScore: 0.78,
        secondaryCharacteristics: [],
        reasoning: 'Change leadership capabilities align with Strategic Catalyst.'
      };

      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      expect(customization.serviceRecommendation.rationale).toContain('Industry-specific considerations');
      // Check that industry insights are incorporated (success metrics should include industry-specific items)
      expect(customization.customizedMessaging.successMetrics.length).toBe(4);
      expect(customization.content.recommendations.resourceFocus.some(resource => 
        resource.includes('financial-services-specific expertise')
      )).toBe(true);
    });
  });

  describe('service recommendation generation', () => {
    it('should recommend appropriate service tier based on persona', () => {
      const architectClassification: PersonaClassification = {
        primaryPersona: 'Strategic Architect',
        confidenceScore: 0.9,
        secondaryCharacteristics: [],
        reasoning: 'Enterprise-wide authority indicates Strategic Architect.'
      };

      const customization = PersonaCustomizer.generateCustomization(
        architectClassification,
        mockUserProfile,
        mockUserContext
      );

      expect(customization.serviceRecommendation.tier).toBe('Strategic Advantage');
      expect(customization.serviceRecommendation.timelineEstimate).toBe('6-18 months');
      expect(customization.serviceRecommendation.nextSteps.length).toBeGreaterThan(0);
    });

    it('should adjust service tier for organization size', () => {
      const contributorClassification: PersonaClassification = {
        primaryPersona: 'Strategic Contributor',
        confidenceScore: 0.75,
        secondaryCharacteristics: [],
        reasoning: 'Department-level authority indicates Strategic Contributor.'
      };

      // Large organization should get upgraded tier
      const largeOrgProfile = {
        ...mockUserProfile,
        professional: {
          ...mockUserProfile.professional,
          organizationSize: 'large'
        }
      };

      const customization = PersonaCustomizer.generateCustomization(
        contributorClassification,
        largeOrgProfile,
        mockUserContext
      );

      expect(customization.serviceRecommendation.tier).toBe('Strategic Systems'); // Upgraded from Strategic Clarity
    });

    it('should generate meaningful rationale for service recommendation', () => {
      const catalystClassification: PersonaClassification = {
        primaryPersona: 'Strategic Catalyst',
        confidenceScore: 0.82,
        secondaryCharacteristics: ['Strategic Architect authority level'],
        reasoning: 'Change leadership capabilities with high influence.'
      };

      const customization = PersonaCustomizer.generateCustomization(
        catalystClassification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      const rationale = customization.serviceRecommendation.rationale;
      expect(rationale).toContain('Strategic Catalyst classification');
      expect(rationale).toContain('82% confidence');
      expect(rationale).toContain('director role');
      expect(rationale).toContain('financial-services');
      expect(rationale).toContain('change leadership capabilities');
    });

    it('should provide relevant next steps for each persona', () => {
      const explorerClassification: PersonaClassification = {
        primaryPersona: 'Strategic Explorer',
        confidenceScore: 0.7,
        secondaryCharacteristics: [],
        reasoning: 'Learning orientation with growth potential.'
      };

      const customization = PersonaCustomizer.generateCustomization(
        explorerClassification,
        mockUserProfile,
        mockUserContext
      );

      const nextSteps = customization.serviceRecommendation.nextSteps;
      expect(nextSteps).toContain('Personal AI readiness assessment and learning path development');
      expect(nextSteps.length).toBeLessThanOrEqual(5);
      expect(nextSteps.every(step => typeof step === 'string' && step.length > 0)).toBe(true);
    });
  });

  describe('customized messaging generation', () => {
    it('should generate persona-specific value propositions', () => {
      const architectClassification: PersonaClassification = {
        primaryPersona: 'Strategic Architect',
        confidenceScore: 0.88,
        secondaryCharacteristics: [],
        reasoning: 'Enterprise authority and strategic focus.'
      };

      const customization = PersonaCustomizer.generateCustomization(
        architectClassification,
        mockUserProfile,
        mockUserContext
      );

      const valueProposition = customization.customizedMessaging.valueProposition;
      expect(valueProposition).toContain('Transform your financial-services organization');
      expect(valueProposition).toContain('strategic AI implementation');
      expect(valueProposition).toContain('enterprise-wide competitive advantage');
    });

    it('should generate appropriate success metrics for each persona', () => {
      const contributorClassification: PersonaClassification = {
        primaryPersona: 'Strategic Contributor',
        confidenceScore: 0.73,
        secondaryCharacteristics: [],
        reasoning: 'Tactical implementation focus.'
      };

      const customization = PersonaCustomizer.generateCustomization(
        contributorClassification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      const successMetrics = customization.customizedMessaging.successMetrics;
      expect(successMetrics).toContain('Process efficiency gains of 10-25%');
      expect(successMetrics).toContain('Time-to-value achievement within 3 months');
      expect(successMetrics.length).toBe(4);
    });

    it('should generate appropriate risk mitigation strategies', () => {
      const catalystClassification: PersonaClassification = {
        primaryPersona: 'Strategic Catalyst',
        confidenceScore: 0.79,
        secondaryCharacteristics: [],
        reasoning: 'Change leadership with organizational influence.'
      };

      const customization = PersonaCustomizer.generateCustomization(
        catalystClassification,
        mockUserProfile,
        mockUserContext
      );

      const riskMitigation = customization.customizedMessaging.riskMitigation;
      expect(riskMitigation).toContain('Team engagement and adoption support strategies');
      expect(riskMitigation).toContain('Continuous feedback loops and iterative improvement');
      expect(riskMitigation.length).toBe(4);
    });

    it('should adapt implementation focus for cultural context', () => {
      const observerClassification: PersonaClassification = {
        primaryPersona: 'Strategic Observer',
        confidenceScore: 0.62,
        secondaryCharacteristics: [],
        reasoning: 'Assessment and exploration focus.'
      };

      const kenyaContext = {
        ...mockUserContext,
        geographicRegion: 'kenya'
      };

      const customization = PersonaCustomizer.generateCustomization(
        observerClassification,
        mockUserProfile,
        kenyaContext
      );

      const implementationFocus = customization.customizedMessaging.implementationFocus;
      expect(implementationFocus).toContain('cultural sensitivity and local market understanding');
    });
  });

  describe('contextual adaptations', () => {
    it('should apply East African cultural adaptations', () => {
      const classification: PersonaClassification = {
        primaryPersona: 'Strategic Architect',
        confidenceScore: 0.85,
        secondaryCharacteristics: [],
        reasoning: 'High authority and strategic focus.'
      };

      const eastAfricanContext = {
        ...mockUserContext,
        geographicRegion: 'east-africa'
      };

      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        eastAfricanContext
      );

      // Check that enterprise-wide is replaced with organization-wide
      const hasOrganizationWide = customization.content.language.vocabulary.some(term => 
        term.includes('organization-wide')
      );
      expect(hasOrganizationWide).toBe(true);

      // Check that use cases include local considerations
      const hasLocalConsiderations = customization.content.examples.useCases.some(useCase => 
        useCase.includes('local business practices')
      );
      expect(hasLocalConsiderations).toBe(true);
    });

    it('should apply industry-specific adaptations', () => {
      const classification: PersonaClassification = {
        primaryPersona: 'Strategic Catalyst',
        confidenceScore: 0.8,
        secondaryCharacteristics: [],
        reasoning: 'Change leadership capabilities.'
      };

      const customization = PersonaCustomizer.generateCustomization(
        classification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      const resourceFocus = customization.content.recommendations.resourceFocus;
      expect(resourceFocus.some(resource => 
        resource.includes('financial-services-specific expertise')
      )).toBe(true);
      expect(resourceFocus.some(resource => 
        resource.includes('Industry best practices')
      )).toBe(true);
    });
  });

  describe('getPersonaCustomizationOptions', () => {
    it('should return customization options for valid persona', () => {
      const options = PersonaCustomizer.getPersonaCustomizationOptions('Strategic Architect');
      
      expect(options.language.tone).toBe('executive');
      expect(options.examples.useCases.length).toBeGreaterThan(0);
      expect(options.recommendations.serviceAlignment).toBeDefined();
    });

    it('should return consistent options for all personas', () => {
      const personas: PersonaType[] = [
        'Strategic Architect',
        'Strategic Catalyst', 
        'Strategic Contributor',
        'Strategic Explorer',
        'Strategic Observer'
      ];

      personas.forEach(persona => {
        const options = PersonaCustomizer.getPersonaCustomizationOptions(persona);
        expect(options.language).toBeDefined();
        expect(options.examples).toBeDefined();
        expect(options.recommendations).toBeDefined();
        expect(options.examples.useCases.length).toBeGreaterThan(0);
        expect(options.examples.roiScenarios.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateCustomization', () => {
    it('should validate correct persona-service tier alignment', () => {
      const architectClassification: PersonaClassification = {
        primaryPersona: 'Strategic Architect',
        confidenceScore: 0.9,
        secondaryCharacteristics: [],
        reasoning: 'High authority and strategic focus.'
      };

      const customization = PersonaCustomizer.generateCustomization(
        architectClassification,
        mockUserProfile,
        mockUserContext
      );

      const validation = PersonaCustomizer.validateCustomization(
        customization,
        architectClassification
      );

      expect(validation.isValid).toBe(true);
      expect(validation.warnings.length).toBe(0);
    });

    it('should warn about misaligned service tier', () => {
      const observerClassification: PersonaClassification = {
        primaryPersona: 'Strategic Observer',
        confidenceScore: 0.6,
        secondaryCharacteristics: [],
        reasoning: 'Assessment focus with low authority.'
      };

      // Manually create misaligned customization
      const customization = PersonaCustomizer.generateCustomization(
        observerClassification,
        mockUserProfile,
        mockUserContext
      );

      // Force misalignment for testing
      customization.serviceRecommendation.tier = 'Strategic Advantage';

      const validation = PersonaCustomizer.validateCustomization(
        customization,
        observerClassification
      );

      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some(w => w.includes('may not align'))).toBe(true);
    });

    it('should warn about high-tier recommendation with low confidence', () => {
      const lowConfidenceClassification: PersonaClassification = {
        primaryPersona: 'Strategic Architect',
        confidenceScore: 0.6, // Low confidence
        secondaryCharacteristics: [],
        reasoning: 'Uncertain classification.'
      };

      const customization = PersonaCustomizer.generateCustomization(
        lowConfidenceClassification,
        mockUserProfile,
        mockUserContext
      );

      const validation = PersonaCustomizer.validateCustomization(
        customization,
        lowConfidenceClassification
      );

      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some(w => w.includes('low classification confidence'))).toBe(true);
    });
  });

  describe('integration with PersonaClassifier', () => {
    it('should work seamlessly with PersonaClassifier output', () => {
      // This test ensures the PersonaCustomizer can handle real PersonaClassifier output
      const mockClassification: PersonaClassification = {
        primaryPersona: 'Strategic Catalyst',
        confidenceScore: 0.82,
        secondaryCharacteristics: ['Strategic Architect authority level', 'Strategic Contributor implementation approach'],
        reasoning: 'Classified as Strategic Catalyst based on strategic authority level of 65% and organizational influence of 75%. Strong influence (75%) and implementation readiness (80%) suggest change leadership potential.'
      };

      const customization = PersonaCustomizer.generateCustomization(
        mockClassification,
        mockUserProfile,
        mockUserContext,
        mockIndustryInsights
      );

      expect(customization).toBeDefined();
      expect(customization.content).toBeDefined();
      expect(customization.serviceRecommendation).toBeDefined();
      expect(customization.customizedMessaging).toBeDefined();
      
      // Validate the customization
      const validation = PersonaCustomizer.validateCustomization(
        customization,
        mockClassification
      );
      
      expect(validation.isValid).toBe(true);
    });
  });
});