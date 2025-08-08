/**
 * Analytics API Routes
 * Provides endpoints for analytics data access and real-time monitoring
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, query, validationResult } = require('express-validator');

function createAnalyticsRoutes(analyticsEngine, realTimeDashboard, performanceTracker) {
    const router = express.Router();

    // Rate limiting for analytics endpoints
    const analyticsLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many analytics requests, please try again later.'
    });

    const dashboardLimiter = rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 60, // Allow frequent dashboard updates
        message: 'Dashboard request limit exceeded.'
    });

    // Apply rate limiting
    router.use(analyticsLimiter);

    /**
     * Track analytics event
     */
    router.post('/track', [
        body('eventType').trim().isLength({ min: 1, max: 50 }).escape(),
        body('eventData').isObject(),
        body('sessionId').optional().trim().isLength({ max: 100 }).escape()
    ], (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { eventType, eventData, sessionId } = req.body;
            
            // Add request metadata
            const enrichedEventData = {
                ...eventData,
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip,
                referrer: req.get('Referer'),
                timestamp: new Date().toISOString()
            };

            const eventId = analyticsEngine.trackEvent(eventType, enrichedEventData, sessionId);

            res.json({
                success: true,
                eventId,
                message: 'Event tracked successfully'
            });

        } catch (error) {
            console.error('Analytics tracking error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to track event'
            });
        }
    });

    /**
     * Get real-time dashboard data
     */
    router.get('/dashboard', dashboardLimiter, [
        query('timeframe').optional().isIn(['1h', '6h', '24h', '7d']).withMessage('Invalid timeframe')
    ], (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const dashboardData = realTimeDashboard.getCurrentDashboardData();
            
            res.json({
                success: true,
                data: dashboardData
            });

        } catch (error) {
            console.error('Dashboard data error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve dashboard data'
            });
        }
    });

    /**
     * Get completion rates
     */
    router.get('/completion-rates', [
        query('timeframe').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('Invalid timeframe'),
        query('assessmentType').optional().trim().isLength({ max: 50 }).escape()
    ], (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { timeframe = '24h' } = req.query;
            const completionRates = analyticsEngine.getCompletionRates(timeframe);

            res.json({
                success: true,
                timeframe,
                data: completionRates
            });

        } catch (error) {
            console.error('Completion rates error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve completion rates'
            });
        }
    });

    /**
     * Get engagement metrics
     */
    router.get('/engagement', [
        query('timeframe').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('Invalid timeframe'),
        query('page').optional().trim().isLength({ max: 100 }).escape()
    ], (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { timeframe = '24h' } = req.query;
            const engagementMetrics = analyticsEngine.getEngagementMetrics(timeframe);

            res.json({
                success: true,
                timeframe,
                data: engagementMetrics
            });

        } catch (error) {
            console.error('Engagement metrics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve engagement metrics'
            });
        }
    });

    /**
     * Get abandonment analysis
     */
    router.get('/abandonment', [
        query('assessmentType').optional().trim().isLength({ max: 50 }).escape()
    ], (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { assessmentType } = req.query;
            const abandonmentAnalysis = analyticsEngine.getAbandonmentAnalysis(assessmentType);

            res.json({
                success: true,
                assessmentType: assessmentType || 'all',
                data: abandonmentAnalysis
            });

        } catch (error) {
            console.error('Abandonment analysis error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve abandonment analysis'
            });
        }
    });

    /**
     * Get assessment accuracy
     */
    router.get('/accuracy', [
        query('assessmentType').optional().trim().isLength({ max: 50 }).escape()
    ], (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { assessmentType } = req.query;
            const accuracyData = analyticsEngine.getAssessmentAccuracy(assessmentType);

            res.json({
                success: true,
                assessmentType: assessmentType || 'all',
                data: accuracyData
            });

        } catch (error) {
            console.error('Assessment accuracy error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve accuracy data'
            });
        }
    });

    /**
     * Generate performance report
     */
    router.get('/performance-report', [
        query('timeframe').optional().isIn(['24h', '7d', '30d', '90d']).withMessage('Invalid timeframe'),
        query('assessmentType').optional().trim().isLength({ max: 50 }).escape(),
        query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format')
    ], (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { timeframe = '7d', assessmentType, format = 'json' } = req.query;
            const report = performanceTracker.generatePerformanceReport(timeframe);

            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="performance-report-${timeframe}.csv"`);
                res.send(performanceTracker.convertPerformanceDataToCSV({ performanceHistory: report }));
            } else {
                res.json({
                    success: true,
                    report
                });
            }

        } catch (error) {
            console.error('Performance report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate performance report'
            });
        }
    });

    /**
     * Get performance trends
     */
    router.get('/trends/:category/:identifier', [
        query('timeframe').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('Invalid timeframe')
    ], (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { category, identifier } = req.params;
            const { timeframe = '24h' } = req.query;
            
            const trends = performanceTracker.getPerformanceTrends(category, identifier, timeframe);

            res.json({
                success: true,
                category,
                identifier,
                timeframe,
                trends
            });

        } catch (error) {
            console.error('Performance trends error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve performance trends'
            });
        }
    });

    /**
     * Get system health status
     */
    router.get('/health', (req, res) => {
        try {
            const healthStatus = realTimeDashboard.getHealthStatus();
            const performanceAlerts = realTimeDashboard.getSystemAlerts();

            res.json({
                success: true,
                health: healthStatus,
                alerts: performanceAlerts,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Health status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve health status'
            });
        }
    });

    /**
     * Export analytics data
     */
    router.get('/export', [
        query('timeframe').optional().isIn(['24h', '7d', '30d', '90d']).withMessage('Invalid timeframe'),
        query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format'),
        query('category').optional().isIn(['all', 'events', 'performance', 'dashboard']).withMessage('Invalid category')
    ], (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { timeframe = '7d', format = 'json', category = 'all' } = req.query;
            
            let exportData;
            if (category === 'dashboard') {
                exportData = realTimeDashboard.exportData(format, timeframe);
            } else if (category === 'performance') {
                exportData = performanceTracker.exportPerformanceData(format);
            } else {
                // Export all data
                exportData = {
                    dashboard: realTimeDashboard.exportData('json', timeframe),
                    performance: performanceTracker.exportPerformanceData('json'),
                    events: analyticsEngine.events.slice(-1000) // Last 1000 events
                };
                
                if (format === 'json') {
                    exportData = JSON.stringify(exportData, null, 2);
                }
            }

            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${category}-${timeframe}.csv"`);
                res.send(exportData);
            } else {
                res.json({
                    success: true,
                    data: typeof exportData === 'string' ? JSON.parse(exportData) : exportData
                });
            }

        } catch (error) {
            console.error('Export data error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export data'
            });
        }
    });

    /**
     * WebSocket endpoint for real-time updates
     */
    router.get('/realtime', (req, res) => {
        // Set headers for Server-Sent Events
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Send initial data
        const initialData = realTimeDashboard.getCurrentDashboardData();
        res.write(`data: ${JSON.stringify(initialData)}\n\n`);

        // Subscribe to real-time updates
        const unsubscribe = realTimeDashboard.subscribe((data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        });

        // Handle client disconnect
        req.on('close', () => {
            unsubscribe();
        });

        req.on('error', (error) => {
            console.error('SSE connection error:', error);
            unsubscribe();
        });
    });

    /**
     * Update alert thresholds
     */
    router.post('/alert-thresholds', [
        body('completionRate').optional().isFloat({ min: 0, max: 100 }),
        body('abandonmentRate').optional().isFloat({ min: 0, max: 100 }),
        body('responseTime').optional().isInt({ min: 0 }),
        body('errorRate').optional().isFloat({ min: 0, max: 100 })
    ], (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const thresholds = req.body;
            realTimeDashboard.setAlertThresholds(thresholds);

            res.json({
                success: true,
                message: 'Alert thresholds updated',
                thresholds: realTimeDashboard.getAlertThresholds()
            });

        } catch (error) {
            console.error('Update thresholds error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update alert thresholds'
            });
        }
    });

    /**
     * Get current alert thresholds
     */
    router.get('/alert-thresholds', (req, res) => {
        try {
            const thresholds = realTimeDashboard.getAlertThresholds();
            
            res.json({
                success: true,
                thresholds
            });

        } catch (error) {
            console.error('Get thresholds error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve alert thresholds'
            });
        }
    });

    /**
     * Trigger manual dashboard update
     */
    router.post('/trigger-update', (req, res) => {
        try {
            realTimeDashboard.triggerUpdate();
            
            res.json({
                success: true,
                message: 'Dashboard update triggered',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Trigger update error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to trigger update'
            });
        }
    });

    /**
     * Get analytics summary
     */
    router.get('/summary', [
        query('timeframe').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('Invalid timeframe')
    ], (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { timeframe = '24h' } = req.query;
            const summary = performanceTracker.generatePerformanceSummary(timeframe);

            res.json({
                success: true,
                timeframe,
                summary
            });

        } catch (error) {
            console.error('Analytics summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate analytics summary'
            });
        }
    });

    return router;
}

module.exports = createAnalyticsRoutes;