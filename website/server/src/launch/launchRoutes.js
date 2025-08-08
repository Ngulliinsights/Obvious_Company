/**
 * Launch System API Routes
 * Provides endpoints for launch monitoring, feedback collection, and system management
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { LaunchController } = require('./launchController');

const router = express.Router();

// Initialize launch controller
const launchController = new LaunchController({
    launchPhase: process.env.LAUNCH_PHASE || 'beta',
    rolloutStrategy: process.env.ROLLOUT_STRATEGY || 'gradual',
    monitoringEnabled: process.env.MONITORING_ENABLED !== 'false',
    feedbackEnabled: process.env.FEEDBACK_ENABLED !== 'false',
    supportEnabled: process.env.SUPPORT_ENABLED !== 'false'
});

// Rate limiting for different endpoint types
const feedbackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 feedback submissions per 15 minutes
    message: 'Too many feedback submissions, please try again later.'
});

const supportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 support tickets per hour
    message: 'Too many support requests, please try again later.'
});

const dashboardLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 dashboard requests per minute
    message: 'Too many dashboard requests, please try again later.'
});

// Validation middleware
const feedbackValidation = [
    body('category').isIn(['user_experience', 'assessment_accuracy', 'technical_issue', 'feature_request', 'content_quality', 'performance', 'accessibility', 'cultural_sensitivity']),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('message').trim().isLength({ min: 10, max: 2000 }).escape(),
    body('email').optional().isEmail().normalizeEmail(),
    body('sessionId').optional().trim().isLength({ max: 100 }).escape(),
    body('url').optional().isURL(),
    body('assessmentType').optional().trim().isLength({ max: 50 }).escape()
];

const issueValidation = [
    body('severity').isIn(['low', 'medium', 'high', 'critical']),
    body('category').isIn(['technical_issue', 'assessment_blocking', 'performance', 'accessibility', 'security']),
    body('title').trim().isLength({ min: 5, max: 200 }).escape(),
    body('description').trim().isLength({ min: 20, max: 2000 }).escape(),
    body('stepsToReproduce').optional().isArray(),
    body('expectedBehavior').optional().trim().isLength({ max: 500 }).escape(),
    body('actualBehavior').optional().trim().isLength({ max: 500 }).escape(),
    body('email').optional().isEmail().normalizeEmail()
];

const supportTicketValidation = [
    body('subject').trim().isLength({ min: 5, max: 200 }).escape(),
    body('description').trim().isLength({ min: 20, max: 2000 }).escape(),
    body('category').isIn(['technical', 'assessment', 'billing', 'general', 'privacy']),
    body('email').isEmail().normalizeEmail(),
    body('name').trim().isLength({ min: 2, max: 100 }).escape(),
    body('company').optional().trim().isLength({ max: 100 }).escape(),
    body('phone').optional().trim().isLength({ max: 20 }).escape()
];

// Feature flag check endpoint
router.get('/feature-flags/:flagName', (req, res) => {
    try {
        const { flagName } = req.params;
        const userContext = {
            email: req.query.email,
            sessionId: req.query.sessionId,
            industry: req.query.industry,
            role: req.query.role,
            assessmentHistory: req.query.assessmentHistory ? JSON.parse(req.query.assessmentHistory) : []
        };

        const isEnabled = launchController.checkFeatureFlag(flagName, userContext);

        res.json({
            success: true,
            flagName,
            enabled: isEnabled,
            userContext: {
                segment: userContext.email ? 'identified' : 'anonymous'
            }
        });

    } catch (error) {
        console.error('Feature flag check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking feature flag',
            enabled: false // Fail closed
        });
    }
});

// Feedback collection endpoint
router.post('/feedback', feedbackLimiter, feedbackValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const feedbackData = {
            ...req.body,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            timestamp: new Date()
        };

        const result = await launchController.recordFeedback(feedbackData);

        res.json(result);

    } catch (error) {
        console.error('Feedback collection error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record feedback. Please try again later.'
        });
    }
});

// Issue reporting endpoint
router.post('/issues', feedbackLimiter, issueValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const issueData = {
            ...req.body,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            timestamp: new Date(),
            browserInfo: req.body.browserInfo || {},
            errorMessages: req.body.errorMessages || [],
            consoleErrors: req.body.consoleErrors || [],
            networkErrors: req.body.networkErrors || []
        };

        const result = await launchController.reportIssue(issueData);

        res.json(result);

    } catch (error) {
        console.error('Issue reporting error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to report issue. Please try again later.'
        });
    }
});

// Support ticket creation endpoint
router.post('/support', supportLimiter, supportTicketValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const ticketData = {
            ...req.body,
            userAgent: req.get('User-Agent'),
            url: req.get('Referer'),
            ipAddress: req.ip,
            timestamp: new Date(),
            browserInfo: req.body.browserInfo || {},
            errorMessages: req.body.errorMessages || []
        };

        const result = await launchController.createSupportTicket(ticketData);

        res.json(result);

    } catch (error) {
        console.error('Support ticket creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create support ticket. Please try again later.'
        });
    }
});

// Performance metric recording endpoint
router.post('/metrics/performance', rateLimit({
    windowMs: 60 * 1000,
    max: 100
}), async (req, res) => {
    try {
        const { metricType, data } = req.body;

        if (!metricType || !data) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: metricType, data'
            });
        }

        const metricData = {
            ...data,
            userAgent: req.get('User-Agent'),
            url: req.get('Referer'),
            timestamp: new Date()
        };

        launchController.recordPerformanceMetric(metricType, metricData);

        res.json({
            success: true,
            message: 'Performance metric recorded'
        });

    } catch (error) {
        console.error('Performance metric recording error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record performance metric'
        });
    }
});

// Assessment metrics recording endpoint
router.post('/metrics/assessment', rateLimit({
    windowMs: 60 * 1000,
    max: 50
}), async (req, res) => {
    try {
        const assessmentData = {
            ...req.body,
            timestamp: new Date()
        };

        launchController.recordAssessmentMetrics(assessmentData);

        res.json({
            success: true,
            message: 'Assessment metrics recorded'
        });

    } catch (error) {
        console.error('Assessment metrics recording error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record assessment metrics'
        });
    }
});

// Launch dashboard endpoint (admin only)
router.get('/dashboard', dashboardLimiter, async (req, res) => {
    try {
        // In production, this would require authentication
        const adminKey = req.query.adminKey || req.headers['x-admin-key'];
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const dashboardData = launchController.getLaunchDashboard();

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

// Launch status endpoint (public)
router.get('/status', rateLimit({
    windowMs: 60 * 1000,
    max: 60
}), (req, res) => {
    try {
        const publicStatus = {
            phase: launchController.launchStatus.phase,
            systemHealth: launchController.launchStatus.systemHealth,
            lastUpdated: launchController.launchStatus.lastUpdated,
            uptime: Date.now() - launchController.launchStatus.startTime.getTime()
        };

        res.json({
            success: true,
            status: publicStatus
        });

    } catch (error) {
        console.error('Status endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve status'
        });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date(),
            services: {
                feedback: !!launchController.feedbackSystem,
                monitoring: !!launchController.performanceMonitor,
                support: !!launchController.supportSystem
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0'
        };

        res.json(health);

    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Feature flag management endpoint (admin only)
router.post('/feature-flags/:flagName', async (req, res) => {
    try {
        const adminKey = req.body.adminKey || req.headers['x-admin-key'];
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const { flagName } = req.params;
        const updates = req.body.updates;

        if (!updates) {
            return res.status(400).json({
                success: false,
                message: 'Missing updates object'
            });
        }

        const { featureFlagsManager } = require('./featureFlags');
        const updatedFlag = featureFlagsManager.updateFlag(flagName, updates);

        res.json({
            success: true,
            flag: updatedFlag
        });

    } catch (error) {
        console.error('Feature flag update error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Middleware to record API response times
router.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const endpoint = `${req.method} ${req.route?.path || req.path}`;
        
        launchController.recordApiResponse(endpoint, duration, res.statusCode);
    });
    
    next();
});

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Launch API error:', error);
    
    // Record error metric
    launchController.recordPerformanceMetric('apiError', {
        endpoint: req.path,
        method: req.method,
        error: error.message,
        statusCode: error.status || 500,
        userAgent: req.get('User-Agent')
    });
    
    res.status(error.status || 500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
});

module.exports = router;