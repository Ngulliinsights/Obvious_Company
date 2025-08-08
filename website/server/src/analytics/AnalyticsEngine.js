/**
 * Comprehensive Analytics Engine for AI Integration Assessment Platform
 * Tracks user behavior, assessment performance, and provides real-time insights
 */

class AnalyticsEngine {
    constructor() {
        this.events = [];
        this.sessions = new Map();
        this.assessmentMetrics = new Map();
        this.performanceMetrics = {
            completionRates: new Map(),
            engagementMetrics: new Map(),
            abandonmentPoints: new Map(),
            accuracyMeasurements: new Map()
        };
        this.realTimeData = {
            activeUsers: 0,
            currentAssessments: 0,
            completionsToday: 0,
            averageEngagementTime: 0
        };
    }

    /**
     * Track user behavior events
     */
    trackEvent(eventType, eventData, sessionId = null) {
        const event = {
            id: this.generateEventId(),
            type: eventType,
            data: eventData,
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            userAgent: eventData.userAgent || null,
            ipAddress: this.hashIP(eventData.ipAddress || ''),
            referrer: eventData.referrer || null
        };

        this.events.push(event);
        this.updateRealTimeMetrics(event);
        
        // Process specific event types
        switch (eventType) {
            case 'assessment_started':
                this.trackAssessmentStart(event);
                break;
            case 'assessment_completed':
                this.trackAssessmentCompletion(event);
                break;
            case 'assessment_abandoned':
                this.trackAssessmentAbandonment(event);
                break;
            case 'question_answered':
                this.trackQuestionResponse(event);
                break;
            case 'page_view':
                this.trackPageView(event);
                break;
            case 'user_engagement':
                this.trackUserEngagement(event);
                break;
        }

        return event.id;
    }

    /**
     * Track assessment start
     */
    trackAssessmentStart(event) {
        const { assessmentType, userId, sessionId } = event.data;
        
        if (!this.assessmentMetrics.has(assessmentType)) {
            this.assessmentMetrics.set(assessmentType, {
                started: 0,
                completed: 0,
                abandoned: 0,
                averageTime: 0,
                questionMetrics: new Map()
            });
        }

        const metrics = this.assessmentMetrics.get(assessmentType);
        metrics.started++;

        // Track session
        this.sessions.set(sessionId, {
            assessmentType,
            userId,
            startTime: new Date(),
            currentQuestion: 0,
            responses: [],
            engagementEvents: [],
            status: 'in_progress'
        });

        this.realTimeData.currentAssessments++;
    }

    /**
     * Track assessment completion
     */
    trackAssessmentCompletion(event) {
        const { assessmentType, sessionId, completionTime, results } = event.data;
        
        const metrics = this.assessmentMetrics.get(assessmentType);
        if (metrics) {
            metrics.completed++;
            
            // Calculate completion rate
            const completionRate = (metrics.completed / metrics.started) * 100;
            this.performanceMetrics.completionRates.set(assessmentType, completionRate);
        }

        // Update session
        const session = this.sessions.get(sessionId);
        if (session) {
            session.status = 'completed';
            session.endTime = new Date();
            session.duration = session.endTime - session.startTime;
            session.results = results;

            // Update average completion time
            if (metrics) {
                const totalTime = (metrics.averageTime * (metrics.completed - 1)) + session.duration;
                metrics.averageTime = totalTime / metrics.completed;
            }
        }

        this.realTimeData.currentAssessments--;
        this.realTimeData.completionsToday++;
    }

