import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Import audit and security systems
import { AuditSystem } from './audit/index';
import { createAuditMiddleware, createAssessmentAuditMiddleware, createAuthAuditMiddleware } from './audit/middleware';
import { createAuditRoutes } from './audit/routes';
import { EncryptionService } from './security/EncryptionService';
import { SecurityManager } from './security/SecurityManager';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/obvious_company',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize security and audit systems
let auditSystem: AuditSystem | null = null;
let encryptionService: EncryptionService | null = null;
let securityManager: SecurityManager | null = null;

async function initializeSecuritySystems() {
  try {
    // Initialize encryption service
    encryptionService = new EncryptionService({
      algorithm: 'aes-256-gcm',
      keyDerivation: 'pbkdf2',
      iterations: 100000
    });

    // Initialize security manager
    securityManager = new SecurityManager(db, encryptionService);
    await securityManager.initialize();

    // Initialize audit system
    auditSystem = new AuditSystem(db, encryptionService || undefined, {
      retentionPeriodDays: 2555, // 7 years
      monitoringIntervalMinutes: 15,
      enableAutomatedTesting: true,
      anonymizationConfig: {
        preserveStructure: true,
        saltLength: 32,
        hashAlgorithm: 'sha256',
        dateGranularity: 'week',
        numericRounding: 5
      }
    });

    await auditSystem.initialize();
    console.log('✅ Security and audit systems initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize security systems:', error);
    throw error;
  }
}

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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Contact form rate limiting (more restrictive)
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 contact form submissions per hour
  message: 'Too many contact form submissions, please try again later.'
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Audit middleware (applied after security systems are initialized)
app.use((req, res, next) => {
  if (auditSystem) {
    // Apply audit middleware
    const auditMiddleware = createAuditMiddleware({
      auditSystem,
      excludePaths: ['/static', '/assets', '/favicon.ico'],
      sensitiveFields: ['password', 'token', 'secret', 'ssn', 'creditCard'],
      logLevel: 'all'
    });
    auditMiddleware(req, res, next);
  } else {
    next();
  }
});

// Assessment-specific audit middleware
app.use((req, res, next) => {
  if (auditSystem && req.path.startsWith('/api/assessment')) {
    const assessmentAuditMiddleware = createAssessmentAuditMiddleware({
      auditSystem
    });
    assessmentAuditMiddleware(req, res, next);
  } else {
    next();
  }
});

// Authentication audit middleware
app.use((req, res, next) => {
  if (auditSystem && (req.path.startsWith('/api/auth') || req.path.startsWith('/api/login'))) {
    const authAuditMiddleware = createAuthAuditMiddleware({
      auditSystem
    });
    authAuditMiddleware(req, res, next);
  } else {
    next();
  }
});

// Static files with caching
app.use(express.static(path.join(__dirname, '..', '..'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Email transporter setup
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Validation middleware
const contactValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('company').optional().trim().isLength({ max: 100 }).escape(),
  body('message').trim().isLength({ min: 10, max: 1000 }).escape(),
  body('service').optional().trim().isLength({ max: 50 }).escape()
];

// Import assessment routes and documentation
import { assessmentRoutes } from './api/routes/assessmentRoutes';
import { documentationRoutes } from './api/documentation';

// Mount audit routes
app.use('/api/audit', (req, res, next) => {
  if (auditSystem) {
    const auditRoutes = createAuditRoutes(auditSystem);
    auditRoutes(req, res, next);
  } else {
    res.status(503).json({
      success: false,
      message: 'Audit system not available'
    });
  }
});

// Mount assessment routes
app.use('/api/assessments', assessmentRoutes);

// Mount API documentation routes
app.use('/api/docs', documentationRoutes);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'index.html'));
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        auditSystem: auditSystem ? 'initialized' : 'not_initialized',
        securityManager: securityManager ? 'initialized' : 'not_initialized'
      },
      uptime: process.uptime()
    };

    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// API Routes
app.post('/api/contact', contactLimiter, contactValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, company, message, service } = req.body;

    // Email content
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
      subject: `New Contact Form Submission - ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
        ${service ? `<p><strong>Service Interest:</strong> ${service}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>Submitted at: ${new Date().toLocaleString()}</small></p>
      `
    };

    // Auto-reply to user
    const autoReply = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Thank you for contacting The Obvious Company',
      html: `
        <h2>Thank you for your interest, ${name}!</h2>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <p>In the meantime, feel free to explore our <a href="${process.env.WEBSITE_URL || 'http://localhost:3000'}/resources.html">resources</a> or learn more about our <a href="${process.env.WEBSITE_URL || 'http://localhost:3000'}/methodology.html">methodology</a>.</p>
        <br>
        <p>Best regards,<br>The Obvious Company Team</p>
        <hr>
        <p><small>This is an automated response. Please do not reply to this email.</small></p>
      `
    };

    // Send emails
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(autoReply);

    res.json({
      success: true,
      message: 'Message sent successfully!'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
});

// Newsletter signup
app.post('/api/newsletter', rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3
}), [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Welcome to The Obvious Company Newsletter',
      html: `
        <h2>Welcome to our community!</h2>
        <p>Thank you for subscribing to The Obvious Company newsletter.</p>
        <p>You'll receive strategic insights, AI updates, and exclusive content to help amplify your leadership capabilities.</p>
        <br>
        <p>Best regards,<br>The Obvious Company Team</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Successfully subscribed to newsletter!'
    });

  } catch (error) {
    console.error('Newsletter signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe. Please try again later.'
    });
  }
});

// Assessment results endpoint
app.post('/api/assessment-results', rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10
}), [
  body('assessmentType').trim().isLength({ min: 1, max: 50 }).escape(),
  body('responses').isObject(),
  body('results').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { assessmentType, responses, results, timestamp, sessionId } = req.body;

    // Log assessment completion for audit trail
    console.log(`Assessment completed: ${assessmentType} at ${timestamp}`);

    res.json({
      success: true,
      message: 'Assessment results recorded successfully'
    });

  } catch (error) {
    console.error('Assessment results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process assessment results'
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  // Log error to audit system if available
  if (auditSystem) {
    auditSystem.getAuditLogger().logEvent({
      eventType: 'system_error',
      resource: req.path,
      action: 'error_occurred',
      details: {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'high',
      complianceFlags: ['system_error']
    }).catch(auditError => {
      console.error('Failed to log error to audit system:', auditError);
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', '..', '404.html'));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  if (auditSystem) {
    await auditSystem.shutdown();
  }
  
  if (securityManager) {
    await securityManager.shutdown();
  }
  
  await db.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  if (auditSystem) {
    await auditSystem.shutdown();
  }
  
  if (securityManager) {
    await securityManager.shutdown();
  }
  
  await db.end();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Initialize security systems first
    await initializeSecuritySystems();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Audit system: ${auditSystem ? 'Active' : 'Inactive'}`);
      console.log(`🔒 Security manager: ${securityManager ? 'Active' : 'Inactive'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export { app, auditSystem, securityManager };