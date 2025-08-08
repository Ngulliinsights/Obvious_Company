/**
 * Launch Controller - Orchestrates Platform Launch and Monitoring
 * Coordinates feature flags, feedback collection, performance monitoring, and support systems
 */

const { featureFlagsManager } = require('./featureFlags');
const { FeedbackSystem } = require('./feedbackSystem');
const { PerformanceMonitor } = require('./performanceMonitor');
const { SupportSystem } = require('./supportSystem');

class LaunchController {
    constructor(config = {}) {
        this.config = {
            launchPhase: config.launchPhase || 'beta', // beta, soft-launch, full-launch
            rolloutStrategy: config.rolloutStrategy || 'gradual', // gradual, immediate
            monitoringEnabled: config.monitoringEnabled !== false,
            feedbackEnabled: config.feedbackEnabled !== false,
            supportEnabled: config.supportEnabled !== false,
            ...config
        };

        this.launchStatus = {
            phase: this.config.launchPhase,
            startTime: new Date(),
            activeUsers: 0,
            systemHealth: 'healthy',
            criticalIssues: 0,
            userSatisfaction: 0
        };

        this.initializeSystems();
        this.startLaunchMonitoring();
    }

    /**
     * Initialize all launch systems
     */
    initializeSystems() {
        // Initialize systems with simplified approach to avoid circular dependencies
        try {
            if (this.config.feedbackEnabled) {
                this.feedbackSystem = new FeedbackSystem({
                    email: {
                        host: process.env.SMTP_HOST,
                        port: process.env.SMTP_PORT,
                        user: process.env.SMTP_USER,
                        password: process.env.SMTP_PASS,
                        notificationEmail: process.env.FEEDBACK_EMAIL || process.env.CONTACT_EMAIL
                    }
                });
                console.log('✅ Feedback system initialized');
            }
        } catch (error) {
            console.warn('⚠️ Feedback system initialization failed:', error.message);
            this.feedbackSystem = null;
        }

        try {
            if (this.config.monitoringEnabled) {
                this.performanceMonitor = new PerformanceMonitor({
                    responseTimeThreshold: 2000,
                    errorRateThreshold: 0.05,
                    memoryThreshold: 0.85,
                    webhookUrl: process.env.MONITORING_WEBHOOK_URL
                });
                console.log('✅ Performance monitoring initialized');
            }
        } catch (error) {
            console.warn('⚠️ Performance monitoring initialization failed:', error.message);
            this.performanceMonitor = null;
        }

        try {
            if (this.config.supportEnabled) {
                this.supportSystem = new SupportSystem({
                    supportEmail: process.env.SUPPORT_EMAIL || process.env.CONTACT_EMAIL,
                    escalationEmail: process.env.ESCALATION_EMAIL || process.env.CONTACT_EMAIL,
                    email: {
                        host: process.env.SMTP_HOST,
                        port: process.env.SMTP_PORT,
                        user: process.env.SMTP_USER,
                        password: process.env.SMTP_PASS
                    }
                });
                console.log('✅ Support system initialized');
            }
        } catch (error) {
            console.warn('⚠️ Support system initialization failed:', error.message);
            this.supportSystem = null;
        }

        console.log(`🚀 Launch Controller initialized for ${this.config.launchPhase} phase`);
    }

    /**
     * Start launch monitoring
     */
    startLaunchMonitoring() {
        // Monitor launch metrics every 5 minutes
        setInterval(() => {
            this.updateLaunchMetrics();
        }, 5 * 60 * 1000);

        // Check for launch phase progression every hour
        setInterval(() => {
            this.checkPhaseProgression();
        }, 60 * 60 * 1000);

        // Generate launch reports daily
        setInterval(() => {
            this.generateLaunchReport();
        }, 24 * 60 * 60 * 1000);

        console.log('🔍 Launch monitoring started');
    }

    /**
     * Handle feature flag check with user context
     */
    checkFeatureFlag(flagName, userContext = {}) {
        return featureFlagsManager.isFeatureEnabled(flagName, userContext);
    }

    /**
     * Record user feedback
     */
    async recordFeedback(feedbackData) {
        if (!this.feedbackSystem) {
            throw new Error('Feedback system not initialized');
        }

        const result = await this.feedbackSystem.collectFeedback(feedbackData);
        
        // Update launch metrics
        this.updateUserSatisfactionMetrics();
        
        return result;
    }