    /**
     * Track assessment abandonment
     */
    trackAssessmentAbandonment(event) {
        const { assessmentType, sessionId, abandonmentPoint, timeSpent } = event.data;
        
        const metrics = this.assessmentMetrics.get(assessmentType);
        if (metrics) {
            metrics.abandoned++;
        }

        // Track abandonment points
        if (!this.performanceMetrics.abandonmentPoints.has(assessmentType)) {
            this.performanceMetrics.abandonmentPoints.set(assessmentType, new Map());
        }
        
        const abandonmentPoints = this.performanceMetrics.abandonmentPoints.get(assessmentType);
        const currentCount = abandonmentPoints.get(abandonmentPoint) || 0;
        abandonmentPoints.set(abandonmentPoint, currentCount + 1);

        // Update session
        const session = this.sessions.get(sessionId);
        if (session) {
            session.status = 'abandoned';
            session.endTime = new Date();
            session.duration = timeSpent;
            session.abandonmentPoint = abandonmentPoint;
        }

        this.realTimeData.currentAssessments--;
    }

    /**
     * Track individual question responses
     */
    trackQuestionResponse(event) {
        const { sessionId, questionId, responseTime, questionType, response } = event.data;
        
        const session = this.sessions.get(sessionId);
        if (session) {
            session.responses.push({
                questionId,
                responseTime,
                questionType,
                response: this.sanitizeResponse(response),
                timestamp: new Date()
            });

            session.currentQuestion++;

            // Track question-level metrics
            const assessmentType = session.assessmentType;
            const metrics = this.assessmentMetrics.get(assessmentType);
            if (metrics) {
                if (!metrics.questionMetrics.has(questionId)) {
                    metrics.questionMetrics.set(questionId, {
                        responses: 0,
                        averageTime: 0,
                        abandonmentRate: 0
                    });
                }

                const questionMetrics = metrics.questionMetrics.get(questionId);
                questionMetrics.responses++;
                
                // Update average response time
                const totalTime = (questionMetrics.averageTime * (questionMetrics.responses - 1)) + responseTime;
                questionMetrics.averageTime = totalTime / questionMetrics.responses;
            }
        }
    }

    /**
     * Track page views and navigation
     */
    trackPageView(event) {
        const { page, referrer, timeOnPage } = event.data;
        
        // Update engagement metrics
        if (!this.performanceMetrics.engagementMetrics.has(page)) {
            this.performanceMetrics.engagementMetrics.set(page, {
                views: 0,
                averageTimeOnPage: 0,
                bounceRate: 0,
                conversionRate: 0
            });
        }

        const pageMetrics = this.performanceMetrics.engagementMetrics.get(page);
        pageMetrics.views++;

        if (timeOnPage) {
            const totalTime = (pageMetrics.averageTimeOnPage * (pageMetrics.views - 1)) + timeOnPage;
            pageMetrics.averageTimeOnPage = totalTime / pageMetrics.views;
        }
    }

    /**
     * Track user engagement events
     */
    trackUserEngagement(event) {
        const { sessionId, engagementType, duration, interactionData } = event.data;
        
        const session = this.sessions.get(sessionId);
        if (session) {
            session.engagementEvents.push({
                type: engagementType,
                duration,
                data: interactionData,
                timestamp: new Date()
            });
        }

        // Update real-time engagement metrics
        this.updateEngagementMetrics(engagementType, duration);
    }

    /**
     * Get completion rates by assessment type
     */
    getCompletionRates(timeframe = '24h') {
        const rates = {};
        
        for (const [assessmentType, rate] of this.performanceMetrics.completionRates) {
            rates[assessmentType] = {
                rate: rate,
                trend: this.calculateTrend(assessmentType, 'completion', timeframe)
            };
        }

        return rates;
    }

    /**
     * Get engagement metrics
     */
    getEngagementMetrics(timeframe = '24h') {
        const metrics = {};
        
        for (const [page, data] of this.performanceMetrics.engagementMetrics) {
            metrics[page] = {
                ...data,
                trend: this.calculateTrend(page, 'engagement', timeframe)
            };
        }

        return metrics;
    }

