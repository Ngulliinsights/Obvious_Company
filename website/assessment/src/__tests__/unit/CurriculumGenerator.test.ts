import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CurriculumGenerator } from '../../services/CurriculumGenerator';
import { createMockUser } from '../setup';

describe('CurriculumGenerator', () => {
  let curriculumGenerator: CurriculumGenerator;
  let mockUser: any;
  let mockAssessmentResults: any;

  beforeEach(() => {
    curriculumGenerator = new CurriculumGenerator();
    mockUser = createMockUser();
    mockAssessmentResults = {
      overall_score: 75,
      dimension_scores: {
        strategic_authority: 8,
        organizational_influence: 7,
        resource_availability: 6,
        implementation_readiness: 8,
        cultural_alignment: 9
      },
      persona_classification: {
        primary_persona: 'Strategic Catalyst',
        confidence_score: 0.85,
        secondary_characteristics: ['change leadership', 'innovation focus']
      },
      industry_insights: {
        sector_readiness: 7,
        regulatory_considerations: ['data privacy', 'compliance'],
        implementation_priorities: ['process optimization', 'team training']
      }
    };
  });

  describe('generateCurriculum', () => {
    it('should create personalized curriculum based on assessment results', async () => {
      const curriculum = await curriculumGenerator.generateCurriculum(
        mockAssessmentResults,
        mockUser
      );

      expect(curriculum).toBeDefined();
      expect(curriculum.pathway_id).toBeDefined();
      expect(curriculum.foundation_modules).toBeDefined();
      expect(curriculum.industry_modules).toBeDefined();
      expect(curriculum.role_specific_modules).toBeDefined();
      expect(curriculum.estimated_duration).toBeDefined();
    });

    it('should include appropriate foundation modules for all personas', async () => {
      const curriculum = await curriculumGenerator.generateCurriculum(
        mockAssessmentResults,
        mockUser
      );

      const foundationTopics = curriculum.foundation_modules.map(m => m.topic);
      
      expect(foundationTopics).toContain('AI Fundamentals');
      expect(foundationTopics).toContain('Strategic Thinking');
      expect(foundationTopics).toContain('Change Management');
      expect(foundationTopics).toContain('Ethics and Governance');
    });

    it('should customize modules based on persona classification', async () => {
      const architectResults = {
        ...mockAssessmentResults,
        persona_classification: {
          primary_persona: 'Strategic Architect',
          confidence_score: 0.9,
          secondary_characteristics: ['enterprise leadership']
        }
      };

      const curriculum = await curriculumGenerator.generateCurriculum(
        architectResults,
        mockUser
      );

      const roleModules = curriculum.role_specific_modules.map(m => m.topic);
      
      expect(roleModules).toContain('Enterprise AI Strategy');
      expect(roleModules).toContain('Board-Level Communication');
      expect(roleModules).toContain('Investment Decision Making');
    });

    it('should adapt curriculum for industry context', async () => {
      const healthcareUser = {
        ...mockUser,
        professional: {
          ...mockUser.professional,
          industry: 'Healthcare'
        }
      };

      const curriculum = await curriculumGenerator.generateCurriculum(
        mockAssessmentResults,
        healthcareUser
      );

      const industryTopics = curriculum.industry_modules.map(m => m.topic);
      
      expect(industryTopics).toContain('Healthcare AI Applications');
      expect(industryTopics).toContain('Patient Privacy and Ethics');
      expect(industryTopics).toContain('Clinical Decision Support');
    });

    it('should include cultural adaptation modules', async () => {
      const curriculum = await curriculumGenerator.generateCurriculum(
        mockAssessmentResults,
        mockUser
      );

      expect(curriculum.cultural_adaptation_modules).toBeDefined();
      expect(curriculum.cultural_adaptation_modules.length).toBeGreaterThan(0);
      
      const culturalTopics = curriculum.cultural_adaptation_modules.map(m => m.topic);
      expect(culturalTopics).toContain('East African Business Context');
    });
  });

  describe('estimateDuration', () => {
    it('should calculate realistic time commitments', async () => {
      const curriculum = await curriculumGenerator.generateCurriculum(
        mockAssessmentResults,
        mockUser
      );

      expect(curriculum.estimated_duration.total_hours).toBeGreaterThan(0);
      expect(curriculum.estimated_duration.weekly_commitment).toBeGreaterThan(0);
      expect(curriculum.estimated_duration.completion_timeline).toBeDefined();
    });

    it('should adjust duration based on persona and availability', async () => {
      const busyExecutiveResults = {
        ...mockAssessmentResults,
        persona_classification: {
          primary_persona: 'Strategic Architect',
          confidence_score: 0.9,
          secondary_characteristics: ['time-constrained']
        }
      };

      const curriculum = await curriculumGenerator.generateCurriculum(
        busyExecutiveResults,
        mockUser
      );

      expect(curriculum.estimated_duration.weekly_commitment).toBeLessThanOrEqual(5);
      expect(curriculum.estimated_duration.completion_timeline).toContain('months');
    });

    it('should provide flexible scheduling options', async () => {
      const curriculum = await curriculumGenerator.generateCurriculum(
        mockAssessmentResults,
        mockUser
      );

      expect(curriculum.scheduling_options).toBeDefined();
      expect(curriculum.scheduling_options.intensive).toBeDefined();
      expect(curriculum.scheduling_options.standard).toBeDefined();
      expect(curriculum.scheduling_options.extended).toBeDefined();
    });
  });

  describe('generateLearningObjectives', () => {
    it('should create specific, measurable learning objectives', async () => {
      const curriculum = await curriculumGenerator.generateCurriculum(
        mockAssessmentResults,
        mockUser
      );

      expect(curriculum.learning_objectives).toBeDefined();
      expect(curriculum.learning_objectives.length).toBeGreaterThan(3);
      
      curriculum.learning_objectives.forEach(objective => {
        expect(objective).toMatch(/^(Understand|Develop|Implement|Analyze|Evaluate)/);
      });
    });

    it('should align objectives with assessment gaps', async () => {
      const lowReadinessResults = {
        ...mockAssessmentResults,
        dimension_scores: {
          ...mockAssessmentResults.dimension_scores,
          implementation_readiness: 3
        }
      };

      const curriculum = await curriculumGenerator.generateCurriculum(
        lowReadinessResults,
        mockUser
      );

      const objectives = curriculum.learning_objectives.join(' ');
      expect(objectives).toContain('implementation');
      expect(objectives).toContain('readiness');
    });
  });

  describe('createModuleSequencing', () => {
    it('should sequence modules logically with prerequisites', async () => {
      const curriculum = await curriculumGenerator.generateCurriculum(
        mockAssessmentResults,
        mockUser
      );

      expect(curriculum.prerequisites).toBeDefined();
      
      // Foundation modules should come first
      const allModules = [
        ...curriculum.foundation_modules,
        ...curriculum.industry_modules,
        ...curriculum.role_specific_modules
      ];

      const foundationModule = allModules.find(m => m.topic === 'AI Fundamentals');
      const advancedModule = allModules.find(m => m.topic.includes('Advanced'));

      if (foundationModule && advancedModule) {
        expect(foundationModule.sequence_order).toBeLessThan(advancedModule.sequence_order);
      }
    });

    it('should handle complex prerequisite chains', async () => {
      const curriculum = await curriculumGenerator.generateCurriculum(
        mockAssessmentResults,
        mockUser
      );

      const moduleWithPrereqs = curriculum.role_specific_modules.find(
        m => m.prerequisites && m.prerequisites.length > 0
      );

      if (moduleWithPrereqs) {
        expect(moduleWithPrereqs.prerequisites).toBeDefined();
        expect(Array.isArray(moduleWithPrereqs.prerequisites)).toBe(true);
      }
    });
  });

  describe('generateSuccessMetrics', () => {
    it('should define measurable success criteria', async () => {
      const curriculum = await curriculumGenerator.generateCurriculum(
        mockAssessmentResults,
        mockUser
      );

      expect(curriculum.success_metrics).toBeDefined();
      expect(curriculum.success_metrics.length).toBeGreaterThan(0);
      
      curriculum.success_metrics.forEach(metric => {
        expect(metric).toMatch(/\d+%|\d+ (points|score|improvement)/);
      });
    });

    it('should align metrics with persona goals', async () => {
      const contributorResults = {
        ...mockAssessmentResults,
        persona_classification: {
          primary_persona: 'Strategic Contributor',
          confidence_score: 0.8,
          secondary_characteristics: ['tactical focus']
        }
      };

      const curriculum = await curriculumGenerator.generateCurriculum(
        contributorResults,
        mockUser
      );

      const metrics = curriculum.success_metrics.join(' ');
      expect(metrics).toContain('implementation');
      expect(metrics).toContain('tactical');
    });
  });

  describe('adaptCurriculumBasedOnProgress', () => {
    it('should modify curriculum based on learning progress', async () => {
      const initialCurriculum = await curriculumGenerator.generateCurriculum(
        mockAssessmentResults,
        mockUser
      );

      const progressData = {
        completed_modules: ['AI Fundamentals', 'Strategic Thinking'],
        performance_scores: { 'AI Fundamentals': 95, 'Strategic Thinking': 78 },
        time_spent: { 'AI Fundamentals': 8, 'Strategic Thinking': 12 },
        engagement_level: 'high'
      };

      const adaptedCurriculum = await curriculumGenerator.adaptCurriculumBasedOnProgress(
        initialCurriculum.pathway_id,
        progressData
      );

      expect(adaptedCurriculum).toBeDefined();
      expect(adaptedCurriculum.remaining_modules.length).toBeLessThan(
        initialCurriculum.foundation_modules.length + 
        initialCurriculum.industry_modules.length + 
        initialCurriculum.role_specific_modules.length
      );
    });

    it('should recommend additional modules for high performers', async () => {
      const progressData = {
        completed_modules: ['AI Fundamentals'],
        performance_scores: { 'AI Fundamentals': 98 },
        time_spent: { 'AI Fundamentals': 4 }, // Completed quickly
        engagement_level: 'very_high'
      };

      const curriculum = await curriculumGenerator.generateCurriculum(
        mockAssessmentResults,
        mockUser
      );

      const adaptedCurriculum = await curriculumGenerator.adaptCurriculumBasedOnProgress(
        curriculum.pathway_id,
        progressData
      );

      expect(adaptedCurriculum.optional_enhancements.length).toBeGreaterThan(0);
      expect(adaptedCurriculum.accelerated_track).toBe(true);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle missing assessment data gracefully', async () => {
      const incompleteResults = {
        overall_score: 60,
        persona_classification: {
          primary_persona: 'Strategic Observer',
          confidence_score: 0.4
        }
        // Missing other fields
      };

      const curriculum = await curriculumGenerator.generateCurriculum(
        incompleteResults as any,
        mockUser
      );

      expect(curriculum).toBeDefined();
      expect(curriculum.foundation_modules.length).toBeGreaterThan(0);
    });

    it('should provide fallback curriculum for unknown industries', async () => {
      const unknownIndustryUser = {
        ...mockUser,
        professional: {
          ...mockUser.professional,
          industry: 'Unknown Industry'
        }
      };

      const curriculum = await curriculumGenerator.generateCurriculum(
        mockAssessmentResults,
        unknownIndustryUser
      );

      expect(curriculum.industry_modules).toBeDefined();
      expect(curriculum.industry_modules.length).toBeGreaterThan(0);
      
      const generalModules = curriculum.industry_modules.filter(
        m => m.topic.includes('General') || m.topic.includes('Universal')
      );
      expect(generalModules.length).toBeGreaterThan(0);
    });

    it('should handle invalid persona classifications', async () => {
      const invalidResults = {
        ...mockAssessmentResults,
        persona_classification: {
          primary_persona: 'Invalid Persona',
          confidence_score: 0.1
        }
      };

      const curriculum = await curriculumGenerator.generateCurriculum(
        invalidResults as any,
        mockUser
      );

      expect(curriculum.role_specific_modules).toBeDefined();
      // Should default to Observer curriculum
      expect(curriculum.role_specific_modules.some(
        m => m.topic.includes('Assessment') || m.topic.includes('Foundation')
      )).toBe(true);
    });
  });
});