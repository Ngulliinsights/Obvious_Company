/**
 * Performance Tracking System for Assessment Platform
 * Monitors completion rates, engagement metrics, and abandonment analysis
 */

class PerformanceTracker {
    constructor(analyticsEngine) {
        this.analytics = analyticsEngine;
        this.trackingIntervals = new Map();
        this.performanceHistory = new Map();
        this.benchmarks = {
            completionRate: {
                excellent: 85,
                good: 70,
                acceptable: 55,
                poor: 40
            },
            engagementTime: {
                excellent: 300000, // 5 minutes
                good: 180000,      // 3 minutes
                acceptable: 120000, // 2 minutes
                poor: 60000        // 1 minute
            },
            abandonmentRate: {
                excellent: 10,
                good: 20,
                acceptable: 30,
                poor: 50
            }
        };
    }

    /**
     * Start performance tracking
     */
    startTracking(intervalMs = 60000) { // Default: 1 minute
        // Track completion rates
        this.trackingIntervals.set('completion', setInterval(() => {
            this.trackCompletionRates();
        }, intervalMs));

        // Track engagement metrics
        this.trackingIntervals.set('engagement', setInterval(() => {
            this.trackEngagementMetrics();
        }, intervalMs));

        // Track abandonment points
        this.trackingIntervals.set('abandonment', setInterval(() => {
            this.trackAbandonmentPoints();
        }, intervalMs));

        // Track accuracy measurements
        this.trackingIntervals.set('accuracy', setInterval(() => {
            this.trackAccuracyMeasurements();
        }, intervalMs * 5)); // Every 5 minutes

        console.log('Performance tracking started');
    }

    /**
     * Stop performance tracking
     */
    stopTracking() {
        for (const [name, interval] of this.trackingIntervals) {
            clearInterval(interval);
        }
        this.trackingIntervals.clear();
        console.log('Performance tracking stopped');
    }

    /**
     * Track completion rates over time
     */
    trackCompletionRates() {
        const timestamp = new Date().toISOString();
        const completionRates = this.analytics.getCompletionRates('1h');
        
        for (const [assessmentType, data] of Object.entries(completionRates)) {
            this.recordPerformanceMetric('completion_rate', assessmentType, {
                timestamp,
                value: data.rate,
                trend: data.trend,
                benchmark: this.getBenchmarkLevel(data.rate, 'completionRate')
            });
        }
    }

    /**
     * Track engagement metrics over time
     */
    trackEngagementMetrics() {
        const timestamp = new Date().toISOString();
        const engagementMetrics = this.analytics.getEngagementMetrics('1h');
        
        for (const [page, metrics] of Object.entries(engagementMetrics)) {
            this.recordPerformanceMetric('engagement', page, {
                timestamp,
                averageTimeOnPage: metrics.averageTimeOnPage,
                views: metrics.views,
                bounceRate: metrics.bounceRate,
                benchmark: this.getBenchmarkLevel(metrics.averageTimeOnPage, 'engagementTime')
            });
        }

        // Track overall engagement
        const overallEngagement = this.calculateOverallEngagement();
        this.recordPerformanceMetric('engagement', 'overall', {
            timestamp,
            ...overallEngagement,
            benchmark: this.getBenchmarkLevel(overallEngagement.averageEngagementTime, 'engagementTime')
        });
    }

    /**
     * Track abandonment points analysis
     */
    trackAbandonmentPoints() {
        const timestamp = new Date().toISOString();
        const abandonmentAnalysis = this.analytics.getAbandonmentAnalysis();
        
        for (const [assessmentType, analysis] of Object.entries(abandonmentAnalysis)) {
            const metrics = this.analytics.assessmentMetrics.get(assessmentType);
            if (metrics) {
                const abandonmentRate = (metrics.abandoned / metrics.started) * 100;
                
                this.recordPerformanceMetric('abandonment', assessmentType, {
                    timestamp,
                    abandonmentRate,
                    totalAbandoned: analysis.totalAbandoned,
                    topAbandonmentPoints: analysis.topAbandonmentPoints,
                    benchmark: this.getBenchmarkLevel(abandonmentRate, 'abandonmentRate', true) // Reverse benchmark (lower is better)
                });
            }
        }
    }