    /**
     * Get abandonment analysis
     */
    getAbandonmentAnalysis(assessmentType = null) {
        const analysis = {};
        
        const abandonmentData = assessmentType 
            ? new Map([[assessmentType, this.performanceMetrics.abandonmentPoints.get(assessmentType)]])
            : this.performanceMetrics.abandonmentPoints;

        for (const [type, points] of abandonmentData) {
            if (!points) continue;
            
            const totalAbandoned = Array.from(points.values()).reduce((sum, count) => sum + count, 0);
            const sortedPoints = Array.from(points.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5); // Top 5 abandonment points

            analysis[type] = {
                totalAbandoned,
                topAbandonmentPoints: sortedPoints.map(([point, count]) => ({
                    point,
                    count,
                    percentage: (count / totalAbandoned) * 100
                }))
            };
        }

        return analysis;
    }

    /**
     * Get assessment accuracy measurements
     */
    getAssessmentAccuracy(assessmentType = null) {
        const accuracy = {};
        
        // This would typically involve follow-up surveys and outcome tracking
        // For now, we'll return placeholder structure
        const assessmentTypes = assessmentType ? [assessmentType] : Array.from(this.assessmentMetrics.keys());
        
        for (const type of assessmentTypes) {
            accuracy[type] = {
                predictiveAccuracy: this.calculatePredictiveAccuracy(type),
                userSatisfaction: this.calculateUserSatisfaction(type),
                outcomeCorrelation: this.calculateOutcomeCorrelation(type),
                followUpResponseRate: this.calculateFollowUpResponseRate(type)
            };
        }

        return accuracy;
    }

    /**
     * Get real-time dashboard data
     */
    getRealTimeDashboard() {
        return {
            ...this.realTimeData,
            recentEvents: this.getRecentEvents(50),
            activeAssessments: this.getActiveAssessments(),
            performanceAlerts: this.getPerformanceAlerts(),
            topPerformingAssessments: this.getTopPerformingAssessments(),
            conversionFunnel: this.getConversionFunnel()
        };
    }

    /**
     * Generate performance report
     */
    generatePerformanceReport(timeframe = '7d', assessmentType = null) {
        const report = {
            timeframe,
            assessmentType,
            generatedAt: new Date().toISOString(),
            summary: {
                totalAssessments: this.getTotalAssessments(timeframe, assessmentType),
                completionRate: this.getAverageCompletionRate(timeframe, assessmentType),
                averageEngagementTime: this.getAverageEngagementTime(timeframe, assessmentType),
                userSatisfaction: this.getAverageUserSatisfaction(timeframe, assessmentType)
            },
            detailed: {
                completionRates: this.getCompletionRates(timeframe),
                engagementMetrics: this.getEngagementMetrics(timeframe),
                abandonmentAnalysis: this.getAbandonmentAnalysis(assessmentType),
                accuracyMeasurements: this.getAssessmentAccuracy(assessmentType),
                userBehaviorPatterns: this.getUserBehaviorPatterns(timeframe),
                conversionMetrics: this.getConversionMetrics(timeframe)
            },
            recommendations: this.generateOptimizationRecommendations(timeframe, assessmentType)
        };

        return report;
    }

    /**
     * Helper methods
     */
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    hashIP(ip) {
        // Simple hash for privacy - in production, use proper hashing
        return ip ? `hashed_${ip.split('.').map(n => parseInt(n) * 7).join('_')}` : null;
    }

    sanitizeResponse(response) {
        // Remove PII and sensitive data from responses
        if (typeof response === 'object') {
            const sanitized = { ...response };
            delete sanitized.email;
            delete sanitized.phone;
            delete sanitized.personalInfo;
            return sanitized;
        }
        return response;
    }

    updateRealTimeMetrics(event) {
        // Update active users count (simplified)
        if (event.type === 'session_start') {
            this.realTimeData.activeUsers++;
        } else if (event.type === 'session_end') {
            this.realTimeData.activeUsers = Math.max(0, this.realTimeData.activeUsers - 1);
        }

        // Update average engagement time
        if (event.type === 'user_engagement' && event.data.duration) {
            const currentAvg = this.realTimeData.averageEngagementTime;
            const newDuration = event.data.duration;
            this.realTimeData.averageEngagementTime = (currentAvg + newDuration) / 2;
        }
    }

