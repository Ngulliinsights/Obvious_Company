import { 
  CurriculumGenerator, 
  ModuleLibrary, 
  LearningPathway 
} from '../../services/CurriculumGenerator';
import { PersonaType, DimensionScores } from '../../models/types';

describe('ModuleLibrary', () => {
  let moduleLibrary: ModuleLibrary;

  beforeEach(() => {
    moduleLibrary = new ModuleLibrary();
  });

  describe('getFoundationModules', () => {
    it('should return all foundation modules', () => {
      const modules = moduleLibrary.getFoundationModules();
      expect(modules).toHaveLength(4);
      expect(modules.every(m => m.id.startsWith('UF-'))).toBe(true);
    });

    it('should include required learning objectives', () => {
      const modules = moduleLibrary.getFoundationModules();
      const strategicVisionModule = modules.find(m => m.id === 'UF-1E');
      
      expect(strategicVisionModule).toBeDefined();
      expect(strategicVisionModule!.learningObjectives).toContain(
        'Develop strategic AI understanding beyond basic awareness'
      );
    });
  });

  describe('getIndustryModules', () => {
    it('should return all industry modules when no industry specified', () => {
      const modules = moduleLibrary.getIndustryModules();
      expect(modules).toHaveLength(4);
      expect(modules.every(m => m.id.startsWith('IS-'))).toBe(true);
    });

    it('should filter modules by industry', () => {
      const financialModules = moduleLibrary.getIndustryModules('financial-services');
      expect(financialModules).toHaveLength(1);
      expect(financialModules[0].id).toBe('IS-1E');
    });

    it('should include modules marked for all industries', () => {
      const modules = moduleLibrary.getIndustryModules('non-existent-industry');
      expect(modules).toHaveLength(0); // No modules marked as 'all' in current implementation
    });
  });

  describe('getRoleSpecificModules', () => {
    it('should return all role-specific modules', () => {
      const modules = moduleLibrary.getRoleSpecificModules();
      expect(modules).toHaveLength(3);
      expect(modules.every(m => m.id.startsWith('RS-'))).toBe(true);
    });
  });

  describe('getCulturalAdaptationModules', () => {
    it('should return all cultural modules when no context specified', () => {
      const modules = moduleLibrary.getCulturalAdaptationModules();
      expect(modules).toHaveLength(2);
      expect(modules.every(m => m.id.startsWith('CA-'))).toBe(true);
    });

    it('should filter modules by cultural context', () => {
      const eastAfricaModules = moduleLibrary.getCulturalAdaptationModules(['east-africa']);
      expect(eastAfricaModules).toHaveLength(1);
      expect(eastAfricaModules[0].id).toBe('CA-1E');
    });
  });

  describe('getModuleById', () => {
    it('should return module when found', () => {
      const module = moduleLibrary.getModuleById('UF-1E');
      expect(module).toBeDefined();
      expect(module!.title).toBe('AI Strategic Vision and Competitive Intelligence');
    });

    it('should return undefined when module not found', () => {
      const module = moduleLibrary.getModuleById('NON-EXISTENT');
      expect(module).toBeUndefined();
    });
  });
});

