/**
 * Simple Launch Script for The Obvious Company Website
 * Hybrid deployment with basic monitoring
 */

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting The Obvious Company - Hybrid Launch');

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Performance middleware
app.use(compression());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname), {
    maxAge: '1d',
    etag: true,
    lastModified: true
}));

// Simple launch monitoring storage
const launchMetrics = {
    startTime: new Date(),
    requests: 0,
    errors: 0,
    feedback: [],
    performance: []
};

// Middleware to track requests
app.use((req, res, next) => {
    launchMetrics.requests++;
    next();
});

// Basic launch API routes
app.get('/api/launch/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: Math.floor((Date.now() - launchMetrics.startTime.getTime()) / 1000),
        requests: launchMetrics.requests,
        errors: launchMetrics.errors,
        version: '1.0.0-hybrid'
    });
});

app.get('/api/launch/status', (req, res) => {
    res.json({
        success: true,
        status: {
            phase: 'hybrid-launch',
            systemHealth: 'healthy',
            lastUpdated: new Date(),
            uptime: Math.floor((Date.now() - launchMetrics.startTime.getTime()) / 1000)
        }
    });
});

app.post('/api/launch/feedback', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5
}), [
    body('category').optional().isIn(['user_experience', 'technical_issue', 'feature_request', 'general']),
    body('message').trim().isLength({ min: 10, max: 1000 }).escape(),
    body('rating').optional().isInt({ min: 1, max: 5 })
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const feedback = {
            id: `feedback_${Date.now()}`,
            ...req.body,
            timestamp: new Date(),
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };

        launchMetrics.feedback.push(feedback);
        
        // Keep only last 100 feedback items
        if (launchMetrics.feedback.length > 100) {
            launchMetrics.feedback = launchMetrics.feedback.slice(-100);
        }

        console.log(`📝 Feedback received: ${feedback.category || 'general'} - ${feedback.rating || 'no rating'}`);

        res.json({
            success: true,
            message: 'Thank you for your feedback!',
            feedbackId: feedback.id
        });

    } catch (error) {
        console.error('Feedback error:', error);
        launchMetrics.errors++;
        res.status(500).json({
            success: false,
            message: 'Failed to record feedback'
        });
    }
});

app.post('/api/launch/metrics/performance', rateLimit({
    windowMs: 60 * 1000,
    max: 100
}), (req, res) => {
    try {
        const metric = {
            id: `metric_${Date.now()}`,
            ...req.body,
            timestamp: new Date(),
            ip: req.ip
        };

        launchMetrics.performance.push(metric);
        
        // Keep only last 1000 metrics
        if (launchMetrics.performance.length > 1000) {
            launchMetrics.performance = launchMetrics.performance.slice(-1000);
        }

        res.json({
            success: true,
            message: 'Metric recorded'
        });

    } catch (error) {
        console.error('Metrics error:', error);
        launchMetrics.errors++;
        res.status(500).json({
            success: false,
            message: 'Failed to record metric'
        });
    }
});

// Simple dashboard endpoint
app.get('/api/launch/dashboard', (req, res) => {
    const adminKey = req.query.adminKey || req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'dev-admin-key-12345') {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized access'
        });
    }

    const now = new Date();
    const uptime = Math.floor((now.getTime() - launchMetrics.startTime.getTime()) / 1000);
    const avgRating = launchMetrics.feedback.length > 0 
        ? launchMetrics.feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / launchMetrics.feedback.filter(f => f.rating).length
        : 0;

    res.json({
        success: true,
        data: {
            launchStatus: {
                phase: 'hybrid-launch',
                systemHealth: 'healthy',
                lastUpdated: now,
                uptime,
                userSatisfaction: avgRating.toFixed(1)
            },
            metrics: {
                totalRequests: launchMetrics.requests,
                totalErrors: launchMetrics.errors,
                errorRate: launchMetrics.requests > 0 ? (launchMetrics.errors / launchMetrics.requests * 100).toFixed(2) : 0,
                feedbackCount: launchMetrics.feedback.length,
                performanceMetrics: launchMetrics.performance.length
            },
            recentFeedback: launchMetrics.feedback.slice(-5),
            systemInfo: {
                nodeVersion: process.version,
                platform: process.platform,
                memory: process.memoryUsage(),
                uptime: process.uptime()
            }
        }
    });
});

// Main routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        service: 'The Obvious Company Website',
        version: '1.0.0-hybrid',
        uptime: process.uptime()
    });
});

// Basic contact form (simplified)
app.post('/api/contact', rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5
}), [
    body('name').trim().isLength({ min: 2, max: 100 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('message').trim().isLength({ min: 10, max: 1000 }).escape()
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        // Log contact form submission
        console.log(`📧 Contact form: ${req.body.name} (${req.body.email})`);

        res.json({
            success: true,
            message: 'Thank you for your message! We\'ll get back to you soon.',
            note: 'Email functionality is in development mode.'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        launchMetrics.errors++;
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.'
        });
    }
});

// Error handling
app.use((error, req, res, next) => {
    console.error('Application error:', error);
    launchMetrics.errors++;
    
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        timestamp: new Date()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'), (err) => {
        if (err) {
            res.json({
                success: false,
                message: 'Page not found',
                availableEndpoints: [
                    'GET /',
                    'GET /api/health',
                    'GET /api/launch/health',
                    'GET /api/launch/status',
                    'POST /api/launch/feedback',
                    'POST /api/contact'
                ]
            });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('🎉 ================================');
    console.log('🚀 HYBRID LAUNCH SUCCESSFUL!');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🛡️  Security: ✅ Active`);
    console.log(`⚡ Compression: ✅ Active`);
    console.log(`🚫 Rate Limiting: ✅ Active`);
    console.log(`📊 Launch Monitoring: ✅ Active`);
    console.log('🎉 ================================');
    console.log('');
    console.log('📊 Launch Dashboard: http://localhost:3000/api/launch/dashboard?adminKey=dev-admin-key-12345');
    console.log('🔍 Health Check: http://localhost:3000/api/launch/health');
    console.log('📝 Feedback: POST http://localhost:3000/api/launch/feedback');
    console.log('');
    console.log('✅ Website is now live and monitoring!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 Graceful shutdown initiated...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Graceful shutdown initiated...');
    process.exit(0);
});

module.exports = app;