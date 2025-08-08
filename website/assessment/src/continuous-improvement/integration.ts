/**
 * Integration layer for the Continuous Improvement Framework
 * 
 * Provides easy integration with the existing assessment platform
 */

import { ContinuousImprovementEngine } from './continuous-improvement-engine';
import { ContinuousImprovementConfig } from './types';

// Default configuration
const DEFAULT_CONFIG: ContinuousImprovementConfig = {
  abTesting: {
    enabled: true,
    defaultTrafficSplit: 50,
    minimumExperimentDuration: 7, // days
    maximumExperimentDuration: 30, // days
    significanceThreshold: 0.95
  },
  modelRefinement: {
    retrainingThreshold: 0.75, // Retrain if accuracy drops below 75%
    minimumDataPoints: 100,
    validationSplit: 0.2,
    hyperparameterTuning: true,
    crossValidationFolds: 5
  },
  performanceMonitoring: {
    enabled: true,
    checkInterval: 5, // minutes
    alertThresholds: {
      assessmentCompletionRate: 0.8,
      userSatisfactionScore: 0.7,
      accuracyScore: 0.75,
      errorRate: 0.05,
      responseTime: 2000 // milliseconds
    },
    retentionPeriod: 30 // days
  },
  contentUpdates: {
    enabled: true,
    reviewCycleFrequency: 90, // days (quarterly)
    autoApprovalThreshold: 1, // Auto-approve low priority requests
    expertReviewRequired: ['scoring_adjustment', 'new_industry_module']
  }
};

// Global instance
let improvementEngine: ContinuousImprovementEngine | null = null;

/**
 * Initialize the continuous improvement system
 */
export async function initializeContinuousImprovement(
  config: Partial<ContinuousImprovementConfig> = {}
): Promise<ContinuousImprovementEngine> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  improvementEngine = new ContinuousImprovementEngine(fullConfig);
  await improvementEngine.initialize();
  
  return improvementEngine;
}

/**
 * Get the current improvement engine instance
 */
export function getContinuousImprovementEngine(): ContinuousImprovementEngine | null {
  return improvementEngine;
}

/**
 * Shutdown the continuous improvement system
 */
export async function shutdownContinuousImprovement(): Promise<void> {
  if (improvementEngine) {
    await improvementEngine.shutdown();
    improvementEngine = null;
  }
}

/**
 * Middleware for Express.js to integrate with assessment endpoints
 */
