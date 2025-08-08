/**
 * Error handling utilities for the AI Integration Assessment Platform
 * Provides comprehensive error management and logging
 */

import { AssessmentError, ValidationError } from '../types/assessment';
import { getDatabase } from '../database/connection';

/**
 * Custom error classes for different types of assessment errors
 */
export class AssessmentValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR';
  public readonly validationErrors: ValidationError[];

  constructor(message: string, validationErrors: ValidationError[]) {
    super(message);
    this.name = 'AssessmentValidationError';
    this.validationErrors = validationErrors;
  }
}

export class AssessmentProcessingError extends Error {
  public readonly code = 'PROCESSING_ERROR';
  public readonly details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'AssessmentProcessingError';
    this.details = details;
  }
}

export class AssessmentDatabaseError extends Error {
  public readonly code = 'DATABASE_ERROR';
  public readonly originalError: Error;

  constructor(message: string, originalError: Error) {
    super(message);
    this.name = 'AssessmentDatabaseError';
    this.originalError = originalError;
  }
}

export class AssessmentExternalError extends Error {
  public readonly code = 'EXTERNAL_ERROR';
  public readonly service: string;
  public readonly statusCode?: number;

  constructor(message: string, service: string, statusCode?: number) {
    super(message);
    this.name = 'AssessmentExternalError';
    this.service = service;
    this.statusCode = statusCode;
  }
}

/**
 * Error logging service
 */
export class ErrorLogger {
  private db = getDatabase();

  /**
   * Log an assessment error to the database
   */
  public async logError(
    error: Error,
    sessionId?: string,
    userId?: string,
    additionalDetails?: any
  ): Promise<void> {
    try {
      const assessmentError: Omit<AssessmentError, 'timestamp'> = {
        type: this.getErrorType(error),
        message: error.message,
        details: {
          stack: error.stack,
          name: error.name,
          ...additionalDetails,
          ...(error as any).details
        },
        session_id: sessionId,
        user_id: userId
      };

      await this.db.query(
        `INSERT INTO assessment_errors (type, message, details_json, session_id, user_id) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          assessmentError.type,
          assessmentError.message,
          JSON.stringify(assessmentError.details),
          assessmentError.session_id,
          assessmentError.user_id
        ]
      );
    } catch (dbError) {
      // If database logging fails, log to console as fallback
      console.error('Failed to log error to database:', dbError);
      console.error('Original error:', error);
    }
  }

  /**
   * Determine error type based on error instance
   */
  private getErrorType(error: Error): AssessmentError['type'] {
    if (error instanceof AssessmentValidationError) return 'validation';
    if (error instanceof AssessmentProcessingError) return 'processing';
    if (error instanceof AssessmentDatabaseError) return 'database';
    if (error instanceof AssessmentExternalError) return 'external';
    return 'processing'; // Default fallback
  }
}

/**
 * Error handler middleware for Express
 */
export class AssessmentErrorHandler {
  private errorLogger = new ErrorLogger();

  /**
   * Handle errors in assessment endpoints
   */
  public async handleError(
    error: Error,
    req: any,
    res: any,
    next: any
  ): Promise<void> {
    const sessionId = req.body?.session_id || req.params?.sessionId;
    const userId = req.body?.user_id || req.user?.id;

    // Log the error
    await this.errorLogger.logError(error, sessionId, userId, {
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Send appropriate response based on error type
    if (error instanceof AssessmentValidationError) {
      res.status(400).json({
        success: false,
        error: {
          type: 'validation',
          message: error.message,
          details: error.validationErrors
        }
      });
    } else if (error instanceof AssessmentProcessingError) {
      res.status(422).json({
        success: false,
        error: {
          type: 'processing',
          message: error.message,
          details: process.env.NODE_ENV === 'development' ? error.details : undefined
        }
      });
    } else if (error instanceof AssessmentDatabaseError) {
      res.status(500).json({
        success: false,
        error: {
          type: 'database',
          message: 'A database error occurred. Please try again.',
          details: process.env.NODE_ENV === 'development' ? error.originalError.message : undefined
        }
      });
    } else if (error instanceof AssessmentExternalError) {
      res.status(error.statusCode || 502).json({
        success: false,
        error: {
          type: 'external',
          message: `External service error: ${error.service}`,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    } else {
      // Generic error handling
      res.status(500).json({
        success: false,
        error: {
          type: 'internal',
          message: 'An unexpected error occurred. Please try again.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }

  /**
   * Wrap async route handlers to catch errors
   */
  public wrapAsync(fn: Function) {
    return (req: any, res: any, next: any) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

// Export singleton instances
export const errorLogger = new ErrorLogger();
export const assessmentErrorHandler = new AssessmentErrorHandler();