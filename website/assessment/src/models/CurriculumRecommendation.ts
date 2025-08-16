import { Module } from './types';

export interface CurriculumRecommendation {
  pathwayId: string;
  foundationModules: Module[];
  industryModules: Module[];
  roleSpecificModules: Module[];
  culturalAdaptationModules: Module[];
  estimatedDuration: {
    totalHours: number;
    weeklyCommitment: number;
    completionTimeline: string;
  };
  learningObjectives: string[];
  successMetrics: string[];
  prerequisites: string[];
  optionalEnhancements: Module[];
}

export interface LearningPathway {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  sequencing: ModuleSequence[];
  adaptiveRules: AdaptiveRule[];
  prerequisites: string[];
  estimatedDuration: number;
  targetPersonas: string[];
  industries: string[];

  getNextModule(completedModules: string[]): Module | null;
  applyAdaptiveRules(assessmentResults: {
    scores: any;
    persona: string;
    industry: string;
  }): Module[];
  getTotalEstimatedHours(): number;
  getPrerequisiteChain(moduleId: string): string[];
}

export interface ModuleSequence {
  moduleId: string;
  order: number;
  prerequisites: string[];
  isOptional: boolean;
  adaptiveConditions?: AdaptiveCondition[];
}

export interface AdaptiveRule {
  condition: string;
  action: 'skip' | 'emphasize' | 'substitute' | 'extend';
  targetModuleId: string;
  alternativeModuleId?: string;
}

export interface AdaptiveCondition {
  type: 'assessment_score' | 'persona_match' | 'industry_context' | 'cultural_factor';
  operator: 'greater_than' | 'less_than' | 'equals' | 'contains';
  value: string | number;
}