    /**
     * Track assessment accuracy measurements
     */
    trackAccuracyMeasurements() {
        const timestamp = new Date().toISOString();
        const accuracyData = this.analytics.getAssessmentAccuracy();
        
        for (const [assessmentType, accuracy] of Object.entries(accuracyData)) {
            this.recordPerformanceMetric('accuracy', assessmentType, {
                timestamp,
                predictiveAccuracy: accuracy.predictiveAccuracy,
                userSatisfaction: accuracy.userSatisfaction,
                outcomeCorrelation: accuracy.outcomeCorrelation,
                followUpResponseRate: accuracy.followUpResponseRate
            });
        }
    }

    /**
     * Record performance metric in history
     */
    recordPerformanceMetric(category, identifier, data) {
        const key = `${category}_${identifier}`;
        
        if (!this.performanceHistory.has(key)) {
            this.performanceHistory.set(key, []);
        }
        
        const history = this.performanceHistory.get(key);
        history.push(data);
        
        // Keep only last 1000 entries to prevent memory issues
        if (history.length > 1000) {
            history.splice(0, history.length - 1000);
        }
    }

    /**
     * Get performance trends
     */
    getPerformanceTrends(category, identifier, timeframe = '24h') {
        const key = `${category}_${identifier}`;
        const history = this.performanceHistory.get(key) || [];
        
        const cutoff = new Date(Date.now() - this.parseTimeframe(timeframe));
        const recentHistory = history.filter(entry => 
            new Date(entry.timestamp) >= cutoff
        );

        if (recentHistory.length < 2) {
            return {
                trend: 'insufficient_data',
                change: 0,
                dataPoints: recentHistory.length
            };
        }

        // Calculate trend based on first and last values
        const firstValue = this.extractTrendValue(recentHistory[0], category);
        const lastValue = this.extractTrendValue(recentHistory[recentHistory.length - 1], category);
        
        const change = ((lastValue - firstValue) / firstValue) * 100;
        
        let trend = 'stable';
        if (change > 5) trend = 'improving';
        else if (change < -5) trend = 'declining';

        return {
            trend,
            change: change.toFixed(2),
            dataPoints: recentHistory.length,
            firstValue,
            lastValue,
            history: recentHistory
        };
    }

    /**
     * Extract trend value based on category
     */
    extractTrendValue(entry, category) {
        switch (category) {
            case 'completion_rate':
                return entry.value || 0;
            case 'engagement':
                return entry.averageTimeOnPage || entry.averageEngagementTime || 0;
            case 'abandonment':
                return entry.abandonmentRate || 0;
            case 'accuracy':
                return entry.predictiveAccuracy || 0;
            default:
                return 0;
        }
    }

    /**
     * Generate performance report
     */
    generatePerformanceReport(timeframe = '7d') {
        const report = {
            generatedAt: new Date().toISOString(),
            timeframe,
            summary: this.generatePerformanceSummary(timeframe),
            completionRates: this.getCompletionRateReport(timeframe),
            engagementMetrics: this.getEngagementReport(timeframe),
            abandonmentAnalysis: this.getAbandonmentReport(timeframe),
            accuracyMeasurements: this.getAccuracyReport(timeframe),
            recommendations: this.generatePerformanceRecommendations(timeframe),
            benchmarkComparison: this.getBenchmarkComparison(timeframe)
        };

        return report;
    }

