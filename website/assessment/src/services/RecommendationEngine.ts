import { 
  CurriculumRecommendation, 
  LearningPathway 
} from '../models/CurriculumRecommendation';
import { 
  Module, 
  PersonaType, 
  DimensionScores, 
  IndustryInsights 
} from '../models/types';
import { CurriculumGenerator, ModuleLibrary } from './CurriculumGenerator';

export interface CompetencyGap {
  area: string;
  currentLevel: number;
  targetLevel: number;
  priority: 'high' | 'medium' | 'low';
  recommendedModules: string[];
}

export interface LearningObjectiveMapping {
  objective: string;
  modules: string[];
  estimatedHours: number;
  prerequisites: string[];
  competencyLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface TimeCommitmentEstimation {
  totalHours: number;
  weeklyHours: number;
  intensiveWeeks: number;
  extendedWeeks: number;
  recommendedPace: 'intensive' | 'standard' | 'extended';
  milestones: Milestone[];
}

export interface Milestone {
  week: number;
  title: string;
  description: string;
  completedModules: string[];
  competenciesAchieved: string[];
  assessmentCheckpoint?: boolean;
}

export interface ProgressAdaptation {
  triggeredBy: 'completion_time' | 'assessment_score' | 'engagement_level' | 'user_feedback';
  condition: string;
  adaptation: 'accelerate' | 'decelerate' | 'add_support' | 'skip_ahead' | 'review_previous';
  targetModules: string[];
  reasoning: string;
}

export interface CurriculumModification {
  requestType: 'add_module' | 'remove_module' | 'replace_module' | 'adjust_pace' | 'change_focus';
  targetModule?: string;
  replacementModule?: string;
  justification: string;
  impactAssessment: {
    timeChange: number;
    prerequisiteChanges: string[];
    learningObjectiveChanges: string[];
  };
}

export class RecommendationEngine {
  private curriculumGenerator: CurriculumGenerator;
  private moduleLibrary: ModuleLibrary;

  constructor() {
    this.curriculumGenerator = new CurriculumGenerator();
    this.moduleLibrary = new ModuleLibrary();
  }

  /**
   * Matches curricula to assessment results with sophisticated scoring
   */
  matchCurriculumToAssessment(
    assessmentResults: {
      scores: DimensionScores;
      persona: PersonaType;
      industry: string;
      culturalContext?: string[];
    },
    preferences: {
      timeCommitment?: number;
      focusAreas?: string[];
      learningStyle?: string;
      urgency?: 'immediate' | 'planned' | 'exploratory';
    } = {}
  ): CurriculumRecommendation {
    // Generate base curriculum
    const baseCurriculum = this.curriculumGenerator.generateCurriculum(
      assessmentResults, 
      preferences
    );

    // Enhance with recommendation engine insights
    const competencyGaps = this.identifyCompetencyGaps(assessmentResults);
    const timeEstimation = this.estimateTimeCommitment(baseCurriculum, preferences);
    const learningObjectives = this.mapLearningObjectives(baseCurriculum);

    // Apply intelligent modifications based on gaps and preferences
    const enhancedCurriculum = this.enhanceCurriculumWithRecommendations(
      baseCurriculum,
      competencyGaps,
      timeEstimation,
      preferences
    );

    return enhancedCurriculum;
  }

  /**
   * Creates detailed time commitment estimation with multiple pacing options
   */
  estimateTimeCommitment(
    curriculum: CurriculumRecommendation,
    preferences: { timeCommitment?: number; urgency?: string } = {}
  ): TimeCommitmentEstimation {
    const totalHours = curriculum.estimatedDuration.totalHours;
    const preferredWeeklyHours = preferences.timeCommitment || curriculum.estimatedDuration.weeklyCommitment;

    // Calculate different pacing options
    const intensiveWeeks = Math.ceil(totalHours / (preferredWeeklyHours * 1.5));
    const standardWeeks = Math.ceil(totalHours / preferredWeeklyHours);
    const extendedWeeks = Math.ceil(totalHours / (preferredWeeklyHours * 0.7));

    // Determine recommended pace based on urgency and persona
    let recommendedPace: 'intensive' | 'standard' | 'extended' = 'standard';
    if (preferences.urgency === 'immediate') {
      recommendedPace = 'intensive';
    } else if (preferences.urgency === 'exploratory') {
      recommendedPace = 'extended';
    }

    // Generate milestones
    const milestones = this.generateMilestones(curriculum, standardWeeks);

    return {
      totalHours,
      weeklyHours: preferredWeeklyHours,
      intensiveWeeks,
      extendedWeeks,
      recommendedPace,
      milestones
    };
  }