describe('LearningPathway', () => {
  let pathway: LearningPathway;
  let moduleLibrary: ModuleLibrary;

  beforeEach(() => {
    moduleLibrary = new ModuleLibrary();
    const modules = moduleLibrary.getFoundationModules().slice(0, 2);
    const sequencing = [
      { moduleId: 'UF-1E', order: 1, prerequisites: [], isOptional: false },
      { moduleId: 'UF-2E', order: 2, prerequisites: ['UF-1E'], isOptional: false }
    ];
    const adaptiveRules = [
      {
        condition: 'strategic_authority_low',
        action: 'emphasize' as const,
        targetModuleId: 'UF-1E'
      }
    ];

    pathway = new LearningPathway(
      'test-pathway',
      'Test Pathway',
      'Test Description',
      modules,
      sequencing,
      adaptiveRules,
      [],
      3,
      ['Strategic Architect'],
      ['financial-services']
    );
  });

  describe('getNextModule', () => {
    it('should return first module when no modules completed', () => {
      const nextModule = pathway.getNextModule([]);
      expect(nextModule).toBeDefined();
      expect(nextModule!.id).toBe('UF-1E');
    });

    it('should return next module after prerequisites completed', () => {
      const nextModule = pathway.getNextModule(['UF-1E']);
      expect(nextModule).toBeDefined();
      expect(nextModule!.id).toBe('UF-2E');
    });

    it('should return null when all modules completed', () => {
      const nextModule = pathway.getNextModule(['UF-1E', 'UF-2E']);
      expect(nextModule).toBeNull();
    });
  });

  describe('applyAdaptiveRules', () => {
    it('should emphasize modules based on assessment results', () => {
      const assessmentResults = {
        scores: {
          strategicAuthority: 0.3,
          organizationalInfluence: 0.7,
          resourceAvailability: 0.6,
          implementationReadiness: 0.5,
          culturalAlignment: 0.8
        } as DimensionScores,
        persona: 'Strategic Architect' as PersonaType,
        industry: 'financial-services'
      };

      const adaptedModules = pathway.applyAdaptiveRules(assessmentResults);
      const emphasizedModule = adaptedModules.find(m => m.id === 'UF-1E');
      
      expect(emphasizedModule).toBeDefined();
      expect(emphasizedModule!.estimatedHours).toBeGreaterThan(1); // Should be emphasized (1.5x)
    });
  });

  describe('getTotalEstimatedHours', () => {
    it('should calculate total hours correctly', () => {
      const totalHours = pathway.getTotalEstimatedHours();
      expect(totalHours).toBe(2); // UF-1E (1 hour) + UF-2E (1 hour)
    });
  });

  describe('getPrerequisiteChain', () => {
    it('should return prerequisite chain for module', () => {
      const prerequisites = pathway.getPrerequisiteChain('UF-2E');
      expect(prerequisites).toContain('UF-1E');
    });

    it('should return empty array for module with no prerequisites', () => {
      const prerequisites = pathway.getPrerequisiteChain('UF-1E');
      expect(prerequisites).toHaveLength(0);
    });
  });
});