    /**
     * Generate performance summary
     */
    generatePerformanceSummary(timeframe) {
        const completionRates = this.analytics.getCompletionRates(timeframe);
        const engagementMetrics = this.analytics.getEngagementMetrics(timeframe);
        const abandonmentAnalysis = this.analytics.getAbandonmentAnalysis();

        // Calculate overall metrics
        const avgCompletionRate = Object.values(completionRates)
            .reduce((sum, data) => sum + data.rate, 0) / Object.keys(completionRates).length || 0;

        const avgEngagementTime = Object.values(engagementMetrics)
            .reduce((sum, data) => sum + data.averageTimeOnPage, 0) / Object.keys(engagementMetrics).length || 0;

        const totalAbandoned = Object.values(abandonmentAnalysis)
            .reduce((sum, data) => sum + data.totalAbandoned, 0);

        return {
            overallCompletionRate: avgCompletionRate,
            overallEngagementTime: avgEngagementTime,
            totalAbandonments: totalAbandoned,
            performanceScore: this.calculateOverallPerformanceScore(avgCompletionRate, avgEngagementTime, totalAbandoned),
            topPerformingAssessment: this.getTopPerformingAssessment(timeframe),
            needsAttentionAssessment: this.getNeedsAttentionAssessment(timeframe)
        };
    }

    /**
     * Get completion rate report
     */
    getCompletionRateReport(timeframe) {
        const completionRates = this.analytics.getCompletionRates(timeframe);
        const report = {};

        for (const [assessmentType, data] of Object.entries(completionRates)) {
            const trends = this.getPerformanceTrends('completion_rate', assessmentType, timeframe);
            
            report[assessmentType] = {
                currentRate: data.rate,
                trend: trends.trend,
                change: trends.change,
                benchmark: this.getBenchmarkLevel(data.rate, 'completionRate'),
                recommendation: this.getCompletionRateRecommendation(data.rate, trends.trend)
            };
        }

        return report;
    }

    /**
     * Get engagement report
     */
    getEngagementReport(timeframe) {
        const engagementMetrics = this.analytics.getEngagementMetrics(timeframe);
        const report = {};

        for (const [page, metrics] of Object.entries(engagementMetrics)) {
            const trends = this.getPerformanceTrends('engagement', page, timeframe);
            
            report[page] = {
                averageTimeOnPage: metrics.averageTimeOnPage,
                views: metrics.views,
                bounceRate: metrics.bounceRate,
                trend: trends.trend,
                change: trends.change,
                benchmark: this.getBenchmarkLevel(metrics.averageTimeOnPage, 'engagementTime'),
                recommendation: this.getEngagementRecommendation(metrics, trends.trend)
            };
        }

        return report;
    }

    /**
     * Get abandonment report
     */
    getAbandonmentReport(timeframe) {
        const abandonmentAnalysis = this.analytics.getAbandonmentAnalysis();
        const report = {};

        for (const [assessmentType, analysis] of Object.entries(abandonmentAnalysis)) {
            const metrics = this.analytics.assessmentMetrics.get(assessmentType);
            if (metrics) {
                const abandonmentRate = (metrics.abandoned / metrics.started) * 100;
                const trends = this.getPerformanceTrends('abandonment', assessmentType, timeframe);
                
                report[assessmentType] = {
                    abandonmentRate,
                    totalAbandoned: analysis.totalAbandoned,
                    topAbandonmentPoints: analysis.topAbandonmentPoints,
                    trend: trends.trend,
                    change: trends.change,
                    benchmark: this.getBenchmarkLevel(abandonmentRate, 'abandonmentRate', true),
                    recommendation: this.getAbandonmentRecommendation(abandonmentRate, analysis.topAbandonmentPoints)
                };
            }
        }

        return report;
    }

    /**
     * Get accuracy report
     */
    getAccuracyReport(timeframe) {
        const accuracyData = this.analytics.getAssessmentAccuracy();
        const report = {};

        for (const [assessmentType, accuracy] of Object.entries(accuracyData)) {
            const trends = this.getPerformanceTrends('accuracy', assessmentType, timeframe);
            
            report[assessmentType] = {
                predictiveAccuracy: accuracy.predictiveAccuracy,
                userSatisfaction: accuracy.userSatisfaction,
                outcomeCorrelation: accuracy.outcomeCorrelation,
                followUpResponseRate: accuracy.followUpResponseRate,
                trend: trends.trend,
                change: trends.change,
                overallAccuracyScore: this.calculateAccuracyScore(accuracy)
            };
        }

        return report;
    }

