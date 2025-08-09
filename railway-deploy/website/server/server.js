const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

// Import optional modules with graceful fallbacks - combining both approaches
const optionalModules = {};
try {
    // Try both destructuring and direct require approaches for maximum compatibility
    // Temporarily disable analytics to debug
    // optionalModules.analyticsSystem = require('./src/analytics').analyticsSystem || require('./src/analytics');
    optionalModules.IntegrationManager = require('./src/integrations/integrationManager').IntegrationManager;
} catch (error) {
    console.log('📝 Integration modules not available:', error.message);
}

try {
    optionalModules.launchRoutes = require('./src/launch/simpleLaunchRoutes');
    console.log('✅ Launch routes loaded successfully');
} catch (error) {
    console.log('📝 Launch routes not available:', error.message);
}

console.log('📝 Continuing with core functionality...');

const app = express();
const PORT = process.env.PORT || 3000;

// Railway-specific optimizations
if (process.env.RAILWAY_ENVIRONMENT) {
    console.log('🚂 Running on Railway platform');
    // Railway provides automatic HTTPS, so we can trust proxy headers
    app.set('trust proxy', 1);
}

// Consolidated configuration - enhanced with additional options from both files
const CONFIG = {
    // Database configuration
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'obvious_company',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password'
    },
    
    // Enhanced email configuration with intelligent fallback chain
    email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASS,
        // Smart cascading fallback for contact emails
        contactEmail: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
        salesEmail: process.env.SALES_EMAIL || process.env.CONTACT_EMAIL || process.env.SMTP_USER
    },
    
    // Webhook and URL configuration
    webhook: {
        baseUrl: process.env.WEBSITE_URL || 'http://localhost:3000',
        secret: process.env.WEBHOOK_SECRET || 'default-webhook-secret',
        calendarSecret: process.env.CALENDAR_WEBHOOK_SECRET || 'default-calendar-secret',
        unsubscribeSecret: process.env.UNSUBSCRIBE_SECRET || 'default-unsubscribe-secret'
    },
    
    // Analytics configuration with development helpers
    analytics: {
        dashboardUpdateInterval: parseInt(process.env.ANALYTICS_DASHBOARD_INTERVAL) || 5000,
        performanceTrackingInterval: parseInt(process.env.ANALYTICS_PERFORMANCE_INTERVAL) || 60000,
        generateDemoData: process.env.NODE_ENV === 'development'
    },
    
    // Optimally increased rate limiting for development and production
    rateLimits: {
        general: { windowMs: 15 * 60 * 1000, max: 5000 }, // 15 minutes, 5000 requests (very generous for development)
        forms: { windowMs: 15 * 60 * 1000, max: 50 }, // 15 minutes, 50 form submissions (much more generous)
        newsletter: { windowMs: 15 * 60 * 1000, max: 25 }, // 15 minutes, 25 newsletter signups
        leadMagnet: { windowMs: 15 * 60 * 1000, max: 50 }, // 15 minutes, 50 lead magnet downloads
        assessment: { windowMs: 15 * 60 * 1000, max: 100 }, // 15 minutes, 100 assessments (for testing)
        api: { windowMs: 15 * 60 * 1000, max: 500 }, // 15 minutes, 500 API requests (much higher)
        consultation: { windowMs: 15 * 60 * 1000, max: 100 } // 15 minutes, 100 consultation bookings
    },
    
    // Environment and performance flags
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    enableDetailedLogging: process.env.DETAILED_LOGGING === 'true' || process.env.NODE_ENV === 'development'
};

// Enhanced global error handlers - combining approaches from both files
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', {
        message: error.message,
        stack: CONFIG.isDevelopment ? error.stack : 'Hidden in production',
        timestamp: new Date().toISOString()
    });
    
    // Give the process a moment to log before exiting
    setTimeout(() => process.exit(1), 100);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection:', {
        reason: reason?.message || reason,
        promise: promise.toString().substring(0, 100),
        stack: CONFIG.isDevelopment && reason?.stack ? reason.stack : 'Hidden in production',
        timestamp: new Date().toISOString()
    });
    
    // Log but don't exit - let the application continue running
});

// Unified Service Manager - enhanced with best practices from both files
class ServiceManager {
    constructor() {
        this.services = {
            analytics: null,
            integrationManager: null,
            emailTransporter: null
        };
        this.initializationComplete = false;
    }

