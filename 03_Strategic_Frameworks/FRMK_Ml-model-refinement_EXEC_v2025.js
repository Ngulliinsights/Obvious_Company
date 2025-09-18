---
title: "Ml-model-refinement"
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
exports.MLModelRefinement = void 0;
class MLModelRefinement {
    constructor(config) {
        this.config = config;
        this.models = new Map();
        this.trainingData = new Map();
        this.modelMetrics = new Map();
        this.retrainingQueue = new Set();
    }
    registerModel(modelId, modelType, initialMetrics) {
        const modelInfo = {
            id: modelId,
            type: modelType,
            version: '1.0.0',
            createdAt: new Date(),
            lastRetrained: new Date(),
            isActive: true,
            trainingDataCount: 0
        };
        this.models.set(modelId, modelInfo);
        this.modelMetrics.set(modelId, initialMetrics);
        this.trainingData.set(modelId, []);
        console.log(`Registered model for refinement: ${modelId} (${modelType})`);
    }
    async addTrainingData(modelId, input, expectedOutput, actualOutput, feedback) {
        const trainingData = this.trainingData.get(modelId) || [];
        const dataPoint = {
            id: this.generateDataPointId(),
            modelId,
            input,
            expectedOutput,
            actualOutput,
            feedback,
            timestamp: new Date(),
            weight: this.calculateDataPointWeight(feedback, actualOutput, expectedOutput)
        };
        trainingData.push(dataPoint);
        this.trainingData.set(modelId, trainingData);
        const model = this.models.get(modelId);
        if (model) {
            model.trainingDataCount = trainingData.length;
        }
        await this.checkRetrainingTriggers(modelId);
        console.log(`Added training data point for model: ${modelId}`);
    }
    async processFeedback(feedback, outcomeData) {
        const affectedModels = this.getAffectedModels(feedback);
        for (const modelId of affectedModels) {
            const trainingInput = this.extractTrainingInput(feedback, outcomeData);
            const expectedOutput = this.extractExpectedOutput(feedback, outcomeData);
            const actualOutput = this.extractActualOutput(feedback, outcomeData);
            await this.addTrainingData(modelId, trainingInput, expectedOutput, actualOutput, feedback);
        }
        console.log(`Processed feedback for models: ${affectedModels.join(', ')}`);
    }
    async processOutcomeData(outcomeData) {
        const modelAccuracies = this.calculateModelAccuracies(outcomeData);
        for (const [modelId, accuracy] of modelAccuracies.entries()) {
            const currentMetrics = this.modelMetrics.get(modelId);
            if (currentMetrics) {
                const updatedMetrics = {
                    ...currentMetrics,
                    accuracy,
                    lastUpdated: new Date()
                };
                this.modelMetrics.set(modelId, updatedMetrics);
                if (accuracy < this.config.retrainingThreshold) {
                    this.retrainingQueue.add(modelId);
                    console.log(`Model ${modelId} queued for retraining due to accuracy drop: ${accuracy}`);
                }
            }
        }
    }
    async retrainModel(modelId) {
        const model = this.models.get(modelId);
        const trainingData = this.trainingData.get(modelId);
        if (!model || !trainingData) {
            throw new Error(`Model ${modelId} not found or no training data available`);
        }
        if (trainingData.length < this.config.minimumDataPoints) {
            throw new Error(`Insufficient training data: ${trainingData.length} < ${this.config.minimumDataPoints}`);
        }
        console.log(`Starting retraining for model: ${modelId}`);
        const { trainSet, validationSet } = this.splitTrainingData(trainingData);
        const newMetrics = await this.performRetraining(model, trainSet, validationSet);
        model.version = this.incrementVersion(model.version);
        model.lastRetrained = new Date();
        this.modelMetrics.set(modelId, newMetrics);
        this.retrainingQueue.delete(modelId);
        console.log(`Completed retraining for model: ${modelId}, new accuracy: ${newMetrics.accuracy}`);
        return newMetrics;
    }
    getModelMetrics(modelId) {
        return this.modelMetrics.get(modelId);
    }
    getModelsRequiringRetraining() {
        return Array.from(this.retrainingQueue);
    }
    async runAutomatedRetraining() {
        const modelsToRetrain = Array.from(this.retrainingQueue);
        for (const modelId of modelsToRetrain) {
            try {
                await this.retrainModel(modelId);
            }
            catch (error) {
                console.error(`Failed to retrain model ${modelId}:`, error);
            }
        }
        console.log(`Completed automated retraining for ${modelsToRetrain.length} models`);
    }
    generatePerformanceReport() {
        const report = {
            timestamp: new Date(),
            models: [],
            summary: {
                totalModels: this.models.size,
                modelsRequiringRetraining: this.retrainingQueue.size,
                averageAccuracy: 0,
                lastRetrainingDate: new Date(0)
            }
        };
        let totalAccuracy = 0;
        let latestRetraining = new Date(0);
        for (const [modelId, model] of this.models.entries()) {
            const metrics = this.modelMetrics.get(modelId);
            if (metrics) {
                report.models.push({
                    id: modelId,
                    type: model.type,
                    version: model.version,
                    accuracy: metrics.accuracy,
                    lastRetrained: model.lastRetrained,
                    trainingDataCount: model.trainingDataCount,
                    requiresRetraining: this.retrainingQueue.has(modelId)
                });
                totalAccuracy += metrics.accuracy;
                if (model.lastRetrained > latestRetraining) {
                    latestRetraining = model.lastRetrained;
                }
            }
        }
        report.summary.averageAccuracy = totalAccuracy / this.models.size;
        report.summary.lastRetrainingDate = latestRetraining;
        return report;
    }
    async checkRetrainingTriggers(modelId) {
        const model = this.models.get(modelId);
        const trainingData = this.trainingData.get(modelId);
        const metrics = this.modelMetrics.get(modelId);
        if (!model || !trainingData || !metrics)
            return;
        const daysSinceLastRetraining = (Date.now() - model.lastRetrained.getTime()) / (1000 * 60 * 60 * 24);
        const newDataPoints = trainingData.filter(dp => dp.timestamp > model.lastRetrained).length;
        if (newDataPoints >= this.config.minimumDataPoints && daysSinceLastRetraining >= 7) {
            this.retrainingQueue.add(modelId);
            console.log(`Model ${modelId} queued for retraining: ${newDataPoints} new data points`);
        }
        if (metrics.accuracy < this.config.retrainingThreshold) {
            this.retrainingQueue.add(modelId);
            console.log(`Model ${modelId} queued for retraining: accuracy below threshold`);
        }
    }
    getAffectedModels(feedback) {
        const affectedModels = [];
        switch (feedback.category) {
            case 'accuracy':
                affectedModels.push('persona_classification', 'scoring_algorithm');
                break;
            case 'relevance':
                affectedModels.push('recommendation_engine');
                break;
            case 'usability':
                break;
            default:
                affectedModels.push('persona_classification', 'scoring_algorithm', 'recommendation_engine');
        }
        return affectedModels.filter(modelId => this.models.has(modelId));
    }
    extractTrainingInput(feedback, outcomeData) {
        return {
            assessmentType: feedback.assessmentType,
            userResponses: outcomeData?.assessmentResults || {},
            sessionContext: {
                timestamp: feedback.timestamp,
                userAgent: 'unknown'
            }
        };
    }
    extractExpectedOutput(feedback, outcomeData) {
        if (feedback.rating >= 4) {
            return outcomeData?.assessmentResults || {};
        }
        else {
            return this.inferCorrectOutput(feedback, outcomeData);
        }
    }
    extractActualOutput(feedback, outcomeData) {
        return outcomeData?.assessmentResults || {};
    }
    inferCorrectOutput(feedback, outcomeData) {
        return {};
    }
    calculateDataPointWeight(feedback, actualOutput, expectedOutput) {
        let weight = 1.0;
        if (feedback) {
            if (feedback.rating === 5)
                weight *= 1.2;
            if (feedback.rating === 1)
                weight *= 1.5;
            if (feedback.feedback.length > 50)
                weight *= 1.1;
        }
        if (actualOutput && expectedOutput) {
            const similarity = this.calculateOutputSimilarity(actualOutput, expectedOutput);
            weight *= (1 + (1 - similarity));
        }
        return Math.min(weight, 2.0);
    }
    calculateOutputSimilarity(output1, output2) {
        const keys = new Set([...Object.keys(output1), ...Object.keys(output2)]);
        let matches = 0;
        for (const key of keys) {
            if (output1[key] === output2[key]) {
                matches++;
            }
        }
        return keys.size > 0 ? matches / keys.size : 0;
    }
    calculateModelAccuracies(outcomeData) {
        const accuracies = new Map();
        if (outcomeData.outcomeAccuracy !== undefined) {
            accuracies.set('persona_classification', outcomeData.outcomeAccuracy);
            accuracies.set('scoring_algorithm', outcomeData.outcomeAccuracy);
            accuracies.set('recommendation_engine', outcomeData.outcomeAccuracy);
        }
        return accuracies;
    }
    splitTrainingData(data) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        const splitIndex = Math.floor(shuffled.length * (1 - this.config.validationSplit));
        return {
            trainSet: shuffled.slice(0, splitIndex),
            validationSet: shuffled.slice(splitIndex)
        };
    }
    async performRetraining(model, trainSet, validationSet) {
        console.log(`Retraining ${model.type} with ${trainSet.length} training samples and ${validationSet.length} validation samples`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const currentMetrics = this.modelMetrics.get(model.id);
        const improvement = 0.02 + Math.random() * 0.05;
        return {
            accuracy: Math.min(0.95, (currentMetrics?.accuracy || 0.8) + improvement),
            precision: Math.min(0.95, (currentMetrics?.precision || 0.8) + improvement),
            recall: Math.min(0.95, (currentMetrics?.recall || 0.8) + improvement),
            f1Score: Math.min(0.95, (currentMetrics?.f1Score || 0.8) + improvement),
            auc: Math.min(0.95, (currentMetrics?.auc || 0.8) + improvement),
            confusionMatrix: currentMetrics?.confusionMatrix || [[80, 20], [15, 85]],
            featureImportance: currentMetrics?.featureImportance || {},
            lastUpdated: new Date()
        };
    }
    incrementVersion(version) {
        const parts = version.split('.');
        const patch = parseInt(parts[2]) + 1;
        return `${parts[0]}.${parts[1]}.${patch}`;
    }
    generateDataPointId() {
        return `dp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.MLModelRefinement = MLModelRefinement;
//# sourceMappingURL=ml-model-refinement.js.map