---
title: "Performance-monitoring.d"
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

import { PerformanceAlert, PerformanceMetrics, UserFeedback } from './types';
export declare class PerformanceMonitoring {
    private config;
    private metrics;
    private alerts;
    private thresholds;
    private monitoringInterval;
    constructor(config: {
        checkInterval: number;
        alertThresholds: Record<string, number>;
        retentionPeriod: number;
    });
    startMonitoring(): void;
    stopMonitoring(): void;
    recordAssessmentCompletion(assessmentType: string, completionTime: number, wasCompleted: boolean, userSatisfaction?: number): void;
    recordSystemPerformance(responseTime: number, throughput: number, errorRate: number): void;
    recordAccuracyMetrics(assessmentType: string, accuracyScore: number): void;
    processFeedbackForMonitoring(feedback: UserFeedback): void;
    getCurrentMetrics(metricType?: string): PerformanceMetrics[];
    getActiveAlerts(): PerformanceAlert[];
    acknowledgeAlert(alertId: string): void;
    resolveAlert(alertId: string): void;
    generateDashboardData(): PerformanceDashboard;
    generatePerformanceReport(startDate: Date, endDate: Date): PerformanceReport;
    private initializeThresholds;
    private getCurrentMetric;
    private createNewMetric;
    private isMetricStale;
    private updateMovingAverage;
    private updateMetrics;
    private collectMetrics;
    private checkAlertConditions;
    private checkMetricThresholds;
    private createAlert;
    private determineSeverity;
    private sendAlertNotification;
    private cleanupOldMetrics;
    private generateOverviewMetrics;
    private generateTrendData;
    private calculateTrend;
    private generateAssessmentMetrics;
    private generateSystemHealthMetrics;
    private generateSummaryMetrics;
    private generateAssessmentPerformanceReport;
    private generateSystemPerformanceReport;
    private generateAlertSummary;
    private generateRecommendations;
}
interface PerformanceDashboard {
    timestamp: Date;
    overview: OverviewMetrics;
    trends: TrendData[];
    alerts: PerformanceAlert[];
    assessmentMetrics: AssessmentMetrics[];
    systemHealth: SystemHealthMetrics;
}
interface OverviewMetrics {
    totalAssessments: number;
    averageCompletionRate: number;
    averageSatisfactionScore: number;
    systemUptime: number;
    activeAlerts: number;
}
interface TrendData {
    metric: string;
    trend: 'up' | 'down' | 'stable';
    dataPoints: {
        timestamp: Date;
        value: number;
    }[];
}
interface AssessmentMetrics {
    type: string;
    completionRate: number;
    averageTime: number;
    satisfactionScore: number;
    totalCompletions: number;
}
interface SystemHealthMetrics {
    responseTime: number;
    throughput: number;
    errorRate: number;
    uptime: number;
    lastUpdated: Date;
}
interface PerformanceReport {
    period: {
        startDate: Date;
        endDate: Date;
    };
    summary: SummaryMetrics;
    assessmentPerformance: AssessmentPerformanceReport[];
    systemPerformance: SystemPerformanceReport;
    alertSummary: AlertSummary;
    recommendations: string[];
}
interface SummaryMetrics {
    totalAssessments: number;
    completionRate: number;
    averageTime: number;
    satisfactionScore: number;
    accuracyScore: number;
    systemUptime: number;
}
interface AssessmentPerformanceReport {
    type: string;
    metrics: PerformanceMetrics[];
}
interface SystemPerformanceReport {
    averageResponseTime: number;
    peakThroughput: number;
    errorRate: number;
    uptime: number;
}
interface AlertSummary {
    totalAlerts: number;
    criticalAlerts: number;
    resolvedAlerts: number;
    averageResolutionTime: number;
}
export {};
//# sourceMappingURL=performance-monitoring.d.ts.map