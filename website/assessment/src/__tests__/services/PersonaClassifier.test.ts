import { describe, it, expect, beforeEach } from 'vitest';
import { PersonaClassifier } from '../../services/PersonaClassifier';
import { 
  DimensionScores, 
  PersonaType,
  UserContext 
} from '../../models/types';
import { UserProfile, UserProfileModel } from '../../models/UserProfile';

describe('PersonaClassifier', () => {
  let mockUserProfile: UserProfile;
  let mockUserContext: UserContext;

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
  });

  describe('classifyPersona', () => {
    it('should classify Strategic Architect correctly', () => {
      const highScores: DimensionScores = {
        strategicAuthority: 85,
        organizationalInfluence: 80,
        resourceAvailability: 75,
        implementationReadiness: 70,
        culturalAlignment: 65
      };

      const classification = PersonaClassifier.classifyPersona(
        highScores,
        mockUserProfile,
        mockUserContext
      );

      expect(classification.primaryPersona).toBe('Strategic Architect');
      expect(classification.confidenceScore).toBeGreaterThan(0.7);
      expect(classification.reasoning).toContain('Strategic Architect');
    });

    it('should classify Strategic Catalyst correctly', () => {
      const catalystScores: DimensionScores = {
        strategicAuthority: 65,
        organizationalInfluence: 75,
        resourceAvailability: 60,
        implementationReadiness: 80,
        culturalAlignment: 70
      };

      const classification = PersonaClassifier.classifyPersona(
        catalystScores,
        mockUserProfile,
        mockUserContext
      );

      expect(classification.primaryPersona).toBe('Strategic Catalyst');
      expect(classification.confidenceScore).toBeGreaterThan(0.5);
      expect(classification.reasoning).toContain('Strategic Catalyst');
    });

    it('should classify Strategic Contributor correctly', () => {
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

      expect(classification.primaryPersona).toBe('Strategic Contributor');
      expect(classification.confidenceScore).toBeGreaterThan(0.5);
    });

    it('should classify Strategic Explorer correctly', () => {
      const explorerScores: DimensionScores = {
        strategicAuthority: 30,
        organizationalInfluence: 45,
        resourceAvailability: 35,
        implementationReadiness: 75,
        culturalAlignment: 70
      };

      const classification = PersonaClassifier.classifyPersona(
        explorerScores,
        mockUserProfile,
        mockUserContext
      );

      expect(classification.primaryPersona).toBe('Strategic Explorer');
      expect(classification.confidenceScore).toBeGreaterThan(0.5);
      expect(classification.reasoning).toContain('implementation readiness');
    });

    it('should classify Strategic Observer correctly', () => {
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

      expect(classification.primaryPersona).toBe('Strategic Observer');
      expect(classification.confidenceScore).toBeGreaterThan(0.5);
    });

    it('should apply cultural adjustments for East African context', () => {
      const moderateScores: DimensionScores = {
        strategicAuthority: 70,
        organizationalInfluence: 65,
        resourceAvailability: 60,
        implementationReadiness: 65,
        culturalAlignment: 70
      };

      const eastAfricanContext = {
        ...mockUserContext,
        geographicRegion: 'east-africa',
        culturalContext: ['east-africa']
      };

      const classification = PersonaClassifier.classifyPersona(
        moderateScores,
        mockUserProfile,
        eastAfricanContext
      );

      // Should apply cultural adjustments that may boost scores
      expect(classification.primaryPersona).toBeDefined();
      expect(classification.confidenceScore).toBeGreaterThan(0.5);
    });

    it('should handle edge case scores', () => {
      const edgeScores: DimensionScores = {
        strategicAuthority: 0,
        organizationalInfluence: 0,
        resourceAvailability: 0,
        implementationReadiness: 0,
        culturalAlignment: 0
      };

      const classification = PersonaClassifier.classifyPersona(
        edgeScores,
        mockUserProfile,
        mockUserContext
      );

      expect(classification.primaryPersona).toBe('Strategic Observer');
      expect(classification.confidenceScore).toBeGreaterThan(0);
    });

    it('should handle maximum scores', () => {
      const maxScores: DimensionScores = {
        strategicAuthority: 100,
        organizationalInfluence: 100,
        resourceAvailability: 100,
        implementationReadiness: 100,
        culturalAlignment: 100
      };

      const classification = PersonaClassifier.classifyPersona(
        maxScores,
        mockUserProfile,
        mockUserContext
      );

      expect(classification.primaryPersona).toBe('Strategic Architect');
      expect(classification.confidenceScore).toBeGreaterThan(0.8);
    });
  });

  describe('confidence score calculation', () => {
    it('should provide high confidence for clear matches', () => {
      const clearArchitectScores: DimensionScores = {
        strategicAuthority: 90,
        organizationalInfluence: 85,
        resourceAvailability: 80,
        implementationReadiness: 75,
        culturalAlignment: 70
      };

      const classification = PersonaClassifier.classifyPersona(
        clearArchitectScores,
        mockUserProfile,
        mockUserContext
      );

      expect(classification.confidenceScore).toBeGreaterThan(0.8);
    });

    it('should provide lower confidence for borderline cases', () => {
      const borderlineScores: DimensionScores = {
        strategicAuthority: 50,
        organizationalInfluence: 50,
        resourceAvailability: 50,
        implementationReadiness: 50,
        culturalAlignment: 50
      };

      const classification = PersonaClassifier.classifyPersona(
        borderlineScores,
        mockUserProfile,
        mockUserContext
      );

      expect(classification.confidenceScore).toBeLessThan(0.8);
      expect(classification.confidenceScore).toBeGreaterThan(0.5);
    });
  });

  describe('secondary characteristics identification', () => {
    it('should identify secondary characteristics', () => {
      const mixedScores: DimensionScores = {
        strategicAuthority: 85, // Architect level
        organizationalInfluence: 45, // Explorer level
        resourceAvailability: 70, // Architect level
        implementationReadiness: 80, // Catalyst level
        culturalAlignment: 60
      };

      const classification = PersonaClassifier.classifyPersona(
        mixedScores,
        mockUserProfile,
        mockUserContext
      );

      expect(classification.secondaryCharacteristics).toBeDefined();
      expect(Array.isArray(classification.secondaryCharacteristics)).toBe(true);
    });

    it('should limit secondary characteristics to reasonable number', () => {
      const mixedScores: DimensionScores = {
        strategicAuthority: 85,
        organizationalInfluence: 45,
        resourceAvailability: 70,
        implementationReadiness: 80,
        culturalAlignment: 60
      };

      const classification = PersonaClassifier.classifyPersona(
        mixedScores,
        mockUserProfile,
        mockUserContext
      );

      expect(classification.secondaryCharacteristics.length).toBeLessThanOrEqual(3);
    });
  });

  describe('reasoning generation', () => {
    it('should provide meaningful reasoning', () => {
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

      expect(classification.reasoning).toBeDefined();
      expect(classification.reasoning!.length).toBeGreaterThan(50);
      expect(classification.reasoning).toContain(classification.primaryPersona);
    });

    it('should include score information in reasoning', () => {
      const scores: DimensionScores = {
        strategicAuthority: 85,
        organizationalInfluence: 80,
        resourceAvailability: 75,
        implementationReadiness: 70,
        culturalAlignment: 65
      };

      const classification = PersonaClassifier.classifyPersona(
        scores,
        mockUserProfile,
        mockUserContext
      );

      expect(classification.reasoning).toContain('85%');
      expect(classification.reasoning).toContain('80%');
    });
  });

  describe('getPersonaCharacteristics', () => {
    it('should return characteristics for valid persona', () => {
      const characteristics = PersonaClassifier.getPersonaCharacteristics('Strategic Architect');
      
      expect(characteristics).toBeDefined();
      expect(characteristics!.authorityRange).toBeDefined();
      expect(characteristics!.investmentCapacity).toBeDefined();
      expect(characteristics!.decisionMakingPower).toBeDefined();
    });

    it('should return null for invalid persona', () => {
      const characteristics = PersonaClassifier.getPersonaCharacteristics('Invalid Persona' as PersonaType);
      
      expect(characteristics).toBeNull();
    });
  });

  describe('getAllPersonaCharacteristics', () => {
    it('should return all persona characteristics', () => {
      const allCharacteristics = PersonaClassifier.getAllPersonaCharacteristics();
      
      expect(Object.keys(allCharacteristics)).toHaveLength(5);
      expect(allCharacteristics['Strategic Architect']).toBeDefined();
      expect(allCharacteristics['Strategic Catalyst']).toBeDefined();
      expect(allCharacteristics['Strategic Contributor']).toBeDefined();
      expect(allCharacteristics['Strategic Explorer']).toBeDefined();
      expect(allCharacteristics['Strategic Observer']).toBeDefined();
    });
  });

  describe('validateClassification', () => {
    it('should validate correct classification', () => {
      const validClassification = {
        primaryPersona: 'Strategic Architect' as PersonaType,
        confidenceScore: 0.85,
        secondaryCharacteristics: ['Strategic Catalyst authority level'],
        reasoning: 'High authority and influence scores indicate Strategic Architect classification.'
      };

      const executiveProfile = {
        ...mockUserProfile,
        professional: {
          ...mockUserProfile.professional,
          roleLevel: 'ceo'
        }
      };

      const validation = PersonaClassifier.validateClassification(
        validClassification,
        executiveProfile
      );

      expect(validation.isValid).toBe(true);
      expect(validation.warnings.length).toBeLessThanOrEqual(1);
    });

    it('should warn about low confidence', () => {
      const lowConfidenceClassification = {
        primaryPersona: 'Strategic Contributor' as PersonaType,
        confidenceScore: 0.6,
        secondaryCharacteristics: [],
        reasoning: 'Moderate scores suggest Strategic Contributor.'
      };

      const validation = PersonaClassifier.validateClassification(
        lowConfidenceClassification,
        mockUserProfile
      );

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('Low confidence in classification - consider additional assessment');
    });

    it('should warn about role level inconsistency', () => {
      const architectClassification = {
        primaryPersona: 'Strategic Architect' as PersonaType,
        confidenceScore: 0.9,
        secondaryCharacteristics: [],
        reasoning: 'High scores indicate Strategic Architect.'
      };

      const juniorProfile = {
        ...mockUserProfile,
        professional: {
          ...mockUserProfile.professional,
          roleLevel: 'junior'
        }
      };

      const validation = PersonaClassifier.validateClassification(
        architectClassification,
        juniorProfile
      );

      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some(w => w.includes('role level'))).toBe(true);
    });

    it('should handle invalid persona type', () => {
      const invalidClassification = {
        primaryPersona: 'Invalid Persona' as PersonaType,
        confidenceScore: 0.8,
        secondaryCharacteristics: [],
        reasoning: 'Invalid classification.'
      };

      const validation = PersonaClassifier.validateClassification(
        invalidClassification,
        mockUserProfile
      );

      expect(validation.isValid).toBe(false);
      expect(validation.warnings).toContain('Invalid persona type');
    });
  });

  describe('decision tree traversal', () => {
    it('should consistently classify same scores', () => {
      const consistentScores: DimensionScores = {
        strategicAuthority: 75,
        organizationalInfluence: 70,
        resourceAvailability: 65,
        implementationReadiness: 70,
        culturalAlignment: 60
      };

      const classification1 = PersonaClassifier.classifyPersona(
        consistentScores,
        mockUserProfile,
        mockUserContext
      );

      const classification2 = PersonaClassifier.classifyPersona(
        consistentScores,
        mockUserProfile,
        mockUserContext
      );

      expect(classification1.primaryPersona).toBe(classification2.primaryPersona);
    });

    it('should handle boundary conditions', () => {
      // Test exact boundary scores
      const boundaryScores: DimensionScores = {
        strategicAuthority: 80, // Exact boundary for high authority
        organizationalInfluence: 75, // Exact boundary for high influence
        resourceAvailability: 70, // Exact boundary for high resources
        implementationReadiness: 60, // Exact boundary for readiness
        culturalAlignment: 50
      };

      const classification = PersonaClassifier.classifyPersona(
        boundaryScores,
        mockUserProfile,
        mockUserContext
      );

      expect(classification.primaryPersona).toBeDefined();
      expect(['Strategic Architect', 'Strategic Catalyst'].includes(classification.primaryPersona)).toBe(true);
    });
  });
});