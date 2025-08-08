/**
 * RESTful API routes for assessment functionality
 * Implements comprehensive API endpoints for all assessment operations
 * Requirements: 5.4, 9.4, 10.1
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { AssessmentController } from '../controllers/AssessmentController';
import { validateRequest } from '../../utils/validation';
import { auditMiddleware } from '../../audit/middleware';
import { 
  rateLimitConfigs, 
  adaptiveRateLimiter, 
  securityHeaders, 
  requestSizeLimiter,
  apiKeyValidation 
} from '../rateLimiting';

const router = Router();
const assessmentController = new AssessmentController();

// Apply security middleware to all routes
router.use(securityHeaders);
router.use(requestSizeLimiter);
router.use(apiKeyValidation);

// Validation schemas
const createAssessmentValidation = [
  body('assessment_type')
    .isIn(['questionnaire', 'scenario_based', 'conversational', 'visual_pattern', 'behavioral'])
    .withMessage('Invalid assessment type'),
  body('user_profile.demographics.geographic_region')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Invalid geographic region'),
  body('user_profile.professional.industry')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Invalid industry'),
  body('cultural_preferences')
    .optional()
    .isArray()
    .withMessage('Cultural preferences must be an array')
];

const submitResponseValidation = [
  param('sessionId')
    .isUUID()
    .withMessage('Invalid session ID format'),
  body('question_id')
    .isUUID()
    .withMessage('Invalid question ID format'),
  body('response_value')
    .notEmpty()
    .withMessage('Response value is required'),
  body('confidence_level')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Confidence level must be between 1 and 10'),
  body('interaction_metadata')
    .optional()
    .isObject()
    .withMessage('Interaction metadata must be an object')
];

const getResultsValidation = [
  param('sessionId')
    .isUUID()
    .withMessage('Invalid session ID format')
];

// Assessment CRUD Operations

/**
 * POST /api/assessments
 * Create a new assessment session
 */
router.post('/',
  rateLimitConfigs.assessmentCreation,
  rateLimitConfigs.general,
  auditMiddleware('assessment_creation'),
  createAssessmentValidation,
  validateRequest,
  assessmentController.createAssessment.bind(assessmentController)
);

/**
 * GET /api/assessments/:sessionId
 * Get assessment session details
 */
router.get('/:sessionId',
  rateLimitConfigs.general,
  auditMiddleware('assessment_retrieval'),
  [param('sessionId').isUUID().withMessage('Invalid session ID format')],
  validateRequest,
  assessmentController.getAssessment.bind(assessmentController)
);

/**
 * PUT /api/assessments/:sessionId
 * Update assessment session
 */
router.put('/:sessionId',
  rateLimitConfigs.general,
  auditMiddleware('assessment_update'),
  [
    param('sessionId').isUUID().withMessage('Invalid session ID format'),
    body('status').optional().isIn(['not_started', 'in_progress', 'completed', 'abandoned']),
    body('metadata').optional().isObject()
  ],
  validateRequest,
  assessmentController.updateAssessment.bind(assessmentController)
);

/**
 * DELETE /api/assessments/:sessionId
 * Delete/abandon assessment session
 */
router.delete('/:sessionId',
  rateLimitConfigs.general,
  auditMiddleware('assessment_deletion'),
  [param('sessionId').isUUID().withMessage('Invalid session ID format')],
  validateRequest,
  assessmentController.deleteAssessment.bind(assessmentController)
);

// Question Operations

/**
 * GET /api/assessments/:sessionId/questions/current
 * Get current question for assessment session
 */
router.get('/:sessionId/questions/current',
  rateLimitConfigs.general,
  auditMiddleware('question_retrieval'),
  [param('sessionId').isUUID().withMessage('Invalid session ID format')],
  validateRequest,
  assessmentController.getCurrentQuestion.bind(assessmentController)
);

/**
 * GET /api/assessments/:sessionId/questions/:questionId
 * Get specific question details
 */
router.get('/:sessionId/questions/:questionId',
  rateLimitConfigs.general,
  auditMiddleware('question_retrieval'),
  [
    param('sessionId').isUUID().withMessage('Invalid session ID format'),
    param('questionId').isUUID().withMessage('Invalid question ID format')
  ],
  validateRequest,
  assessmentController.getQuestion.bind(assessmentController)
);

