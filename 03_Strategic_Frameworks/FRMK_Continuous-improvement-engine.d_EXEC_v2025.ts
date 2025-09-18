---
title: "Continuous-improvement-engine.d"
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

import { ContinuousImprovementConfig, UserFeedback, OutcomeData } from './types';
export declare class ContinuousImprovementEngine {
    private config;
    private abTesting;
    private modelRefinement;
    private performanceMonitoring;
    private contentWorkflow;
    private isRunning;
    private improvementInterval;
    constructor(config: ContinuousImprovementConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    processFeedback(feedback: UserFeedback): Promise<void>;
    processOutcomeData(outcomeData: OutcomeData): Promise<void>;
    recordAssessmentCompletion(assessmentType: string, sessionId: string, completionTime: number, wasCompleted: boolean, userSatisfaction?: number, accuracyScore?: number): Promise<void>;
    getAssessmentVariant(userId: string, assessmentType: string): any;
    createExperiment(name: string, type: 'assessment_approach' | 'question_formulation' | 'ui_design' | 'scoring_algorithm', variants: any[]): Promise<string>;
    startExperiment(experimentId: string): Promise<void>;
    stopExperiment(experimentId: string): Promise<any>;
    triggerModelRetraining(modelId?: string): Promise<void>;
    generateImprovementDashboard(): ImprovementDashboard;
    generateImprovementReport(startDate: Date, endDate: Date): ImprovementReport;
    private initializeSubsystems;
    private registerInitialModels;
    private startImprovementCycle;
    private runImprovementCycle;
    private generateSystemRecommendations;
    private calculatePerformanceGains;
    private calculateModelAccuracyImprovement;
    private generateOverallRecommendations;
}
interface ImprovementDashboard {
    timestamp: Date;
    systemStatus: {
        isRunning: boolean;
        abTestingEnabled: boolean;
        performanceMonitoringEnabled: boolean;
        contentUpdatesEnabled: boolean;
    };
    performance: {
        overview: any;
        alerts: any[];
        systemHealth: any;
    };
    experiments: {
        active: number;
        experiments: {
            id: string;
            name: string;
            type: string;
            status: string;
            participants: number;
        }[];
    };
    models: {
        summary: any;
        modelsRequiringRetraining: string[];
    };
    content: {
        summary: any;
        urgentRequests: number;
        contentHealth: any;
    };
    recommendations: string[];
}
interface ImprovementReport {
    period: {
        startDate: Date;
        endDate: Date;
    };
    summary: {
        totalImprovements: number;
        performanceGains: number;
        modelAccuracyImprovement: number;
        experimentsCompleted: number;
    };
    performance: any;
    content: any;
    models: any;
    experiments: any[];
    overallRecommendations: string[];
}
export {};
//# sourceMappingURL=continuous-improvement-engine.d.ts.map