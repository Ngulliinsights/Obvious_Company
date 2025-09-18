---
title: "Ml-model-refinement.d"
type: "framework"
audience: "executives"
version: "v2025.ts"
dependencies:
  - "" # Add dependencies here
implementations:
  - "" # Add implementations here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

import { MLModelMetrics, ModelRefinementConfig, UserFeedback, OutcomeData } from './types';
export declare class MLModelRefinement {
    private config;
    private models;
    private trainingData;
    private modelMetrics;
    private retrainingQueue;
    constructor(config: ModelRefinementConfig);
    registerModel(modelId: string, modelType: 'persona_classification' | 'scoring_algorithm' | 'recommendation_engine', initialMetrics: MLModelMetrics): void;
    addTrainingData(modelId: string, input: Record<string, any>, expectedOutput: Record<string, any>, actualOutput?: Record<string, any>, feedback?: UserFeedback): Promise<void>;
    processFeedback(feedback: UserFeedback, outcomeData?: OutcomeData): Promise<void>;
    processOutcomeData(outcomeData: OutcomeData): Promise<void>;
    retrainModel(modelId: string): Promise<MLModelMetrics>;
    getModelMetrics(modelId: string): MLModelMetrics | undefined;
    getModelsRequiringRetraining(): string[];
    runAutomatedRetraining(): Promise<void>;
    generatePerformanceReport(): ModelPerformanceReport;
    private checkRetrainingTriggers;
    private getAffectedModels;
    private extractTrainingInput;
    private extractExpectedOutput;
    private extractActualOutput;
    private inferCorrectOutput;
    private calculateDataPointWeight;
    private calculateOutputSimilarity;
    private calculateModelAccuracies;
    private splitTrainingData;
    private performRetraining;
    private incrementVersion;
    private generateDataPointId;
}
interface ModelPerformanceReport {
    timestamp: Date;
    models: {
        id: string;
        type: string;
        version: string;
        accuracy: number;
        lastRetrained: Date;
        trainingDataCount: number;
        requiresRetraining: boolean;
    }[];
    summary: {
        totalModels: number;
        modelsRequiringRetraining: number;
        averageAccuracy: number;
        lastRetrainingDate: Date;
    };
}
export {};
//# sourceMappingURL=ml-model-refinement.d.ts.map