    updateEngagementMetrics(engagementType, duration) {
        // Update engagement metrics based on interaction type
        const metrics = this.performanceMetrics.engagementMetrics;
        
        if (!metrics.has('overall_engagement')) {
            metrics.set('overall_engagement', {
                totalInteractions: 0,
                averageDuration: 0,
                engagementScore: 0
            });
        }

        const overallMetrics = metrics.get('overall_engagement');
        overallMetrics.totalInteractions++;
        
        const totalDuration = (overallMetrics.averageDuration * (overallMetrics.totalInteractions - 1)) + duration;
        overallMetrics.averageDuration = totalDuration / overallMetrics.totalInteractions;
        
        // Calculate engagement score (0-100)
        overallMetrics.engagementScore = Math.min(100, (overallMetrics.averageDuration / 1000) * 10);
    }

    calculateTrend(identifier, metricType, timeframe) {
        // Simplified trend calculation - in production, use proper time series analysis
        const recentEvents = this.events.filter(event => {
            const eventTime = new Date(event.timestamp);
            const cutoff = new Date(Date.now() - this.parseTimeframe(timeframe));
            return eventTime >= cutoff;
        });

        const relevantEvents = recentEvents.filter(event => {
            if (metricType === 'completion') {
                return event.type === 'assessment_completed' && 
                       event.data.assessmentType === identifier;
            } else if (metricType === 'engagement') {
                return event.type === 'page_view' && 
                       event.data.page === identifier;
            }
            return false;
        });

        // Simple trend: positive if more events in second half than first half
        const midpoint = Date.now() - (this.parseTimeframe(timeframe) / 2);
        const firstHalf = relevantEvents.filter(e => new Date(e.timestamp) < new Date(midpoint)).length;
        const secondHalf = relevantEvents.filter(e => new Date(e.timestamp) >= new Date(midpoint)).length;

        if (firstHalf === 0 && secondHalf === 0) return 'stable';
        if (firstHalf === 0) return 'up';
        
        const change = ((secondHalf - firstHalf) / firstHalf) * 100;
        if (change > 10) return 'up';
        if (change < -10) return 'down';
        return 'stable';
    }

    parseTimeframe(timeframe) {
        const unit = timeframe.slice(-1);
        const value = parseInt(timeframe.slice(0, -1));
        
        switch (unit) {
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            case 'w': return value * 7 * 24 * 60 * 60 * 1000;
            default: return 24 * 60 * 60 * 1000; // Default to 24 hours
        }
    }

    getRecentEvents(limit = 50) {
        return this.events
            .slice(-limit)
            .reverse()
            .map(event => ({
                id: event.id,
                type: event.type,
                timestamp: event.timestamp,
                summary: this.generateEventSummary(event)
            }));
    }

    generateEventSummary(event) {
        switch (event.type) {
            case 'assessment_started':
                return `Assessment started: ${event.data.assessmentType}`;
            case 'assessment_completed':
                return `Assessment completed: ${event.data.assessmentType} (${event.data.completionTime}ms)`;
            case 'assessment_abandoned':
                return `Assessment abandoned: ${event.data.assessmentType} at ${event.data.abandonmentPoint}`;
            case 'question_answered':
                return `Question answered: ${event.data.questionId} (${event.data.responseTime}ms)`;
            case 'page_view':
                return `Page viewed: ${event.data.page}`;
            default:
                return `${event.type}: ${JSON.stringify(event.data).substring(0, 50)}...`;
        }
    }

    getActiveAssessments() {
        const active = [];
        for (const [sessionId, session] of this.sessions) {
            if (session.status === 'in_progress') {
                active.push({
                    sessionId,
                    assessmentType: session.assessmentType,
                    startTime: session.startTime,
                    currentQuestion: session.currentQuestion,
                    duration: Date.now() - session.startTime.getTime()
                });
            }
        }
        return active;
    }