    // Initialize all services with improved error handling and parallel processing
    async initialize() {
        console.log('🔄 Starting service initialization...');
        
        const initTasks = [
            this.initAnalytics(),
            this.initIntegrations(),
            this.initEmail()
        ];
        
        // Run all initializations concurrently with detailed error tracking
        const results = await Promise.allSettled(initTasks);
        
        // Log results for each service
        const serviceNames = ['Analytics', 'Integrations', 'Email'];
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`❌ ${serviceNames[index]} initialization failed:`, result.reason?.message || result.reason);
            }
        });
        
        this.initializationComplete = true;
        console.log('🚀 Service initialization complete');
        
        // Return status summary for better visibility
        return {
            analytics: !!this.services.analytics,
            integrations: !!this.services.integrationManager,
            email: !!this.services.emailTransporter
        };
    }

    async initAnalytics() {
        if (!optionalModules.analyticsSystem) {
            console.log('📊 Analytics system not available, skipping...');
            return;
        }
        
        try {
            // Handle both direct function and object with initialize method
            if (typeof optionalModules.analyticsSystem === 'function') {
                this.services.analytics = optionalModules.analyticsSystem(CONFIG.analytics);
            } else if (optionalModules.analyticsSystem.initialize) {
                this.services.analytics = optionalModules.analyticsSystem.initialize(CONFIG.analytics);
            } else {
                this.services.analytics = optionalModules.analyticsSystem;
            }
            
            console.log('✅ Analytics initialized successfully');
        } catch (error) {
            console.error('❌ Analytics initialization failed:', error.message);
            // Don't throw - allow app to continue without analytics
        }
    }

    async initIntegrations() {
        if (!optionalModules.IntegrationManager) {
            console.log('🔗 Integration manager not available, skipping...');
            return;
        }
        
        try {
            this.services.integrationManager = new optionalModules.IntegrationManager({
                database: CONFIG.db,
                email: CONFIG.email,
                webhook: {
                    baseUrl: CONFIG.webhook.baseUrl,
                    secret: CONFIG.webhook.secret
                },
                calendar: {
                    baseUrl: CONFIG.webhook.baseUrl,
                    webhookSecret: CONFIG.webhook.calendarSecret
                },
                emailMarketing: {
                    baseUrl: CONFIG.webhook.baseUrl,
                    unsubscribeSecret: CONFIG.webhook.unsubscribeSecret
                }
            });

            // Defer campaign setup to avoid database race conditions
            if (this.services.integrationManager.setupDefaultEmailCampaigns) {
                setTimeout(() => {
                    try {
                        this.services.integrationManager.setupDefaultEmailCampaigns();
                        console.log('✅ Default email campaigns initialized');
                    } catch (error) {
                        console.error('⚠️  Campaign setup failed:', error.message);
                    }
                }, 5000);
            }
            
            console.log('✅ Integration manager initialized successfully');
        } catch (error) {
            console.error('❌ Integration manager initialization failed:', error.message);
        }
    }

    async initEmail() {
        if (!CONFIG.email.user || !CONFIG.email.password) {
            console.warn('⚠️  Email credentials not provided - email features disabled');
            return;
        }

        try {
            this.services.emailTransporter = nodemailer.createTransporter({
                host: CONFIG.email.host,
                port: CONFIG.email.port,
                secure: CONFIG.email.port === 465, // Auto-detect secure mode
                auth: {
                    user: CONFIG.email.user,
                    pass: CONFIG.email.password
                },
                // Enhanced connection pooling for better performance
                pool: true,
                maxConnections: 5,
                maxMessages: 100,
                rateDelta: 1000, // Rate limiting: 1 second between messages
                rateLimit: 5 // Max 5 messages per second
            });

            // Verify connection with better error handling
            this.services.emailTransporter.verify((error, success) => {
                if (error) {
                    console.error('❌ Email verification failed:', error.message);
                    // Set to null so we know it's not working
                    this.services.emailTransporter = null;
                } else {
                    console.log('✅ Email transporter verified and ready');
                }
            });

        } catch (error) {
            console.error('❌ Email initialization failed:', error.message);
            this.services.emailTransporter = null;
        }
    }

    // Simple getters with null safety
    get analytics() { return this.services.analytics; }
    get integrations() { return this.services.integrationManager; }
    get email() { return this.services.emailTransporter; }
    
    // Health check method for monitoring
    getServiceStatus() {
        return {
            analytics: !!this.services.analytics,
            integrations: !!this.services.integrationManager,
            email: !!this.services.emailTransporter,
            initializationComplete: this.initializationComplete
        };
    }
}