  /**
   * Maps learning objectives to specific modules and competency levels
   */
  mapLearningObjectives(curriculum: CurriculumRecommendation): LearningObjectiveMapping[] {
    const allModules = [
      ...curriculum.foundationModules,
      ...curriculum.industryModules,
      ...curriculum.roleSpecificModules,
      ...curriculum.culturalAdaptationModules
    ];

    const objectiveMap = new Map<string, LearningObjectiveMapping>();

    allModules.forEach(module => {
      module.learningObjectives.forEach(objective => {
        if (!objectiveMap.has(objective)) {
          objectiveMap.set(objective, {
            objective,
            modules: [],
            estimatedHours: 0,
            prerequisites: [],
            competencyLevel: this.determineCompetencyLevel(objective, module)
          });
        }

        const mapping = objectiveMap.get(objective)!;
        mapping.modules.push(module.id);
        mapping.estimatedHours += module.estimatedHours;
        mapping.prerequisites.push(...module.prerequisites);
      });
    });

    return Array.from(objectiveMap.values()).map(mapping => ({
      ...mapping,
      prerequisites: [...new Set(mapping.prerequisites)] // Remove duplicates
    }));
  }

  /**
   * Tracks competency development and suggests progress adaptations
   */
  trackCompetencyProgress(
    userId: string,
    completedModules: string[],
    assessmentScores: Record<string, number>,
    engagementMetrics: {
      averageTimePerModule: number;
      completionRate: number;
      satisfactionScore: number;
    }
  ): ProgressAdaptation[] {
    const adaptations: ProgressAdaptation[] = [];

    // Check for fast learners who might benefit from acceleration
    if (engagementMetrics.averageTimePerModule < 0.8 && engagementMetrics.completionRate > 0.9) {
      adaptations.push({
        triggeredBy: 'completion_time',
        condition: 'fast_completion_high_accuracy',
        adaptation: 'accelerate',
        targetModules: this.getAdvancedModules(completedModules),
        reasoning: 'User demonstrates rapid learning and high comprehension. Recommend advanced modules.'
      });
    }

    // Check for struggling learners who need additional support
    if (engagementMetrics.completionRate < 0.7 || engagementMetrics.satisfactionScore < 3.0) {
      adaptations.push({
        triggeredBy: 'engagement_level',
        condition: 'low_completion_low_satisfaction',
        adaptation: 'add_support',
        targetModules: this.getSupportModules(completedModules),
        reasoning: 'User showing signs of difficulty. Recommend additional support modules and review.'
      });
    }

    // Check assessment scores for specific competency gaps
    Object.entries(assessmentScores).forEach(([competency, score]) => {
      if (score < 0.6) {
        adaptations.push({
          triggeredBy: 'assessment_score',
          condition: `low_${competency}_score`,
          adaptation: 'review_previous',
          targetModules: this.getModulesForCompetency(competency),
          reasoning: `Low score in ${competency}. Recommend reviewing related modules.`
        });
      }
    });

    return adaptations;
  }