    getPerformanceAlerts() {
        const alerts = [];
        
        // Check for low completion rates
        for (const [assessmentType, rate] of this.performanceMetrics.completionRates) {
            if (rate < 70) {
                alerts.push({
                    type: 'warning',
                    category: 'completion_rate',
                    message: `Low completion rate for ${assessmentType}: ${rate.toFixed(1)}%`,
                    assessmentType,
                    value: rate,
                    threshold: 70
                });
            }
        }

        // Check for high abandonment at specific points
        for (const [assessmentType, points] of this.performanceMetrics.abandonmentPoints) {
            for (const [point, count] of points) {
                const metrics = this.assessmentMetrics.get(assessmentType);
                if (metrics && count > (metrics.started * 0.2)) {
                    alerts.push({
                        type: 'error',
                        category: 'high_abandonment',
                        message: `High abandonment at ${point} for ${assessmentType}: ${count} users`,
                        assessmentType,
                        abandonmentPoint: point,
                        count
                    });
                }
            }
        }

        return alerts;
    }

    getTopPerformingAssessments() {
        const performance = [];
        
        for (const [assessmentType, metrics] of this.assessmentMetrics) {
            const completionRate = this.performanceMetrics.completionRates.get(assessmentType) || 0;
            const engagementScore = this.calculateEngagementScore(assessmentType);
            
            performance.push({
                assessmentType,
                completionRate,
                engagementScore,
                totalStarted: metrics.started,
                totalCompleted: metrics.completed,
                averageTime: metrics.averageTime,
                overallScore: (completionRate + engagementScore) / 2
            });
        }

        return performance
            .sort((a, b) => b.overallScore - a.overallScore)
            .slice(0, 5);
    }

    getConversionFunnel() {
        // Simplified conversion funnel
        const totalVisitors = this.events.filter(e => e.type === 'page_view').length;
        const assessmentStarts = this.events.filter(e => e.type === 'assessment_started').length;
        const assessmentCompletions = this.events.filter(e => e.type === 'assessment_completed').length;
        const leadCaptures = this.events.filter(e => e.type === 'lead_captured').length;
        const consultationScheduled = this.events.filter(e => e.type === 'consultation_scheduled').length;

        return {
            visitors: totalVisitors,
            assessmentStarts,
            assessmentCompletions,
            leadCaptures,
            consultationScheduled,
            conversionRates: {
                visitorToAssessment: totalVisitors > 0 ? (assessmentStarts / totalVisitors) * 100 : 0,
                assessmentCompletion: assessmentStarts > 0 ? (assessmentCompletions / assessmentStarts) * 100 : 0,
                completionToLead: assessmentCompletions > 0 ? (leadCaptures / assessmentCompletions) * 100 : 0,
                leadToConsultation: leadCaptures > 0 ? (consultationScheduled / leadCaptures) * 100 : 0
            }
        };
    }

    // Placeholder methods for complex calculations
    calculatePredictiveAccuracy(assessmentType) {
        // Would involve follow-up surveys and outcome tracking
        return Math.random() * 20 + 75; // Placeholder: 75-95%
    }

    calculateUserSatisfaction(assessmentType) {
        // Would involve user feedback and ratings
        return Math.random() * 1 + 4; // Placeholder: 4-5 stars
    }

    calculateOutcomeCorrelation(assessmentType) {
        // Would involve tracking actual implementation success
        return Math.random() * 0.3 + 0.6; // Placeholder: 0.6-0.9 correlation
    }

    calculateFollowUpResponseRate(assessmentType) {
        // Would track follow-up survey responses
        return Math.random() * 30 + 40; // Placeholder: 40-70%
    }

    calculateEngagementScore(assessmentType) {
        // Calculate based on time spent, interactions, etc.
        const sessions = Array.from(this.sessions.values())
            .filter(s => s.assessmentType === assessmentType);
        
        if (sessions.length === 0) return 0;
        
        const avgEngagementEvents = sessions.reduce((sum, s) => sum + s.engagementEvents.length, 0) / sessions.length;
        return Math.min(100, avgEngagementEvents * 10);
    }

