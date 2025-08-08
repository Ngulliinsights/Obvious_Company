/**
 * Data validation utilities for the AI Integration Assessment Platform
 * Provides comprehensive validation for all assessment data models
 */

import { 
  UserProfile, 
  AssessmentSession, 
  AssessmentResponse, 
  AssessmentResults,
  Question,
  ValidationError,
  AssessmentType,
  PersonaType,
  QuestionType,
  AssessmentStatus
} from '../types/assessment';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Base validator class
 */
export abstract class BaseValidator {
  protected errors: ValidationError[] = [];

  protected addError(field: string, message: string, code: string, value?: any): void {
    this.errors.push({ field, message, code, value });
  }

  protected validateRequired(value: any, field: string): boolean {
    if (value === null || value === undefined || value === '') {
      this.addError(field, `${field} is required`, 'REQUIRED');
      return false;
    }
    return true;
  }

  protected validateString(value: any, field: string, minLength?: number, maxLength?: number): boolean {
    if (!this.validateRequired(value, field)) return false;
    
    if (typeof value !== 'string') {
      this.addError(field, `${field} must be a string`, 'INVALID_TYPE', value);
      return false;
    }

    if (minLength && value.length < minLength) {
      this.addError(field, `${field} must be at least ${minLength} characters`, 'MIN_LENGTH', value);
      return false;
    }

    if (maxLength && value.length > maxLength) {
      this.addError(field, `${field} must be no more than ${maxLength} characters`, 'MAX_LENGTH', value);
      return false;
    }

    return true;
  }

  protected validateNumber(value: any, field: string, min?: number, max?: number): boolean {
    if (!this.validateRequired(value, field)) return false;
    
    if (typeof value !== 'number' || isNaN(value)) {
      this.addError(field, `${field} must be a valid number`, 'INVALID_TYPE', value);
      return false;
    }

    if (min !== undefined && value < min) {
      this.addError(field, `${field} must be at least ${min}`, 'MIN_VALUE', value);
      return false;
    }

    if (max !== undefined && value > max) {
      this.addError(field, `${field} must be no more than ${max}`, 'MAX_VALUE', value);
      return false;
    }

    return true;
  }

  protected validateEnum<T>(value: any, field: string, enumObject: Record<string, T>): boolean {
    if (!this.validateRequired(value, field)) return false;
    
    const validValues = Object.values(enumObject);
    if (!validValues.includes(value)) {
      this.addError(field, `${field} must be one of: ${validValues.join(', ')}`, 'INVALID_ENUM', value);
      return false;
    }

    return true;
  }

  protected validateArray(value: any, field: string, minLength?: number, maxLength?: number): boolean {
    if (!this.validateRequired(value, field)) return false;
    
    if (!Array.isArray(value)) {
      this.addError(field, `${field} must be an array`, 'INVALID_TYPE', value);
      return false;
    }

    if (minLength && value.length < minLength) {
      this.addError(field, `${field} must have at least ${minLength} items`, 'MIN_LENGTH', value);
      return false;
    }

    if (maxLength && value.length > maxLength) {
      this.addError(field, `${field} must have no more than ${maxLength} items`, 'MAX_LENGTH', value);
      return false;
    }

    return true;
  }

  protected validateDate(value: any, field: string): boolean {
    if (!this.validateRequired(value, field)) return false;
    
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      this.addError(field, `${field} must be a valid date`, 'INVALID_DATE', value);
      return false;
    }

    return true;
  }

  protected validateEmail(value: any, field: string): boolean {
    if (!this.validateString(value, field)) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      this.addError(field, `${field} must be a valid email address`, 'INVALID_EMAIL', value);
      return false;
    }

    return true;
  }

  public getValidationResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors]
    };
  }

  public reset(): void {
    this.errors = [];
  }
}

/**
 * User profile validator
 */
export class UserProfileValidator extends BaseValidator {
  public validate(userProfile: Partial<UserProfile>): ValidationResult {
    this.reset();

    // Validate demographics
    if (userProfile.demographics) {
      this.validateString(userProfile.demographics.age_range, 'demographics.age_range');
      this.validateString(userProfile.demographics.geographic_region, 'demographics.geographic_region');
      this.validateArray(userProfile.demographics.cultural_context, 'demographics.cultural_context');
      this.validateArray(userProfile.demographics.languages, 'demographics.languages');
    }

    // Validate professional information
    if (userProfile.professional) {
      this.validateString(userProfile.professional.industry, 'professional.industry');
      this.validateString(userProfile.professional.role_level, 'professional.role_level');
      this.validateString(userProfile.professional.organization_size, 'professional.organization_size');
      this.validateNumber(userProfile.professional.decision_authority, 'professional.decision_authority', 1, 10);
      this.validateNumber(userProfile.professional.years_experience, 'professional.years_experience', 0, 50);
    }

    // Validate preferences
    if (userProfile.preferences) {
      this.validateArray(userProfile.preferences.assessment_modality, 'preferences.assessment_modality');
      this.validateString(userProfile.preferences.learning_style, 'preferences.learning_style');
      this.validateString(userProfile.preferences.communication_preference, 'preferences.communication_preference');
      this.validateString(userProfile.preferences.timezone, 'preferences.timezone');
    }

    return this.getValidationResult();
  }
}

/**
 * Assessment session validator
 */
