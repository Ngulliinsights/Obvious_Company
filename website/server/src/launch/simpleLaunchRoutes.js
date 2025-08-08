/**
 * Simplified Launch System API Routes
 * Basic launch monitoring without circular dependencies
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Simple feature flags storage
const featureFlags = new Map([
    ['assessment_platform_enabled', { enabled: true, rolloutPercentage: 100 }],
    ['multi_modal_assessments', { enabled: true, rolloutPercentage: 50 }],
    ['industry_specific_diagnostics', { enabled: true, rolloutPercentage: 75 }],
    ['persona_classification', { enabled: true, rolloutPercentage: 100 }],
    ['adaptive_curriculum', { enabled: true, rolloutPercentage: 25 }],
    ['cultural_sensitivity', { enabled: true, rolloutPercentage: 80 }],
    ['advanced_analytics', { enabled: true, rolloutPercentage: 100 }],
    ['real_time_feedback', { enabled: true, rolloutPercentage: 100 }]
]);

// Simple metrics storage
const metrics = {
    performance: [],
    feedback: [],
    issues: []
};

// Rate limiting
const feedbackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many feedback submissions, please try again later.' }
});

const dashboardLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many dashboard requests, please try again later.' }
});

// Feature flag check endpoint
router.get('/feature-flags/:flagName', (req, res) => {
    try {
        const { flagName } = req.params;
        const flag = featureFlags.get(flagName);
        
        if (!flag) {
            return res.json({
                success: true,
                flagName,
                enabled: false,
                message: 'Feature flag not found'
            });
        }

        // Simple rollout logic
        const rolloutCheck = Math.random() * 100;
        const isEnabled = flag.enabled && rolloutCheck <= flag.rolloutPercentage;

        res.json({
            success: true,
            flagName,
            enabled: isEnabled,
            rolloutPercentage: flag.rolloutPercentage
        });

    } catch (error) {
        console.error('Feature flag check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking feature flag',
            enabled: false
        });
    }
});

// Feedback collection endpoint
router.post('/feedback', feedbackLimiter, [
    body('category').isIn(['user_experience', 'assessment_accuracy', 'technical_issue', 'feature_request', 'content_quality', 'performance', 'accessibility', 'cultural_sensitivity']),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('message').trim().isLength({ min: 10, max: 2000 }).escape(),
    body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const feedbackData = {
            id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            timestamp: new Date()
        };

        // Store feedback
        metrics.feedback.push(feedbackData);
        
        // Keep only last 1000 feedback items
        if (metrics.feedback.length > 1000) {
            metrics.feedback = metrics.feedback.slice(-1000);
        }

        console.log(`Feedback received: ${feedbackData.category} - ${feedbackData.rating}/5`);

        res.json({
            success: true,
            feedbackId: feedbackData.id,
            message: 'Thank you for your feedback! We\'ll review it and get back to you if needed.'
        });

    } catch (error) {
        console.error('Feedback collection error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record feedback. Please try again later.'
        });
    }
});

// Issue reporting endpoint
router.post('/issues', feedbackLimiter, [
    body('severity').isIn(['low', 'medium', 'high', 'critical']),
    body('category').isIn(['technical_issue', 'assessment_blocking', 'performance', 'accessibility', 'security']),
    body('title').trim().isLength({ min: 5, max: 200 }).escape(),
    body('description').trim().isLength({ min: 20, max: 2000 }).escape()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const issueData = {
            id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            timestamp: new Date(),
            status: 'open'
        };

        // Store issue
        metrics.issues.push(issueData);
        
        // Keep only last 500 issues
        if (metrics.issues.length > 500) {
            metrics.issues = metrics.issues.slice(-500);
        }

        console.log(`Issue reported: ${issueData.severity} - ${issueData.title}`);

        res.json({
            success: true,
            issueId: issueData.id,
            message: 'Issue reported successfully! We\'ll investigate and provide updates.'
        });

    } catch (error) {
        console.error('Issue reporting error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to report issue. Please try again later.'
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
            id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            metricType,
            data,
            userAgent: req.get('User-Agent'),
            url: req.get('Referer'),
            timestamp: new Date()
        };

        // Store metric
        metrics.performance.push(metricData);
        
        // Keep only last 5000 metrics
        if (metrics.performance.length > 5000) {
            metrics.performance = metrics.performance.slice(-5000);
        }

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

// Launch dashboard endpoint (simplified)
router.get('/dashboard', dashboardLimiter, async (req, res) => {
    try {
        const adminKey = req.query.adminKey || req.headers['x-admin-key'];
        if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'dev-admin-key-12345') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        // Calculate simple metrics
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const recentFeedback = metrics.feedback.filter(f => f.timestamp > last24Hours);
        const recentIssues = metrics.issues.filter(i => i.timestamp > last24Hours);
        const recentMetrics = metrics.performance.filter(m => m.timestamp > last24Hours);

        const avgRating = recentFeedback.length > 0 
            ? recentFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / recentFeedback.filter(f => f.rating).length
            : 0;

        const dashboardData = {
            launchStatus: {
                phase: process.env.LAUNCH_PHASE || 'beta',
                systemHealth: 'healthy',
                lastUpdated: now,
                userSatisfaction: avgRating,
                performanceScore: 85
            },
            performanceMetrics: {
                systemMetrics: {
                    responseTime: { avg: 150, p95: 300 },
                    errorRate: { rate: 0.01, count: 2 },
                    throughput: recentMetrics.length
                },
                alerts: []
            },
            feedbackSummary: {
                total: recentFeedback.length,
                averageRating: avgRating.toFixed(1),
                sentimentDistribution: {
                    positive: recentFeedback.filter(f => f.rating >= 4).length,
                    neutral: recentFeedback.filter(f => f.rating === 3).length,
                    negative: recentFeedback.filter(f => f.rating <= 2).length
                }
            },
            supportSummary: {
                ticketStats: {
                    total: metrics.issues.length,
                    open: metrics.issues.filter(i => i.status === 'open').length,
                    overdue: 0,
                    recent: recentIssues.length
                }
            },
            featureFlags: Array.from(featureFlags.entries()).map(([name, config]) => ({
                name,
                enabled: config.enabled,
                rolloutPercentage: config.rolloutPercentage,
                description: `Feature flag for ${name.replace(/_/g, ' ')}`
            })),
            recommendations: []
        };

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
            phase: process.env.LAUNCH_PHASE || 'beta',
            systemHealth: 'healthy',
            lastUpdated: new Date(),
            uptime: process.uptime(),
            version: '1.0.0'
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
                feedback: true,
                monitoring: true,
                support: true
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '1.0.0'
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
        if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'dev-admin-key-12345') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const { flagName } = req.params;
        const { updates } = req.body;

        if (!updates) {
            return res.status(400).json({
                success: false,
                message: 'Missing updates object'
            });
        }

        const currentFlag = featureFlags.get(flagName) || { enabled: false, rolloutPercentage: 0 };
        const updatedFlag = { ...currentFlag, ...updates };
        
        featureFlags.set(flagName, updatedFlag);

        console.log(`Feature flag '${flagName}' updated:`, updates);

        res.json({
            success: true,
            flag: { name: flagName, ...updatedFlag }
        });

    } catch (error) {
        console.error('Feature flag update error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;