    getTotalAssessments(timeframe, assessmentType) {
        const cutoff = new Date(Date.now() - this.parseTimeframe(timeframe));
        return this.events.filter(event => {
            const eventTime = new Date(event.timestamp);
            return eventTime >= cutoff && 
                   event.type === 'assessment_started' &&
                   (!assessmentType || event.data.assessmentType === assessmentType);
        }).length;
    }

    getAverageCompletionRate(timeframe, assessmentType) {
        const rates = Array.from(this.performanceMetrics.completionRates.entries());
        const filteredRates = assessmentType 
            ? rates.filter(([type]) => type === assessmentType)
            : rates;
        
        if (filteredRates.length === 0) return 0;
        
        const sum = filteredRates.reduce((total, [, rate]) => total + rate, 0);
        return sum / filteredRates.length;
    }

    getAverageEngagementTime(timeframe, assessmentType) {
        const sessions = Array.from(this.sessions.values());
        const filteredSessions = assessmentType 
            ? sessions.filter(s => s.assessmentType === assessmentType)
            : sessions;
        
        if (filteredSessions.length === 0) return 0;
        
        const totalTime = filteredSessions.reduce((sum, session) => {
            return sum + (session.duration || 0);
        }, 0);
        
        return totalTime / filteredSessions.length;
    }

    getAverageUserSatisfaction(timeframe, assessmentType) {
        // Placeholder - would integrate with actual satisfaction surveys
        return Math.random() * 1 + 4; // 4-5 stars
    }

    getUserBehaviorPatterns(timeframe) {
        // Analyze user behavior patterns
        const cutoff = new Date(Date.now() - this.parseTimeframe(timeframe));
        const recentEvents = this.events.filter(e => new Date(e.timestamp) >= cutoff);
        
        return {
            peakUsageHours: this.calculatePeakUsageHours(recentEvents),
            commonUserJourneys: this.identifyCommonUserJourneys(recentEvents),
            devicePreferences: this.analyzeDevicePreferences(recentEvents),
            geographicDistribution: this.analyzeGeographicDistribution(recentEvents)
        };
    }

    getConversionMetrics(timeframe) {
        const cutoff = new Date(Date.now() - this.parseTimeframe(timeframe));
        const recentEvents = this.events.filter(e => new Date(e.timestamp) >= cutoff);
        
        return {
            assessmentToLead: this.calculateConversionRate(recentEvents, 'assessment_completed', 'lead_captured'),
            leadToConsultation: this.calculateConversionRate(recentEvents, 'lead_captured', 'consultation_scheduled'),
            consultationToClient: this.calculateConversionRate(recentEvents, 'consultation_scheduled', 'client_converted'),
            overallConversion: this.calculateOverallConversion(recentEvents)
        };
    }