  /**
   * Handles user requests for curriculum modifications
   */
  modifyCurriculum(
    currentCurriculum: CurriculumRecommendation,
    modification: CurriculumModification
  ): CurriculumRecommendation {
    const modifiedCurriculum = { ...currentCurriculum };

    switch (modification.requestType) {
      case 'add_module':
        if (modification.targetModule) {
          const module = this.moduleLibrary.getModuleById(modification.targetModule);
          if (module) {
            // Add to appropriate category
            if (module.id.startsWith('UF-')) {
              modifiedCurriculum.foundationModules.push(module);
            } else if (module.id.startsWith('IS-')) {
              modifiedCurriculum.industryModules.push(module);
            } else if (module.id.startsWith('RS-')) {
              modifiedCurriculum.roleSpecificModules.push(module);
            } else if (module.id.startsWith('CA-')) {
              modifiedCurriculum.culturalAdaptationModules.push(module);
            }

            // Update duration
            modifiedCurriculum.estimatedDuration.totalHours += module.estimatedHours;
            modifiedCurriculum.estimatedDuration.completionTimeline = 
              `${Math.ceil(modifiedCurriculum.estimatedDuration.totalHours / modifiedCurriculum.estimatedDuration.weeklyCommitment)} weeks`;
          }
        }
        break;

      case 'remove_module':
        if (modification.targetModule) {
          const removeFromArray = (arr: Module[]) => 
            arr.filter(m => m.id !== modification.targetModule);

          modifiedCurriculum.foundationModules = removeFromArray(modifiedCurriculum.foundationModules);
          modifiedCurriculum.industryModules = removeFromArray(modifiedCurriculum.industryModules);
          modifiedCurriculum.roleSpecificModules = removeFromArray(modifiedCurriculum.roleSpecificModules);
          modifiedCurriculum.culturalAdaptationModules = removeFromArray(modifiedCurriculum.culturalAdaptationModules);

          // Update duration (find removed module to subtract hours)
          const removedModule = this.moduleLibrary.getModuleById(modification.targetModule);
          if (removedModule) {
            modifiedCurriculum.estimatedDuration.totalHours -= removedModule.estimatedHours;
            modifiedCurriculum.estimatedDuration.completionTimeline = 
              `${Math.ceil(modifiedCurriculum.estimatedDuration.totalHours / modifiedCurriculum.estimatedDuration.weeklyCommitment)} weeks`;
          }
        }
        break;

      case 'replace_module':
        if (modification.targetModule && modification.replacementModule) {
          // Remove old module and add new one
          const removeModification: CurriculumModification = {
            ...modification,
            requestType: 'remove_module'
          };
          const addModification: CurriculumModification = {
            ...modification,
            requestType: 'add_module',
            targetModule: modification.replacementModule
          };

          const tempCurriculum = this.modifyCurriculum(modifiedCurriculum, removeModification);
          return this.modifyCurriculum(tempCurriculum, addModification);
        }
        break;

      case 'adjust_pace':
        const paceMultiplier = modification.justification.includes('accelerate') ? 1.5 : 0.7;
        modifiedCurriculum.estimatedDuration.weeklyCommitment *= paceMultiplier;
        modifiedCurriculum.estimatedDuration.completionTimeline = 
          `${Math.ceil(modifiedCurriculum.estimatedDuration.totalHours / modifiedCurriculum.estimatedDuration.weeklyCommitment)} weeks`;
        break;
    }

    return modifiedCurriculum;
  }

  private identifyCompetencyGaps(assessmentResults: {
    scores: DimensionScores;
    persona: PersonaType;
    industry: string;
  }): CompetencyGap[] {
    const gaps: CompetencyGap[] = [];

    // Analyze each dimension score
    Object.entries(assessmentResults.scores).forEach(([dimension, score]) => {
      if (score < 0.7) { // Threshold for competency gap
        const gap: CompetencyGap = {
          area: dimension,
          currentLevel: score,
          targetLevel: this.getTargetLevel(dimension, assessmentResults.persona),
          priority: score < 0.4 ? 'high' : score < 0.6 ? 'medium' : 'low',
          recommendedModules: this.getModulesForCompetency(dimension)
        };
        gaps.push(gap);
      }
    });

    return gaps;
  }

  private enhanceCurriculumWithRecommendations(
    baseCurriculum: CurriculumRecommendation,
    competencyGaps: CompetencyGap[],
    timeEstimation: TimeCommitmentEstimation,
    preferences: { focusAreas?: string[]; learningStyle?: string }
  ): CurriculumRecommendation {
    let enhancedCurriculum = { ...baseCurriculum };

    // Add modules to address high-priority competency gaps
    const highPriorityGaps = competencyGaps.filter(gap => gap.priority === 'high');
    highPriorityGaps.forEach(gap => {
      gap.recommendedModules.forEach(moduleId => {
        const module = this.moduleLibrary.getModuleById(moduleId);
        if (module && !this.isModuleInCurriculum(module, enhancedCurriculum)) {
          // Add to optional enhancements
          enhancedCurriculum.optionalEnhancements.push(module);
        }
      });
    });

    // Adjust based on learning style preferences
    if (preferences.learningStyle === 'hands-on') {
      enhancedCurriculum.learningObjectives.push(
        'Apply concepts through practical exercises and real-world scenarios'
      );
    }

    // Update time estimation
    enhancedCurriculum.estimatedDuration = {
      ...enhancedCurriculum.estimatedDuration,
      totalHours: timeEstimation.totalHours,
      weeklyCommitment: timeEstimation.weeklyHours
    };

    return enhancedCurriculum;
  }

  private generateMilestones(curriculum: CurriculumRecommendation, totalWeeks: number): Milestone[] {
    const milestones: Milestone[] = [];
    const allModules = [
      ...curriculum.foundationModules,
      ...curriculum.industryModules,
      ...curriculum.roleSpecificModules,
      ...curriculum.culturalAdaptationModules
    ];

    const modulesPerWeek = Math.ceil(allModules.length / totalWeeks);
    
    for (let week = 1; week <= totalWeeks; week++) {
      const startIndex = (week - 1) * modulesPerWeek;
      const endIndex = Math.min(startIndex + modulesPerWeek, allModules.length);
      const weekModules = allModules.slice(startIndex, endIndex);

      milestones.push({
        week,
        title: `Week ${week}: ${this.getMilestoneTitle(weekModules)}`,
        description: `Complete ${weekModules.length} modules focusing on ${this.getMilestoneFocus(weekModules)}`,
        completedModules: weekModules.map(m => m.id),
        competenciesAchieved: weekModules.flatMap(m => m.learningObjectives.slice(0, 2)), // First 2 objectives
        assessmentCheckpoint: week % 3 === 0 // Assessment every 3 weeks
      });
    }

    return milestones;
  }

