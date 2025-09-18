---
title: "Ab-testing-system.d"
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

import { ABTestExperiment, ABTestResults } from './types';
export declare class ABTestingSystem {
    private config;
    private experiments;
    private userAssignments;
    private results;
    constructor(config: {
        defaultTrafficSplit: number;
        minimumExperimentDuration: number;
        maximumExperimentDuration: number;
        significanceThreshold: number;
    });
    createExperiment(experiment: Omit<ABTestExperiment, 'id'>): Promise<string>;
    startExperiment(experimentId: string): Promise<void>;
    assignUserToVariant(userId: string, experimentId: string): string | null;
    getActiveExperiments(assessmentType?: string): ABTestExperiment[];
    recordEvent(userId: string, experimentId: string, eventType: string, eventData?: Record<string, any>): Promise<void>;
    analyzeExperiment(experimentId: string): Promise<ABTestResults>;
    stopExperiment(experimentId: string): Promise<ABTestResults>;
    createAssessmentApproachExperiment(name: string, approaches: {
        name: string;
        config: any;
    }[]): Promise<string>;
    createQuestionFormulationExperiment(name: string, questionVariants: {
        question: string;
        options?: string[];
    }[]): Promise<string>;
    private validateExperiment;
    private generateExperimentId;
    private selectVariantByWeight;
    private hashUserId;
    private getUserVariant;
    private storeEventData;
    private getEventData;
    private calculateVariantMetrics;
    private calculateConfidenceInterval;
    private calculateStatisticalSignificance;
    private generateRecommendations;
}
//# sourceMappingURL=ab-testing-system.d.ts.map