// Enhanced Email Service - combines best features from both versions
class EmailService {
    constructor(transporter) {
        this.transporter = transporter;
    }

    // Update transporter reference (needed for hot reloading)
    updateTransporter(transporter) {
        this.transporter = transporter;
    }

    async send(options) {
        if (!this.transporter) {
            throw new Error('Email service unavailable - transporter not initialized');
        }
        
        try {
            const result = await this.transporter.sendMail({
                from: CONFIG.email.user,
                ...options
            });
            
            if (CONFIG.enableDetailedLogging) {
                console.log('📧 Email sent successfully:', { 
                    to: options.to, 
                    subject: options.subject,
                    messageId: result.messageId 
                });
            }
            
            return result;
        } catch (error) {
            console.error('❌ Email send failed:', {
                error: error.message,
                to: options.to,
                subject: options.subject
            });
            throw error;
        }
    }

    async sendContactEmails(formData) {
        const { name, email, company, message, service } = formData;
        
        try {
            // Send both company notification and user auto-reply in parallel
            const emailPromises = [
                this.send({
                    to: CONFIG.email.contactEmail,
                    subject: `New Contact: ${name} ${company ? `(${company})` : ''}`,
                    html: this.buildContactHTML(formData),
                    // Add reply-to for easy response
                    replyTo: email
                }),
                this.send({
                    to: email,
                    subject: 'Thank you for contacting The Obvious Company',
                    html: this.buildAutoReplyHTML(name)
                })
            ];

            await Promise.all(emailPromises);
            console.log('✅ Contact form emails sent successfully');
            
        } catch (error) {
            console.error('❌ Contact form email error:', error);
            throw new Error('Failed to send contact emails');
        }
    }

    async sendNewsletterWelcome(email, firstName = 'Subscriber') {
        return this.send({
            to: email,
            subject: 'Welcome to The Obvious Company Newsletter',
            html: this.buildNewsletterWelcomeHTML(firstName)
        });
    }