  private determineCompetencyLevel(objective: string, module: Module): 'beginner' | 'intermediate' | 'advanced' {
    if (objective.includes('Advanced') || objective.includes('Master') || module.id.includes('E')) {
      return 'advanced';
    }
    if (objective.includes('Implement') || objective.includes('Develop') || objective.includes('Build')) {
      return 'intermediate';
    }
    return 'beginner';
  }

  private getTargetLevel(dimension: string, persona: PersonaType): number {
    const targetLevels: Record<PersonaType, Record<string, number>> = {
      'Strategic Architect': {
        strategicAuthority: 0.9,
        organizationalInfluence: 0.9,
        resourceAvailability: 0.8,
        implementationReadiness: 0.8,
        culturalAlignment: 0.7
      },
      'Strategic Catalyst': {
        strategicAuthority: 0.7,
        organizationalInfluence: 0.9,
        resourceAvailability: 0.7,
        implementationReadiness: 0.9,
        culturalAlignment: 0.8
      },
      'Strategic Contributor': {
        strategicAuthority: 0.6,
        organizationalInfluence: 0.7,
        resourceAvailability: 0.6,
        implementationReadiness: 0.8,
        culturalAlignment: 0.8
      },
      'Strategic Explorer': {
        strategicAuthority: 0.5,
        organizationalInfluence: 0.6,
        resourceAvailability: 0.5,
        implementationReadiness: 0.7,
        culturalAlignment: 0.7
      },
      'Strategic Observer': {
        strategicAuthority: 0.4,
        organizationalInfluence: 0.5,
        resourceAvailability: 0.4,
        implementationReadiness: 0.6,
        culturalAlignment: 0.7
      }
    };

    return targetLevels[persona]?.[dimension] || 0.7;
  }

  private getModulesForCompetency(competency: string): string[] {
    const competencyModuleMap: Record<string, string[]> = {
      strategicAuthority: ['UF-1E', 'RS-1E', 'RS-2E'],
      organizationalInfluence: ['UF-4E', 'RS-1E', 'RS-3E'],
      resourceAvailability: ['UF-3E', 'RS-2E'],
      implementationReadiness: ['UF-2E', 'RS-3E'],
      culturalAlignment: ['CA-1E', 'CA-2E', 'UF-4E']
    };

    return competencyModuleMap[competency] || [];
  }

  private getAdvancedModules(completedModules: string[]): string[] {
    // Return advanced modules that haven't been completed
    const advancedModuleIds = ['RS-1E', 'RS-2E', 'IS-1E', 'IS-2E', 'IS-3E', 'IS-4E'];
    return advancedModuleIds.filter(id => !completedModules.includes(id));
  }

  private getSupportModules(completedModules: string[]): string[] {
    // Return foundational support modules
    const supportModuleIds = ['UF-1E', 'UF-2E', 'CA-1E'];
    return supportModuleIds.filter(id => !completedModules.includes(id));
  }

  private isModuleInCurriculum(module: Module, curriculum: CurriculumRecommendation): boolean {
    const allModules = [
      ...curriculum.foundationModules,
      ...curriculum.industryModules,
      ...curriculum.roleSpecificModules,
      ...curriculum.culturalAdaptationModules,
      ...curriculum.optionalEnhancements
    ];
    return allModules.some(m => m.id === module.id);
  }

  private getMilestoneTitle(modules: Module[]): string {
    if (modules.some(m => m.id.startsWith('UF-'))) return 'Foundation Building';
    if (modules.some(m => m.id.startsWith('IS-'))) return 'Industry Application';
    if (modules.some(m => m.id.startsWith('RS-'))) return 'Leadership Development';
    if (modules.some(m => m.id.startsWith('CA-'))) return 'Cultural Integration';
    return 'Skill Development';
  }

  private getMilestoneFocus(modules: Module[]): string {
    const focuses = modules.map(m => {
      if (m.id.startsWith('UF-')) return 'strategic foundations';
      if (m.id.startsWith('IS-')) return 'industry applications';
      if (m.id.startsWith('RS-')) return 'leadership skills';
      if (m.id.startsWith('CA-')) return 'cultural adaptation';
      return 'core competencies';
    });
    return [...new Set(focuses)].join(' and ');
  }
}