---
title: "Types.d"
type: "template"
audience: "consultants"
version: "v2025"
dependencies:
  - "" # Add dependencies here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

export interface ABTestVariant {
    id: string;
    name: string;
    description: string;
    config: Record<string, any>;
    weight: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ABTestExperiment {
    id: string;
    name: string;
    description: string;
    type: 'assessment_approach' | 'question_formulation' | 'ui_design' | 'scoring_algorithm';
    variants: ABTestVariant[];
    startDate: Date;
    endDate?: Date;
    status: 'draft' | 'running' | 'completed' | 'paused';
    targetMetrics: string[];
    minimumSampleSize: number;
    confidenceLevel: number;
    results?: ABTestResults;
}
export interface ABTestResults {
    experimentId: string;
    variants: {
        [variantId: string]: {
            participants: number;
            conversions: number;
            conversionRate: number;
            metrics: Record<string, number>;
            confidenceInterval: [number, number];
            statisticalSignificance: boolean;
        };
    };
    winner?: string;
    conclusionDate: Date;
    recommendations: string[];
}
export interface MLModelMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
    confusionMatrix: number[][];
    featureImportance: Record<string, number>;
    lastUpdated: Date;
}
export interface ModelRefinementConfig {
    retrainingThreshold: number;
    minimumDataPoints: number;
    validationSplit: number;
    hyperparameterTuning: boolean;
    crossValidationFolds: number;
}
export interface PerformanceAlert {
    id: string;
    type: 'metric_decline' | 'error_rate_spike' | 'completion_rate_drop' | 'accuracy_degradation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    metric: string;
    currentValue: number;
    threshold: number;
    timestamp: Date;
    acknowledged: boolean;
    resolvedAt?: Date;
}
export interface PerformanceMetrics {
    assessmentCompletionRate: number;
    averageCompletionTime: number;
    userSatisfactionScore: number;
    accuracyScore: number;
    abandonmentRate: number;
    errorRate: number;
    responseTime: number;
    throughput: number;
    timestamp: Date;
}
export interface ContentUpdateRequest {
    id: string;
    type: 'question_update' | 'scoring_adjustment' | 'new_industry_module' | 'cultural_adaptation';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    description: string;
    requestedBy: string;
    requestDate: Date;
    targetCompletionDate?: Date;
    status: 'pending' | 'in_review' | 'approved' | 'in_progress' | 'completed' | 'rejected';
    reviewNotes?: string;
    implementationNotes?: string;
}
export interface ExpertReviewCycle {
    id: string;
    type: 'quarterly_review' | 'annual_audit' | 'emergency_review';
    startDate: Date;
    endDate: Date;
    reviewers: string[];
    areas: string[];
    status: 'scheduled' | 'in_progress' | 'completed';
    findings: ExpertReviewFinding[];
    recommendations: string[];
}
export interface ExpertReviewFinding {
    id: string;
    area: string;
    severity: 'info' | 'minor' | 'major' | 'critical';
    description: string;
    recommendation: string;
    reviewer: string;
    timestamp: Date;
}
export interface ContinuousImprovementConfig {
    abTesting: {
        enabled: boolean;
        defaultTrafficSplit: number;
        minimumExperimentDuration: number;
        maximumExperimentDuration: number;
        significanceThreshold: number;
    };
    modelRefinement: ModelRefinementConfig;
    performanceMonitoring: {
        enabled: boolean;
        checkInterval: number;
        alertThresholds: Record<string, number>;
        retentionPeriod: number;
    };
    contentUpdates: {
        enabled: boolean;
        reviewCycleFrequency: number;
        autoApprovalThreshold: number;
        expertReviewRequired: string[];
    };
}
export interface UserFeedback {
    id: string;
    sessionId: string;
    userId?: string;
    assessmentType: string;
    rating: number;
    feedback: string;
    category: 'usability' | 'accuracy' | 'relevance' | 'technical' | 'content';
    timestamp: Date;
    processed: boolean;
    sentiment: 'positive' | 'neutral' | 'negative';
}
export interface OutcomeData {
    sessionId: string;
    userId?: string;
    assessmentResults: Record<string, any>;
    actualOutcome?: Record<string, any>;
    followUpDate?: Date;
    outcomeAccuracy?: number;
    serviceEngagement?: string;
    satisfactionScore?: number;
    implementationSuccess?: boolean;
}
//# sourceMappingURL=types.d.ts.map