// Response Operations

/**
 * POST /api/assessments/:sessionId/responses
 * Submit response to assessment question
 */
router.post('/:sessionId/responses',
  rateLimitConfigs.responseSubmission,
  rateLimitConfigs.general,
  auditMiddleware('response_submission'),
  submitResponseValidation,
  validateRequest,
  assessmentController.submitResponse.bind(assessmentController)
);

/**
 * GET /api/assessments/:sessionId/responses
 * Get all responses for assessment session
 */
router.get('/:sessionId/responses',
  rateLimitConfigs.general,
  auditMiddleware('response_retrieval'),
  [param('sessionId').isUUID().withMessage('Invalid session ID format')],
  validateRequest,
  assessmentController.getResponses.bind(assessmentController)
);

// Results Operations

/**
 * GET /api/assessments/:sessionId/results
 * Get assessment results
 */
router.get('/:sessionId/results',
  rateLimitConfigs.general,
  auditMiddleware('results_retrieval'),
  getResultsValidation,
  validateRequest,
  assessmentController.getResults.bind(assessmentController)
);

/**
 * POST /api/assessments/:sessionId/results/calculate
 * Calculate assessment results
 */
router.post('/:sessionId/results/calculate',
  rateLimitConfigs.resultsCalculation,
  auditMiddleware('results_calculation'),
  [param('sessionId').isUUID().withMessage('Invalid session ID format')],
  validateRequest,
  assessmentController.calculateResults.bind(assessmentController)
);

/**
 * GET /api/assessments/:sessionId/results/export
 * Export assessment results as PDF
 */
router.get('/:sessionId/results/export',
  rateLimitConfigs.exportDownload,
  auditMiddleware('results_export'),
  [param('sessionId').isUUID().withMessage('Invalid session ID format')],
  validateRequest,
  assessmentController.exportResults.bind(assessmentController)
);

// Progress and Analytics

/**
 * GET /api/assessments/:sessionId/progress
 * Get assessment progress
 */
router.get('/:sessionId/progress',
  rateLimitConfigs.general,
  auditMiddleware('progress_retrieval'),
  [param('sessionId').isUUID().withMessage('Invalid session ID format')],
  validateRequest,
  assessmentController.getProgress.bind(assessmentController)
);

// User Assessment History

/**
 * GET /api/users/:userId/assessments
 * Get user's assessment history
 */
router.get('/users/:userId/assessments',
  rateLimitConfigs.general,
  auditMiddleware('user_assessments_retrieval'),
  [
    param('userId').isUUID().withMessage('Invalid user ID format'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
    query('status').optional().isIn(['not_started', 'in_progress', 'completed', 'abandoned'])
  ],
  validateRequest,
  assessmentController.getUserAssessments.bind(assessmentController)
);

// Assessment Types and Metadata

/**
 * GET /api/assessment-types
 * Get available assessment types and their metadata
 */
router.get('/types',
  rateLimitConfigs.general,
  auditMiddleware('assessment_types_retrieval'),
  assessmentController.getAssessmentTypes.bind(assessmentController)
);

/**
 * GET /api/assessment-types/:type/questions
 * Get questions for specific assessment type
 */
router.get('/types/:type/questions',
  rateLimitConfigs.general,
  auditMiddleware('assessment_questions_retrieval'),
  [
    param('type').isIn(['questionnaire', 'scenario_based', 'conversational', 'visual_pattern', 'behavioral'])
      .withMessage('Invalid assessment type'),
    query('industry').optional().isString().withMessage('Industry must be a string'),
    query('culture').optional().isString().withMessage('Culture must be a string')
  ],
  validateRequest,
  assessmentController.getQuestionsByType.bind(assessmentController)
);

// Health Check

/**
 * GET /api/assessments/health
 * Health check endpoint for assessment service
 */
router.get('/health',
  rateLimitConfigs.healthCheck,
  assessmentController.healthCheck.bind(assessmentController)
);

export { router as assessmentRoutes };