export function continuousImprovementMiddleware() {
  return (req: any, res: any, next: any) => {
    // Add improvement tracking to request
    req.improvementEngine = improvementEngine;
    
    // Track request start time for performance monitoring
    req.startTime = Date.now();
    
    // Override res.json to capture response data
    const originalJson = res.json;
    res.json = function(data: any) {
      // Record performance metrics
      if (improvementEngine) {
        const responseTime = Date.now() - req.startTime;
        const isError = res.statusCode >= 400;
        
        improvementEngine.recordSystemPerformance?.(responseTime, 1, isError ? 1 : 0);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * Helper function to process assessment completion
 */
export async function trackAssessmentCompletion(
  assessmentType: string,
  sessionId: string,
  completionData: {
    completionTime: number;
    wasCompleted: boolean;
    userSatisfaction?: number;
    accuracyScore?: number;
  }
): Promise<void> {
  if (improvementEngine) {
    await improvementEngine.recordAssessmentCompletion(
      assessmentType,
      sessionId,
      completionData.completionTime,
      completionData.wasCompleted,
      completionData.userSatisfaction,
      completionData.accuracyScore
    );
  }
}

/**
 * Helper function to process user feedback
 */
export async function processFeedback(feedback: {
  sessionId: string;
  userId?: string;
  assessmentType: string;
  rating: number;
  feedback: string;
  category: 'usability' | 'accuracy' | 'relevance' | 'technical' | 'content';
}): Promise<void> {
  if (improvementEngine) {
    const userFeedback = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...feedback,
      timestamp: new Date(),
      processed: false,
      sentiment: feedback.rating >= 4 ? 'positive' as const : 
                feedback.rating <= 2 ? 'negative' as const : 'neutral' as const
    };
    
    await improvementEngine.processFeedback(userFeedback);
  }
}

/**
 * Helper function to get A/B test variant for user
 */
export function getAssessmentVariant(userId: string, assessmentType: string): any {
  if (improvementEngine) {
    return improvementEngine.getAssessmentVariant(userId, assessmentType);
  }
  return null;
}

/**
 * Helper function to create new A/B test experiment
 */
export async function createExperiment(
  name: string,
  type: 'assessment_approach' | 'question_formulation' | 'ui_design' | 'scoring_algorithm',
  variants: any[]
): Promise<string | null> {
  if (improvementEngine) {
    return await improvementEngine.createExperiment(name, type, variants);
  }
  return null;
}

/**
 * Helper function to get improvement dashboard data
 */
export function getImprovementDashboard(): any {
  if (improvementEngine) {
    return improvementEngine.generateImprovementDashboard();
  }
  return null;
}

/**
 * Helper function to trigger model retraining
 */
export async function triggerModelRetraining(modelId?: string): Promise<void> {
  if (improvementEngine) {
    await improvementEngine.triggerModelRetraining(modelId);
  }
}

/**
 * Express.js route handlers for continuous improvement API
 */
export const continuousImprovementRoutes = {
  // GET /api/improvement/dashboard
  getDashboard: (req: any, res: any) => {
    try {
      const dashboard = getImprovementDashboard();
      if (dashboard) {
        res.json({ success: true, data: dashboard });
      } else {
        res.status(503).json({ success: false, message: 'Improvement engine not initialized' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error generating dashboard', error: error.message });
    }
  },

  // POST /api/improvement/feedback
  submitFeedback: async (req: any, res: any) => {
    try {
      const { sessionId, userId, assessmentType, rating, feedback, category } = req.body;
      
      if (!sessionId || !assessmentType || rating === undefined || !feedback || !category) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      await processFeedback({ sessionId, userId, assessmentType, rating, feedback, category });
      res.json({ success: true, message: 'Feedback processed successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error processing feedback', error: error.message });
    }
  },

  // POST /api/improvement/experiments
  createExperiment: async (req: any, res: any) => {
    try {
      const { name, type, variants } = req.body;
      
      if (!name || !type || !variants || !Array.isArray(variants)) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const experimentId = await createExperiment(name, type, variants);
      if (experimentId) {
        res.json({ success: true, experimentId });
      } else {
        res.status(503).json({ success: false, message: 'Improvement engine not initialized' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error creating experiment', error: error.message });
    }
  },

  // POST /api/improvement/retrain
  triggerRetraining: async (req: any, res: any) => {
    try {
      const { modelId } = req.body;
      
      await triggerModelRetraining(modelId);
      res.json({ success: true, message: 'Model retraining triggered' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error triggering retraining', error: error.message });
    }
  },

  // GET /api/improvement/variant/:userId/:assessmentType
  getVariant: (req: any, res: any) => {
    try {
      const { userId, assessmentType } = req.params;
      
      if (!userId || !assessmentType) {
        return res.status(400).json({ success: false, message: 'Missing userId or assessmentType' });
      }

      const variant = getAssessmentVariant(userId, assessmentType);
      res.json({ success: true, variant });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error getting variant', error: error.message });
    }
  },

  // POST /api/improvement/track-completion
  trackCompletion: async (req: any, res: any) => {
    try {
      const { assessmentType, sessionId, completionTime, wasCompleted, userSatisfaction, accuracyScore } = req.body;
      
      if (!assessmentType || !sessionId || completionTime === undefined || wasCompleted === undefined) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      await trackAssessmentCompletion(assessmentType, sessionId, {
        completionTime,
        wasCompleted,
        userSatisfaction,
        accuracyScore
      });

      res.json({ success: true, message: 'Assessment completion tracked' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error tracking completion', error: error.message });
    }
  }
};

// Export types for external use
export * from './types';