    /**
     * Calculate overall performance score
     */
    calculateOverallPerformanceScore(completionRate, engagementTime, totalAbandoned) {
        // Weighted scoring: completion rate (40%), engagement time (30%), abandonment (30%)
        const completionScore = Math.min(100, (completionRate / 85) * 100); // 85% is excellent
        const engagementScore = Math.min(100, (engagementTime / 300000) * 100); // 5 minutes is excellent
        const abandonmentScore = Math.max(0, 100 - (totalAbandoned / 10)); // Lower abandonment is better

        return (completionScore * 0.4 + engagementScore * 0.3 + abandonmentScore * 0.3).toFixed(1);
    }

    /**
     * Calculate accuracy score
     */
    calculateAccuracyScore(accuracy) {
        const weights = {
            predictiveAccuracy: 0.4,
            userSatisfaction: 0.3,
            outcomeCorrelation: 0.2,
            followUpResponseRate: 0.1
        };

        let score = 0;
        score += (accuracy.predictiveAccuracy / 100) * weights.predictiveAccuracy * 100;
        score += (accuracy.userSatisfaction / 5) * weights.userSatisfaction * 100;
        score += accuracy.outcomeCorrelation * weights.outcomeCorrelation * 100;
        score += (accuracy.followUpResponseRate / 100) * weights.followUpResponseRate * 100;

        return score.toFixed(1);
    }

    /**
     * Get benchmark level for a value
     */
    getBenchmarkLevel(value, benchmarkType, reverse = false) {
        const benchmarks = this.benchmarks[benchmarkType];
        if (!benchmarks) return 'unknown';

        if (reverse) {
            // For metrics where lower is better (like abandonment rate)
            if (value <= benchmarks.excellent) return 'excellent';
            if (value <= benchmarks.good) return 'good';
            if (value <= benchmarks.acceptable) return 'acceptable';
            return 'poor';
        } else {
            // For metrics where higher is better
            if (value >= benchmarks.excellent) return 'excellent';
            if (value >= benchmarks.good) return 'good';
            if (value >= benchmarks.acceptable) return 'acceptable';
            return 'poor';
        }
    }

