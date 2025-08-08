import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersonaClassifier } from '../../services/PersonaClassifier';
import { createMockUser } from '../setup';

describe('PersonaClassifier', () => {
  let personaClassifier: PersonaClassifier;
  let mockUser: any;

  beforeEach(() => {
    personaClassifier = new PersonaClassifier();
    mockUser = createMockUser();
  });

  describe('classifyPersona', () => {
    it('should classify Strategic Architect for high authority users', async () => {
      const responses = [
        { dimension: 'strategic_authority', score: 9 },
        { dimension: 'organizational_influence', score: 8 },
        { dimension: 'resource_availability', score: 9 },
        { dimension: 'implementation_readiness', score: 8 }
      ];

      const classification = await personaClassifier.classifyPersona(responses, mockUser);

      expect(classification.primary_persona).toBe('Strategic Architect');
      expect(classification.confidence_score).toBeGreaterThan(0.8);
      expect(classification.characteristics).toContain('enterprise-wide authority');
    });

    it('should classify Strategic Catalyst for influential change leaders', async () => {
      const responses = [
        { dimension: 'strategic_authority', score: 6 },
        { dimension: 'organizational_influence', score: 9 },
        { dimension: 'resource_availability', score: 7 },
        { dimension: 'implementation_readiness', score: 8 }
      ];

      const classification = await personaClassifier.classifyPersona(responses, mockUser);

      expect(classification.primary_persona).toBe('Strategic Catalyst');
      expect(classification.characteristics).toContain('change leadership');
    });

    it('should classify Strategic Contributor for tactical implementers', async () => {
      const responses = [
        { dimension: 'strategic_authority', score: 5 },
        { dimension: 'organizational_influence', score: 6 },
        { dimension: 'resource_availability', score: 6 },
        { dimension: 'implementation_readiness', score: 8 }
      ];

      const classification = await personaClassifier.classifyPersona(responses, mockUser);

      expect(classification.primary_persona).toBe('Strategic Contributor');
      expect(classification.characteristics).toContain('tactical implementation');
    });

    it('should classify Strategic Explorer for emerging leaders', async () => {
      const responses = [
        { dimension: 'strategic_authority', score: 4 },
        { dimension: 'organizational_influence', score: 5 },
        { dimension: 'resource_availability', score: 5 },
        { dimension: 'implementation_readiness', score: 7 }
      ];

      const classification = await personaClassifier.classifyPersona(responses, mockUser);

      expect(classification.primary_persona).toBe('Strategic Explorer');
      expect(classification.characteristics).toContain('development potential');
    });

    it('should classify Strategic Observer for assessment-focused users', async () => {
      const responses = [
        { dimension: 'strategic_authority', score: 3 },
        { dimension: 'organizational_influence', score: 3 },
        { dimension: 'resource_availability', score: 3 },
        { dimension: 'implementation_readiness', score: 4 }
      ];

      const classification = await personaClassifier.classifyPersona(responses, mockUser);

      expect(classification.primary_persona).toBe('Strategic Observer');
      expect(classification.characteristics).toContain('assessment-based consultation');
    });
  });

  describe('calculateAuthorityScore', () => {
    it('should calculate authority based on role level and decision power', () => {
      const userWithHighAuthority = {
        ...mockUser,
        professional: {
          ...mockUser.professional,
          role_level: 'C-Suite',
          decision_authority: 9,
          organization_size: '1000+'
        }
      };

      const score = personaClassifier.calculateAuthorityScore(userWithHighAuthority);

      expect(score).toBeGreaterThan(8);
    });

    it('should adjust for organization size', () => {
      const smallOrgUser = {
        ...mockUser,
        professional: {
          ...mockUser.professional,
          role_level: 'Director',
          decision_authority: 7,
          organization_size: '10-50'
        }
      };

      const largeOrgUser = {
        ...mockUser,
        professional: {
          ...mockUser.professional,
          role_level: 'Director',
          decision_authority: 7,
          organization_size: '1000+'
        }
      };

      const smallOrgScore = personaClassifier.calculateAuthorityScore(smallOrgUser);
      const largeOrgScore = personaClassifier.calculateAuthorityScore(largeOrgUser);

      expect(smallOrgScore).toBeGreaterThan(largeOrgScore);
    });
  });

  describe('assessResourceAvailability', () => {
    it('should evaluate investment capacity based on persona and organization', () => {
      const architectUser = {
        ...mockUser,
        professional: {
          ...mockUser.professional,
          role_level: 'C-Suite',
          organization_size: '500-1000'
        }
      };

      const resourceScore = personaClassifier.assessResourceAvailability(
        architectUser, 
        'Strategic Architect'
      );

      expect(resourceScore).toBeGreaterThan(7);
    });

    it('should consider cultural context in resource assessment', () => {
      const kenyanUser = {
        ...mockUser,
        demographics: {
          ...mockUser.demographics,
          geographic_region: 'Kenya',
          cultural_context: ['East African']
        }
      };

      const resourceScore = personaClassifier.assessResourceAvailability(
        kenyanUser, 
        'Strategic Contributor'
      );

      expect(resourceScore).toBeDefined();
      expect(resourceScore).toBeGreaterThanOrEqual(1);
      expect(resourceScore).toBeLessThanOrEqual(10);
    });
  });

  describe('evaluateImplementationReadiness', () => {
    it('should assess readiness based on experience and change capacity', () => {
      const experiencedUser = {
        ...mockUser,
        professional: {
          ...mockUser.professional,
          years_experience: 15,
          role_level: 'Senior Manager'
        }
      };

      const readinessScore = personaClassifier.evaluateImplementationReadiness(experiencedUser);

      expect(readinessScore).toBeGreaterThan(6);
    });

    it('should consider industry maturity in readiness assessment', () => {
      const techUser = {
        ...mockUser,
        professional: {
          ...mockUser.professional,
          industry: 'Technology'
        }
      };

      const financeUser = {
        ...mockUser,
        professional: {
          ...mockUser.professional,
          industry: 'Financial Services'
        }
      };

      const techReadiness = personaClassifier.evaluateImplementationReadiness(techUser);
      const financeReadiness = personaClassifier.evaluateImplementationReadiness(financeUser);

      expect(techReadiness).toBeGreaterThan(financeReadiness);
    });
  });

  describe('generatePersonaRecommendations', () => {
    it('should provide persona-specific service recommendations', () => {
      const recommendations = personaClassifier.generatePersonaRecommendations(
        'Strategic Architect',
        mockUser
      );

      expect(recommendations.service_tier).toBe('Strategic Advantage');
      expect(recommendations.investment_range).toContain('$50K-75K');
      expect(recommendations.next_steps).toContain('enterprise');
    });

    it('should adapt recommendations for cultural context', () => {
      const kenyanUser = {
        ...mockUser,
        demographics: {
          ...mockUser.demographics,
          geographic_region: 'Kenya'
        }
      };

      const recommendations = personaClassifier.generatePersonaRecommendations(
        'Strategic Contributor',
        kenyanUser
      );

      expect(recommendations.investment_range).toContain('KSH');
      expect(recommendations.cultural_considerations).toContain('East African');
    });

    it('should provide industry-specific recommendations', () => {
      const healthcareUser = {
        ...mockUser,
        professional: {
          ...mockUser.professional,
          industry: 'Healthcare'
        }
      };

      const recommendations = personaClassifier.generatePersonaRecommendations(
        'Strategic Catalyst',
        healthcareUser
      );

      expect(recommendations.industry_focus).toContain('patient outcomes');
      expect(recommendations.regulatory_considerations).toContain('healthcare');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle incomplete response data', async () => {
      const incompleteResponses = [
        { dimension: 'strategic_authority', score: 7 }
        // Missing other dimensions
      ];

      const classification = await personaClassifier.classifyPersona(
        incompleteResponses, 
        mockUser
      );

      expect(classification.primary_persona).toBeDefined();
      expect(classification.confidence_score).toBeLessThan(0.7);
    });

    it('should handle invalid score ranges', async () => {
      const invalidResponses = [
        { dimension: 'strategic_authority', score: 15 }, // Out of range
        { dimension: 'organizational_influence', score: -2 }, // Negative
        { dimension: 'resource_availability', score: NaN }, // Invalid
        { dimension: 'implementation_readiness', score: null } // Null
      ];

      const classification = await personaClassifier.classifyPersona(
        invalidResponses as any, 
        mockUser
      );

      expect(classification.primary_persona).toBe('Strategic Observer');
      expect(classification.confidence_score).toBeLessThan(0.5);
    });

    it('should provide fallback classification for edge cases', async () => {
      const edgeCaseResponses = [
        { dimension: 'strategic_authority', score: 5.5 },
        { dimension: 'organizational_influence', score: 5.5 },
        { dimension: 'resource_availability', score: 5.5 },
        { dimension: 'implementation_readiness', score: 5.5 }
      ];

      const classification = await personaClassifier.classifyPersona(
        edgeCaseResponses, 
        mockUser
      );

      expect(classification.primary_persona).toBeDefined();
      expect(classification.secondary_characteristics).toBeDefined();
      expect(classification.secondary_characteristics.length).toBeGreaterThan(0);
    });
  });
});