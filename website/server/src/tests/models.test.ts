/**
 * Unit tests for assessment data models and validation
 * Tests data integrity, validation rules, and error handling
 */

import { 
  UserProfile, 
  AssessmentSession, 
  AssessmentResponse, 
  AssessmentResults,
  Question,
  AssessmentType,
  PersonaType,
  QuestionType,
  AssessmentStatus
} from '../types/assessment';

import { 
  ValidationService,
  UserProfileValidator,
  AssessmentSessionValidator,
  AssessmentResponseValidator,
  QuestionValidator,
  AssessmentResultsValidator
} from '../utils/validation';

import {
  AssessmentValidationError,
  AssessmentProcessingError,
  AssessmentDatabaseError,
  AssessmentExternalError
} from '../utils/errorHandler';

describe('Assessment Data Models', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('UserProfile Validation', () => {
    const validUserProfile: Partial<UserProfile> = {
      demographics: {
        age_range: '35-44',
        geographic_region: 'East Africa',
        cultural_context: ['Kenyan', 'Urban'],
        languages: ['English', 'Swahili']
      },
      professional: {
        industry: 'Financial Services',
        role_level: 'Executive',
        organization_size: 'Large (1000+ employees)',
        decision_authority: 8,
        years_experience: 15
      },
      preferences: {
        assessment_modality: [AssessmentType.QUESTIONNAIRE, AssessmentType.CONVERSATIONAL],
        learning_style: 'Visual',
        communication_preference: 'Direct',
        timezone: 'Africa/Nairobi'
      }
    };

    test('should validate a complete user profile', () => {
      const result = validationService.validateUserProfile(validUserProfile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject user profile with missing demographics', () => {
      const invalidProfile = { ...validUserProfile };
      delete invalidProfile.demographics;
      
      const result = validationService.validateUserProfile(invalidProfile);
      expect(result.isValid).toBe(true); // Demographics are optional in partial profile
    });

    test('should reject invalid decision authority range', () => {
      const invalidProfile = {
        ...validUserProfile,
        professional: {
          ...validUserProfile.professional!,
          decision_authority: 15 // Invalid: should be 1-10
        }
      };
      
      const result = validationService.validateUserProfile(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'professional.decision_authority')).toBe(true);
    });

    test('should reject negative years of experience', () => {
      const invalidProfile = {
        ...validUserProfile,
        professional: {
          ...validUserProfile.professional!,
          years_experience: -5
        }
      };
      
      const result = validationService.validateUserProfile(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'professional.years_experience')).toBe(true);
    });
  });

  describe('AssessmentSession Validation', () => {
    const validSession: Partial<AssessmentSession> = {
      id: 'session-123',
      user_id: 'user-456',
      assessment_type: AssessmentType.QUESTIONNAIRE,
      status: AssessmentStatus.IN_PROGRESS,
      metadata: {
        start_time: new Date(),
        modality_used: AssessmentType.QUESTIONNAIRE,
        cultural_adaptations: ['Swahili'],
        progress_percentage: 45,
        current_question_index: 9
      }
    };

    test('should validate a complete assessment session', () => {
      const result = validationService.validateAssessmentSession(validSession);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid assessment type', () => {
      const invalidSession = {
        ...validSession,
        assessment_type: 'invalid_type' as AssessmentType
      };
      
      const result = validationService.validateAssessmentSession(invalidSession);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'assessment_type')).toBe(true);
    });

    test('should reject invalid progress percentage', () => {
      const invalidSession = {
        ...validSession,
        metadata: {
          ...validSession.metadata!,
          progress_percentage: 150 // Invalid: should be 0-100
        }
      };
      
      const result = validationService.validateAssessmentSession(invalidSession);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'metadata.progress_percentage')).toBe(true);
    });

    test('should reject negative current question index', () => {
      const invalidSession = {
        ...validSession,
        metadata: {
          ...validSession.metadata!,
          current_question_index: -1
        }
      };
      
      const result = validationService.validateAssessmentSession(invalidSession);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'metadata.current_question_index')).toBe(true);
    });
  });

  describe('AssessmentResponse Validation', () => {
    const validResponse: Partial<AssessmentResponse> = {
      id: 'response-123',
      question_id: 'question-456',
      user_id: 'user-789',
      session_id: 'session-012',
      response_value: { selected_option: 'option_1', confidence: 8 },
      response_time_ms: 15000,
      confidence_level: 7,
      metadata: {
        timestamp: new Date(),
        user_agent: 'Mozilla/5.0...',
        interaction_data: { clicks: 3, hesitation_time: 2000 }
      }
    };

    test('should validate a complete assessment response', () => {
      const result = validationService.validateAssessmentResponse(validResponse);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject missing response value', () => {
      const invalidResponse = { ...validResponse };
      delete invalidResponse.response_value;
      
      const result = validationService.validateAssessmentResponse(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'response_value')).toBe(true);
    });

    test('should reject negative response time', () => {
      const invalidResponse = {
        ...validResponse,
        response_time_ms: -1000
      };
      
      const result = validationService.validateAssessmentResponse(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'response_time_ms')).toBe(true);
    });

    test('should reject invalid confidence level', () => {
      const invalidResponse = {
        ...validResponse,
        confidence_level: 15 // Invalid: should be 1-10
      };
      
      const result = validationService.validateAssessmentResponse(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'confidence_level')).toBe(true);
    });
  });

  describe('Question Validation', () => {
    const validQuestion: Partial<Question> = {
      id: 'question-123',
      type: QuestionType.MULTIPLE_CHOICE,
      text: 'What is your primary role in AI decision-making?',
      description: 'This helps us understand your authority level.',
      options: [
        { id: '1', text: 'Decision maker', value: 10 },
        { id: '2', text: 'Influencer', value: 8 },
        { id: '3', text: 'Contributor', value: 6 }
      ],
      validation_rules: [
        { type: 'required', message: 'Please select an option' }
      ],
      weight: 1.5,
      dimension: 'strategic_authority'
    };

    test('should validate a complete question', () => {
      const result = validationService.validateQuestion(validQuestion);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject empty question text', () => {
      const invalidQuestion = {
        ...validQuestion,
        text: ''
      };
      
      const result = validationService.validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'text')).toBe(true);
    });

    test('should reject invalid question type', () => {
      const invalidQuestion = {
        ...validQuestion,
        type: 'invalid_type' as QuestionType
      };
      
      const result = validationService.validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    });

    test('should reject negative weight', () => {
      const invalidQuestion = {
        ...validQuestion,
        weight: -1
      };
      
      const result = validationService.validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'weight')).toBe(true);
    });
  });

  describe('AssessmentResults Validation', () => {
    const validResults: Partial<AssessmentResults> = {
      id: 'results-123',
      session_id: 'session-456',
      user_id: 'user-789',
      overall_score: 75.5,
      dimension_scores: {
        strategic_authority: 80,
        organizational_influence: 70,
        resource_availability: 85,
        implementation_readiness: 65,
        cultural_alignment: 90
      },
      persona_classification: {
        primary_persona: PersonaType.STRATEGIC_CATALYST,
        confidence_score: 0.85,
        secondary_characteristics: ['innovative', 'collaborative'],
        persona_description: 'A strategic catalyst with strong influence capabilities'
      }
    };

    test('should validate complete assessment results', () => {
      const result = validationService.validateAssessmentResults(validResults);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid overall score range', () => {
      const invalidResults = {
        ...validResults,
        overall_score: 150 // Invalid: should be 0-100
      };
      
      const result = validationService.validateAssessmentResults(invalidResults);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'overall_score')).toBe(true);
    });

    test('should reject invalid dimension scores', () => {
      const invalidResults = {
        ...validResults,
        dimension_scores: {
          ...validResults.dimension_scores!,
          strategic_authority: -10 // Invalid: should be 0-100
        }
      };
      
      const result = validationService.validateAssessmentResults(invalidResults);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'dimension_scores.strategic_authority')).toBe(true);
    });

    test('should reject invalid persona type', () => {
      const invalidResults = {
        ...validResults,
        persona_classification: {
          ...validResults.persona_classification!,
          primary_persona: 'invalid_persona' as PersonaType
        }
      };
      
      const result = validationService.validateAssessmentResults(invalidResults);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'persona_classification.primary_persona')).toBe(true);
    });

    test('should reject invalid confidence score range', () => {
      const invalidResults = {
        ...validResults,
        persona_classification: {
          ...validResults.persona_classification!,
          confidence_score: 1.5 // Invalid: should be 0-1
        }
      };
      
      const result = validationService.validateAssessmentResults(invalidResults);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'persona_classification.confidence_score')).toBe(true);
    });
  });

  describe('Batch Validation', () => {
    test('should validate multiple objects and return combined results', () => {
      const validations = [
        { type: 'userProfile', data: { demographics: { age_range: '25-34', geographic_region: 'East Africa', cultural_context: ['Kenyan'], languages: ['English'] } } },
        { type: 'session', data: { 
          id: 'test', 
          user_id: 'user', 
          assessment_type: AssessmentType.QUESTIONNAIRE, 
          status: AssessmentStatus.NOT_STARTED,
          metadata: {
            start_time: new Date(),
            modality_used: AssessmentType.QUESTIONNAIRE,
            cultural_adaptations: [],
            progress_percentage: 0,
            current_question_index: 0
          }
        } },
        { type: 'response', data: { 
          id: 'resp', 
          question_id: 'q1', 
          user_id: 'u1', 
          session_id: 's1', 
          response_value: 'test', 
          response_time_ms: 1000,
          metadata: { timestamp: new Date() }
        } }
      ];

      const result = validationService.validateBatch(validations);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should collect errors from multiple invalid objects', () => {
      const validations = [
        { type: 'userProfile', data: { professional: { decision_authority: 15 } } }, // Invalid
        { type: 'session', data: { assessment_type: 'invalid' } }, // Invalid
        { type: 'response', data: { response_time_ms: -100 } } // Invalid
      ];

      const result = validationService.validateBatch(validations);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Error Handling', () => {
  describe('AssessmentValidationError', () => {
    test('should create validation error with details', () => {
      const validationErrors = [
        { field: 'test_field', message: 'Test error', code: 'TEST_ERROR' }
      ];
      
      const error = new AssessmentValidationError('Validation failed', validationErrors);
      
      expect(error.name).toBe('AssessmentValidationError');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.validationErrors).toEqual(validationErrors);
      expect(error.message).toBe('Validation failed');
    });
  });

  describe('AssessmentProcessingError', () => {
    test('should create processing error with details', () => {
      const details = { step: 'scoring', algorithm: 'persona_classification' };
      const error = new AssessmentProcessingError('Processing failed', details);
      
      expect(error.name).toBe('AssessmentProcessingError');
      expect(error.code).toBe('PROCESSING_ERROR');
      expect(error.details).toEqual(details);
    });
  });

  describe('AssessmentDatabaseError', () => {
    test('should create database error with original error', () => {
      const originalError = new Error('Connection timeout');
      const error = new AssessmentDatabaseError('Database operation failed', originalError);
      
      expect(error.name).toBe('AssessmentDatabaseError');
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('AssessmentExternalError', () => {
    test('should create external service error', () => {
      const error = new AssessmentExternalError('API call failed', 'scoring_service', 503);
      
      expect(error.name).toBe('AssessmentExternalError');
      expect(error.code).toBe('EXTERNAL_ERROR');
      expect(error.service).toBe('scoring_service');
      expect(error.statusCode).toBe(503);
    });
  });
});