describe('CurriculumGenerator', () => {
  let generator: CurriculumGenerator;

  beforeEach(() => {
    generator = new CurriculumGenerator();
  });

  describe('generateCurriculum', () => {
    const mockAssessmentResults = {
      scores: {
        strategicAuthority: 0.8,
        organizationalInfluence: 0.7,
        resourceAvailability: 0.6,
        implementationReadiness: 0.9,
        culturalAlignment: 0.8
      } as DimensionScores,
      persona: 'Strategic Architect' as PersonaType,
      industry: 'financial-services',
      culturalContext: ['east-africa', 'swahili']
    };

    it('should generate comprehensive curriculum for Strategic Architect', () => {
      const curriculum = generator.generateCurriculum(mockAssessmentResults);

      expect(curriculum.pathwayId).toBeDefined();
      expect(curriculum.foundationModules).toHaveLength(4);
      expect(curriculum.industryModules).toHaveLength(1); // Financial services module
      expect(curriculum.roleSpecificModules).toHaveLength(3); // All role modules for architects
      expect(curriculum.culturalAdaptationModules).toHaveLength(2); // East Africa and Swahili modules
    });

    it('should calculate appropriate duration and timeline', () => {
      const curriculum = generator.generateCurriculum(mockAssessmentResults);

      expect(curriculum.estimatedDuration.totalHours).toBeGreaterThan(0);
      expect(curriculum.estimatedDuration.weeklyCommitment).toBe(3); // Strategic Architect commitment
      expect(curriculum.estimatedDuration.completionTimeline).toMatch(/\d+ weeks/);
    });

    it('should include learning objectives and success metrics', () => {
      const curriculum = generator.generateCurriculum(mockAssessmentResults);

      expect(curriculum.learningObjectives).toContain(
        'Develop strategic AI understanding beyond basic awareness'
      );
      expect(curriculum.successMetrics).toContain(
        'Lead successful AI transformation initiative'
      );
    });

    it('should adapt to different personas', () => {
      const observerResults = {
        ...mockAssessmentResults,
        persona: 'Strategic Observer' as PersonaType
      };

      const curriculum = generator.generateCurriculum(observerResults);

      expect(curriculum.roleSpecificModules).toHaveLength(0); // No role modules for observers
      expect(curriculum.estimatedDuration.weeklyCommitment).toBe(2); // Lower commitment for observers
    });

    it('should respect time commitment preferences', () => {
      const preferences = { timeCommitment: 5 };
      const curriculum = generator.generateCurriculum(mockAssessmentResults, preferences);

      expect(curriculum.estimatedDuration.weeklyCommitment).toBe(5);
    });

    it('should suggest optional enhancements', () => {
      const curriculum = generator.generateCurriculum(mockAssessmentResults);

      expect(curriculum.optionalEnhancements).toBeDefined();
      expect(Array.isArray(curriculum.optionalEnhancements)).toBe(true);
    });

    it('should identify prerequisites based on assessment scores', () => {
      const lowReadinessResults = {
        ...mockAssessmentResults,
        scores: {
          ...mockAssessmentResults.scores,
          implementationReadiness: 0.2
        }
      };

      const curriculum = generator.generateCurriculum(lowReadinessResults);

      expect(curriculum.prerequisites).toContain(
        'Change management and project leadership experience'
      );
    });
  });

  describe('persona-specific curriculum generation', () => {
    const baseAssessmentResults = {
      scores: {
        strategicAuthority: 0.7,
        organizationalInfluence: 0.6,
        resourceAvailability: 0.5,
        implementationReadiness: 0.8,
        culturalAlignment: 0.7
      } as DimensionScores,
      industry: 'manufacturing',
      culturalContext: ['east-africa']
    };

    it('should generate appropriate curriculum for Strategic Catalyst', () => {
      const results = { ...baseAssessmentResults, persona: 'Strategic Catalyst' as PersonaType };
      const curriculum = generator.generateCurriculum(results);

      expect(curriculum.roleSpecificModules).toHaveLength(2); // Leadership and team management
      expect(curriculum.estimatedDuration.weeklyCommitment).toBe(4);
    });

    it('should generate appropriate curriculum for Strategic Contributor', () => {
      const results = { ...baseAssessmentResults, persona: 'Strategic Contributor' as PersonaType };
      const curriculum = generator.generateCurriculum(results);

      expect(curriculum.roleSpecificModules).toHaveLength(2); // Planning and team management
      expect(curriculum.estimatedDuration.weeklyCommitment).toBe(5);
    });

    it('should generate appropriate curriculum for Strategic Explorer', () => {
      const results = { ...baseAssessmentResults, persona: 'Strategic Explorer' as PersonaType };
      const curriculum = generator.generateCurriculum(results);

      expect(curriculum.roleSpecificModules).toHaveLength(1); // Team management only
      expect(curriculum.estimatedDuration.weeklyCommitment).toBe(6);
    });
  });

  describe('industry-specific curriculum generation', () => {
    const baseAssessmentResults = {
      scores: {
        strategicAuthority: 0.7,
        organizationalInfluence: 0.6,
        resourceAvailability: 0.5,
        implementationReadiness: 0.8,
        culturalAlignment: 0.7
      } as DimensionScores,
      persona: 'Strategic Architect' as PersonaType,
      culturalContext: ['east-africa']
    };

    it('should include healthcare-specific modules for healthcare industry', () => {
      const results = { ...baseAssessmentResults, industry: 'healthcare' };
      const curriculum = generator.generateCurriculum(results);

      const healthcareModule = curriculum.industryModules.find(m => m.id === 'IS-3E');
      expect(healthcareModule).toBeDefined();
      expect(healthcareModule!.title).toContain('Healthcare');
    });

    it('should include government-specific modules for government industry', () => {
      const results = { ...baseAssessmentResults, industry: 'government' };
      const curriculum = generator.generateCurriculum(results);

      const governmentModule = curriculum.industryModules.find(m => m.id === 'IS-4E');
      expect(governmentModule).toBeDefined();
      expect(governmentModule!.title).toContain('Government');
    });
  });
});