    /**
     * Generate performance recommendations
     */
    generatePerformanceRecommendations(timeframe) {
        const recommendations = [];
        const completionRates = this.analytics.getCompletionRates(timeframe);
        const engagementMetrics = this.analytics.getEngagementMetrics(timeframe);
        const abandonmentAnalysis = this.analytics.getAbandonmentAnalysis();

        // Completion rate recommendations
        for (const [assessmentType, data] of Object.entries(completionRates)) {
            if (data.rate < 60) {
                recommendations.push({
                    priority: 'high',
                    category: 'completion_rate',
                    assessment: assessmentType,
                    issue: `Low completion rate: ${data.rate.toFixed(1)}%`,
                    recommendation: this.getCompletionRateRecommendation(data.rate, data.trend),
                    expectedImpact: 'Increase completion rate by 15-25%',
                    timeframe: '1-2 weeks'
                });
            }
        }

        // Engagement recommendations
        for (const [page, metrics] of Object.entries(engagementMetrics)) {
            if (metrics.averageTimeOnPage < 60000) { // Less than 1 minute
                recommendations.push({
                    priority: 'medium',
                    category: 'engagement',
                    page: page,
                    issue: `Low engagement time: ${(metrics.averageTimeOnPage / 1000).toFixed(1)}s`,
                    recommendation: this.getEngagementRecommendation(metrics, 'declining'),
                    expectedImpact: 'Increase engagement by 40-60%',
                    timeframe: '2-3 weeks'
                });
            }
        }

        // Abandonment recommendations
        for (const [assessmentType, analysis] of Object.entries(abandonmentAnalysis)) {
            if (analysis.topAbandonmentPoints.length > 0) {
                const topPoint = analysis.topAbandonmentPoints[0];
                if (topPoint.percentage > 25) {
                    recommendations.push({
                        priority: 'high',
                        category: 'abandonment',
                        assessment: assessmentType,
                        issue: `High abandonment at ${topPoint.point}: ${topPoint.percentage.toFixed(1)}%`,
                        recommendation: this.getAbandonmentRecommendation(topPoint.percentage, analysis.topAbandonmentPoints),
                        expectedImpact: 'Reduce abandonment by 20-30%',
                        timeframe: '1 week'
                    });
                }
            }
        }

        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * Get specific recommendations based on metrics
     */
    getCompletionRateRecommendation(rate, trend) {
        if (rate < 40) {
            return 'Critical: Redesign assessment flow, reduce length by 30-50%, improve question clarity';
        } else if (rate < 60) {
            return 'Optimize question flow, add progress indicators, reduce cognitive load';
        } else if (trend === 'declining') {
            return 'Monitor user feedback, A/B test question variations, check for technical issues';
        }
        return 'Continue monitoring and minor optimizations';
    }

    getEngagementRecommendation(metrics, trend) {
        if (metrics.averageTimeOnPage < 30000) {
            return 'Improve content quality, add interactive elements, enhance visual design';
        } else if (metrics.bounceRate > 70) {
            return 'Improve page loading speed, enhance content relevance, optimize CTAs';
        } else if (trend === 'declining') {
            return 'Refresh content, add new interactive features, improve user experience';
        }
        return 'Maintain current approach with minor enhancements';
    }

    getAbandonmentRecommendation(rate, topPoints) {
        if (rate > 40) {
            return 'Critical redesign needed: simplify flow, reduce question complexity, improve UX';
        } else if (topPoints.length > 0 && topPoints[0].percentage > 30) {
            return `Focus on ${topPoints[0].point}: simplify this section, add help text, improve clarity`;
        }
        return 'Monitor abandonment patterns and make incremental improvements';
    }

    /**
     * Get top performing assessment
     */
    getTopPerformingAssessment(timeframe) {
        const completionRates = this.analytics.getCompletionRates(timeframe);
        let topAssessment = null;
        let highestScore = 0;

        for (const [assessmentType, data] of Object.entries(completionRates)) {
            const engagementScore = this.analytics.calculateEngagementScore(assessmentType);
            const overallScore = (data.rate + engagementScore) / 2;
            
            if (overallScore > highestScore) {
                highestScore = overallScore;
                topAssessment = {
                    assessmentType,
                    completionRate: data.rate,
                    engagementScore,
                    overallScore
                };
            }
        }

        return topAssessment;
    }

    /**
     * Get assessment that needs attention
     */
    getNeedsAttentionAssessment(timeframe) {
        const completionRates = this.analytics.getCompletionRates(timeframe);
        let needsAttention = null;
        let lowestScore = 100;

        for (const [assessmentType, data] of Object.entries(completionRates)) {
            const engagementScore = this.analytics.calculateEngagementScore(assessmentType);
            const overallScore = (data.rate + engagementScore) / 2;
            
            if (overallScore < lowestScore) {
                lowestScore = overallScore;
                needsAttention = {
                    assessmentType,
                    completionRate: data.rate,
                    engagementScore,
                    overallScore,
                    issues: this.identifyAssessmentIssues(assessmentType, data.rate, engagementScore)
                };
            }
        }

        return needsAttention;
    }

    /**
     * Identify specific issues with an assessment
     */
    identifyAssessmentIssues(assessmentType, completionRate, engagementScore) {
        const issues = [];
        
        if (completionRate < 50) {
            issues.push('Very low completion rate');
        }
        
        if (engagementScore < 30) {
            issues.push('Poor user engagement');
        }
        
        const abandonmentAnalysis = this.analytics.getAbandonmentAnalysis(assessmentType);
        if (abandonmentAnalysis[assessmentType]?.topAbandonmentPoints.length > 0) {
            const topPoint = abandonmentAnalysis[assessmentType].topAbandonmentPoints[0];
            if (topPoint.percentage > 25) {
                issues.push(`High abandonment at ${topPoint.point}`);
            }
        }

        return issues;
    }

    /**
     * Get benchmark comparison
     */
    getBenchmarkComparison(timeframe) {
        const completionRates = this.analytics.getCompletionRates(timeframe);
        const comparison = {};

        for (const [assessmentType, data] of Object.entries(completionRates)) {
            const benchmark = this.getBenchmarkLevel(data.rate, 'completionRate');
            const engagementScore = this.analytics.calculateEngagementScore(assessmentType);
            const engagementBenchmark = this.getBenchmarkLevel(engagementScore, 'engagementTime');

            comparison[assessmentType] = {
                completionRate: {
                    value: data.rate,
                    benchmark,
                    target: this.benchmarks.completionRate.excellent,
                    gap: this.benchmarks.completionRate.excellent - data.rate
                },
                engagement: {
                    value: engagementScore,
                    benchmark: engagementBenchmark,
                    target: 100,
                    gap: 100 - engagementScore
                }
            };
        }

        return comparison;
    }

    /**
     * Calculate overall engagement
     */
    calculateOverallEngagement() {
        const sessions = Array.from(this.analytics.sessions.values());
        
        if (sessions.length === 0) {
            return {
                averageEngagementTime: 0,
                totalSessions: 0,
                engagementScore: 0
            };
        }

        const totalEngagementTime = sessions.reduce((sum, session) => {
            return sum + (session.duration || 0);
        }, 0);

        const averageEngagementTime = totalEngagementTime / sessions.length;
        const engagementScore = Math.min(100, (averageEngagementTime / 300000) * 100); // 5 minutes = 100%

        return {
            averageEngagementTime,
            totalSessions: sessions.length,
            engagementScore
        };
    }

    /**
     * Parse timeframe string to milliseconds
     */
    parseTimeframe(timeframe) {
        const unit = timeframe.slice(-1);
        const value = parseInt(timeframe.slice(0, -1));
        
        switch (unit) {
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            case 'w': return value * 7 * 24 * 60 * 60 * 1000;
            default: return 24 * 60 * 60 * 1000;
        }
    }

    /**
     * Export performance data
     */
    exportPerformanceData(format = 'json') {
        const data = {
            exportedAt: new Date().toISOString(),
            performanceHistory: Object.fromEntries(this.performanceHistory),
            currentMetrics: {
                completionRates: this.analytics.getCompletionRates('24h'),
                engagementMetrics: this.analytics.getEngagementMetrics('24h'),
                abandonmentAnalysis: this.analytics.getAbandonmentAnalysis()
            },
            benchmarks: this.benchmarks
        };

        if (format === 'csv') {
            return this.convertPerformanceDataToCSV(data);
        }

        return JSON.stringify(data, null, 2);
    }

    /**
     * Convert performance data to CSV
     */
    convertPerformanceDataToCSV(data) {
        const csvRows = [];
        csvRows.push(['Timestamp', 'Category', 'Identifier', 'Metric', 'Value', 'Benchmark']);

        for (const [key, history] of Object.entries(data.performanceHistory)) {
            const [category, identifier] = key.split('_');
            
            history.forEach(entry => {
                if (category === 'completion_rate') {
                    csvRows.push([entry.timestamp, category, identifier, 'completion_rate', entry.value, entry.benchmark]);
                } else if (category === 'engagement') {
                    csvRows.push([entry.timestamp, category, identifier, 'avg_time_on_page', entry.averageTimeOnPage, entry.benchmark]);
                } else if (category === 'abandonment') {
                    csvRows.push([entry.timestamp, category, identifier, 'abandonment_rate', entry.abandonmentRate, entry.benchmark]);
                }
            });
        }

        return csvRows.map(row => row.join(',')).join('\n');
    }
}

module.exports = PerformanceTracker;