// Core type definitions for the assessment platform

export type AssessmentType = 
  | 'questionnaire' 
  | 'scenario-based' 
  | 'conversational' 
  | 'visual-pattern' 
  | 'behavioral-observation';

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export type PersonaType = 
  | 'Strategic Architect' 
  | 'Strategic Catalyst' 
  | 'Strategic Contributor' 
  | 'Strategic Explorer' 
  | 'Strategic Observer';

export type QuestionType = 
  | 'multiple_choice' 
  | 'scale_rating' 
  | 'text_input' 
  | 'scenario_selection' 
  | 'visual_pattern' 
  | 'behavioral_observation';

export interface UserContext {
  userId?: string;
  industry?: string;
  geographicRegion?: string;
  culturalContext?: string[];
  preferredLanguage?: string;
  assessmentHistory?: string[];
}

export interface AssessmentResponse {
  questionId: string;
  questionType: QuestionType;
  responseValue: unknown;
  responseTimeSeconds?: number;
  culturalAdaptationApplied?: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  scaleRange?: { min: number; max: number; labels?: string[] };
  culturalAdaptations?: Record<string, string>;
  industrySpecific?: boolean;
  requiredForPersona?: PersonaType[];
}

export interface NextQuestion {
  question: Question;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  adaptations?: {
    culturalContext?: string;
    industryFocus?: string;
    personaHint?: PersonaType;
  };
}

export interface DimensionScores {
  strategicAuthority: number;
  organizationalInfluence: number;
  resourceAvailability: number;
  implementationReadiness: number;
  culturalAlignment: number;
}

export interface PersonaClassification {
  primaryPersona: PersonaType;
  confidenceScore: number;
  secondaryCharacteristics: string[];
  reasoning?: string;
}

export interface IndustryInsights {
  sectorReadiness: number;
  regulatoryConsiderations: string[];
  implementationPriorities: string[];
  culturalFactors?: string[];
}

export interface ServiceRecommendation {
  tier: 'Strategic Clarity' | 'Strategic Systems' | 'Strategic Advantage';
  priceRange: string;
  rationale: string;
  nextSteps: string[];
  timelineEstimate: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  prerequisites: string[];
  learningObjectives: string[];
  industryRelevance?: string[];
  culturalAdaptations?: Record<string, string>;
}

export interface ResponsePattern {
  averageResponseTime: number;
  consistencyScore: number;
  engagementLevel: number;
  preferredQuestionTypes: QuestionType[];
  culturalAdaptationsUsed: string[];
}

export interface AssessmentResults {
  sessionId: string;
  overallScore: number;
  dimensionScores: DimensionScores;
  personaClassification: PersonaClassification;
  industryInsights: IndustryInsights;
  recommendations: {
    programRecommendation: string;
    nextSteps: string[];
    timelineSuggestion: string;
    resourceRequirements: string[];
  };
  curriculumPathway: {
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
  };
}