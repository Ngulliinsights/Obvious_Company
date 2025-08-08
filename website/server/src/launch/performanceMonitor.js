/**
 * Performance Monitoring and Optimization System
 * Tracks real user data and system performance metrics
 */

class PerformanceMonitor {
    constructor(config = {}) {
        this.config = {
            metricsRetentionDays: config.metricsRetentionDays || 30,
            alertThresholds: {
                responseTime: config.responseTimeThreshold || 2000, // 2 seconds
                errorRate: config.errorRateThreshold || 0.05, // 5%
                memoryUsage: config.memoryThreshold || 0.85, // 85%
                cpuUsage: config.cpuThreshold || 0.80, // 80%
                diskUsage: config.diskThreshold || 0.90 // 90%
            },
            ...config
        };

        this.metrics = new Map();
        this.alerts = new Map();
        this.performanceData = new Map();
        this.userMetrics = new Map();
        
        this.initializeMetricsCollection();
        this.startPerformanceMonitoring();
    }

    /**
     * Initialize metrics collection
     */
    initializeMetricsCollection() {
        // System metrics
        this.systemMetrics = {
            responseTime: [],
            throughput: [],
            errorRate: [],
            memoryUsage: [],
            cpuUsage: [],
            diskUsage: [],
            activeConnections: [],
            databaseConnections: []
        };

        // User experience metrics
        this.userExperienceMetrics = {
            pageLoadTime: [],
            assessmentCompletionTime: [],
            assessmentAbandonmentRate: [],
            userSatisfactionScore: [],
            featureUsage: new Map(),
            errorEncounters: []
        };

        // Business metrics
        this.businessMetrics = {
            assessmentCompletions: [],
            leadConversions: [],
            consultationBookings: [],
            userRetention: [],
            revenueImpact: []
        };
    }

    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        // Collect system metrics every minute
        setInterval(() => {
            this.collectSystemMetrics();
        }, 60000);

        // Collect user metrics every 5 minutes
        setInterval(() => {
            this.aggregateUserMetrics();
        }, 300000);

        // Check alerts every 30 seconds
        setInterval(() => {
            this.checkAlerts();
        }, 30000);

        // Cleanup old metrics daily
        setInterval(() => {
            this.cleanupOldMetrics();
        }, 24 * 60 * 60 * 1000);

