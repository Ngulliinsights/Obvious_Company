/**
 * Real-Time Dashboard for Analytics Monitoring
 * Provides live insights and performance monitoring
 */

class RealTimeDashboard {
    constructor(analyticsEngine) {
        this.analytics = analyticsEngine;
        this.subscribers = new Set();
        this.updateInterval = null;
        this.alertThresholds = {
            completionRate: 70,
            abandonmentRate: 30,
            responseTime: 5000,
            errorRate: 5
        };
    }

    /**
     * Start real-time monitoring
     */
    start(updateIntervalMs = 5000) {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            this.broadcastUpdate();
        }, updateIntervalMs);

        console.log(`Real-time dashboard started with ${updateIntervalMs}ms update interval`);
    }

    /**
     * Stop real-time monitoring
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        console.log('Real-time dashboard stopped');
    }

    /**
     * Subscribe to real-time updates
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        
        // Send initial data
        callback(this.getCurrentDashboardData());
        
        return () => {
            this.subscribers.delete(callback);
        };
    }

    /**
     * Get current dashboard data
     */
    getCurrentDashboardData() {
        const realTimeData = this.analytics.getRealTimeDashboard();
        
        return {
            timestamp: new Date().toISOString(),
            overview: {
                activeUsers: realTimeData.activeUsers,
                currentAssessments: realTimeData.currentAssessments,
                completionsToday: realTimeData.completionsToday,
                averageEngagementTime: realTimeData.averageEngagementTime
            },
            performance: {
                completionRates: this.analytics.getCompletionRates('1h'),
                engagementMetrics: this.analytics.getEngagementMetrics('1h'),
                abandonmentAnalysis: this.analytics.getAbandonmentAnalysis(),
                conversionFunnel: realTimeData.conversionFunnel
            },
            activity: {
                recentEvents: realTimeData.recentEvents,
                activeAssessments: realTimeData.activeAssessments,
                topPerformingAssessments: realTimeData.topPerformingAssessments
            },
            alerts: {
                performanceAlerts: realTimeData.performanceAlerts,
                systemAlerts: this.getSystemAlerts(),
                recommendations: this.getImmediateRecommendations()
            },
            charts: {
                hourlyActivity: this.getHourlyActivityData(),
                completionTrends: this.getCompletionTrendsData(),
                userJourneyFlow: this.getUserJourneyFlowData(),
                geographicDistribution: this.getGeographicData()
            }
        };
    }

    /**
     * Broadcast updates to all subscribers
     */
    broadcastUpdate() {
        const data = this.getCurrentDashboardData();
        
        this.subscribers.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error broadcasting dashboard update:', error);
            }
        });
    }

    /**
     * Get system alerts
     */
    getSystemAlerts() {
        const alerts = [];
        const now = Date.now();
        
        // Check for system performance issues
        const recentEvents = this.analytics.events.filter(e => 
            now - new Date(e.timestamp).getTime() < 300000 // Last 5 minutes
        );

        // High error rate alert
        const errorEvents = recentEvents.filter(e => e.type === 'error');
        const errorRate = recentEvents.length > 0 ? (errorEvents.length / recentEvents.length) * 100 : 0;
        
        if (errorRate > this.alertThresholds.errorRate) {
            alerts.push({
                type: 'error',
                category: 'system_performance',
                message: `High error rate detected: ${errorRate.toFixed(1)}%`,
                severity: 'critical',
                timestamp: new Date().toISOString(),
                value: errorRate,
                threshold: this.alertThresholds.errorRate
            });
        }

        // Slow response time alert
        const responseTimeEvents = recentEvents.filter(e => 
            e.type === 'question_answered' && e.data.responseTime > this.alertThresholds.responseTime
        );
        
        if (responseTimeEvents.length > 0) {
            const avgResponseTime = responseTimeEvents.reduce((sum, e) => sum + e.data.responseTime, 0) / responseTimeEvents.length;
            alerts.push({
                type: 'warning',
                category: 'performance',
                message: `Slow response times detected: ${avgResponseTime.toFixed(0)}ms average`,
                severity: 'medium',
                timestamp: new Date().toISOString(),
                value: avgResponseTime,
                threshold: this.alertThresholds.responseTime
            });
        }

        // High abandonment rate alert
        const abandonmentAnalysis = this.analytics.getAbandonmentAnalysis();
        for (const [assessmentType, analysis] of Object.entries(abandonmentAnalysis)) {
            const metrics = this.analytics.assessmentMetrics.get(assessmentType);
            if (metrics) {
                const abandonmentRate = (metrics.abandoned / metrics.started) * 100;
                if (abandonmentRate > this.alertThresholds.abandonmentRate) {
                    alerts.push({
                        type: 'warning',
                        category: 'user_experience',
                        message: `High abandonment rate for ${assessmentType}: ${abandonmentRate.toFixed(1)}%`,
                        severity: 'medium',
                        timestamp: new Date().toISOString(),
                        assessmentType,
                        value: abandonmentRate,
                        threshold: this.alertThresholds.abandonmentRate
                    });
                }
            }
        }

        return alerts.sort((a, b) => {
            const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }

    /**
     * Get immediate recommendations
     */
    getImmediateRecommendations() {
        const recommendations = [];
        const dashboardData = this.getCurrentDashboardData();

        // Low completion rate recommendations
        for (const [assessmentType, data] of Object.entries(dashboardData.performance.completionRates)) {
            if (data.rate < 60) {
                recommendations.push({
                    priority: 'high',
                    category: 'completion_optimization',
                    title: `Optimize ${assessmentType} completion rate`,
                    description: `Current rate is ${data.rate.toFixed(1)}%. Consider reducing length or improving UX.`,
                    action: 'Review assessment flow',
                    estimatedImpact: '+15-25% completion rate',
                    timeToImplement: '2-3 days'
                });
            }
        }

        // High abandonment recommendations
        const abandonmentAnalysis = dashboardData.performance.abandonmentAnalysis;
        for (const [assessmentType, analysis] of Object.entries(abandonmentAnalysis)) {
            if (analysis.topAbandonmentPoints.length > 0) {
                const topPoint = analysis.topAbandonmentPoints[0];
                if (topPoint.percentage > 25) {
                    recommendations.push({
                        priority: 'high',
                        category: 'abandonment_reduction',
                        title: `Fix abandonment at ${topPoint.point}`,
                        description: `${topPoint.percentage.toFixed(1)}% of users abandon at this point in ${assessmentType}.`,
                        action: 'Redesign problematic section',
                        estimatedImpact: '+20-30% completion rate',
                        timeToImplement: '1-2 days'
                    });
                }
            }
        }

        // Low engagement recommendations
        for (const [page, metrics] of Object.entries(dashboardData.performance.engagementMetrics)) {
            if (metrics.averageTimeOnPage < 20000) { // Less than 20 seconds
                recommendations.push({
                    priority: 'medium',
                    category: 'engagement_improvement',
                    title: `Improve ${page} engagement`,
                    description: `Average time on page is only ${(metrics.averageTimeOnPage / 1000).toFixed(1)} seconds.`,
                    action: 'Enhance content and interactivity',
                    estimatedImpact: '+40-60% engagement',
                    timeToImplement: '3-5 days'
                });
            }
        }

        // Conversion optimization recommendations
        const conversionFunnel = dashboardData.performance.conversionFunnel;
        if (conversionFunnel.conversionRates.visitorToAssessment < 15) {
            recommendations.push({
                priority: 'medium',
                category: 'conversion_optimization',
                title: 'Improve visitor-to-assessment conversion',
                description: `Only ${conversionFunnel.conversionRates.visitorToAssessment.toFixed(1)}% of visitors start assessments.`,
                action: 'Optimize CTAs and value proposition',
                estimatedImpact: '+25-40% assessment starts',
                timeToImplement: '2-3 days'
            });
        }

        return recommendations
            .sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            })
            .slice(0, 5); // Top 5 recommendations
    }

    /**
     * Get hourly activity data for charts
     */
    getHourlyActivityData() {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const hourlyData = new Array(24).fill(0).map((_, index) => {
            const hour = new Date(last24Hours.getTime() + index * 60 * 60 * 1000);
            return {
                hour: hour.getHours(),
                timestamp: hour.toISOString(),
                assessmentStarts: 0,
                assessmentCompletions: 0,
                pageViews: 0,
                uniqueUsers: new Set()
            };
        });

        // Populate with actual data
        this.analytics.events.forEach(event => {
            const eventTime = new Date(event.timestamp);
            if (eventTime >= last24Hours) {
                const hourIndex = Math.floor((eventTime.getTime() - last24Hours.getTime()) / (60 * 60 * 1000));
                if (hourIndex >= 0 && hourIndex < 24) {
                    const hourData = hourlyData[hourIndex];
                    
                    switch (event.type) {
                        case 'assessment_started':
                            hourData.assessmentStarts++;
                            break;
                        case 'assessment_completed':
                            hourData.assessmentCompletions++;
                            break;
                        case 'page_view':
                            hourData.pageViews++;
                            break;
                    }
                    
                    if (event.sessionId) {
                        hourData.uniqueUsers.add(event.sessionId);
                    }
                }
            }
        });

        // Convert unique users set to count
        return hourlyData.map(data => ({
            ...data,
            uniqueUsers: data.uniqueUsers.size
        }));
    }

    /**
     * Get completion trends data
     */
    getCompletionTrendsData() {
        const trends = new Map();
        const now = Date.now();
        const timeWindows = [
            { label: '1h', duration: 60 * 60 * 1000 },
            { label: '6h', duration: 6 * 60 * 60 * 1000 },
            { label: '24h', duration: 24 * 60 * 60 * 1000 },
            { label: '7d', duration: 7 * 24 * 60 * 60 * 1000 }
        ];

        for (const assessmentType of this.analytics.assessmentMetrics.keys()) {
            trends.set(assessmentType, {
                assessmentType,
                windows: timeWindows.map(window => {
                    const cutoff = now - window.duration;
                    const starts = this.analytics.events.filter(e => 
                        e.type === 'assessment_started' &&
                        e.data.assessmentType === assessmentType &&
                        new Date(e.timestamp).getTime() >= cutoff
                    ).length;
                    
                    const completions = this.analytics.events.filter(e => 
                        e.type === 'assessment_completed' &&
                        e.data.assessmentType === assessmentType &&
                        new Date(e.timestamp).getTime() >= cutoff
                    ).length;

                    return {
                        timeframe: window.label,
                        starts,
                        completions,
                        completionRate: starts > 0 ? (completions / starts) * 100 : 0
                    };
                })
            });
        }

        return Array.from(trends.values());
    }

    /**
     * Get user journey flow data
     */
    getUserJourneyFlowData() {
        const journeySteps = [
            'page_view',
            'assessment_started',
            'question_answered',
            'assessment_completed',
            'lead_captured',
            'consultation_scheduled'
        ];

        const flowData = {
            nodes: journeySteps.map(step => ({
                id: step,
                label: this.formatStepLabel(step),
                count: this.analytics.events.filter(e => e.type === step).length
            })),
            links: []
        };

        // Calculate transitions between steps
        const sessionJourneys = new Map();
        
        this.analytics.events.forEach(event => {
            if (event.sessionId && journeySteps.includes(event.type)) {
                if (!sessionJourneys.has(event.sessionId)) {
                    sessionJourneys.set(event.sessionId, []);
                }
                sessionJourneys.get(event.sessionId).push({
                    step: event.type,
                    timestamp: event.timestamp
                });
            }
        });

        // Analyze transitions
        const transitions = new Map();
        
        sessionJourneys.forEach(journey => {
            const sortedJourney = journey.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            for (let i = 0; i < sortedJourney.length - 1; i++) {
                const from = sortedJourney[i].step;
                const to = sortedJourney[i + 1].step;
                const key = `${from}->${to}`;
                
                transitions.set(key, (transitions.get(key) || 0) + 1);
            }
        });

        // Convert to links format
        flowData.links = Array.from(transitions.entries()).map(([key, count]) => {
            const [source, target] = key.split('->');
            return { source, target, count };
        });

        return flowData;
    }

    /**
     * Get geographic distribution data
     */
    getGeographicData() {
        const geographic = new Map();
        
        this.analytics.events.forEach(event => {
            if (event.ipAddress) {
                const region = this.analytics.getRegionFromHashedIP(event.ipAddress);
                if (!geographic.has(region)) {
                    geographic.set(region, {
                        region,
                        users: new Set(),
                        assessmentStarts: 0,
                        assessmentCompletions: 0,
                        pageViews: 0
                    });
                }
                
                const regionData = geographic.get(region);
                
                if (event.sessionId) {
                    regionData.users.add(event.sessionId);
                }
                
                switch (event.type) {
                    case 'assessment_started':
                        regionData.assessmentStarts++;
                        break;
                    case 'assessment_completed':
                        regionData.assessmentCompletions++;
                        break;
                    case 'page_view':
                        regionData.pageViews++;
                        break;
                }
            }
        });

        return Array.from(geographic.values()).map(data => ({
            ...data,
            users: data.users.size,
            completionRate: data.assessmentStarts > 0 ? (data.assessmentCompletions / data.assessmentStarts) * 100 : 0
        }));
    }

    /**
     * Format step labels for display
     */
    formatStepLabel(step) {
        const labels = {
            'page_view': 'Page View',
            'assessment_started': 'Assessment Started',
            'question_answered': 'Question Answered',
            'assessment_completed': 'Assessment Completed',
            'lead_captured': 'Lead Captured',
            'consultation_scheduled': 'Consultation Scheduled'
        };
        
        return labels[step] || step;
    }

    /**
     * Export dashboard data
     */
    exportData(format = 'json', timeframe = '24h') {
        const data = {
            exportedAt: new Date().toISOString(),
            timeframe,
            format,
            data: this.getCurrentDashboardData()
        };

        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.convertToCSV(data);
            default:
                return data;
        }
    }

    /**
     * Convert data to CSV format
     */
    convertToCSV(data) {
        // Simplified CSV conversion for key metrics
        const csvData = [];
        
        // Header
        csvData.push(['Metric', 'Value', 'Timestamp']);
        
        // Overview metrics
        const overview = data.data.overview;
        csvData.push(['Active Users', overview.activeUsers, data.exportedAt]);
        csvData.push(['Current Assessments', overview.currentAssessments, data.exportedAt]);
        csvData.push(['Completions Today', overview.completionsToday, data.exportedAt]);
        csvData.push(['Avg Engagement Time', overview.averageEngagementTime, data.exportedAt]);

        // Completion rates
        for (const [assessmentType, rateData] of Object.entries(data.data.performance.completionRates)) {
            csvData.push([`${assessmentType} Completion Rate`, `${rateData.rate.toFixed(2)}%`, data.exportedAt]);
        }

        return csvData.map(row => row.join(',')).join('\n');
    }

    /**
     * Set alert thresholds
     */
    setAlertThresholds(thresholds) {
        this.alertThresholds = { ...this.alertThresholds, ...thresholds };
    }

    /**
     * Get current alert thresholds
     */
    getAlertThresholds() {
        return { ...this.alertThresholds };
    }

    /**
     * Manual trigger for immediate dashboard update
     */
    triggerUpdate() {
        this.broadcastUpdate();
    }

    /**
     * Get dashboard health status
     */
    getHealthStatus() {
        const alerts = this.getSystemAlerts();
        const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
        const warningAlerts = alerts.filter(a => a.severity === 'medium').length;

        let status = 'healthy';
        if (criticalAlerts > 0) {
            status = 'critical';
        } else if (warningAlerts > 2) {
            status = 'warning';
        } else if (warningAlerts > 0) {
            status = 'caution';
        }

        return {
            status,
            criticalAlerts,
            warningAlerts,
            totalAlerts: alerts.length,
            lastUpdate: new Date().toISOString(),
            uptime: this.updateInterval ? 'running' : 'stopped'
        };
    }
}

module.exports = RealTimeDashboard;