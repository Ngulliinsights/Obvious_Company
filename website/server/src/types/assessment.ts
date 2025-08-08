/**
 * Core assessment data models and interfaces for the AI Integration Assessment Platform
 * Based on requirements 1.1, 9.1, 10.1
 */

// Enums for type safety
export enum AssessmentType {
  QUESTIONNAIRE = 'questionnaire',
  SCENARIO_BASED = 'scenario_based',
  CONVERSATIONAL = 'conversational',
  VISUAL_PATTERN = 'visual_pattern',
  BEHAVIORAL = 'behavioral'
}

export enum PersonaType {
  STRATEGIC_ARCHITECT = 'strategic_architect',
  STRATEGIC_CATALYST = 'strategic_catalyst',
  STRATEGIC_CONTRIBUTOR = 'strategic_contributor',
  STRATEGIC_EXPLORER = 'strategic_explorer',
  STRATEGIC_OBSERVER = 'strategic_observer'
}

export enum AssessmentStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  SCALE_RATING = 'scale_rating',
  TEXT_INPUT = 'text_input',
  SCENARIO_RESPONSE = 'scenario_response',
  VISUAL_SELECTION = 'visual_selection',
  BEHAVIORAL_OBSERVATION = 'behavioral_observation'
}

// Core interfaces
export interface UserProfile {
  id: string;
  demographics: {
    age_range: string;
    geographic_region: string;
    cultural_context: string[];
    languages: string[];
  };
  professional: {
    industry: string;
    role_level: string;
    organization_size: string;
    decision_authority: number; // 1-10 scale
    years_experience: number;
  };
  preferences: {
    assessment_modality: AssessmentType[];
    learning_style: string;
    communication_preference: string;
    timezone: string;
  };
  created_at: Date;
  updated_at: Date;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  description?: string;
  options?: QuestionOption[];
  validation_rules: ValidationRule[];
  cultural_adaptations?: CulturalAdaptation[];
  industry_specific?: boolean;
  weight: number; // For scoring calculations
  dimension: string; // Which assessment dimension this measures
}

export interface QuestionOption {
  id: string;
  text: string;
  value: number | string;
  cultural_variants?: { [culture: string]: string };
}

export interface ValidationRule {
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'range';
  value?: any;
  message: string;
}

export interface CulturalAdaptation {
  culture: string;
  adapted_text: string;
  adapted_options?: QuestionOption[];
  context_notes?: string;
}

export interface AssessmentResponse {
  id: string;
  question_id: string;
  user_id: string;
  session_id: string;
  response_value: any;
  response_time_ms: number;
  confidence_level?: number; // 1-10 scale
  metadata: {
    timestamp: Date;
    user_agent?: string;
    interaction_data?: any; // For behavioral tracking
  };
}

export interface AssessmentSession {
  id: string;
  user_id: string;
  assessment_type: AssessmentType;
  status: AssessmentStatus;
  responses: AssessmentResponse[];
  metadata: {
    start_time: Date;
    completion_time?: Date;
    duration_minutes?: number;
    modality_used: AssessmentType;
    cultural_adaptations: string[];
    progress_percentage: number;
    current_question_index: number;
  };
  results?: AssessmentResults;
  created_at: Date;
  updated_at: Date;
}

export interface AssessmentResults {
  id: string;
  session_id: string;
  user_id: string;
  overall_score: number; // 0-100 scale
  dimension_scores: {
    strategic_authority: number;
    organizational_influence: number;
    resource_availability: number;
    implementation_readiness: number;
    cultural_alignment: number;
  };
  persona_classification: {
    primary_persona: PersonaType;
    confidence_score: number; // 0-1 scale
    secondary_characteristics: string[];
    persona_description: string;
  };
  industry_insights: {
    sector_readiness: number;
    regulatory_considerations: string[];
    implementation_priorities: string[];
    market_maturity_level: string;
  };
  recommendations: {
    program_recommendation: string;
    service_tier_recommendation: string; // Strategic Clarity, Systems, or Advantage
    next_steps: string[];
    timeline_suggestion: string;
    resource_requirements: string[];
    investment_range: string;
  };
  curriculum_pathway: CurriculumRecommendation;
  created_at: Date;
  calculated_at: Date;
}

export interface CurriculumRecommendation {
  pathway_id: string;
  foundation_modules: Module[];
  industry_modules: Module[];
  role_specific_modules: Module[];
  cultural_adaptation_modules: Module[];
  estimated_duration: {
    total_hours: number;
    weekly_commitment: number;
    completion_timeline: string;
  };
  learning_objectives: string[];
  success_metrics: string[];
  prerequisites: string[];
  optional_enhancements: Module[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  duration_hours: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  learning_objectives: string[];
  prerequisites: string[];
  content_type: 'video' | 'text' | 'interactive' | 'workshop';
  industry_focus?: string;
  cultural_adaptations?: string[];
}

// Database schema interfaces
export interface UserTable {
  id: string;
  demographics_json: string; // JSON serialized demographics
  professional_json: string; // JSON serialized professional info
  preferences_json: string; // JSON serialized preferences
  created_at: Date;
  updated_at: Date;
}

export interface AssessmentSessionTable {
  id: string;
  user_id: string;
  assessment_type: AssessmentType;
  status: AssessmentStatus;
  metadata_json: string; // JSON serialized metadata
  created_at: Date;
  updated_at: Date;
}

export interface AssessmentResponseTable {
  id: string;
  question_id: string;
  user_id: string;
  session_id: string;
  response_value_json: string; // JSON serialized response value
  response_time_ms: number;
  confidence_level?: number;
  metadata_json: string; // JSON serialized metadata
  created_at: Date;
}

export interface AssessmentResultsTable {
  id: string;
  session_id: string;
  user_id: string;
  overall_score: number;
  dimension_scores_json: string; // JSON serialized dimension scores
  persona_classification_json: string; // JSON serialized persona data
  industry_insights_json: string; // JSON serialized industry insights
  recommendations_json: string; // JSON serialized recommendations
  curriculum_pathway_json: string; // JSON serialized curriculum data
  created_at: Date;
  calculated_at: Date;
}

// Validation and error handling interfaces
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface AssessmentError {
  type: 'validation' | 'processing' | 'database' | 'external';
  message: string;
  details?: any;
  timestamp: Date;
  session_id?: string;
  user_id?: string;
}

// API request/response interfaces
export interface CreateAssessmentRequest {
  user_profile: Partial<UserProfile>;
  assessment_type: AssessmentType;
  cultural_preferences?: string[];
}

export interface CreateAssessmentResponse {
  session_id: string;
  first_question: Question;
  progress: {
    current_step: number;
    total_steps: number;
    percentage: number;
  };
}

export interface SubmitResponseRequest {
  session_id: string;
  question_id: string;
  response_value: any;
  confidence_level?: number;
  interaction_metadata?: any;
}

export interface SubmitResponseResponse {
  success: boolean;
  next_question?: Question;
  is_complete: boolean;
  progress: {
    current_step: number;
    total_steps: number;
    percentage: number;
  };
  results?: AssessmentResults;
}

export interface GetResultsRequest {
  session_id: string;
  user_id: string;
}

export interface GetResultsResponse {
  results: AssessmentResults;
  recommendations: {
    immediate_actions: string[];
    consultation_booking_url?: string;
    resource_downloads: string[];
  };
}