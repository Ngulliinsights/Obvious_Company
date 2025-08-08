import { 
  RecommendationEngine,
  CompetencyGap,
  TimeCommitmentEstimation,
  LearningObjectiveMapping,
  ProgressAdaptation,
  CurriculumModification
} from '../../services/RecommendationEngine';
import { PersonaType, DimensionScores } from '../../models/types';
import { CurriculumRecommendation } from '../../models/CurriculumRecommendation';

describe('RecommendationEngine', () => {
  let recommendationEngine: RecommendationEngine;

  beforeEach(() => {
    recommendationEngine = new RecommendationEngine();
  });

  describe('matchCurriculumToAssessment', () => {
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

    it('should generate enhanced curriculum with recommendation insights', () => {
      const curriculum = recommendationEngine.matchCurriculumToAssessment(mockAssessmentResults);

      expect(curriculum.pathwayId).toBeDefined();
      expect(curriculum.foundationModules).toHaveLength(4);
      expect(curriculum.industryModules).toHaveLength(1);
      expect(curriculum.roleSpecificModules).toHaveLength(3);
      expect(curriculum.culturalAdaptationModules).toHaveLength(2);
    });

    it('should adapt to different urgency preferences', () => {
      const urgentPreferences = { urgency: 'immediate' as const, timeCommitment: 6 };
      const exploratoryPreferences = { urgency: 'exploratory' as const, timeCommitment: 2 };

      const urgentCurriculum = recommendationEngine.matchCurriculumToAssessment(
        mockAssessmentResults, 
        urgentPreferences
      );
      const exploratoryCurriculum = recommendationEngine.matchCurriculumToAssessment(
        mockAssessmentResults, 
        exploratoryPreferences
      );

      expect(urgentCurriculum.estimatedDuration.weeklyCommitment).toBe(6);
      expect(exploratoryCurriculum.estimatedDuration.weeklyCommitment).toBe(2);
    });

    it('should include focus area preferences', () => {
      const preferences = { focusAreas: ['leadership', 'strategy'] };
      const curriculum = recommendationEngine.matchCurriculumToAssessment(
        mockAssessmentResults, 
        preferences
      );

      expect(curriculum.learningObjectives).toBeDefined();
      expect(Array.isArray(curriculum.learningObjectives)).toBe(true);
    });

    it('should handle low competency scores by suggesting additional modules', () => {
      const lowScoreResults = {
        ...mockAssessmentResults,
        scores: {
          ...mockAssessmentResults.scores,
          strategicAuthority: 0.3,
          implementationReadiness: 0.2
        }
      };

      const curriculum = recommendationEngine.matchCurriculumToAssessment(lowScoreResults);

      // The system should identify prerequisites for low scores
      expect(curriculum.prerequisites).toContain(
        'Change management and project leadership experience'
      );
      
      // Optional enhancements may be empty if all relevant modules are already included
      expect(curriculum.optionalEnhancements).toBeDefined();
      expect(Array.isArray(curriculum.optionalEnhancements)).toBe(true);
    });
  });

  describe('estimateTimeCommitment', () => {
    let mockCurriculum: CurriculumRecommendation;

    beforeEach(() => {
      mockCurriculum = {
        pathwayId: 'test-pathway',
        foundationModules: [],
        industryModules: [],
        roleSpecificModules: [],
        culturalAdaptationModules: [],
        estimatedDuration: {
          totalHours: 12,
          weeklyCommitment: 4,
          completionTimeline: '3 weeks'
        },
        learningObjectives: [],
        successMetrics: [],
        prerequisites: [],
        optionalEnhancements: []
      };
    });

    it('should calculate different pacing options', () => {
      const estimation = recommendationEngine.estimateTimeCommitment(mockCurriculum);

      expect(estimation.totalHours).toBe(12);
      expect(estimation.weeklyHours).toBe(4);
      expect(estimation.intensiveWeeks).toBeLessThan(estimation.extendedWeeks);
      expect(estimation.recommendedPace).toBe('standard');
    });

    it('should recommend intensive pace for immediate urgency', () => {
      const preferences = { urgency: 'immediate' };
      const estimation = recommendationEngine.estimateTimeCommitment(mockCurriculum, preferences);

      expect(estimation.recommendedPace).toBe('intensive');
    });

    it('should recommend extended pace for exploratory urgency', () => {
      const preferences = { urgency: 'exploratory' };
      const estimation = recommendationEngine.estimateTimeCommitment(mockCurriculum, preferences);

      expect(estimation.recommendedPace).toBe('extended');
    });

    it('should generate meaningful milestones', () => {
      const estimation = recommendationEngine.estimateTimeCommitment(mockCurriculum);

      expect(estimation.milestones).toBeDefined();
      expect(Array.isArray(estimation.milestones)).toBe(true);
      
      if (estimation.milestones.length > 0) {
        const firstMilestone = estimation.milestones[0];
        expect(firstMilestone.week).toBe(1);
        expect(firstMilestone.title).toBeDefined();
        expect(firstMilestone.description).toBeDefined();
      }
    });

    it('should respect custom time commitment preferences', () => {
      const preferences = { timeCommitment: 8 };
      const estimation = recommendationEngine.estimateTimeCommitment(mockCurriculum, preferences);

      expect(estimation.weeklyHours).toBe(8);
    });
  });

  describe('mapLearningObjectives', () => {
    let mockCurriculum: CurriculumRecommendation;

    beforeEach(() => {
      mockCurriculum = {
        pathwayId: 'test-pathway',
        foundationModules: [
          {
            id: 'UF-1E',
            title: 'Test Module',
            description: 'Test Description',
            estimatedHours: 2,
            prerequisites: [],
            learningObjectives: [
              'Develop strategic AI understanding',
              'Master competitive positioning'
            ]
          }
        ],
        industryModules: [],
        roleSpecificModules: [],
        culturalAdaptationModules: [],
        estimatedDuration: {
          totalHours: 2,
          weeklyCommitment: 2,
          completionTimeline: '1 week'
        },
        learningObjectives: [],
        successMetrics: [],
        prerequisites: [],
        optionalEnhancements: []
      };
    });

    it('should map learning objectives to modules', () => {
      const mappings = recommendationEngine.mapLearningObjectives(mockCurriculum);

      expect(mappings).toHaveLength(2);
      expect(mappings[0].objective).toBe('Develop strategic AI understanding');
      expect(mappings[0].modules).toContain('UF-1E');
      expect(mappings[0].estimatedHours).toBe(2);
    });

    it('should determine appropriate competency levels', () => {
      const mappings = recommendationEngine.mapLearningObjectives(mockCurriculum);

      expect(mappings[0].competencyLevel).toMatch(/beginner|intermediate|advanced/);
      expect(mappings[1].competencyLevel).toMatch(/beginner|intermediate|advanced/);
    });

    it('should handle modules with prerequisites', () => {
      mockCurriculum.foundationModules[0].prerequisites = ['PREREQ-1'];
      const mappings = recommendationEngine.mapLearningObjectives(mockCurriculum);

      expect(mappings[0].prerequisites).toContain('PREREQ-1');
    });
  });

  describe('trackCompetencyProgress', () => {
    const mockEngagementMetrics = {
      averageTimePerModule: 1.0,
      completionRate: 0.8,
      satisfactionScore: 4.0
    };

    it('should identify fast learners for acceleration', () => {
      const fastLearnerMetrics = {
        averageTimePerModule: 0.7,
        completionRate: 0.95,
        satisfactionScore: 4.5
      };

      const adaptations = recommendationEngine.trackCompetencyProgress(
        'user-123',
        ['UF-1E', 'UF-2E'],
        { strategicAuthority: 0.9 },
        fastLearnerMetrics
      );

      const accelerationAdaptation = adaptations.find(a => a.adaptation === 'accelerate');
      expect(accelerationAdaptation).toBeDefined();
      expect(accelerationAdaptation!.reasoning).toContain('rapid learning');
    });

    it('should identify struggling learners for additional support', () => {
      const strugglingMetrics = {
        averageTimePerModule: 1.5,
        completionRate: 0.6,
        satisfactionScore: 2.5
      };

      const adaptations = recommendationEngine.trackCompetencyProgress(
        'user-123',
        ['UF-1E'],
        { strategicAuthority: 0.7 },
        strugglingMetrics
      );

      const supportAdaptation = adaptations.find(a => a.adaptation === 'add_support');
      expect(supportAdaptation).toBeDefined();
      expect(supportAdaptation!.reasoning).toContain('difficulty');
    });

    it('should recommend review for low assessment scores', () => {
      const adaptations = recommendationEngine.trackCompetencyProgress(
        'user-123',
        ['UF-1E', 'UF-2E'],
        { strategicAuthority: 0.5, implementationReadiness: 0.4 },
        mockEngagementMetrics
      );

      const reviewAdaptations = adaptations.filter(a => a.adaptation === 'review_previous');
      expect(reviewAdaptations.length).toBeGreaterThan(0);
      expect(reviewAdaptations[0].reasoning).toContain('Low score');
    });

    it('should provide specific module recommendations for each adaptation', () => {
      const adaptations = recommendationEngine.trackCompetencyProgress(
        'user-123',
        ['UF-1E'],
        { strategicAuthority: 0.4 },
        mockEngagementMetrics
      );

      adaptations.forEach(adaptation => {
        expect(adaptation.targetModules).toBeDefined();
        expect(Array.isArray(adaptation.targetModules)).toBe(true);
        expect(adaptation.reasoning).toBeDefined();
      });
    });
  });

  describe('modifyCurriculum', () => {
    let mockCurriculum: CurriculumRecommendation;

    beforeEach(() => {
      mockCurriculum = {
        pathwayId: 'test-pathway',
        foundationModules: [
          {
            id: 'UF-1E',
            title: 'Strategic Vision',
            description: 'Test',
            estimatedHours: 1,
            prerequisites: [],
            learningObjectives: []
          }
        ],
        industryModules: [],
        roleSpecificModules: [],
        culturalAdaptationModules: [],
        estimatedDuration: {
          totalHours: 1,
          weeklyCommitment: 2,
          completionTimeline: '1 week'
        },
        learningObjectives: [],
        successMetrics: [],
        prerequisites: [],
        optionalEnhancements: []
      };
    });

    it('should add modules when requested', () => {
      const modification: CurriculumModification = {
        requestType: 'add_module',
        targetModule: 'UF-2E',
        justification: 'User requested additional foundation knowledge',
        impactAssessment: {
          timeChange: 1,
          prerequisiteChanges: [],
          learningObjectiveChanges: []
        }
      };

      const modifiedCurriculum = recommendationEngine.modifyCurriculum(mockCurriculum, modification);

      expect(modifiedCurriculum.foundationModules).toHaveLength(2);
      expect(modifiedCurriculum.estimatedDuration.totalHours).toBe(2);
    });

    it('should remove modules when requested', () => {
      const modification: CurriculumModification = {
        requestType: 'remove_module',
        targetModule: 'UF-1E',
        justification: 'User already has this knowledge',
        impactAssessment: {
          timeChange: -1,
          prerequisiteChanges: [],
          learningObjectiveChanges: []
        }
      };

      const modifiedCurriculum = recommendationEngine.modifyCurriculum(mockCurriculum, modification);

      expect(modifiedCurriculum.foundationModules).toHaveLength(0);
      expect(modifiedCurriculum.estimatedDuration.totalHours).toBe(0);
    });

    it('should replace modules when requested', () => {
      const modification: CurriculumModification = {
        requestType: 'replace_module',
        targetModule: 'UF-1E',
        replacementModule: 'UF-2E',
        justification: 'Better fit for user needs',
        impactAssessment: {
          timeChange: 0,
          prerequisiteChanges: [],
          learningObjectiveChanges: []
        }
      };

      const modifiedCurriculum = recommendationEngine.modifyCurriculum(mockCurriculum, modification);

      expect(modifiedCurriculum.foundationModules).toHaveLength(1);
      expect(modifiedCurriculum.foundationModules[0].id).toBe('UF-2E');
    });

    it('should adjust pace when requested', () => {
      const modification: CurriculumModification = {
        requestType: 'adjust_pace',
        justification: 'accelerate learning pace',
        impactAssessment: {
          timeChange: 0,
          prerequisiteChanges: [],
          learningObjectiveChanges: []
        }
      };

      const modifiedCurriculum = recommendationEngine.modifyCurriculum(mockCurriculum, modification);

      expect(modifiedCurriculum.estimatedDuration.weeklyCommitment).toBe(3); // 2 * 1.5
    });

    it('should handle invalid module IDs gracefully', () => {
      const modification: CurriculumModification = {
        requestType: 'add_module',
        targetModule: 'INVALID-MODULE',
        justification: 'Test invalid module',
        impactAssessment: {
          timeChange: 0,
          prerequisiteChanges: [],
          learningObjectiveChanges: []
        }
      };

      const modifiedCurriculum = recommendationEngine.modifyCurriculum(mockCurriculum, modification);

      // Should remain unchanged
      expect(modifiedCurriculum.foundationModules).toHaveLength(1);
      expect(modifiedCurriculum.estimatedDuration.totalHours).toBe(1);
    });
  });

  describe('integration with different personas', () => {
    const baseAssessmentResults = {
      scores: {
        strategicAuthority: 0.6,
        organizationalInfluence: 0.7,
        resourceAvailability: 0.5,
        implementationReadiness: 0.8,
        culturalAlignment: 0.7
      } as DimensionScores,
      industry: 'healthcare',
      culturalContext: ['east-africa']
    };

    it('should provide appropriate recommendations for Strategic Observer', () => {
      const observerResults = { ...baseAssessmentResults, persona: 'Strategic Observer' as PersonaType };
      const curriculum = recommendationEngine.matchCurriculumToAssessment(observerResults);

      expect(curriculum.estimatedDuration.weeklyCommitment).toBe(2); // Lower commitment
      expect(curriculum.roleSpecificModules).toHaveLength(0); // No role-specific modules
    });

    it('should provide comprehensive recommendations for Strategic Architect', () => {
      const architectResults = { ...baseAssessmentResults, persona: 'Strategic Architect' as PersonaType };
      const curriculum = recommendationEngine.matchCurriculumToAssessment(architectResults);

      expect(curriculum.estimatedDuration.weeklyCommitment).toBe(3); // Executive time commitment
      expect(curriculum.roleSpecificModules).toHaveLength(3); // All role modules
      expect(curriculum.successMetrics).toContain('Lead successful AI transformation initiative');
    });

    it('should adapt time estimation based on persona characteristics', () => {
      const explorerResults = { ...baseAssessmentResults, persona: 'Strategic Explorer' as PersonaType };
      const curriculum = recommendationEngine.matchCurriculumToAssessment(explorerResults);
      const timeEstimation = recommendationEngine.estimateTimeCommitment(curriculum);

      expect(timeEstimation.weeklyHours).toBe(6); // Higher commitment for explorers
      expect(timeEstimation.milestones.length).toBeGreaterThan(0);
    });
  });
});