        console.log('Performance monitoring started');
    }

    /**
     * Collect system performance metrics
     */
    async collectSystemMetrics() {
        const timestamp = new Date();
        
        try {
            // Memory usage
            const memoryUsage = process.memoryUsage();
            const memoryPercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
            
            this.recordMetric('memoryUsage', {
                timestamp,
                value: memoryPercent,
                details: {
                    heapUsed: memoryUsage.heapUsed,
                    heapTotal: memoryUsage.heapTotal,
                    external: memoryUsage.external,
                    rss: memoryUsage.rss
                }
            });

            // CPU usage (approximation using process.cpuUsage())
            const cpuUsage = process.cpuUsage();
            const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
            
            this.recordMetric('cpuUsage', {
                timestamp,
                value: cpuPercent,
                details: cpuUsage
            });

            // Event loop lag (approximation)
            const start = process.hrtime.bigint();
            setImmediate(() => {
                const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
                this.recordMetric('eventLoopLag', {
                    timestamp,
                    value: lag
                });
            });

            // Active connections (if available)
            if (global.server && global.server.connections) {
                this.recordMetric('activeConnections', {
                    timestamp,
                    value: global.server.connections
                });
            }

        } catch (error) {
            console.error('Error collecting system metrics:', error);
        }
    }

    /**
     * Record user performance metric
     */
    recordUserMetric(metricType, data) {
        const timestamp = new Date();
        const metric = {
            timestamp,
            sessionId: data.sessionId,
            userId: data.userId,
            value: data.value,
            metadata: data.metadata || {},
            userAgent: data.userAgent,
            url: data.url
        };

        if (!this.userMetrics.has(metricType)) {
            this.userMetrics.set(metricType, []);
        }

        this.userMetrics.get(metricType).push(metric);

        // Process specific metric types
        switch (metricType) {
            case 'pageLoadTime':
                this.processPageLoadMetric(metric);
                break;
            case 'assessmentCompletion':
                this.processAssessmentMetric(metric);
                break;
            case 'userError':
                this.processErrorMetric(metric);
                break;
            case 'featureUsage':
                this.processFeatureUsageMetric(metric);
                break;
        }
    }

    /**
     * Record API response time
     */
    recordResponseTime(endpoint, duration, statusCode) {
        const timestamp = new Date();
        
        this.recordMetric('responseTime', {
            timestamp,
            value: duration,
            endpoint,
            statusCode,
            success: statusCode < 400
        });

        // Update error rate if this was an error
        if (statusCode >= 400) {
            this.recordMetric('errorRate', {
                timestamp,
                endpoint,
                statusCode,
                error: true
            });
        }
    }

    /**
     * Record assessment performance metrics
     */
    recordAssessmentMetrics(assessmentData) {
        const {
            sessionId,
            assessmentType,
            startTime,
            endTime,
            completionStatus,
            questionsAnswered,
            totalQuestions,
            userInteractions,
            abandonmentPoint
        } = assessmentData;

        const duration = endTime - startTime;
        const completionRate = questionsAnswered / totalQuestions;

        // Record completion time
        this.recordUserMetric('assessmentCompletionTime', {
            sessionId,
            value: duration,
            metadata: {
                assessmentType,
                completionStatus,
                completionRate,
                questionsAnswered,
                totalQuestions
            }
        });

        // Record abandonment if applicable
        if (completionStatus === 'abandoned') {
            this.recordUserMetric('assessmentAbandonment', {
                sessionId,
                value: abandonmentPoint,
                metadata: {
                    assessmentType,
                    questionsAnswered,
                    totalQuestions,
                    timeSpent: duration
                }
            });
        }

        // Record user interactions
        if (userInteractions) {
            this.recordUserMetric('userInteractions', {
                sessionId,
                value: userInteractions.length,
                metadata: {
                    assessmentType,
                    interactions: userInteractions
                }
            });
        }
    }

    /**
     * Process page load metrics
     */
    processPageLoadMetric(metric) {
        const { value, metadata } = metric;
        
        // Alert if page load time is too high
        if (value > this.config.alertThresholds.responseTime) {
            this.triggerAlert('slow_page_load', {
                loadTime: value,
                url: metadata.url,
                userAgent: metric.userAgent
            });
        }

        // Track by page type
        const pageType = this.categorizeUrl(metadata.url);
        if (!this.performanceData.has(`pageLoad_${pageType}`)) {
            this.performanceData.set(`pageLoad_${pageType}`, []);
        }
        this.performanceData.get(`pageLoad_${pageType}`).push(value);
    }

    /**
     * Process assessment completion metrics
     */
    processAssessmentMetric(metric) {
        const { value, metadata } = metric;
        
        // Track assessment performance by type
        const assessmentType = metadata.assessmentType;
        if (!this.performanceData.has(`assessment_${assessmentType}`)) {
            this.performanceData.set(`assessment_${assessmentType}`, {
                completionTimes: [],
                completionRates: [],
                abandonmentRates: []
            });
        }

        const assessmentData = this.performanceData.get(`assessment_${assessmentType}`);
        assessmentData.completionTimes.push(value);
        assessmentData.completionRates.push(metadata.completionRate);

        // Calculate abandonment rate
        const recentAssessments = this.userMetrics.get('assessmentCompletionTime') || [];
        const recentOfType = recentAssessments.filter(m => 
            m.metadata.assessmentType === assessmentType &&
            m.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        );

        const abandonments = recentOfType.filter(m => m.metadata.completionStatus === 'abandoned').length;
        const abandonmentRate = recentOfType.length > 0 ? abandonments / recentOfType.length : 0;
        
        assessmentData.abandonmentRates.push(abandonmentRate);

        // Alert if abandonment rate is high
        if (abandonmentRate > 0.3) { // 30% abandonment rate
            this.triggerAlert('high_abandonment_rate', {
                assessmentType,
                abandonmentRate,
                sampleSize: recentOfType.length
            });
        }
    }

    /**
     * Process error metrics
     */
    processErrorMetric(metric) {
        const { metadata } = metric;
        
        // Categorize error
        const errorCategory = this.categorizeError(metadata.error);
        
        if (!this.performanceData.has(`errors_${errorCategory}`)) {
            this.performanceData.set(`errors_${errorCategory}`, []);
        }
        
        this.performanceData.get(`errors_${errorCategory}`).push(metric);

        // Alert for critical errors
        if (errorCategory === 'critical') {
            this.triggerAlert('critical_error', {
                error: metadata.error,
                url: metadata.url,
                userAgent: metric.userAgent,
                sessionId: metric.sessionId
            });
        }
    }

    /**
     * Process feature usage metrics
     */
    processFeatureUsageMetric(metric) {
        const { metadata } = metric;
        const feature = metadata.feature;
        
        if (!this.performanceData.has('featureUsage')) {
            this.performanceData.set('featureUsage', new Map());
        }
        
        const featureUsage = this.performanceData.get('featureUsage');
        if (!featureUsage.has(feature)) {
            featureUsage.set(feature, {
                usageCount: 0,
                uniqueUsers: new Set(),
                avgUsageTime: [],
                successRate: []
            });
        }
        
        const featureData = featureUsage.get(feature);
        featureData.usageCount++;
        featureData.uniqueUsers.add(metric.sessionId);
        
        if (metadata.usageTime) {
            featureData.avgUsageTime.push(metadata.usageTime);
        }
        
        if (metadata.success !== undefined) {
            featureData.successRate.push(metadata.success ? 1 : 0);
        }
    }

    /**
     * Record generic metric
     */
    recordMetric(metricType, data) {
        if (!this.metrics.has(metricType)) {
            this.metrics.set(metricType, []);
        }
        
        this.metrics.get(metricType).push(data);
        
        // Keep only recent metrics to prevent memory issues
        const maxMetrics = 10000;
        const metricArray = this.metrics.get(metricType);
        if (metricArray.length > maxMetrics) {
            metricArray.splice(0, metricArray.length - maxMetrics);
        }
    }

    /**
     * Aggregate user metrics
     */
    aggregateUserMetrics() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        // Aggregate page load times
        const pageLoadMetrics = this.userMetrics.get('pageLoadTime') || [];
        const recentPageLoads = pageLoadMetrics.filter(m => m.timestamp > oneHourAgo);
        
        if (recentPageLoads.length > 0) {
            const avgLoadTime = recentPageLoads.reduce((sum, m) => sum + m.value, 0) / recentPageLoads.length;
            const p95LoadTime = this.calculatePercentile(recentPageLoads.map(m => m.value), 95);
            
            this.recordMetric('aggregatedPageLoad', {
                timestamp: now,
                avgLoadTime,
                p95LoadTime,
                sampleSize: recentPageLoads.length
            });
        }

        // Aggregate assessment metrics
        const assessmentMetrics = this.userMetrics.get('assessmentCompletionTime') || [];
        const recentAssessments = assessmentMetrics.filter(m => m.timestamp > oneHourAgo);
        
        if (recentAssessments.length > 0) {
            const completedAssessments = recentAssessments.filter(m => m.metadata.completionStatus === 'completed');
            const avgCompletionTime = completedAssessments.length > 0 
                ? completedAssessments.reduce((sum, m) => sum + m.value, 0) / completedAssessments.length 
                : 0;
            
            const completionRate = completedAssessments.length / recentAssessments.length;
            
            this.recordMetric('aggregatedAssessment', {
                timestamp: now,
                avgCompletionTime,
                completionRate,
                totalAssessments: recentAssessments.length,
                completedAssessments: completedAssessments.length
            });
        }
    }

    /**
     * Check for performance alerts
     */
    checkAlerts() {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        
        // Check response time alerts
        const responseTimeMetrics = this.metrics.get('responseTime') || [];
        const recentResponseTimes = responseTimeMetrics.filter(m => m.timestamp > fiveMinutesAgo);
        
        if (recentResponseTimes.length > 0) {
            const avgResponseTime = recentResponseTimes.reduce((sum, m) => sum + m.value, 0) / recentResponseTimes.length;
            
            if (avgResponseTime > this.config.alertThresholds.responseTime) {
                this.triggerAlert('high_response_time', {
                    avgResponseTime,
                    threshold: this.config.alertThresholds.responseTime,
                    sampleSize: recentResponseTimes.length
                });
            }
        }

        // Check error rate alerts
        const errorMetrics = this.metrics.get('errorRate') || [];
        const recentErrors = errorMetrics.filter(m => m.timestamp > fiveMinutesAgo);
        const totalRequests = responseTimeMetrics.length;
        
        if (totalRequests > 0) {
            const errorRate = recentErrors.length / totalRequests;
            
            if (errorRate > this.config.alertThresholds.errorRate) {
                this.triggerAlert('high_error_rate', {
                    errorRate,
                    threshold: this.config.alertThresholds.errorRate,
                    errorCount: recentErrors.length,
                    totalRequests
                });
            }
        }

        // Check memory usage alerts
        const memoryMetrics = this.metrics.get('memoryUsage') || [];
        const recentMemory = memoryMetrics.filter(m => m.timestamp > fiveMinutesAgo);
        
        if (recentMemory.length > 0) {
            const avgMemoryUsage = recentMemory.reduce((sum, m) => sum + m.value, 0) / recentMemory.length;
            
            if (avgMemoryUsage > this.config.alertThresholds.memoryUsage) {
                this.triggerAlert('high_memory_usage', {
                    memoryUsage: avgMemoryUsage,
                    threshold: this.config.alertThresholds.memoryUsage
                });
            }
        }
    }

    /**
     * Trigger performance alert
     */
    triggerAlert(alertType, data) {
        const alertId = `${alertType}_${Date.now()}`;
        const alert = {
            id: alertId,
            type: alertType,
            timestamp: new Date(),
            data,
            status: 'active',
            severity: this.getAlertSeverity(alertType)
        };

        this.alerts.set(alertId, alert);
        
        // Send alert notification
        this.sendAlertNotification(alert);
        
        console.warn(`Performance Alert [${alertType}]:`, data);
    }

    /**
     * Send alert notification
     */
    async sendAlertNotification(alert) {
        // This would integrate with notification systems (email, Slack, PagerDuty, etc.)
        // For now, just log the alert
        
        const message = this.formatAlertMessage(alert);
        
        // In production, this would send to monitoring channels
        console.log(`ALERT NOTIFICATION: ${message}`);
        
        // Could also trigger webhooks, send emails, etc.
        if (this.config.webhookUrl) {
            try {
                await fetch(this.config.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: message,
                        alert: alert
                    })
                });
            } catch (error) {
                console.error('Error sending webhook alert:', error);
            }
        }
    }

    /**
     * Format alert message
     */
    formatAlertMessage(alert) {
        const { type, data, severity } = alert;
        
        switch (type) {
            case 'high_response_time':
                return `🚨 High Response Time Alert: Average response time is ${data.avgResponseTime}ms (threshold: ${data.threshold}ms)`;
            case 'high_error_rate':
                return `🚨 High Error Rate Alert: Error rate is ${(data.errorRate * 100).toFixed(2)}% (threshold: ${(data.threshold * 100).toFixed(2)}%)`;
            case 'high_memory_usage':
                return `🚨 High Memory Usage Alert: Memory usage is ${(data.memoryUsage * 100).toFixed(2)}% (threshold: ${(data.threshold * 100).toFixed(2)}%)`;
            case 'high_abandonment_rate':
                return `⚠️ High Assessment Abandonment: ${data.assessmentType} has ${(data.abandonmentRate * 100).toFixed(2)}% abandonment rate`;
            case 'critical_error':
                return `🔥 Critical Error: ${data.error.message || 'Unknown error'} on ${data.url}`;
            default:
                return `Alert: ${type} - ${JSON.stringify(data)}`;
        }
    }

    /**
     * Get alert severity
     */
    getAlertSeverity(alertType) {
        const severityMap = {
            'critical_error': 'critical',
            'high_error_rate': 'high',
            'high_response_time': 'medium',
            'high_memory_usage': 'medium',
            'high_abandonment_rate': 'medium',
            'slow_page_load': 'low'
        };
        
        return severityMap[alertType] || 'low';
    }

    /**
     * Get performance dashboard data
     */
    getDashboardData(timeRange = '24h') {
        const cutoffTime = new Date(Date.now() - this.parseTimeRange(timeRange));
        
        return {
            systemMetrics: this.getSystemMetricsSummary(cutoffTime),
            userExperience: this.getUserExperienceSummary(cutoffTime),
            assessmentPerformance: this.getAssessmentPerformanceSummary(cutoffTime),
            alerts: this.getActiveAlerts(),
            trends: this.getPerformanceTrends(cutoffTime)
        };
    }

    /**
     * Get system metrics summary
     */
    getSystemMetricsSummary(cutoffTime) {
        const responseTimeMetrics = (this.metrics.get('responseTime') || [])
            .filter(m => m.timestamp > cutoffTime);
        const memoryMetrics = (this.metrics.get('memoryUsage') || [])
            .filter(m => m.timestamp > cutoffTime);
        const errorMetrics = (this.metrics.get('errorRate') || [])
            .filter(m => m.timestamp > cutoffTime);

        return {
            responseTime: {
                avg: this.calculateAverage(responseTimeMetrics.map(m => m.value)),
                p95: this.calculatePercentile(responseTimeMetrics.map(m => m.value), 95),
                p99: this.calculatePercentile(responseTimeMetrics.map(m => m.value), 99)
            },
            memoryUsage: {
                avg: this.calculateAverage(memoryMetrics.map(m => m.value)),
                max: Math.max(...memoryMetrics.map(m => m.value), 0)
            },
            errorRate: {
                rate: errorMetrics.length / Math.max(responseTimeMetrics.length, 1),
                count: errorMetrics.length
            },
            throughput: responseTimeMetrics.length
        };
    }

    /**
     * Get user experience summary
     */
    getUserExperienceSummary(cutoffTime) {
        const pageLoadMetrics = (this.userMetrics.get('pageLoadTime') || [])
            .filter(m => m.timestamp > cutoffTime);
        const assessmentMetrics = (this.userMetrics.get('assessmentCompletionTime') || [])
            .filter(m => m.timestamp > cutoffTime);

        const completedAssessments = assessmentMetrics.filter(m => 
            m.metadata.completionStatus === 'completed'
        );

        return {
            pageLoad: {
                avg: this.calculateAverage(pageLoadMetrics.map(m => m.value)),
                p95: this.calculatePercentile(pageLoadMetrics.map(m => m.value), 95)
            },
            assessmentCompletion: {
                avg: this.calculateAverage(completedAssessments.map(m => m.value)),
                completionRate: completedAssessments.length / Math.max(assessmentMetrics.length, 1)
            },
            userSatisfaction: this.calculateUserSatisfaction(cutoffTime)
        };
    }

    /**
     * Get assessment performance summary
     */
    getAssessmentPerformanceSummary(cutoffTime) {
        const assessmentMetrics = (this.userMetrics.get('assessmentCompletionTime') || [])
            .filter(m => m.timestamp > cutoffTime);

        const byType = {};
        assessmentMetrics.forEach(metric => {
            const type = metric.metadata.assessmentType;
            if (!byType[type]) {
                byType[type] = {
                    total: 0,
                    completed: 0,
                    abandoned: 0,
                    completionTimes: []
                };
            }
            
            byType[type].total++;
            if (metric.metadata.completionStatus === 'completed') {
                byType[type].completed++;
                byType[type].completionTimes.push(metric.value);
            } else if (metric.metadata.completionStatus === 'abandoned') {
                byType[type].abandoned++;
            }
        });

        // Calculate summary statistics for each type
        Object.keys(byType).forEach(type => {
            const data = byType[type];
            data.completionRate = data.completed / data.total;
            data.abandonmentRate = data.abandoned / data.total;
            data.avgCompletionTime = this.calculateAverage(data.completionTimes);
        });

        return byType;
    }

    /**
     * Get active alerts
     */
    getActiveAlerts() {
        const activeAlerts = Array.from(this.alerts.values())
            .filter(alert => alert.status === 'active')
            .sort((a, b) => b.timestamp - a.timestamp);

        return activeAlerts.slice(0, 10); // Return last 10 active alerts
    }

    /**
     * Get performance trends
     */
    getPerformanceTrends(cutoffTime) {
        // This would calculate trends over time
        // For now, return basic trend indicators
        return {
            responseTimeTrend: 'stable',
            errorRateTrend: 'improving',
            userSatisfactionTrend: 'improving',
            assessmentCompletionTrend: 'stable'
        };
    }

    /**
     * Calculate user satisfaction score
     */
    calculateUserSatisfaction(cutoffTime) {
        // This would integrate with feedback system
        // For now, return a calculated score based on performance metrics
        const pageLoadMetrics = (this.userMetrics.get('pageLoadTime') || [])
            .filter(m => m.timestamp > cutoffTime);
        const errorMetrics = (this.userMetrics.get('userError') || [])
            .filter(m => m.timestamp > cutoffTime);

        if (pageLoadMetrics.length === 0) return 0;

        const avgLoadTime = this.calculateAverage(pageLoadMetrics.map(m => m.value));
        const errorRate = errorMetrics.length / pageLoadMetrics.length;

        // Simple satisfaction calculation (0-100 scale)
        let satisfaction = 100;
        
        // Penalize slow load times
        if (avgLoadTime > 3000) satisfaction -= 30;
        else if (avgLoadTime > 2000) satisfaction -= 15;
        else if (avgLoadTime > 1000) satisfaction -= 5;

        // Penalize errors
        satisfaction -= errorRate * 50;

        return Math.max(0, Math.min(100, satisfaction));
    }

    /**
     * Helper methods
     */
    calculateAverage(values) {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    calculatePercentile(values, percentile) {
        if (values.length === 0) return 0;
        const sorted = values.sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    parseTimeRange(timeRange) {
        const units = {
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000,
            'w': 7 * 24 * 60 * 60 * 1000
        };
        
        const match = timeRange.match(/^(\d+)([hdw])$/);
        if (match) {
            return parseInt(match[1]) * units[match[2]];
        }
        
        return 24 * 60 * 60 * 1000; // Default to 24 hours
    }

    categorizeUrl(url) {
        if (!url) return 'unknown';
        
        if (url.includes('/assessment')) return 'assessment';
        if (url.includes('/insights')) return 'insights';
        if (url.includes('/learn')) return 'learn';
        if (url.includes('/contact')) return 'contact';
        if (url === '/' || url.includes('index')) return 'homepage';
        
        return 'other';
    }

    categorizeError(error) {
        if (!error) return 'unknown';
        
        const errorString = error.toString().toLowerCase();
        
        if (errorString.includes('network') || errorString.includes('fetch')) return 'network';
        if (errorString.includes('timeout')) return 'timeout';
        if (errorString.includes('permission') || errorString.includes('unauthorized')) return 'auth';
        if (errorString.includes('not found') || errorString.includes('404')) return 'notfound';
        if (errorString.includes('server') || errorString.includes('500')) return 'server';
        if (errorString.includes('validation') || errorString.includes('invalid')) return 'validation';
        
        return 'application';
    }

    /**
     * Cleanup old metrics to prevent memory issues
     */
    cleanupOldMetrics() {
        const cutoffTime = new Date(Date.now() - this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);
        
        // Clean system metrics
        for (const [metricType, metrics] of this.metrics.entries()) {
            const filteredMetrics = metrics.filter(m => m.timestamp > cutoffTime);
            this.metrics.set(metricType, filteredMetrics);
        }

        // Clean user metrics
        for (const [metricType, metrics] of this.userMetrics.entries()) {
            const filteredMetrics = metrics.filter(m => m.timestamp > cutoffTime);
            this.userMetrics.set(metricType, filteredMetrics);
        }

        // Clean old alerts
        for (const [alertId, alert] of this.alerts.entries()) {
            if (alert.timestamp < cutoffTime) {
                this.alerts.delete(alertId);
            }
        }

        console.log(`Cleaned up metrics older than ${this.config.metricsRetentionDays} days`);
    }
}

module.exports = { PerformanceMonitor };