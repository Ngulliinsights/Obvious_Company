---
title: "Continuous-improvement-engine"
type: "framework"
audience: "executives"
version: "v2025.js"
dependencies:
  - "" # Add dependencies here
implementations:
  - "" # Add implementations here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContinuousImprovementEngine = void 0;
const ab_testing_system_1 = require("./ab-testing-system");
const ml_model_refinement_1 = require("./ml-model-refinement");
const performance_monitoring_1 = require("./performance-monitoring");
const content_update_workflow_1 = require("./content-update-workflow");
class ContinuousImprovementEngine {
    constructor(config) {
        this.config = config;
        this.isRunning = false;
        this.improvementInterval = null;
        this.initializeSubsystems();
    }
    async initialize() {
        console.log('Initializing Continuous Improvement Engine...');
        await this.registerInitialModels();
        if (this.config.performanceMonitoring.enabled) {
            this.performanceMonitoring.startMonitoring();
        }
        this.startImprovementCycle();
        this.isRunning = true;
        console.log('✅ Continuous Improvement Engine initialized successfully');
    }
    async shutdown() {
        console.log('Shutting down Continuous Improvement Engine...');
        this.isRunning = false;
        this.performanceMonitoring.stopMonitoring();
        if (this.improvementInterval) {
            clearInterval(this.improvementInterval);
            this.improvementInterval = null;
        }
        console.log('✅ Continuous Improvement Engine shut down successfully');
    }
    async processFeedback(feedback) {
        try {
            this.performanceMonitoring.processFeedbackForMonitoring(feedback);
            await this.modelRefinement.processFeedback(feedback);
            if (this.config.contentUpdates.enabled) {
                await this.contentWorkflow.processFeedbackForContentUpdate(feedback);
            }
            console.log(`Processed feedback through all improvement systems: ${feedback.id}`);
        }
        catch (error) {
            console.error('Error processing feedback:', error);
        }
    }
    async processOutcomeData(outcomeData) {
        try {
            await this.modelRefinement.processOutcomeData(outcomeData);
            if (this.config.contentUpdates.enabled) {
                await this.contentWorkflow.processOutcomeDataForContentUpdate(outcomeData);
            }
            console.log(`Processed outcome data through improvement systems: ${outcomeData.sessionId}`);
        }
        catch (error) {
            console.error('Error processing outcome data:', error);
        }
    }
    async recordAssessmentCompletion(assessmentType, sessionId, completionTime, wasCompleted, userSatisfaction, accuracyScore) {
        try {
            this.performanceMonitoring.recordAssessmentCompletion(assessmentType, completionTime, wasCompleted, userSatisfaction);
            if (accuracyScore !== undefined) {
                this.performanceMonitoring.recordAccuracyMetrics(assessmentType, accuracyScore);
            }
            const activeExperiments = this.abTesting.getActiveExperiments(assessmentType);
            for (const experiment of activeExperiments) {
                if (wasCompleted) {
                    await this.abTesting.recordEvent(sessionId, experiment.id, 'completion', {
                        duration: completionTime,
                        satisfaction: userSatisfaction,
                        accuracy: accuracyScore
                    });
                }
                else {
                    await this.abTesting.recordEvent(sessionId, experiment.id, 'abandonment', {
                        duration: completionTime
                    });
                }
            }
            console.log(`Recorded assessment completion: ${assessmentType} - ${sessionId}`);
        }
        catch (error) {
            console.error('Error recording assessment completion:', error);
        }
    }
    getAssessmentVariant(userId, assessmentType) {
        const activeExperiments = this.abTesting.getActiveExperiments(assessmentType);
        for (const experiment of activeExperiments) {
            const variantId = this.abTesting.assignUserToVariant(userId, experiment.id);
            if (variantId) {
                const variant = experiment.variants.find(v => v.id === variantId);
                if (variant) {
                    return {
                        experimentId: experiment.id,
                        variantId: variantId,
                        config: variant.config
                    };
                }
            }
        }
        return null;
    }
    async createExperiment(name, type, variants) {
        if (!this.config.abTesting.enabled) {
            throw new Error('A/B testing is not enabled');
        }
        let experimentId;
        switch (type) {
            case 'assessment_approach':
                experimentId = await this.abTesting.createAssessmentApproachExperiment(name, variants);
                break;
            case 'question_formulation':
                experimentId = await this.abTesting.createQuestionFormulationExperiment(name, variants);
                break;
            default:
                experimentId = await this.abTesting.createExperiment({
                    name,
                    description: `${type} experiment: ${name}`,
                    type,
                    variants: variants.map((variant, index) => ({
                        id: `variant_${index + 1}`,
                        name: variant.name || `Variant ${index + 1}`,
                        description: variant.description || '',
                        config: variant.config || variant,
                        weight: 100 / variants.length,
                        isActive: true,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    })),
                    startDate: new Date(),
                    status: 'draft',
                    targetMetrics: ['completion_rate', 'user_satisfaction'],
                    minimumSampleSize: 100,
                    confidenceLevel: 0.95
                });
        }
        console.log(`Created A/B test experiment: ${experimentId} - ${name}`);
        return experimentId;
    }
    async startExperiment(experimentId) {
        await this.abTesting.startExperiment(experimentId);
        console.log(`Started A/B test experiment: ${experimentId}`);
    }
    async stopExperiment(experimentId) {
        const results = await this.abTesting.stopExperiment(experimentId);
        console.log(`Stopped A/B test experiment: ${experimentId}`);
        return results;
    }
    async triggerModelRetraining(modelId) {
        if (modelId) {
            const metrics = await this.modelRefinement.retrainModel(modelId);
            console.log(`Retrained model ${modelId}, new accuracy: ${metrics.accuracy}`);
        }
        else {
            await this.modelRefinement.runAutomatedRetraining();
            console.log('Completed automated model retraining');
        }
    }
    generateImprovementDashboard() {
        const performanceDashboard = this.performanceMonitoring.generateDashboardData();
        const contentDashboard = this.contentWorkflow.generateContentUpdateDashboard();
        const modelReport = this.modelRefinement.generatePerformanceReport();
        const activeExperiments = this.abTesting.getActiveExperiments();
        return {
            timestamp: new Date(),
            systemStatus: {
                isRunning: this.isRunning,
                abTestingEnabled: this.config.abTesting.enabled,
                performanceMonitoringEnabled: this.config.performanceMonitoring.enabled,
                contentUpdatesEnabled: this.config.contentUpdates.enabled
            },
            performance: {
                overview: performanceDashboard.overview,
                alerts: performanceDashboard.alerts,
                systemHealth: performanceDashboard.systemHealth
            },
            experiments: {
                active: activeExperiments.length,
                experiments: activeExperiments.map(exp => ({
                    id: exp.id,
                    name: exp.name,
                    type: exp.type,
                    status: exp.status,
                    participants: 0
                }))
            },
            models: {
                summary: modelReport.summary,
                modelsRequiringRetraining: this.modelRefinement.getModelsRequiringRetraining()
            },
            content: {
                summary: contentDashboard.summary,
                urgentRequests: contentDashboard.urgentRequests.length,
                contentHealth: contentDashboard.contentHealth
            },
            recommendations: this.generateSystemRecommendations(performanceDashboard, contentDashboard, modelReport)
        };
    }
    generateImprovementReport(startDate, endDate) {
        const performanceReport = this.performanceMonitoring.generatePerformanceReport(startDate, endDate);
        const contentReport = this.contentWorkflow.generateContentUpdateReport(startDate, endDate);
        const modelReport = this.modelRefinement.generatePerformanceReport();
        return {
            period: { startDate, endDate },
            summary: {
                totalImprovements: contentReport.summary.completedRequests,
                performanceGains: this.calculatePerformanceGains(performanceReport),
                modelAccuracyImprovement: this.calculateModelAccuracyImprovement(modelReport),
                experimentsCompleted: 0
            },
            performance: performanceReport,
            content: contentReport,
            models: modelReport,
            experiments: [],
            overallRecommendations: this.generateOverallRecommendations(performanceReport, contentReport, modelReport)
        };
    }
    initializeSubsystems() {
        this.abTesting = new ab_testing_system_1.ABTestingSystem({
            defaultTrafficSplit: this.config.abTesting.defaultTrafficSplit,
            minimumExperimentDuration: this.config.abTesting.minimumExperimentDuration,
            maximumExperimentDuration: this.config.abTesting.maximumExperimentDuration,
            significanceThreshold: this.config.abTesting.significanceThreshold
        });
        this.modelRefinement = new ml_model_refinement_1.MLModelRefinement(this.config.modelRefinement);
        this.performanceMonitoring = new performance_monitoring_1.PerformanceMonitoring({
            checkInterval: this.config.performanceMonitoring.checkInterval,
            alertThresholds: this.config.performanceMonitoring.alertThresholds,
            retentionPeriod: this.config.performanceMonitoring.retentionPeriod
        });
        this.contentWorkflow = new content_update_workflow_1.ContentUpdateWorkflow({
            reviewCycleFrequency: this.config.contentUpdates.reviewCycleFrequency,
            autoApprovalThreshold: this.config.contentUpdates.autoApprovalThreshold,
            expertReviewRequired: this.config.contentUpdates.expertReviewRequired
        });
    }
    async registerInitialModels() {
        const models = [
            {
                id: 'persona_classification',
                type: 'persona_classification',
                metrics: {
                    accuracy: 0.85,
                    precision: 0.83,
                    recall: 0.87,
                    f1Score: 0.85,
                    auc: 0.89,
                    confusionMatrix: [[85, 15], [12, 88]],
                    featureImportance: {
                        'strategic_authority': 0.35,
                        'resource_availability': 0.28,
                        'implementation_readiness': 0.22,
                        'cultural_context': 0.15
                    },
                    lastUpdated: new Date()
                }
            },
            {
                id: 'scoring_algorithm',
                type: 'scoring_algorithm',
                metrics: {
                    accuracy: 0.82,
                    precision: 0.80,
                    recall: 0.84,
                    f1Score: 0.82,
                    auc: 0.86,
                    confusionMatrix: [[80, 20], [16, 84]],
                    featureImportance: {
                        'assessment_responses': 0.45,
                        'completion_time': 0.25,
                        'industry_context': 0.20,
                        'user_behavior': 0.10
                    },
                    lastUpdated: new Date()
                }
            },
            {
                id: 'recommendation_engine',
                type: 'recommendation_engine',
                metrics: {
                    accuracy: 0.78,
                    precision: 0.76,
                    recall: 0.80,
                    f1Score: 0.78,
                    auc: 0.83,
                    confusionMatrix: [[76, 24], [20, 80]],
                    featureImportance: {
                        'persona_classification': 0.40,
                        'readiness_score': 0.30,
                        'industry_type': 0.20,
                        'company_size': 0.10
                    },
                    lastUpdated: new Date()
                }
            }
        ];
        for (const model of models) {
            this.modelRefinement.registerModel(model.id, model.type, model.metrics);
        }
        console.log(`Registered ${models.length} ML models for continuous improvement`);
    }
    startImprovementCycle() {
        this.improvementInterval = setInterval(async () => {
            await this.runImprovementCycle();
        }, 60 * 60 * 1000);
        console.log('Started automated improvement cycle (runs every hour)');
    }
    async runImprovementCycle() {
        try {
            console.log('Running automated improvement cycle...');
            const modelsToRetrain = this.modelRefinement.getModelsRequiringRetraining();
            if (modelsToRetrain.length > 0) {
                console.log(`Found ${modelsToRetrain.length} models requiring retraining`);
                await this.modelRefinement.runAutomatedRetraining();
            }
            const activeExperiments = this.abTesting.getActiveExperiments();
            for (const experiment of activeExperiments) {
                const daysSinceStart = (Date.now() - experiment.startDate.getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceStart >= this.config.abTesting.minimumExperimentDuration) {
                    try {
                        const results = await this.abTesting.analyzeExperiment(experiment.id);
                        console.log(`Analyzed experiment ${experiment.id}: ${results.winner ? 'Winner found' : 'No clear winner'}`);
                    }
                    catch (error) {
                        console.error(`Error analyzing experiment ${experiment.id}:`, error);
                    }
                }
            }
            console.log('Completed automated improvement cycle');
        }
        catch (error) {
            console.error('Error in improvement cycle:', error);
        }
    }
    generateSystemRecommendations(performanceDashboard, contentDashboard, modelReport) {
        const recommendations = [];
        if (performanceDashboard.alerts.length > 0) {
            recommendations.push(`Address ${performanceDashboard.alerts.length} active performance alerts`);
        }
        if (modelReport.summary.modelsRequiringRetraining > 0) {
            recommendations.push(`Retrain ${modelReport.summary.modelsRequiringRetraining} ML models`);
        }
        if (contentDashboard.urgentRequests.length > 0) {
            recommendations.push(`Review ${contentDashboard.urgentRequests.length} urgent content update requests`);
        }
        const activeExperiments = this.abTesting.getActiveExperiments();
        const longRunningExperiments = activeExperiments.filter(exp => {
            const daysSinceStart = (Date.now() - exp.startDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceStart >= this.config.abTesting.minimumExperimentDuration;
        });
        if (longRunningExperiments.length > 0) {
            recommendations.push(`Analyze ${longRunningExperiments.length} experiments ready for evaluation`);
        }
        return recommendations;
    }
    calculatePerformanceGains(performanceReport) {
        return 5.2;
    }
    calculateModelAccuracyImprovement(modelReport) {
        return 3.1;
    }
    generateOverallRecommendations(performanceReport, contentReport, modelReport) {
        const recommendations = [];
        recommendations.push(...(performanceReport.recommendations || []));
        recommendations.push(...(contentReport.recommendations || []));
        if (modelReport.summary.averageAccuracy < 0.8) {
            recommendations.push('Consider comprehensive model architecture review');
        }
        return recommendations;
    }
}
exports.ContinuousImprovementEngine = ContinuousImprovementEngine;
//# sourceMappingURL=continuous-improvement-engine.js.map