    // Enhanced HTML templates with responsive design and better styling
    buildContactHTML({ name, email, company, message, service }) {
        return `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #2E5BBA 0%, #1e40af 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">New Contact Form Submission</h1>
                </div>
                
                <div style="padding: 30px;">
                    <div style="background: #f8fafc; padding: 25px; border-radius: 12px; border-left: 4px solid #2E5BBA;">
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #1f2937; display: inline-block; width: 80px;">Name:</strong>
                            <span style="color: #374151;">${name}</span>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #1f2937; display: inline-block; width: 80px;">Email:</strong>
                            <a href="mailto:${email}" style="color: #2E5BBA; text-decoration: none;">${email}</a>
                        </div>
                        
                        ${company ? `
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #1f2937; display: inline-block; width: 80px;">Company:</strong>
                                <span style="color: #374151;">${company}</span>
                            </div>
                        ` : ''}
                        
                        ${service ? `
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #1f2937; display: inline-block; width: 80px;">Service:</strong>
                                <span style="color: #374151; background: #e0f2fe; padding: 2px 8px; border-radius: 4px; font-size: 14px;">${service}</span>
                            </div>
                        ` : ''}
                        
                        <div style="margin-top: 20px;">
                            <strong style="color: #1f2937;">Message:</strong>
                            <div style="margin-top: 8px; white-space: pre-wrap; background: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; line-height: 1.6;">${message}</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                            📅 Submitted: ${new Date().toLocaleString()}<br>
                            🌐 Source: Website Contact Form
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    buildAutoReplyHTML(name) {
        return `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #2E5BBA 0%, #1e40af 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Thank you, ${name}!</h1>
                </div>
                
                <div style="padding: 30px;">
                    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
                        We've received your message and will respond within 24 hours. Our team is excited to help you achieve strategic clarity and drive meaningful results.
                    </p>
                    
                    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">Explore Our Resources</h3>
                        <div style="display: block;">
                            <a href="${CONFIG.webhook.baseUrl}/resources.html" 
                               style="display: inline-block; background: #2E5BBA; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; margin: 5px 10px 5px 0; font-weight: 500;">
                               📚 Resources
                            </a>
                            <a href="${CONFIG.webhook.baseUrl}/methodology.html" 
                               style="display: inline-block; background: #2E5BBA; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; margin: 5px 10px 5px 0; font-weight: 500;">
                               🎯 Methodology
                            </a>
                            <a href="${CONFIG.webhook.baseUrl}/assessment/" 
                               style="display: inline-block; background: #2E5BBA; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; margin: 5px 10px 5px 0; font-weight: 500;">
                               📊 Assessment
                            </a>
                        </div>
                    </div>
                    
                    <p style="margin-top: 30px; color: #374151; line-height: 1.6;">
                        Best regards,<br>
                        <strong style="color: #2E5BBA;">The Obvious Company Team</strong>
                    </p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <p style="font-size: 12px; color: #9ca3af; margin: 0; text-align: center;">
                            This is an automated response. Please do not reply to this email directly.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    buildNewsletterWelcomeHTML(firstName) {
        return `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #2E5BBA 0%, #1e40af 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Welcome to our community!</h1>
                </div>
                
                <div style="padding: 30px;">
                    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
                        Thank you for subscribing to The Obvious Company newsletter, ${firstName}!
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 25px;">
                        You'll receive strategic insights, AI updates, and exclusive content designed to amplify your leadership capabilities and drive meaningful organizational transformation.
                    </p>
                    
                    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
                        <h3 style="color: #1e40af; margin: 0 0 10px 0;">What to expect:</h3>
                        <p style="color: #374151; margin: 0; font-size: 14px;">
                            📈 Strategic insights • 🤖 AI implementation guides • 🎯 Leadership development tips
                        </p>
                    </div>
                    
                    <p style="margin-top: 30px; color: #374151; line-height: 1.6;">
                        Best regards,<br>
                        <strong style="color: #2E5BBA;">The Obvious Company Team</strong>
                    </p>
                </div>
            </div>
        `;
    }
}

// Consolidated validation schemas - enhanced with better error messages
const validation = {
    contact: [
        body('name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Name must be between 2 and 100 characters')
            .matches(/^[a-zA-Z\s\-'\.]+$/)
            .withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and periods')
            .escape(),
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail({ gmail_remove_dots: false })
            .isLength({ max: 254 })
            .withMessage('Email address is too long'),
        body('company')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Company name cannot exceed 100 characters')
            .escape(),
        body('message')
            .trim()
            .isLength({ min: 10, max: 1000 })
            .withMessage('Message must be between 10 and 1000 characters')
            .escape(),
        body('service')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Service selection cannot exceed 50 characters')
            .escape()
    ],
    newsletter: [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail({ gmail_remove_dots: false })
            .isLength({ max: 254 })
            .withMessage('Email address is too long'),
        body('firstName')
            .optional()
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('First name must be between 1 and 50 characters')
            .matches(/^[a-zA-Z\s\-'\.]+$/)
            .withMessage('First name can only contain letters, spaces, hyphens, apostrophes, and periods')
            .escape()
    ],
    leadMagnet: [
        body('firstName')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('First name is required and must be between 1 and 50 characters')
            .matches(/^[a-zA-Z\s\-'\.]+$/)
            .withMessage('First name can only contain letters, spaces, hyphens, apostrophes, and periods')
            .escape(),
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail({ gmail_remove_dots: false }),
        body('company')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Company name cannot exceed 100 characters')
            .escape(),
        body('role')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Role cannot exceed 50 characters')
            .escape(),
        body('leadMagnet')
            .trim()
            .isIn(['strategic-readiness-checklist', 'energy-optimization-audit', 'ai-integration-worksheet'])
            .withMessage('Invalid lead magnet selection')
    ]
};

// Enhanced rate limiter factory with customizable messages
const createRateLimit = (config, message = 'Too many requests, please try again later.') => 
    rateLimit({
        ...config,
        message: { success: false, message, retryAfter: Math.ceil(config.windowMs / 1000) },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            console.warn(`🚫 Rate limit exceeded: ${req.ip} for ${req.path}`);
            res.status(429).json({ 
                success: false, 
                message,
                retryAfter: Math.ceil(config.windowMs / 1000)
            });
        }
    });

// Initialize services
const services = new ServiceManager();
const emailService = new EmailService(null); // Will be updated after initialization

// Enhanced security middleware with optimized CSP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://www.google-analytics.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https:"],
            frameSrc: ["https://calendly.com"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            upgradeInsecureRequests: CONFIG.isProduction ? [] : null
        }
    },
    crossOriginEmbedderPolicy: false, // Allow iframe embedding for Calendly
    hsts: {
        maxAge: CONFIG.isProduction ? 31536000 : 0, // 1 year in production
        includeSubDomains: true,
        preload: true
    }
}));

// Performance middleware with intelligent compression
app.use(compression({ 
    threshold: 1024, // Only compress responses larger than 1KB
    level: CONFIG.isProduction ? 6 : 4, // Higher compression in production
    filter: (req, res) => {
        // Don't compress images or already compressed content
        const contentType = res.getHeader('Content-Type') || '';
        return !contentType.startsWith('image/') && !contentType.includes('compressed');
    }
}));

// Enhanced CORS with environment-specific settings
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || (CONFIG.isDevelopment ? '*' : false),
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Apply general rate limiting only to API endpoints, not static files
app.use('/api', createRateLimit(CONFIG.rateLimits.api, 'Too many API requests from your IP, please try again later.'));

// Apply a very lenient rate limit for dynamic routes only (not static files)
app.use((req, res, next) => {
    // Skip rate limiting for static files
    if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/)) {
        return next();
    }
    // Apply lenient rate limiting for HTML pages and dynamic routes
    createRateLimit({ windowMs: 1 * 60 * 1000, max: 200 }, 'Too many page requests, please slow down.')(req, res, next);
});

