/**
 * Analytics System Initialization
 * Sets up and configures the comprehensive analytics system
 */

const AnalyticsEngine = require('./AnalyticsEngine');
const RealTimeDashboard = require('./RealTimeDashboard');
const PerformanceTracker = require('./PerformanceTracker');
const createAnalyticsRoutes = require('./analyticsRoutes');

class AnalyticsSystem {
    constructor() {
        this.engine = null;
        this.dashboard = null;
        this.tracker = null;
        this.routes = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the analytics system
     */
    initialize(options = {}) {
        try {
            console.log('Initializing Analytics System...');

            // Initialize core analytics engine
            this.engine = new AnalyticsEngine();
            console.log('✓ Analytics Engine initialized');

            // Initialize real-time dashboard
            this.dashboard = new RealTimeDashboard(this.engine);
            console.log('✓ Real-Time Dashboard initialized');

            // Initialize performance tracker
            this.tracker = new PerformanceTracker(this.engine);
            console.log('✓ Performance Tracker initialized');

            // Create API routes
            this.routes = createAnalyticsRoutes(this.engine, this.dashboard, this.tracker);
            console.log('✓ Analytics API Routes created');

            // Start real-time monitoring
            const dashboardUpdateInterval = options.dashboardUpdateInterval || 5000; // 5 seconds
            this.dashboard.start(dashboardUpdateInterval);
            console.log(`✓ Real-Time Dashboard started (${dashboardUpdateInterval}ms interval)`);

            // Start performance tracking
            const performanceTrackingInterval = options.performanceTrackingInterval || 60000; // 1 minute
            this.tracker.startTracking(performanceTrackingInterval);
            console.log(`✓ Performance Tracking started (${performanceTrackingInterval}ms interval)`);

            // Set up initial demo data if in development mode
            if (options.generateDemoData && process.env.NODE_ENV === 'development') {
                this.generateDemoData();
                console.log('✓ Demo data generated');
            }

            this.isInitialized = true;
            console.log('🎉 Analytics System fully initialized');

            return {
                engine: this.engine,
                dashboard: this.dashboard,
                tracker: this.tracker,
                routes: this.routes
            };

        } catch (error) {
            console.error('❌ Failed to initialize Analytics System:', error);
            throw error;
        }
    }

    /**
     * Shutdown the analytics system
     */
    shutdown() {
        try {
            console.log('Shutting down Analytics System...');

            if (this.dashboard) {
                this.dashboard.stop();
                console.log('✓ Real-Time Dashboard stopped');
            }

            if (this.tracker) {
                this.tracker.stopTracking();
                console.log('✓ Performance Tracking stopped');
            }

            this.isInitialized = false;
            console.log('✓ Analytics System shutdown complete');

        } catch (error) {
            console.error('❌ Error during Analytics System shutdown:', error);
        }
    }

    /**
     * Get system status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            components: {
                engine: !!this.engine,
                dashboard: !!this.dashboard && this.dashboard.updateInterval !== null,
                tracker: !!this.tracker && this.tracker.trackingIntervals.size > 0
            },
            health: this.dashboard ? this.dashboard.getHealthStatus() : null,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate demo data for development/testing
     */
    generateDemoData() {
        if (!this.engine) return;

        console.log('Generating demo analytics data...');

        const assessmentTypes = [
            'strategic-readiness-assessment',
            'ai-integration-questionnaire',
            'leadership-capability-audit',
            'organizational-maturity-evaluation'
        ];

        const pages = [
            'homepage',
            'assessment-landing',
            'services',
            'about',
            'contact'
        ];

        // Generate historical events
        const now = Date.now();
        const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

        for (let i = 0; i < 500; i++) {
            const timestamp = new Date(oneWeekAgo + Math.random() * (now - oneWeekAgo));
            const sessionId = `demo_session_${Math.floor(Math.random() * 100)}`;
            const assessmentType = assessmentTypes[Math.floor(Math.random() * assessmentTypes.length)];
            const page = pages[Math.floor(Math.random() * pages.length)];

            // Generate page views
            this.engine.trackEvent('page_view', {
                page: page,
                referrer: Math.random() > 0.5 ? 'https://google.com' : 'direct',
                timeOnPage: Math.random() * 300000, // 0-5 minutes
                userAgent: 'Mozilla/5.0 (Demo Browser)',
                ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`
            }, sessionId);

            // Generate assessment events
            if (Math.random() > 0.3) { // 70% start assessments
                this.engine.trackEvent('assessment_started', {
                    assessmentType: assessmentType,
                    userId: `demo_user_${Math.floor(Math.random() * 50)}`,
                    sessionId: sessionId
                }, sessionId);

                // Generate question responses
                const numQuestions = Math.floor(Math.random() * 20) + 5; // 5-25 questions
                for (let q = 0; q < numQuestions; q++) {
                    // Some users abandon during questions
                    if (Math.random() > 0.85) { // 15% abandon
                        this.engine.trackEvent('assessment_abandoned', {
                            assessmentType: assessmentType,
                            sessionId: sessionId,
                            abandonmentPoint: `question_${q + 1}`,
                            timeSpent: Math.random() * 600000 // 0-10 minutes
                        }, sessionId);
                        break;
                    }

                    this.engine.trackEvent('question_answered', {
                        sessionId: sessionId,
                        questionId: `${assessmentType}_q${q + 1}`,
                        responseTime: Math.random() * 30000 + 5000, // 5-35 seconds
                        questionType: Math.random() > 0.5 ? 'multiple_choice' : 'scale',
                        response: { value: Math.floor(Math.random() * 5) + 1 }
                    }, sessionId);
                }

                // Complete assessment (if not abandoned)
                if (Math.random() > 0.2) { // 80% of started assessments complete
                    this.engine.trackEvent('assessment_completed', {
                        assessmentType: assessmentType,
                        sessionId: sessionId,
                        completionTime: Math.random() * 1800000 + 300000, // 5-35 minutes
                        results: {
                            overallScore: Math.random() * 40 + 60, // 60-100%
                            persona: ['Strategic Architect', 'Strategic Catalyst', 'Strategic Contributor'][Math.floor(Math.random() * 3)]
                        }
                    }, sessionId);

                    // Some users become leads
                    if (Math.random() > 0.6) { // 40% become leads
                        this.engine.trackEvent('lead_captured', {
                            sessionId: sessionId,
                            email: `demo${Math.floor(Math.random() * 1000)}@example.com`,
                            source: 'assessment_completion'
                        }, sessionId);

                        // Some leads schedule consultations
                        if (Math.random() > 0.7) { // 30% schedule consultations
                            this.engine.trackEvent('consultation_scheduled', {
                                sessionId: sessionId,
                                service: ['Strategic Clarity', 'Strategic Systems', 'Strategic Advantage'][Math.floor(Math.random() * 3)]
                            }, sessionId);
                        }
                    }
                }
            }

            // Generate engagement events
            this.engine.trackEvent('user_engagement', {
                sessionId: sessionId,
                engagementType: ['scroll', 'click', 'hover', 'focus'][Math.floor(Math.random() * 4)],
                duration: Math.random() * 10000, // 0-10 seconds
                interactionData: { element: 'demo_element' }
            }, sessionId);
        }

        console.log('✓ Demo data generation complete');
    }

    /**
     * Get analytics components for external use
     */
    getComponents() {
        return {
            engine: this.engine,
            dashboard: this.dashboard,
            tracker: this.tracker,
            routes: this.routes
        };
    }

    /**
     * Track a custom event (convenience method)
     */
    track(eventType, eventData, sessionId = null) {
        if (!this.engine) {
            console.warn('Analytics engine not initialized');
            return null;
        }

        return this.engine.trackEvent(eventType, eventData, sessionId);
    }

    /**
     * Get current dashboard data (convenience method)
     */
    getDashboardData() {
        if (!this.dashboard) {
            console.warn('Dashboard not initialized');
            return null;
        }

        return this.dashboard.getCurrentDashboardData();
    }

    /**
     * Generate performance report (convenience method)
     */
    getPerformanceReport(timeframe = '7d') {
        if (!this.tracker) {
            console.warn('Performance tracker not initialized');
            return null;
        }

        return this.tracker.generatePerformanceReport(timeframe);
    }

    /**
     * Subscribe to real-time updates (convenience method)
     */
    subscribe(callback) {
        if (!this.dashboard) {
            console.warn('Dashboard not initialized');
            return () => {};
        }

        return this.dashboard.subscribe(callback);
    }

    /**
     * Export analytics data (convenience method)
     */
    exportData(format = 'json', timeframe = '7d') {
        const data = {
            dashboard: this.dashboard ? this.dashboard.exportData(format, timeframe) : null,
            performance: this.tracker ? this.tracker.exportPerformanceData(format) : null,
            events: this.engine ? this.engine.events.slice(-1000) : []
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        }

        return data;
    }

    /**
     * Health check for the analytics system
     */
    healthCheck() {
        const status = this.getStatus();
        const health = {
            status: 'healthy',
            checks: {
                engine: status.components.engine ? 'pass' : 'fail',
                dashboard: status.components.dashboard ? 'pass' : 'fail',
                tracker: status.components.tracker ? 'pass' : 'fail'
            },
            timestamp: new Date().toISOString()
        };

        // Determine overall health
        const failedChecks = Object.values(health.checks).filter(check => check === 'fail').length;
        if (failedChecks > 0) {
            health.status = failedChecks === Object.keys(health.checks).length ? 'critical' : 'degraded';
        }

        return health;
    }
}

// Create singleton instance
const analyticsSystem = new AnalyticsSystem();

module.exports = {
    AnalyticsSystem,
    analyticsSystem,
    AnalyticsEngine,
    RealTimeDashboard,
    PerformanceTracker,
    createAnalyticsRoutes
};