export class AssessmentSessionValidator extends BaseValidator {
  public validate(session: Partial<AssessmentSession>): ValidationResult {
    this.reset();

    this.validateString(session.id, 'id');
    this.validateString(session.user_id, 'user_id');
    this.validateEnum(session.assessment_type, 'assessment_type', AssessmentType);
    this.validateEnum(session.status, 'status', AssessmentStatus);

    if (session.metadata) {
      this.validateDate(session.metadata.start_time, 'metadata.start_time');
      this.validateEnum(session.metadata.modality_used, 'metadata.modality_used', AssessmentType);
      this.validateArray(session.metadata.cultural_adaptations, 'metadata.cultural_adaptations');
      this.validateNumber(session.metadata.progress_percentage, 'metadata.progress_percentage', 0, 100);
      this.validateNumber(session.metadata.current_question_index, 'metadata.current_question_index', 0);

      if (session.metadata.completion_time) {
        this.validateDate(session.metadata.completion_time, 'metadata.completion_time');
      }

      if (session.metadata.duration_minutes) {
        this.validateNumber(session.metadata.duration_minutes, 'metadata.duration_minutes', 0);
      }
    }

    return this.getValidationResult();
  }
}

/**
 * Assessment response validator
 */
export class AssessmentResponseValidator extends BaseValidator {
  public validate(response: Partial<AssessmentResponse>): ValidationResult {
    this.reset();

    this.validateString(response.id, 'id');
    this.validateString(response.question_id, 'question_id');
    this.validateString(response.user_id, 'user_id');
    this.validateString(response.session_id, 'session_id');
    this.validateRequired(response.response_value, 'response_value');
    this.validateNumber(response.response_time_ms, 'response_time_ms', 0);

    if (response.confidence_level !== undefined) {
      this.validateNumber(response.confidence_level, 'confidence_level', 1, 10);
    }

    if (response.metadata) {
      this.validateDate(response.metadata.timestamp, 'metadata.timestamp');
    }

    return this.getValidationResult();
  }
}

/**
 * Question validator
 */
export class QuestionValidator extends BaseValidator {
  public validate(question: Partial<Question>): ValidationResult {
    this.reset();

    this.validateString(question.id, 'id');
    this.validateEnum(question.type, 'type', QuestionType);
    this.validateString(question.text, 'text', 1, 1000);
    this.validateArray(question.validation_rules, 'validation_rules');
    this.validateNumber(question.weight, 'weight', 0, 10);
    this.validateString(question.dimension, 'dimension');

    if (question.description) {
      this.validateString(question.description, 'description', 0, 2000);
    }

    if (question.options) {
      this.validateArray(question.options, 'options');
    }

    return this.getValidationResult();
  }
}

/**
 * Assessment results validator
 */
export class AssessmentResultsValidator extends BaseValidator {
  public validate(results: Partial<AssessmentResults>): ValidationResult {
    this.reset();

    this.validateString(results.id, 'id');
    this.validateString(results.session_id, 'session_id');
    this.validateString(results.user_id, 'user_id');
    this.validateNumber(results.overall_score, 'overall_score', 0, 100);

    if (results.dimension_scores) {
      this.validateNumber(results.dimension_scores.strategic_authority, 'dimension_scores.strategic_authority', 0, 100);
      this.validateNumber(results.dimension_scores.organizational_influence, 'dimension_scores.organizational_influence', 0, 100);
      this.validateNumber(results.dimension_scores.resource_availability, 'dimension_scores.resource_availability', 0, 100);
      this.validateNumber(results.dimension_scores.implementation_readiness, 'dimension_scores.implementation_readiness', 0, 100);
      this.validateNumber(results.dimension_scores.cultural_alignment, 'dimension_scores.cultural_alignment', 0, 100);
    }

    if (results.persona_classification) {
      this.validateEnum(results.persona_classification.primary_persona, 'persona_classification.primary_persona', PersonaType);
      this.validateNumber(results.persona_classification.confidence_score, 'persona_classification.confidence_score', 0, 1);
      this.validateArray(results.persona_classification.secondary_characteristics, 'persona_classification.secondary_characteristics');
      this.validateString(results.persona_classification.persona_description, 'persona_classification.persona_description');
    }

    return this.getValidationResult();
  }
}

/**
 * Comprehensive validation service
 */
export class ValidationService {
  private userProfileValidator = new UserProfileValidator();
  private sessionValidator = new AssessmentSessionValidator();
  private responseValidator = new AssessmentResponseValidator();
  private questionValidator = new QuestionValidator();
  private resultsValidator = new AssessmentResultsValidator();

  public validateUserProfile(userProfile: Partial<UserProfile>): ValidationResult {
    return this.userProfileValidator.validate(userProfile);
  }

  public validateAssessmentSession(session: Partial<AssessmentSession>): ValidationResult {
    return this.sessionValidator.validate(session);
  }

  public validateAssessmentResponse(response: Partial<AssessmentResponse>): ValidationResult {
    return this.responseValidator.validate(response);
  }

  public validateQuestion(question: Partial<Question>): ValidationResult {
    return this.questionValidator.validate(question);
  }

  public validateAssessmentResults(results: Partial<AssessmentResults>): ValidationResult {
    return this.resultsValidator.validate(results);
  }

  /**
   * Validate multiple objects and return combined results
   */
  public validateBatch(validations: Array<{ type: string; data: any }>): ValidationResult {
    const allErrors: ValidationError[] = [];

    for (const validation of validations) {
      let result: ValidationResult;

      switch (validation.type) {
        case 'userProfile':
          result = this.validateUserProfile(validation.data);
          break;
        case 'session':
          result = this.validateAssessmentSession(validation.data);
          break;
        case 'response':
          result = this.validateAssessmentResponse(validation.data);
          break;
        case 'question':
          result = this.validateQuestion(validation.data);
          break;
        case 'results':
          result = this.validateAssessmentResults(validation.data);
          break;
        default:
          continue;
      }

      allErrors.push(...result.errors);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }
}

// Export singleton instance
export const validationService = new ValidationService();

/**
 * Express middleware for request validation
 */
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
    return;
  }
  
  next();
};