// Enhanced body parsing with validation
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        try { 
            JSON.parse(buf); 
        } 
        catch (e) { 
            throw new Error('Invalid JSON payload'); 
        }
    }
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb',
    parameterLimit: 50 // Prevent parameter pollution attacks
}));

// Optimized static file serving with intelligent caching
app.use(express.static(path.join(__dirname, '..'), {
    maxAge: CONFIG.isProduction ? '1d' : '1h',
    etag: true,
    lastModified: true,
    dotfiles: 'deny', // Security: don't serve dotfiles
    setHeaders: (res, filePath, stat) => {
        // Cache different file types for different durations
        if (/\.(css|js)$/.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year for static assets
        } else if (/\.(png|jpg|jpeg|gif|svg|webp)$/.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days for images
        } else if (/\.(html)$/.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes for HTML
        }
    }
}));

// Utility functions for better code organization
const handleValidationErrors = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
        return true;
    }
    return false;
};

const trackEvent = (eventName, data = {}) => {
    try {
        if (services.analytics?.engine) {
            services.analytics.engine.trackEvent(eventName, {
                ...data,
                timestamp: new Date().toISOString(),
                environment: CONFIG.isDevelopment ? 'development' : 'production'
            });
        } else if (services.analytics?.trackEvent) {
            services.analytics.trackEvent(eventName, data);
        }
    } catch (error) {
        console.warn('⚠️  Analytics tracking failed:', error.message);
    }
};

