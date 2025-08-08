/**
 * Tests for the Continuous Improvement Framework
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContinuousImprovementEngine } from '../continuous-improvement-engine';
import { ABTestingSystem } from '../ab-testing-system';
import { MLModelRefinement } from '../ml-model-refinement';
import { PerformanceMonitoring } from '../performance-monitoring';
import { ContentUpdateWorkflow } from '../content-update-workflow';
import { ContinuousImprovementConfig, UserFeedback, OutcomeData } from '../types';

describe('ContinuousImprovementEngine', () => {
  let engine: ContinuousImprovementEngine;
  let config: ContinuousImprovementConfig;

  beforeEach(() => {
    config = {
      abTesting: {
        enabled: true,
        defaultTrafficSplit: 50,
        minimumExperimentDuration: 7,
        maximumExperimentDuration: 30,
        significanceThreshold: 0.95
      },
      modelRefinement: {
        retrainingThreshold: 0.75,
        minimumDataPoints: 100,
        validationSplit: 0.2,
        hyperparameterTuning: true,
        crossValidationFolds: 5
      },
      performanceMonitoring: {
        enabled: true,
        checkInterval: 5,
        alertThresholds: {
          assessmentCompletionRate: 0.8,
          userSatisfactionScore: 0.7,
          accuracyScore: 0.75,
          errorRate: 0.05,
          responseTime: 2000
        },
        retentionPeriod: 30
      },
      contentUpdates: {
        enabled: true,
        reviewCycleFrequency: 90,
        autoApprovalThreshold: 1,
        expertReviewRequired: ['scoring_adjustment', 'new_industry_module']
      }
    };

    engine = new ContinuousImprovementEngine(config);
  });

  afterEach(async () => {
    if (engine) {
      await engine.shutdown();
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await engine.initialize();
      
      const dashboard = engine.generateImprovementDashboard();
      expect(dashboard.systemStatus.isRunning).toBe(true);
      expect(dashboard.systemStatus.abTestingEnabled).toBe(true);
      expect(dashboard.systemStatus.performanceMonitoringEnabled).toBe(true);
      expect(dashboard.systemStatus.contentUpdatesEnabled).toBe(true);
    });

    it('should shutdown successfully', async () => {
      await engine.initialize();
      await engine.shutdown();
      
      const dashboard = engine.generateImprovementDashboard();
      expect(dashboard.systemStatus.isRunning).toBe(false);
    });
  });

  describe('feedback processing', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should process user feedback', async () => {
      const feedback: UserFeedback = {
        id: 'feedback_1',
        sessionId: 'session_1',
        userId: 'user_1',
        assessmentType: 'strategic_readiness',
        rating: 2,
        feedback: 'The questions were confusing and not relevant to my industry',
        category: 'relevance',
        timestamp: new Date(),
        processed: false,
        sentiment: 'negative'
      };

      await expect(engine.processFeedback(feedback)).resolves.not.toThrow();
    });

    it('should process outcome data', async () => {
      const outcomeData: OutcomeData = {
        sessionId: 'session_1',
        userId: 'user_1',
        assessmentResults: {
          overallScore: 75,
          persona: 'Strategic Contributor',
          recommendedService: 'Strategic Systems'
        },
        actualOutcome: {
          serviceEngaged: 'Strategic Clarity',
          implementationSuccess: true
        },
        followUpDate: new Date(),
        outcomeAccuracy: 0.6,
        serviceEngagement: 'Strategic Clarity',
        satisfactionScore: 4,
        implementationSuccess: true
      };

      await expect(engine.processOutcomeData(outcomeData)).resolves.not.toThrow();
    });
  });

  describe('assessment tracking', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should record assessment completion', async () => {
      await expect(
        engine.recordAssessmentCompletion(
          'strategic_readiness',
          'session_1',
          1200, // 20 minutes
          true,
          4.5,
          0.85
        )
      ).resolves.not.toThrow();
    });

    it('should record assessment abandonment', async () => {
      await expect(
        engine.recordAssessmentCompletion(
          'strategic_readiness',
          'session_2',
          300, // 5 minutes
          false
        )
      ).resolves.not.toThrow();
    });
  });

  describe('A/B testing', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should create assessment approach experiment', async () => {
      const experimentId = await engine.createExperiment(
        'Question Order Test',
        'assessment_approach',
        [
          { name: 'Linear Approach', config: { questionOrder: 'linear' } },
          { name: 'Adaptive Approach', config: { questionOrder: 'adaptive' } }
        ]
      );

      expect(experimentId).toBeTruthy();
      expect(typeof experimentId).toBe('string');
    });

    it('should start and stop experiments', async () => {
      const experimentId = await engine.createExperiment(
        'UI Test',
        'ui_design',
        [
          { name: 'Design A', config: { theme: 'light' } },
          { name: 'Design B', config: { theme: 'dark' } }
        ]
      );

      await expect(engine.startExperiment(experimentId)).resolves.not.toThrow();
      
      const results = await engine.stopExperiment(experimentId);
      expect(results).toBeTruthy();
      expect(results.experimentId).toBe(experimentId);
    });

    it('should assign users to variants', async () => {
      const experimentId = await engine.createExperiment(
        'Question Format Test',
        'question_formulation',
        [
          { question: 'How would you rate your AI readiness?', options: ['Low', 'Medium', 'High'] },
          { question: 'What is your current AI maturity level?', options: ['Beginner', 'Intermediate', 'Advanced'] }
        ]
      );

      await engine.startExperiment(experimentId);

      const variant1 = engine.getAssessmentVariant('user_1', 'question_formulation');
      const variant2 = engine.getAssessmentVariant('user_2', 'question_formulation');

      expect(variant1).toBeTruthy();
      expect(variant2).toBeTruthy();
      
      // Same user should get same variant
      const variant1Again = engine.getAssessmentVariant('user_1', 'question_formulation');
      expect(variant1.variantId).toBe(variant1Again.variantId);
    });
  });

  describe('model retraining', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should trigger model retraining', async () => {
      // Add some training data first
      const modelRefinement = (engine as any).modelRefinement;
      for (let i = 0; i < 101; i++) {
        await modelRefinement.addTrainingData(
          'persona_classification',
          { responses: [`response_${i}`] },
          { persona: 'Strategic Contributor' }
        );
      }
      
      await expect(engine.triggerModelRetraining('persona_classification')).resolves.not.toThrow();
    });

    it('should run automated retraining', async () => {
      await expect(engine.triggerModelRetraining()).resolves.not.toThrow();
    });
  });

  describe('dashboard generation', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should generate improvement dashboard', () => {
      const dashboard = engine.generateImprovementDashboard();

      expect(dashboard).toBeTruthy();
      expect(dashboard.timestamp).toBeInstanceOf(Date);
      expect(dashboard.systemStatus).toBeTruthy();
      expect(dashboard.performance).toBeTruthy();
      expect(dashboard.experiments).toBeTruthy();
      expect(dashboard.models).toBeTruthy();
      expect(dashboard.content).toBeTruthy();
      expect(Array.isArray(dashboard.recommendations)).toBe(true);
    });

    it('should generate improvement report', () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = new Date();

      const report = engine.generateImprovementReport(startDate, endDate);

      expect(report).toBeTruthy();
      expect(report.period.startDate).toBe(startDate);
      expect(report.period.endDate).toBe(endDate);
      expect(report.summary).toBeTruthy();
      expect(Array.isArray(report.overallRecommendations)).toBe(true);
    });
  });
});

describe('ABTestingSystem', () => {
  let abTesting: ABTestingSystem;

  beforeEach(() => {
    abTesting = new ABTestingSystem({
      defaultTrafficSplit: 50,
      minimumExperimentDuration: 7,
      maximumExperimentDuration: 30,
      significanceThreshold: 0.95
    });
  });

  it('should create and manage experiments', async () => {
    const experimentId = await abTesting.createAssessmentApproachExperiment(
      'Test Experiment',
      [
        { name: 'Approach A', config: { type: 'linear' } },
        { name: 'Approach B', config: { type: 'adaptive' } }
      ]
    );

    expect(experimentId).toBeTruthy();

    await abTesting.startExperiment(experimentId);

    const activeExperiments = abTesting.getActiveExperiments();
    expect(activeExperiments.length).toBe(1);
    expect(activeExperiments[0].id).toBe(experimentId);
  });

  it('should assign users to variants consistently', async () => {
    const experimentId = await abTesting.createAssessmentApproachExperiment(
      'Consistency Test',
      [
        { name: 'Variant A', config: { value: 'a' } },
        { name: 'Variant B', config: { value: 'b' } }
      ]
    );

    await abTesting.startExperiment(experimentId);

    const variant1 = abTesting.assignUserToVariant('user_123', experimentId);
    const variant2 = abTesting.assignUserToVariant('user_123', experimentId);

    expect(variant1).toBe(variant2);
    expect(variant1).toBeTruthy();
  });

  it('should record and analyze experiment events', async () => {
    const experimentId = await abTesting.createAssessmentApproachExperiment(
      'Event Test',
      [
        { name: 'Control', config: { version: 'control' } },
        { name: 'Treatment', config: { version: 'treatment' } }
      ]
    );

    await abTesting.startExperiment(experimentId);

    // Assign user and record events
    const variantId = abTesting.assignUserToVariant('user_456', experimentId);
    expect(variantId).toBeTruthy();

    await abTesting.recordEvent('user_456', experimentId, 'completion', {
      duration: 1200,
      satisfaction: 4.5
    });

    const results = await abTesting.analyzeExperiment(experimentId);
    expect(results).toBeTruthy();
    expect(results.experimentId).toBe(experimentId);
  });
});

describe('PerformanceMonitoring', () => {
  let monitoring: PerformanceMonitoring;

  beforeEach(() => {
    monitoring = new PerformanceMonitoring({
      checkInterval: 1, // 1 minute for testing
      alertThresholds: {
        assessmentCompletionRate: 0.8,
        userSatisfactionScore: 0.7,
        accuracyScore: 0.75,
        errorRate: 0.05,
        responseTime: 2000
      },
      retentionPeriod: 7 // 7 days
    });
  });

  afterEach(() => {
    monitoring.stopMonitoring();
  });

  it('should start and stop monitoring', () => {
    monitoring.startMonitoring();
    expect(() => monitoring.stopMonitoring()).not.toThrow();
  });

  it('should record assessment completion metrics', () => {
    expect(() => {
      monitoring.recordAssessmentCompletion('strategic_readiness', 1200, true, 4.5);
    }).not.toThrow();
  });

  it('should record system performance metrics', () => {
    expect(() => {
      monitoring.recordSystemPerformance(500, 100, 0.01);
    }).not.toThrow();
  });

  it('should generate dashboard data', () => {
    monitoring.recordAssessmentCompletion('strategic_readiness', 1200, true, 4.5);
    monitoring.recordSystemPerformance(500, 100, 0.01);

    const dashboard = monitoring.generateDashboardData();
    expect(dashboard).toBeTruthy();
    expect(dashboard.timestamp).toBeInstanceOf(Date);
    expect(dashboard.overview).toBeTruthy();
    expect(Array.isArray(dashboard.alerts)).toBe(true);
  });

  it('should process feedback for monitoring', () => {
    const feedback: UserFeedback = {
      id: 'feedback_1',
      sessionId: 'session_1',
      assessmentType: 'strategic_readiness',
      rating: 2,
      feedback: 'Poor experience',
      category: 'usability',
      timestamp: new Date(),
      processed: false,
      sentiment: 'negative'
    };

    expect(() => {
      monitoring.processFeedbackForMonitoring(feedback);
    }).not.toThrow();
  });
});

describe('ContentUpdateWorkflow', () => {
  let workflow: ContentUpdateWorkflow;

  beforeEach(() => {
    workflow = new ContentUpdateWorkflow({
      reviewCycleFrequency: 90,
      autoApprovalThreshold: 1,
      expertReviewRequired: ['scoring_adjustment', 'new_industry_module']
    });
  });

  it('should submit update requests', async () => {
    const requestId = await workflow.submitUpdateRequest({
      type: 'question_update',
      priority: 'medium',
      description: 'Update confusing question in strategic readiness assessment',
      requestedBy: 'user_feedback'
    });

    expect(requestId).toBeTruthy();
    expect(typeof requestId).toBe('string');
  });

  it('should process feedback for content updates', async () => {
    const feedback: UserFeedback = {
      id: 'feedback_1',
      sessionId: 'session_1',
      assessmentType: 'strategic_readiness',
      rating: 1,
      feedback: 'Questions are not relevant to my industry',
      category: 'relevance',
      timestamp: new Date(),
      processed: false,
      sentiment: 'negative'
    };

    await expect(workflow.processFeedbackForContentUpdate(feedback)).resolves.not.toThrow();
  });

  it('should start and complete expert review cycles', async () => {
    const cycleId = await workflow.startExpertReviewCycle(
      'quarterly_review',
      ['assessment_questions', 'scoring_algorithms'],
      ['expert_1', 'expert_2']
    );

    expect(cycleId).toBeTruthy();

    await workflow.submitReviewFinding(cycleId, {
      area: 'assessment_questions',
      severity: 'minor',
      description: 'Some questions could be clearer',
      recommendation: 'Revise question wording for clarity',
      reviewer: 'expert_1'
    });

    await workflow.completeReviewCycle(cycleId, [
      'Improve question clarity',
      'Add more industry-specific examples'
    ]);

    // Check all review cycles (including completed ones)
    const allReviews = Array.from((workflow as any).reviewCycles.values());
    expect(allReviews.find(r => r.id === cycleId)?.status).toBe('completed');
  });

  it('should generate content update dashboard', () => {
    const dashboard = workflow.generateContentUpdateDashboard();

    expect(dashboard).toBeTruthy();
    expect(dashboard.timestamp).toBeInstanceOf(Date);
    expect(dashboard.summary).toBeTruthy();
    expect(Array.isArray(dashboard.urgentRequests)).toBe(true);
    expect(dashboard.contentHealth).toBeTruthy();
  });
});

describe('Integration', () => {
  it('should export all necessary components', () => {
    expect(ContinuousImprovementEngine).toBeTruthy();
    expect(ABTestingSystem).toBeTruthy();
    expect(MLModelRefinement).toBeTruthy();
    expect(PerformanceMonitoring).toBeTruthy();
    expect(ContentUpdateWorkflow).toBeTruthy();
  });
});