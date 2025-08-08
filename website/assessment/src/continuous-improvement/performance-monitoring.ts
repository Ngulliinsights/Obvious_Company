/**
 * Performance Monitoring System
 * 
 * Implements automated performance monitoring with alert systems for declining metrics.
 * Tracks assessment completion rates, user satisfaction, accuracy, and system performance.
 */

import { 
  PerformanceAlert, 
  PerformanceMetrics, 
  UserFeedback 
} from './types';

export class PerformanceMonitoring {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private alerts: Map<string, PerformanceAlert> = new Map();
  private thresholds: Map<string, number> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(private config: {
    checkInterval: number; // minutes
    alertThresholds: Record<string, number>;
    retentionPeriod: number; // days
  }) {
    this.initializeThresholds();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkAlertConditions();
      this.cleanupOldMetrics();
    }, this.config.checkInterval * 60 * 1000);

    console.log(`Started performance monitoring with ${this.config.checkInterval} minute intervals`);
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('Stopped performance monitoring');
  }

  /**
   * Record assessment completion
   */
  recordAssessmentCompletion(
    assessmentType: string,
    completionTime: number,
    wasCompleted: boolean,
    userSatisfaction?: number
  ): void {
    const metricKey = `assessment_${assessmentType}`;
    const metrics = this.metrics.get(metricKey) || [];
    
    const currentMetric = this.getCurrentMetric(metricKey);
    
    // Update completion metrics
    if (wasCompleted) {
      currentMetric.assessmentCompletionRate = this.updateMovingAverage(
        currentMetric.assessmentCompletionRate, 1, 0.1
      );
      currentMetric.averageCompletionTime = this.updateMovingAverage(
        currentMetric.averageCompletionTime, completionTime, 0.1
      );
    } else {
      currentMetric.assessmentCompletionRate = this.updateMovingAverage(
        currentMetric.assessmentCompletionRate, 0, 0.1
      );
      currentMetric.abandonmentRate = this.updateMovingAverage(
        currentMetric.abandonmentRate, 1, 0.1
      );
    }

    if (userSatisfaction !== undefined) {
      currentMetric.userSatisfactionScore = this.updateMovingAverage(
        currentMetric.userSatisfactionScore, userSatisfaction, 0.1
      );
    }

    currentMetric.timestamp = new Date();
    this.updateMetrics(metricKey, currentMetric);
  }

  /**
   * Record system performance metrics
   */
  recordSystemPerformance(
    responseTime: number,
    throughput: number,
    errorRate: number
  ): void {
    const metricKey = 'system_performance';
    const currentMetric = this.getCurrentMetric(metricKey);

    currentMetric.responseTime = this.updateMovingAverage(
      currentMetric.responseTime, responseTime, 0.1
    );
    currentMetric.throughput = this.updateMovingAverage(
      currentMetric.throughput, throughput, 0.1
    );
    currentMetric.errorRate = this.updateMovingAverage(
      currentMetric.errorRate, errorRate, 0.1
    );
    currentMetric.timestamp = new Date();

    this.updateMetrics(metricKey, currentMetric);
  }

  /**
   * Record accuracy metrics
   */
  recordAccuracyMetrics(assessmentType: string, accuracyScore: number): void {
    const metricKey = `accuracy_${assessmentType}`;
    const currentMetric = this.getCurrentMetric(metricKey);

    currentMetric.accuracyScore = this.updateMovingAverage(
      currentMetric.accuracyScore, accuracyScore, 0.1
    );
    currentMetric.timestamp = new Date();

    this.updateMetrics(metricKey, currentMetric);
  }

  /**
   * Process user feedback for monitoring
   */
  processFeedbackForMonitoring(feedback: UserFeedback): void {
    const metricKey = `feedback_${feedback.assessmentType}`;
    const currentMetric = this.getCurrentMetric(metricKey);

    // Update satisfaction score based on feedback rating
    const satisfactionScore = feedback.rating / 5.0; // Normalize to 0-1
    currentMetric.userSatisfactionScore = this.updateMovingAverage(
      currentMetric.userSatisfactionScore, satisfactionScore, 0.1
    );

    // Track feedback sentiment
    if (feedback.sentiment === 'negative') {
      this.createAlert(
        'user_satisfaction_decline',
        'medium',
        `Negative feedback received for ${feedback.assessmentType}: ${feedback.feedback}`,
        'userSatisfactionScore',
        satisfactionScore,
        this.thresholds.get('userSatisfactionScore') || 0.7
      );
    }

    currentMetric.timestamp = new Date();
    this.updateMetrics(metricKey, currentMetric);
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(metricType?: string): PerformanceMetrics[] {
    if (metricType) {
      return this.metrics.get(metricType) || [];
    }

    const allMetrics: PerformanceMetrics[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }
    return allMetrics;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.acknowledged);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      console.log(`Alert acknowledged: ${alertId}`);
    }
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      console.log(`Alert resolved: ${alertId}`);
    }
  }

  /**
   * Generate performance dashboard data
   */
  generateDashboardData(): PerformanceDashboard {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      timestamp: now,
      overview: this.generateOverviewMetrics(),
      trends: this.generateTrendData(oneWeekAgo, now),
      alerts: this.getActiveAlerts(),
      assessmentMetrics: this.generateAssessmentMetrics(),
      systemHealth: this.generateSystemHealthMetrics()
    };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(startDate: Date, endDate: Date): PerformanceReport {
    const report: PerformanceReport = {
      period: { startDate, endDate },
      summary: this.generateSummaryMetrics(startDate, endDate),
      assessmentPerformance: this.generateAssessmentPerformanceReport(startDate, endDate),
      systemPerformance: this.generateSystemPerformanceReport(startDate, endDate),
      alertSummary: this.generateAlertSummary(startDate, endDate),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  // Private helper methods

  private initializeThresholds(): void {
    for (const [metric, threshold] of Object.entries(this.config.alertThresholds)) {
      this.thresholds.set(metric, threshold);
    }
  }

  private getCurrentMetric(metricKey: string): PerformanceMetrics {
    const metrics = this.metrics.get(metricKey) || [];
    const latest = metrics[metrics.length - 1];

    if (!latest || this.isMetricStale(latest)) {
      return this.createNewMetric();
    }

    return { ...latest };
  }

  private createNewMetric(): PerformanceMetrics {
    return {
      assessmentCompletionRate: 0,
      averageCompletionTime: 0,
      userSatisfactionScore: 0,
      accuracyScore: 0,
      abandonmentRate: 0,
      errorRate: 0,
      responseTime: 0,
      throughput: 0,
      timestamp: new Date()
    };
  }

  private isMetricStale(metric: PerformanceMetrics): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return metric.timestamp < fiveMinutesAgo;
  }

  private updateMovingAverage(current: number, newValue: number, alpha: number): number {
    return alpha * newValue + (1 - alpha) * current;
  }

  private updateMetrics(metricKey: string, metric: PerformanceMetrics): void {
    const metrics = this.metrics.get(metricKey) || [];
    metrics.push(metric);

    // Keep only recent metrics
    const cutoffTime = new Date(Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000);
    const filteredMetrics = metrics.filter(m => m.timestamp > cutoffTime);

    this.metrics.set(metricKey, filteredMetrics);
  }

  private collectMetrics(): void {
    // This would collect real-time metrics from the system
    // For now, we'll simulate some basic collection
    console.log('Collecting performance metrics...');
  }

  private checkAlertConditions(): void {
    for (const [metricKey, metrics] of this.metrics.entries()) {
      if (metrics.length === 0) continue;

      const latest = metrics[metrics.length - 1];
      this.checkMetricThresholds(metricKey, latest);
    }
  }

  private checkMetricThresholds(metricKey: string, metric: PerformanceMetrics): void {
    const checks = [
      {
        key: 'assessmentCompletionRate',
        value: metric.assessmentCompletionRate,
        threshold: this.thresholds.get('assessmentCompletionRate') || 0.8,
        type: 'completion_rate_drop' as const,
        isBelow: true
      },
      {
        key: 'userSatisfactionScore',
        value: metric.userSatisfactionScore,
        threshold: this.thresholds.get('userSatisfactionScore') || 0.7,
        type: 'metric_decline' as const,
        isBelow: true
      },
      {
        key: 'accuracyScore',
        value: metric.accuracyScore,
        threshold: this.thresholds.get('accuracyScore') || 0.75,
        type: 'accuracy_degradation' as const,
        isBelow: true
      },
      {
        key: 'errorRate',
        value: metric.errorRate,
        threshold: this.thresholds.get('errorRate') || 0.05,
        type: 'error_rate_spike' as const,
        isBelow: false
      },
      {
        key: 'responseTime',
        value: metric.responseTime,
        threshold: this.thresholds.get('responseTime') || 2000,
        type: 'metric_decline' as const,
        isBelow: false
      }
    ];

    for (const check of checks) {
      const shouldAlert = check.isBelow ? 
        check.value < check.threshold : 
        check.value > check.threshold;

      if (shouldAlert) {
        this.createAlert(
          check.type,
          this.determineSeverity(check.key, check.value, check.threshold),
          `${check.key} ${check.isBelow ? 'below' : 'above'} threshold in ${metricKey}`,
          check.key,
          check.value,
          check.threshold
        );
      }
    }
  }

  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    metric: string,
    currentValue: number,
    threshold: number
  ): void {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: PerformanceAlert = {
      id: alertId,
      type,
      severity,
      message,
      metric,
      currentValue,
      threshold,
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.set(alertId, alert);
    console.log(`Performance alert created: ${severity} - ${message}`);

    // In a real implementation, you'd send notifications here
    this.sendAlertNotification(alert);
  }

  private determineSeverity(
    metric: string, 
    currentValue: number, 
    threshold: number
  ): PerformanceAlert['severity'] {
    const deviation = Math.abs(currentValue - threshold) / threshold;

    if (deviation > 0.5) return 'critical';
    if (deviation > 0.3) return 'high';
    if (deviation > 0.1) return 'medium';
    return 'low';
  }

  private sendAlertNotification(alert: PerformanceAlert): void {
    // In a real implementation, this would send emails, Slack messages, etc.
    console.log(`ALERT NOTIFICATION: ${alert.severity.toUpperCase()} - ${alert.message}`);
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000);
    
    for (const [key, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(m => m.timestamp > cutoffTime);
      this.metrics.set(key, filteredMetrics);
    }

    // Cleanup old resolved alerts
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.resolvedAt && alert.resolvedAt < oneWeekAgo) {
        this.alerts.delete(alertId);
      }
    }
  }

  private generateOverviewMetrics(): OverviewMetrics {
    const allMetrics = this.getCurrentMetrics();
    if (allMetrics.length === 0) {
      return {
        totalAssessments: 0,
        averageCompletionRate: 0,
        averageSatisfactionScore: 0,
        systemUptime: 100,
        activeAlerts: this.getActiveAlerts().length
      };
    }

    const latest = allMetrics[allMetrics.length - 1];
    return {
      totalAssessments: allMetrics.length,
      averageCompletionRate: latest.assessmentCompletionRate,
      averageSatisfactionScore: latest.userSatisfactionScore,
      systemUptime: 100 - latest.errorRate * 100,
      activeAlerts: this.getActiveAlerts().length
    };
  }

  private generateTrendData(startDate: Date, endDate: Date): TrendData[] {
    const trends: TrendData[] = [];
    
    for (const [metricKey, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(m => 
        m.timestamp >= startDate && m.timestamp <= endDate
      );

      if (filteredMetrics.length > 1) {
        const first = filteredMetrics[0];
        const last = filteredMetrics[filteredMetrics.length - 1];
        
        trends.push({
          metric: metricKey,
          trend: this.calculateTrend(first, last),
          dataPoints: filteredMetrics.map(m => ({
            timestamp: m.timestamp,
            value: m.assessmentCompletionRate // Simplified - would vary by metric
          }))
        });
      }
    }

    return trends;
  }

  private calculateTrend(first: PerformanceMetrics, last: PerformanceMetrics): 'up' | 'down' | 'stable' {
    const change = last.assessmentCompletionRate - first.assessmentCompletionRate;
    if (Math.abs(change) < 0.05) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  private generateAssessmentMetrics(): AssessmentMetrics[] {
    const assessmentTypes = new Set<string>();
    
    for (const metricKey of this.metrics.keys()) {
      if (metricKey.startsWith('assessment_')) {
        assessmentTypes.add(metricKey.replace('assessment_', ''));
      }
    }

    return Array.from(assessmentTypes).map(type => {
      const metrics = this.metrics.get(`assessment_${type}`) || [];
      const latest = metrics[metrics.length - 1];
      
      return {
        type,
        completionRate: latest?.assessmentCompletionRate || 0,
        averageTime: latest?.averageCompletionTime || 0,
        satisfactionScore: latest?.userSatisfactionScore || 0,
        totalCompletions: metrics.length
      };
    });
  }

  private generateSystemHealthMetrics(): SystemHealthMetrics {
    const systemMetrics = this.metrics.get('system_performance') || [];
    const latest = systemMetrics[systemMetrics.length - 1];

    return {
      responseTime: latest?.responseTime || 0,
      throughput: latest?.throughput || 0,
      errorRate: latest?.errorRate || 0,
      uptime: 100 - (latest?.errorRate || 0) * 100,
      lastUpdated: latest?.timestamp || new Date()
    };
  }

  private generateSummaryMetrics(startDate: Date, endDate: Date): SummaryMetrics {
    // Implementation would aggregate metrics over the specified period
    return {
      totalAssessments: 0,
      completionRate: 0,
      averageTime: 0,
      satisfactionScore: 0,
      accuracyScore: 0,
      systemUptime: 100
    };
  }

  private generateAssessmentPerformanceReport(startDate: Date, endDate: Date): AssessmentPerformanceReport[] {
    // Implementation would generate detailed assessment performance data
    return [];
  }

  private generateSystemPerformanceReport(startDate: Date, endDate: Date): SystemPerformanceReport {
    // Implementation would generate system performance data
    return {
      averageResponseTime: 0,
      peakThroughput: 0,
      errorRate: 0,
      uptime: 100
    };
  }

  private generateAlertSummary(startDate: Date, endDate: Date): AlertSummary {
    const alerts = Array.from(this.alerts.values()).filter(alert =>
      alert.timestamp >= startDate && alert.timestamp <= endDate
    );

    return {
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      resolvedAlerts: alerts.filter(a => a.resolvedAt).length,
      averageResolutionTime: 0 // Would calculate actual resolution times
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const activeAlerts = this.getActiveAlerts();

    if (activeAlerts.some(a => a.type === 'completion_rate_drop')) {
      recommendations.push('Review assessment UX and consider A/B testing different approaches');
    }

    if (activeAlerts.some(a => a.type === 'accuracy_degradation')) {
      recommendations.push('Retrain ML models with recent feedback data');
    }

    if (activeAlerts.some(a => a.type === 'error_rate_spike')) {
      recommendations.push('Investigate system errors and implement additional monitoring');
    }

    return recommendations;
  }
}

// Supporting interfaces

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
  dataPoints: { timestamp: Date; value: number }[];
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
  period: { startDate: Date; endDate: Date };
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