    /**
     * Report technical issue
     */
    async reportIssue(issueData) {
        if (!this.feedbackSystem) {
            throw new Error('Feedback system not initialized');
        }

        const result = await this.feedbackSystem.reportIssue(issueData);
        
        // Update critical issues count
        if (issueData.severity === 'critical') {
            this.launchStatus.criticalIssues++;
        }
        
        return result;
    }

    /**
     * Record performance metric
     */
    recordPerformanceMetric(metricType, data) {
        if (!this.performanceMonitor) {
            console.warn('Performance monitor not initialized');
            return;
        }

        this.performanceMonitor.recordUserMetric(metricType, data);
    }

    /**
     * Record API response time
     */
    recordApiResponse(endpoint, duration, statusCode) {
        if (!this.performanceMonitor) {
            return;
        }

        this.performanceMonitor.recordResponseTime(endpoint, duration, statusCode);
    }

    /**
     * Record assessment metrics
     */
    recordAssessmentMetrics(assessmentData) {
        if (!this.performanceMonitor) {
            return;
        }

        this.performanceMonitor.recordAssessmentMetrics(assessmentData);
    }

    /**
     * Create support ticket
     */
    async createSupportTicket(ticketData) {
        if (!this.supportSystem) {
            throw new Error('Support system not initialized');
        }

        return await this.supportSystem.createSupportTicket(ticketData);
    }

    /**
     * Update launch metrics
     */
    updateLaunchMetrics() {
        try {
            // Get performance data
            const performanceData = this.performanceMonitor ? 
                this.performanceMonitor.getDashboardData('1h') : null;

            // Get feedback stats
            const feedbackStats = this.feedbackSystem ? 
                this.feedbackSystem.getFeedbackStats('24h') : null;

            // Get support stats
            const supportStats = this.supportSystem ? 
                this.supportSystem.getSupportDashboard() : null;

            // Update launch status
            this.launchStatus = {
                ...this.launchStatus,
                lastUpdated: new Date(),
                systemHealth: this.calculateSystemHealth(performanceData, supportStats),
                userSatisfaction: feedbackStats ? parseFloat(feedbackStats.averageRating) : 0,
                criticalIssues: supportStats ? supportStats.ticketStats.overdue : 0,
                performanceScore: this.calculatePerformanceScore(performanceData),
                feedbackScore: this.calculateFeedbackScore(feedbackStats)
            };

            // Check for launch issues
            this.checkLaunchHealth();

        } catch (error) {
            console.error('Error updating launch metrics:', error);
        }
    }

    /**
     * Calculate system health status
     */
    calculateSystemHealth(performanceData, supportStats) {
        if (!performanceData && !supportStats) {
            return 'unknown';
        }

        let healthScore = 100;

        // Performance factors
        if (performanceData) {
            const { systemMetrics, alerts } = performanceData;
            
            // Response time impact
            if (systemMetrics.responseTime.avg > 2000) {
                healthScore -= 20;
            } else if (systemMetrics.responseTime.avg > 1000) {
                healthScore -= 10;
            }

            // Error rate impact
            if (systemMetrics.errorRate.rate > 0.05) {
                healthScore -= 30;
            } else if (systemMetrics.errorRate.rate > 0.02) {
                healthScore -= 15;
            }

            // Memory usage impact
            if (systemMetrics.memoryUsage.avg > 0.9) {
                healthScore -= 25;
            } else if (systemMetrics.memoryUsage.avg > 0.8) {
                healthScore -= 10;
            }

            // Active alerts impact
            const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
            healthScore -= criticalAlerts * 20;
        }

        // Support factors
        if (supportStats) {
            const { ticketStats } = supportStats;
            
            // Overdue tickets impact
            if (ticketStats.overdue > 5) {
                healthScore -= 20;
            } else if (ticketStats.overdue > 2) {
                healthScore -= 10;
            }
        }

        // Determine health status
        if (healthScore >= 90) return 'excellent';
        if (healthScore >= 75) return 'healthy';
        if (healthScore >= 60) return 'warning';
        if (healthScore >= 40) return 'degraded';
        return 'critical';
    }