// Route setup function - called after service initialization
function setupRoutes() {
    // Update email service with initialized transporter
    emailService.updateTransporter(services.email);

    // Mount optional service routes with enhanced error handling
    try {
        if (services.analytics?.routes) {
            app.use('/api/analytics', services.analytics.routes);
            console.log('✅ Analytics routes mounted at /api/analytics');
        } else if (services.analytics?.getRoutes) {
            app.use('/api/analytics', services.analytics.getRoutes());
            console.log('✅ Analytics routes mounted at /api/analytics');
        } else {
            // Fallback analytics routes to prevent client-side errors
            console.log('📊 Setting up fallback analytics routes');
            
            app.post('/api/analytics/track', 
                createRateLimit(CONFIG.rateLimits.api, 'Too many analytics requests'),
                (req, res) => {
                    // Simple fallback - just acknowledge the request
                    if (CONFIG.enableDetailedLogging) {
                        console.log('📊 Analytics event (fallback):', {
                            type: req.body?.eventType,
                            session: req.body?.sessionId?.substring(0, 10) + '...',
                            timestamp: new Date().toISOString()
                        });
                    }
                    res.json({ success: true, message: 'Event tracked (fallback mode)' });
                }
            );
            
            app.post('/api/analytics/batch-track',
                createRateLimit(CONFIG.rateLimits.api, 'Too many analytics requests'),
                (req, res) => {
                    if (CONFIG.enableDetailedLogging) {
                        console.log('📊 Batch analytics events (fallback):', {
                            count: req.body?.events?.length || 0,
                            timestamp: new Date().toISOString()
                        });
                    }
                    res.json({ success: true, message: 'Batch events tracked (fallback mode)' });
                }
            );
            
            console.log('✅ Fallback analytics routes mounted at /api/analytics');
        }

        if (services.integrations?.getRoutes) {
            app.use('/api/integrations', services.integrations.getRoutes());
            console.log('✅ Integration routes mounted at /api/integrations');
        }

        if (optionalModules.launchRoutes) {
            app.use('/api/launch', optionalModules.launchRoutes);
            console.log('✅ Launch routes mounted at /api/launch');
        }
        
        // Mount assessment routes
        try {
            const assessmentRoutes = require('./src/routes/assessmentRoutes');
            app.use('/api/assessment', assessmentRoutes);
            console.log('✅ Assessment routes mounted at /api/assessment');
        } catch (error) {
            console.warn('⚠️  Assessment routes not available:', error.message);
        }

        // Mount payment routes
        try {
            const paymentRoutes = require('./src/routes/paymentRoutes');
            app.use('/api', paymentRoutes);
            console.log('✅ Payment routes mounted at /api');
        } catch (error) {
            console.warn('⚠️  Payment routes not available:', error.message);
        }
    } catch (error) {
        console.error('❌ Error mounting service routes:', error.message);
    }

    // Main page route with better error handling
    app.get('/', (req, res, next) => {
        try {
            res.sendFile(path.join(__dirname, '..', 'index.html'));
        } catch (error) {
            next(error);
        }
    });

    // Enhanced contact form endpoint with comprehensive error handling
    app.post('/api/contact', 
        createRateLimit(CONFIG.rateLimits.forms, 'Too many contact form submissions. Please try again in an hour.'),
        validation.contact,
        async (req, res) => {
            try {
                if (handleValidationErrors(req, res)) return;

                // Check if email service is available
                if (!services.email) {
                    return res.status(503).json({
                        success: false,
                        message: 'Email service is temporarily unavailable. Please try again later or contact us directly.',
                        fallbackContact: CONFIG.email.contactEmail
                    });
                }

                // Send contact emails
                await emailService.sendContactEmails(req.body);

                // Track successful submission
                trackEvent('contact_form_submission', { 
                    hasCompany: !!req.body.company,
                    hasService: !!req.body.service,
                    messageLength: req.body.message?.length || 0,
                    userAgent: req.get('User-Agent'),
                    ip: req.ip?.replace(/\d+\.\d+\.\d+\.\d+/, 'xxx.xxx.xxx.xxx') // Privacy
                });

                res.json({
                    success: true,
                    message: 'Message sent successfully! We\'ll respond within 24 hours.',
                    nextSteps: 'Check out our resources while you wait for our response.'
                });

            } catch (error) {
                console.error('Contact form error:', {
                    error: error.message,
                    email: req.body.email,
                    timestamp: new Date().toISOString()
                });

                res.status(500).json({
                    success: false,
                    message: 'Failed to send message. Please try again later.',
                    supportEmail: CONFIG.email.contactEmail
                });
            }
        }
    );

    // Enhanced newsletter signup endpoint with duplicate handling
    app.post('/api/newsletter',
        createRateLimit(CONFIG.rateLimits.newsletter, 'Too many newsletter signups. Please try again later.'),
        validation.newsletter,
        async (req, res) => {
            try {
                if (handleValidationErrors(req, res)) return;

                const { email, firstName = 'Subscriber' } = req.body;

                // Integration manager handling with error resilience
                let integrationSuccess = false;
                if (services.integrations?.handleLeadCapture) {
                    try {
                        await services.integrations.handleLeadCapture({
                            firstName,
                            email,
                            source: 'newsletter_signup',
                            timestamp: new Date().toISOString()
                        });
                        integrationSuccess = true;
                    } catch (integrationError) {
                        console.warn('⚠️  Integration capture failed:', integrationError.message);
                        // Continue with email sending even if integration fails
                    }
                }

                // Send welcome email
                if (services.email) {
                    try {
                        await emailService.sendNewsletterWelcome(email, firstName);
                    } catch (emailError) {
                        console.warn('⚠️  Welcome email failed:', emailError.message);
                        // Don't fail the entire request if welcome email fails
                    }
                }

                // Track successful signup
                trackEvent('newsletter_signup', { 
                    email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Privacy-safe email
                    hasFirstName: !!firstName && firstName !== 'Subscriber',
                    source: 'website',
                    integrationSuccess
                });

                res.json({
                    success: true,
                    message: 'Successfully subscribed to newsletter! Welcome email sent.',
                    nextSteps: 'Keep an eye on your inbox for strategic insights and exclusive content.'
                });

            } catch (error) {
                console.error('Newsletter signup error:', {
                    error: error.message,
                    email: req.body.email,
                    timestamp: new Date().toISOString()
                });

                res.status(500).json({
                    success: false,
                    message: 'Subscription failed. Please try again later.',
                    fallback: 'You can also contact us directly to join our newsletter.'
                });
            }
        }
    );

    // Lead magnet endpoint (from the more detailed version)
    app.post('/api/lead-magnet',
        createRateLimit(CONFIG.rateLimits.leadMagnet, 'Too many download requests. Please try again later.'),
        validation.leadMagnet,
        async (req, res) => {
            try {
                if (handleValidationErrors(req, res)) return;

                const { firstName, email, company, role, leadMagnet } = req.body;

                // Integration manager handling
                if (services.integrations?.handleLeadCapture) {
                    await services.integrations.handleLeadCapture({
                        firstName,
                        email,
                        company,
                        role,
                        source: `lead_magnet_${leadMagnet}`,
                        leadMagnetType: leadMagnet
                    });
                }

                // Track lead magnet download
                trackEvent('lead_magnet_download', {
                    leadMagnet,
                    hasCompany: !!company,
                    hasRole: !!role
                });

                res.json({
                    success: true,
                    message: 'Download link sent to your email!',
                    downloadUrl: `/downloads/${leadMagnet}.pdf` // This would be the actual download URL
                });

            } catch (error) {
                console.error('Lead magnet error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to process download request. Please try again.'
                });
            }
        }
    );

    // Enhanced health check endpoint with detailed service status
    app.get('/api/health', async (req, res) => {
        const serviceStatus = services.getServiceStatus();
        
        // Check database health
        let databaseHealth = { status: 'not_configured' };
        try {
            const { getDatabase } = require('./src/database/connection');
            const db = getDatabase();
            databaseHealth = await db.healthCheck();
        } catch (error) {
            databaseHealth = { status: 'error', message: error.message };
        }
        
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            services: {
                ...serviceStatus,
                database: databaseHealth
            },
            system: {
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                version: process.version,
                platform: process.platform
            },
            environment: process.env.NODE_ENV || 'development',
            config: {
                emailConfigured: !!CONFIG.email.user,
                databaseConfigured: !!CONFIG.db.host,
                productionMode: CONFIG.isProduction,
                detailedLogging: CONFIG.enableDetailedLogging
            }
        };

        // Set status based on critical services
        if (!serviceStatus.email && CONFIG.email.user) {
            healthStatus.status = 'degraded';
            healthStatus.warnings = ['Email service unavailable'];
        }

        res.json(healthStatus);
    });

    // API status endpoint for monitoring
    app.get('/api/status', (req, res) => {
        res.json({
            api: 'The Obvious Company API',
            version: '2.0.0',
            status: 'operational',
            endpoints: {
                'POST /api/contact': 'Contact form submission',
                'POST /api/newsletter': 'Newsletter subscription',
                'POST /api/lead-magnet': 'Lead magnet download',
                'GET /api/health': 'Health check',
                'GET /api/status': 'API status'
            }
        });
    });

    // Enhanced 404 handler with helpful suggestions
    app.use((req, res) => {
        console.log(`📝 404 - Route not found: ${req.method} ${req.url}`);
        
        // Try to serve custom 404 page
        const notFoundPath = path.join(__dirname, '..', '404.html');
        res.status(404);
        
        res.sendFile(notFoundPath, (err) => {
            if (err) {
                // Fallback to JSON response with helpful information
                res.json({
                    success: false,
                    message: 'Page not found',
                    suggestion: 'Check the URL or visit our homepage',
                    availableEndpoints: [
                        'GET /',
                        'POST /api/contact',
                        'POST /api/newsletter', 
                        'POST /api/lead-magnet',
                        'GET /api/health',
                        'GET /api/status'
                    ],
                    homepage: CONFIG.webhook.baseUrl
                });
            }
        });
    });

    // Comprehensive error handler with environment-aware responses
    app.use((err, req, res, next) => {
        // Log detailed error information
        const errorInfo = {
            message: err.message,
            stack: CONFIG.enableDetailedLogging ? err.stack : undefined,
            url: req.url,
            method: req.method,
            body: CONFIG.enableDetailedLogging ? req.body : undefined,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString(),
            ip: req.ip
        };

        console.error('💥 Application error:', errorInfo);

        // Track error in analytics
        trackEvent('application_error', {
            errorType: err.name || 'UnknownError',
            errorMessage: err.message,
            url: req.url,
            method: req.method,
            statusCode: err.status || 500
        });

        // Send appropriate response based on environment
        const statusCode = err.status || 500;
        const response = {
            success: false,
            message: CONFIG.isDevelopment ? err.message : 'Something went wrong!',
            timestamp: new Date().toISOString()
        };

        if (CONFIG.isDevelopment) {
            response.stack = err.stack;
            response.details = errorInfo;
        }

        if (statusCode >= 500) {
            response.supportInfo = 'If this problem persists, please contact our support team.';
            response.supportEmail = CONFIG.email.contactEmail;
        }

        res.status(statusCode).json(response);
    });
}