    generateOptimizationRecommendations(timeframe, assessmentType) {
        const recommendations = [];
        
        // Analyze completion rates
        const completionRates = this.getCompletionRates(timeframe);
        for (const [type, data] of Object.entries(completionRates)) {
            if (data.rate < 70) {
                recommendations.push({
                    priority: 'high',
                    category: 'completion_rate',
                    assessment: type,
                    issue: `Low completion rate (${data.rate.toFixed(1)}%)`,
                    recommendation: 'Review question flow and reduce assessment length',
                    expectedImpact: 'Increase completion rate by 15-25%'
                });
            }
        }

        // Analyze abandonment points
        const abandonmentAnalysis = this.getAbandonmentAnalysis(assessmentType);
        for (const [type, analysis] of Object.entries(abandonmentAnalysis)) {
            if (analysis.topAbandonmentPoints.length > 0) {
                const topPoint = analysis.topAbandonmentPoints[0];
                if (topPoint.percentage > 30) {
                    recommendations.push({
                        priority: 'high',
                        category: 'abandonment',
                        assessment: type,
                        issue: `High abandonment at ${topPoint.point} (${topPoint.percentage.toFixed(1)}%)`,
                        recommendation: 'Simplify or redesign this section of the assessment',
                        expectedImpact: 'Reduce abandonment by 20-30%'
                    });
                }
            }
        }

        // Analyze engagement
        const engagementMetrics = this.getEngagementMetrics(timeframe);
        for (const [page, metrics] of Object.entries(engagementMetrics)) {
            if (metrics.averageTimeOnPage < 30000) { // Less than 30 seconds
                recommendations.push({
                    priority: 'medium',
                    category: 'engagement',
                    page: page,
                    issue: `Low time on page (${(metrics.averageTimeOnPage / 1000).toFixed(1)}s)`,
                    recommendation: 'Improve content quality and user experience',
                    expectedImpact: 'Increase engagement by 40-60%'
                });
            }
        }

        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    // Additional helper methods for behavior analysis
    calculatePeakUsageHours(events) {
        const hourCounts = new Array(24).fill(0);
        
        events.forEach(event => {
            const hour = new Date(event.timestamp).getHours();
            hourCounts[hour]++;
        });

        return hourCounts.map((count, hour) => ({ hour, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }

    identifyCommonUserJourneys(events) {
        // Simplified journey analysis
        const journeys = new Map();
        
        // Group events by session
        const sessionEvents = new Map();
        events.forEach(event => {
            if (event.sessionId) {
                if (!sessionEvents.has(event.sessionId)) {
                    sessionEvents.set(event.sessionId, []);
                }
                sessionEvents.get(event.sessionId).push(event);
            }
        });

        // Analyze journey patterns
        sessionEvents.forEach(events => {
            const journey = events
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                .map(e => e.type)
                .join(' -> ');
            
            journeys.set(journey, (journeys.get(journey) || 0) + 1);
        });

        return Array.from(journeys.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([journey, count]) => ({ journey, count }));
    }

    analyzeDevicePreferences(events) {
        const devices = new Map();
        
        events.forEach(event => {
            if (event.data.userAgent) {
                const deviceType = this.detectDeviceType(event.data.userAgent);
                devices.set(deviceType, (devices.get(deviceType) || 0) + 1);
            }
        });

        return Array.from(devices.entries())
            .map(([device, count]) => ({ device, count }));
    }

    analyzeGeographicDistribution(events) {
        // Simplified geographic analysis based on IP hashing
        const regions = new Map();
        
        events.forEach(event => {
            if (event.ipAddress) {
                // In production, use proper IP geolocation
                const region = this.getRegionFromHashedIP(event.ipAddress);
                regions.set(region, (regions.get(region) || 0) + 1);
            }
        });

        return Array.from(regions.entries())
            .map(([region, count]) => ({ region, count }));
    }

    calculateConversionRate(events, fromEvent, toEvent) {
        const fromCount = events.filter(e => e.type === fromEvent).length;
        const toCount = events.filter(e => e.type === toEvent).length;
        
        return fromCount > 0 ? (toCount / fromCount) * 100 : 0;
    }

    calculateOverallConversion(events) {
        const visitors = events.filter(e => e.type === 'page_view').length;
        const conversions = events.filter(e => e.type === 'client_converted').length;
        
        return visitors > 0 ? (conversions / visitors) * 100 : 0;
    }

    detectDeviceType(userAgent) {
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile';
        if (/Tablet/.test(userAgent)) return 'tablet';
        return 'desktop';
    }

    getRegionFromHashedIP(hashedIP) {
        // Simplified region detection - in production, use proper geolocation
        const regions = ['North America', 'Europe', 'Asia', 'Africa', 'South America', 'Oceania'];
        const hash = hashedIP.split('_').reduce((sum, part) => sum + parseInt(part) || 0, 0);
        return regions[hash % regions.length];
    }
}

module.exports = AnalyticsEngine;