    /**
     * Calculate performance score
     */
    calculatePerformanceScore(performanceData) {
        if (!performanceData) return 0;

        const { systemMetrics, userExperience } = performanceData;
        let score = 100;

        // System performance factors
        if (systemMetrics.responseTime.avg > 3000) score -= 30;
        else if (systemMetrics.responseTime.avg > 2000) score -= 20;
        else if (systemMetrics.responseTime.avg > 1000) score -= 10;

        if (systemMetrics.errorRate.rate > 0.1) score -= 40;
        else if (systemMetrics.errorRate.rate > 0.05) score -= 25;
        else if (systemMetrics.errorRate.rate > 0.02) score -= 10;

        // User experience factors
        if (userExperience.assessmentCompletion.completionRate < 0.5) score -= 30;
        else if (userExperience.assessmentCompletion.completionRate < 0.7) score -= 15;

        return Math.max(0, score);
    }

    /**
     * Calculate feedback score
     */
    calculateFeedbackScore(feedbackStats) {
        if (!feedbackStats) return 0;

        const avgRating = parseFloat(feedbackStats.averageRating) || 0;
        const sentimentDistribution = feedbackStats.sentimentDistribution || {};
        
        // Base score from average rating (0-5 scale converted to 0-100)
        let score = (avgRating / 5) * 100;

        // Adjust based on sentiment distribution
        const positive = sentimentDistribution.positive || 0;
        const negative = sentimentDistribution.negative || 0;
        const total = positive + negative + (sentimentDistribution.neutral || 0);

        if (total > 0) {
            const positiveRatio = positive / total;
            const negativeRatio = negative / total;
            
            // Boost for high positive sentiment
            if (positiveRatio > 0.7) score += 10;
            else if (positiveRatio > 0.5) score += 5;
            
            // Penalty for high negative sentiment
            if (negativeRatio > 0.3) score -= 15;
            else if (negativeRatio > 0.2) score -= 10;
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Check launch health and trigger alerts if needed
     */
    checkLaunchHealth() {
        const { systemHealth, criticalIssues, userSatisfaction, performanceScore } = this.launchStatus;

        // Critical system health
        if (systemHealth === 'critical') {
            this.triggerLaunchAlert('critical_system_health', {
                systemHealth,
                performanceScore,
                criticalIssues
            });
        }

        // Too many critical issues
        if (criticalIssues > 3) {
            this.triggerLaunchAlert('high_critical_issues', {
                criticalIssues,
                threshold: 3
            });
        }

        // Low user satisfaction
        if (userSatisfaction > 0 && userSatisfaction < 3.0) {
            this.triggerLaunchAlert('low_user_satisfaction', {
                userSatisfaction,
                threshold: 3.0
            });
        }

        // Poor performance
        if (performanceScore < 60) {
            this.triggerLaunchAlert('poor_performance', {
                performanceScore,
                threshold: 60
            });
        }
    }

    /**
     * Trigger launch alert
     */
    async triggerLaunchAlert(alertType, data) {
        const alert = {
            type: alertType,
            timestamp: new Date(),
            data,
            severity: this.getAlertSeverity(alertType),
            launchPhase: this.launchStatus.phase
        };

        console.warn(`🚨 LAUNCH ALERT [${alertType}]:`, data);

        // Send alert notification
        await this.sendLaunchAlert(alert);

        // Consider rollback for critical alerts
        if (alert.severity === 'critical') {
            await this.considerRollback(alert);
        }
    }

    /**
     * Send launch alert notification
     */
    async sendLaunchAlert(alert) {
        const message = this.formatLaunchAlert(alert);
        
        // This would integrate with notification systems
        console.log(`LAUNCH ALERT NOTIFICATION: ${message}`);
        
        // Could send to Slack, email, PagerDuty, etc.
        if (process.env.LAUNCH_WEBHOOK_URL) {
            try {
                await fetch(process.env.LAUNCH_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: message,
                        alert: alert,
                        launchStatus: this.launchStatus
                    })
                });
            } catch (error) {
                console.error('Error sending launch alert webhook:', error);
            }
        }
    }

    /**
     * Format launch alert message
     */
    formatLaunchAlert(alert) {
        const { type, data, severity, launchPhase } = alert;
        
        switch (type) {
            case 'critical_system_health':
                return `🔥 CRITICAL: System health is ${data.systemHealth} during ${launchPhase} phase. Performance score: ${data.performanceScore}`;
            case 'high_critical_issues':
                return `🚨 HIGH CRITICAL ISSUES: ${data.criticalIssues} critical issues detected (threshold: ${data.threshold})`;
            case 'low_user_satisfaction':
                return `😞 LOW USER SATISFACTION: Rating is ${data.userSatisfaction}/5 (threshold: ${data.threshold})`;
            case 'poor_performance':
                return `⚡ POOR PERFORMANCE: Performance score is ${data.performanceScore} (threshold: ${data.threshold})`;
            default:
                return `Launch Alert: ${type} - ${JSON.stringify(data)}`;
        }
    }

    /**
     * Get alert severity
     */
    getAlertSeverity(alertType) {
        const severityMap = {
            'critical_system_health': 'critical',
            'high_critical_issues': 'high',
            'low_user_satisfaction': 'medium',
            'poor_performance': 'medium'
        };
        
        return severityMap[alertType] || 'low';
    }

    /**
     * Consider rollback for critical issues
     */
    async considerRollback(alert) {
        // This would implement rollback logic based on alert severity and type
        console.warn(`Considering rollback due to critical alert: ${alert.type}`);
        
        // For now, just log the consideration
        // In production, this might trigger automated rollback procedures
        // or alert the operations team for manual intervention
    }

    /**
     * Check for launch phase progression
     */
    checkPhaseProgression() {
        const { phase, systemHealth, userSatisfaction, performanceScore } = this.launchStatus;
        
        // Define progression criteria
        const progressionCriteria = {
            'beta': {
                nextPhase: 'soft-launch',
                requirements: {
                    systemHealth: ['healthy', 'excellent'],
                    userSatisfaction: 3.5,
                    performanceScore: 70,
                    minRuntime: 7 * 24 * 60 * 60 * 1000 // 7 days
                }
            },
            'soft-launch': {
                nextPhase: 'full-launch',
                requirements: {
                    systemHealth: ['healthy', 'excellent'],
                    userSatisfaction: 4.0,
                    performanceScore: 80,
                    minRuntime: 14 * 24 * 60 * 60 * 1000 // 14 days
                }
            }
        };

        const currentCriteria = progressionCriteria[phase];
        if (!currentCriteria) return;

        const runtime = Date.now() - this.launchStatus.startTime.getTime();
        const meetsRequirements = 
            currentCriteria.requirements.systemHealth.includes(systemHealth) &&
            userSatisfaction >= currentCriteria.requirements.userSatisfaction &&
            performanceScore >= currentCriteria.requirements.performanceScore &&
            runtime >= currentCriteria.requirements.minRuntime;

        if (meetsRequirements) {
            this.progressToNextPhase(currentCriteria.nextPhase);
        }
    }

    /**
     * Progress to next launch phase
     */
    async progressToNextPhase(nextPhase) {
        console.log(`🎯 Progressing from ${this.launchStatus.phase} to ${nextPhase}`);
        
        this.launchStatus.phase = nextPhase;
        this.launchStatus.phaseStartTime = new Date();
        
        // Update feature flag rollouts for new phase
        await this.updateFeatureFlagsForPhase(nextPhase);
        
        // Send progression notification
        await this.sendPhaseProgressionNotification(nextPhase);
        
        // Generate progression report
        await this.generatePhaseProgressionReport(nextPhase);
    }

    /**
     * Update feature flags for new phase
     */
    async updateFeatureFlagsForPhase(phase) {
        const phaseRollouts = {
            'beta': {
                'multi_modal_assessments': 25,
                'adaptive_curriculum': 10,
                'cultural_sensitivity': 50
            },
            'soft-launch': {
                'multi_modal_assessments': 75,
                'adaptive_curriculum': 50,
                'cultural_sensitivity': 100,
                'ai_powered_recommendations': 25
            },
            'full-launch': {
                'multi_modal_assessments': 100,
                'adaptive_curriculum': 100,
                'cultural_sensitivity': 100,
                'ai_powered_recommendations': 75,
                'collaborative_assessments': 25
            }
        };

        const rollouts = phaseRollouts[phase];
        if (!rollouts) return;

        for (const [flagName, percentage] of Object.entries(rollouts)) {
            try {
                featureFlagsManager.updateFlag(flagName, { rolloutPercentage: percentage });
                console.log(`Updated ${flagName} rollout to ${percentage}% for ${phase} phase`);
            } catch (error) {
                console.error(`Error updating feature flag ${flagName}:`, error);
            }
        }
    }

    /**
     * Send phase progression notification
     */
    async sendPhaseProgressionNotification(nextPhase) {
        const message = `🚀 LAUNCH PHASE PROGRESSION: Successfully progressed to ${nextPhase} phase!`;
        console.log(message);
        
        // This would send to team notification channels
        if (process.env.LAUNCH_WEBHOOK_URL) {
            try {
                await fetch(process.env.LAUNCH_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: message,
                        phase: nextPhase,
                        launchStatus: this.launchStatus
                    })
                });
            } catch (error) {
                console.error('Error sending phase progression notification:', error);
            }
        }
    }

    /**
     * Generate launch report
     */
    async generateLaunchReport() {
        const report = {
            timestamp: new Date(),
            launchStatus: this.launchStatus,
            performanceMetrics: this.performanceMonitor ? 
                this.performanceMonitor.getDashboardData('24h') : null,
            feedbackSummary: this.feedbackSystem ? 
                this.feedbackSystem.getFeedbackStats('24h') : null,
            supportSummary: this.supportSystem ? 
                this.supportSystem.getSupportDashboard() : null,
            featureFlags: featureFlagsManager.getAllFlags(),
            recommendations: this.generateRecommendations()
        };

        console.log('📊 Daily Launch Report Generated:', {
            phase: report.launchStatus.phase,
            systemHealth: report.launchStatus.systemHealth,
            userSatisfaction: report.launchStatus.userSatisfaction,
            performanceScore: report.launchStatus.performanceScore
        });

        // This would save the report and/or send it to stakeholders
        return report;
    }

    /**
     * Generate phase progression report
     */
    async generatePhaseProgressionReport(nextPhase) {
        const report = await this.generateLaunchReport();
        report.progressionEvent = {
            fromPhase: this.launchStatus.phase,
            toPhase: nextPhase,
            progressionTime: new Date(),
            criteria: 'All progression requirements met'
        };

        console.log('📈 Phase Progression Report Generated');
        return report;
    }

    /**
     * Generate recommendations based on current metrics
     */
    generateRecommendations() {
        const recommendations = [];
        const { systemHealth, userSatisfaction, performanceScore, criticalIssues } = this.launchStatus;

        // Performance recommendations
        if (performanceScore < 80) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                message: 'Consider optimizing response times and reducing error rates',
                actions: ['Review slow API endpoints', 'Optimize database queries', 'Implement caching']
            });
        }

        // User satisfaction recommendations
        if (userSatisfaction > 0 && userSatisfaction < 4.0) {
            recommendations.push({
                type: 'user_experience',
                priority: 'medium',
                message: 'Focus on improving user satisfaction scores',
                actions: ['Analyze user feedback', 'Improve assessment UX', 'Enhance support response times']
            });
        }

        // System health recommendations
        if (systemHealth === 'warning' || systemHealth === 'degraded') {
            recommendations.push({
                type: 'system_health',
                priority: 'high',
                message: 'Address system health issues to prevent degradation',
                actions: ['Monitor resource usage', 'Scale infrastructure', 'Review error logs']
            });
        }

        // Support recommendations
        if (criticalIssues > 1) {
            recommendations.push({
                type: 'support',
                priority: 'high',
                message: 'Reduce critical support issues',
                actions: ['Prioritize critical tickets', 'Improve documentation', 'Enhance error handling']
            });
        }

        return recommendations;
    }

    /**
     * Get launch dashboard data
     */
    getLaunchDashboard() {
        return {
            launchStatus: this.launchStatus,
            featureFlags: featureFlagsManager.getAllFlags(),
            performanceMetrics: this.performanceMonitor ? 
                this.performanceMonitor.getDashboardData('24h') : null,
            feedbackSummary: this.feedbackSystem ? 
                this.feedbackSystem.getFeedbackStats('24h') : null,
            supportSummary: this.supportSystem ? 
                this.supportSystem.getSupportDashboard() : null,
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * Update user satisfaction metrics
     */
    updateUserSatisfactionMetrics() {
        if (!this.feedbackSystem) return;
        
        const feedbackStats = this.feedbackSystem.getFeedbackStats('24h');
        this.launchStatus.userSatisfaction = parseFloat(feedbackStats.averageRating) || 0;
    }
}

module.exports = { LaunchController };