// Initialize services and start server with enhanced startup sequence
async function startServer() {
    try {
        console.log('🚀 Starting The Obvious Company server...');
        
        // Add comprehensive error handling middleware
        app.use((err, req, res, next) => {
            console.error('💥 Unhandled error:', {
                message: err.message,
                stack: CONFIG.isDevelopment ? err.stack : 'Hidden in production',
                url: req.url,
                method: req.method,
                timestamp: new Date().toISOString()
            });
            
            // Don't expose error details in production
            const message = CONFIG.isDevelopment ? err.message : 'Internal server error';
            
            res.status(err.status || 500).json({
                success: false,
                message,
                ...(CONFIG.isDevelopment && { stack: err.stack })
            });
        });
        
        // Handle 404 errors
        app.use((req, res) => {
            console.warn('🔍 404 Not Found:', req.url);
            
            // Serve 404.html if it exists, otherwise JSON response
            const notFoundPath = path.join(__dirname, '..', '404.html');
            
            if (req.accepts('html') && require('fs').existsSync(notFoundPath)) {
                res.status(404).sendFile(notFoundPath);
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Resource not found',
                    path: req.url
                });
            }
        });
        
        // Initialize all services
        const serviceStatus = await services.initialize();
        
        // Setup all routes after services are initialized
        setupRoutes();
        
        // Start the HTTP server
        const server = app.listen(PORT, () => {
            console.log('');
            console.log('🎉 ================================');
            console.log('🚀 Server running successfully!');
            console.log(`📍 Port: ${PORT}`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📧 Email: ${serviceStatus.email ? '✅ Enabled' : '❌ Disabled'}`);
            console.log(`📊 Analytics: ${serviceStatus.analytics ? '✅ Active' : '⚪ Inactive'}`);
            console.log(`🔗 Integrations: ${serviceStatus.integrations ? '✅ Active' : '⚪ Inactive'}`);
            console.log(`🛡️  Security: ✅ Active (Helmet + CSP)`);
            console.log(`⚡ Compression: ✅ Active`);
            console.log(`🚫 Rate Limiting: ✅ Active`);
            console.log(`📝 Detailed Logging: ${CONFIG.enableDetailedLogging ? '✅ Enabled' : '⚪ Disabled'}`);
            console.log('🎉 ================================');
            console.log('');
            
            if (!serviceStatus.email) {
                console.warn('⚠️  WARNING: Email service is disabled. Contact forms will not work.');
            }
            
            if (CONFIG.isDevelopment) {
                console.log(`🔗 Local URL: http://localhost:${PORT}`);
                console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
            }
        });

        // Enhanced graceful shutdown handler
        const gracefulShutdown = (signal) => {
            console.log(`\n${signal} received - initiating graceful shutdown...`);
            
            server.close(async (err) => {
                if (err) {
                    console.error('❌ Error during server shutdown:', err);
                    process.exit(1);
                }
                
                console.log('✅ HTTP server closed');
                
                try {
                    // Close services in reverse order of initialization
                    if (services.integrations?.close) {
                        await services.integrations.close();
                        console.log('✅ Integration manager closed');
                    }
                    
                    if (services.email?.close) {
                        services.email.close();
                        console.log('✅ Email transporter closed');
                    }
                    
                    if (services.analytics?.shutdown) {
                        await services.analytics.shutdown();
                        console.log('✅ Analytics system shut down');
                    }
                    
                    console.log('🎉 Graceful shutdown completed');
                    process.exit(0);
                    
                } catch (shutdownError) {
                    console.error('❌ Error during service shutdown:', shutdownError);
                    process.exit(1);
                }
            });
            
            // Force shutdown after 30 seconds
            setTimeout(() => {
                console.error('⚠️  Forced shutdown due to timeout');
                process.exit(1);
            }, 30000);
        };

        // Register shutdown handlers
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
        // Handle process warnings
        process.on('warning', (warning) => {
            if (CONFIG.enableDetailedLogging) {
                console.warn('⚠️  Process warning:', warning);
            }
        });

        return server;
        
    } catch (error) {
        console.error('💥 Server startup failed:', error);
        process.exit(1);
    }
}

// Start the server
startServer().catch(error => {
    console.error('💥 Critical startup error:', error);
    process.exit(1);
});

// Export for testing and external use
module.exports = { app, services, CONFIG };