---
title: "Integrationmanager"
type: "framework"
audience: "clients"
version: "v2025.js"
dependencies:
  - "" # Add dependencies here
implementations:
  - "" # Add implementations here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

"use strict";
/**
 * Integration Manager
 * Coordinates all external system integrations
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationManager = void 0;
const pg_1 = require("pg");
const nodemailer = __importStar(require("nodemailer"));
const crmIntegration_1 = require("./crmIntegration");
const emailMarketingIntegration_1 = require("./emailMarketingIntegration");
const calendarIntegration_1 = require("./calendarIntegration");
const webhookSystem_1 = require("./webhookSystem");
class IntegrationManager {
    constructor(config) {
        this.initializeDatabase(config.database);
        this.initializeEmailTransporter(config.email);
        this.initializeIntegrations(config);
    }
    /**
     * Initialize database connection
     */
    initializeDatabase(dbConfig) {
        this.db = new pg_1.Pool({
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database,
            user: dbConfig.user,
            password: dbConfig.password,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        this.db.on('error', (err) => {
            console.error('Database connection error:', err);
        });
        console.log('✅ Database connection initialized');
    }
    /**
     * Initialize email transporter
     */
    initializeEmailTransporter(emailConfig) {
        this.transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.port === 465,
            auth: {
                user: emailConfig.user,
                pass: emailConfig.password
            }
        });
        console.log('✅ Email transporter initialized');
    }
    /**
     * Initialize all integrations
     */
    initializeIntegrations(config) {
        // Initialize webhook system first (other systems depend on it)
        this.webhooks = new webhookSystem_1.WebhookSystem(this.db, {
            maxConcurrentDeliveries: 10
        });
        // Initialize CRM integration
        this.crm = new crmIntegration_1.CRMIntegration(this.db, {
            webhookUrl: `${config.webhook.baseUrl}/api/webhooks/crm`,
            apiKey: config.webhook.secret
        });
        // Initialize email marketing integration
        this.emailMarketing = new emailMarketingIntegration_1.EmailMarketingIntegration(this.db, this.transporter, {
            baseUrl: config.emailMarketing.baseUrl,
            unsubscribeSecret: config.emailMarketing.unsubscribeSecret
        });
        // Initialize calendar integration
        this.calendar = new calendarIntegration_1.CalendarIntegration(this.db, {
            baseUrl: config.calendar.baseUrl,
            webhookSecret: config.calendar.webhookSecret
        });
        console.log('✅ All integrations initialized');
    }
    /**
     * Handle assessment completion - orchestrates all integrations
     */
    async handleAssessmentCompletion(assessmentData) {
        try {
            console.log(`Processing assessment completion for ${assessmentData.email}`);
            // 1. Create or update lead in CRM
            const leadData = await this.crm.createOrUpdateLead({
                firstName: assessmentData.firstName,
                email: assessmentData.email,
                company: assessmentData.company,
                role: assessmentData.role,
                source: 'assessment_completion',
                assessmentType: assessmentData.assessmentType,
                persona: assessmentData.persona,
                readinessScore: assessmentData.readinessScore,
                recommendedService: assessmentData.serviceRecommendation,
                status: 'new_lead',
                timestamp: assessmentData.timestamp,
                customFields: {
                    industry: assessmentData.industry,
                    assessmentResults: assessmentData.assessmentResults
                }
            });
            // 2. Subscribe to email marketing and trigger assessment-based campaign
            await this.emailMarketing.triggerAssessmentCampaign({
                email: assessmentData.email,
                firstName: assessmentData.firstName,
                persona: assessmentData.persona,
                industry: assessmentData.industry,
                readinessScore: assessmentData.readinessScore,
                assessmentType: assessmentData.assessmentType,
                serviceRecommendation: assessmentData.serviceRecommendation
            });
            // 3. Send webhook notifications to external systems
            await this.webhooks.triggerEvent('assessment_completed', {
                leadId: leadData.id,
                email: assessmentData.email,
                persona: assessmentData.persona,
                readinessScore: assessmentData.readinessScore,
                serviceRecommendation: assessmentData.serviceRecommendation,
                assessmentType: assessmentData.assessmentType
            });
            // 4. Log CRM activity
            await this.crm.logActivity(leadData.id, 'assessment_completed', `Completed ${assessmentData.assessmentType} assessment with ${assessmentData.readinessScore}% readiness score`, {
                persona: assessmentData.persona,
                serviceRecommendation: assessmentData.serviceRecommendation,
                industry: assessmentData.industry
            });
            console.log(`✅ Assessment completion processed successfully for ${assessmentData.email}`);
        }
        catch (error) {
            console.error('❌ Failed to handle assessment completion:', error);
            throw error;
        }
    }
    /**
     * Handle consultation scheduling
     */
    async handleConsultationScheduling(schedulingData) {
        try {
            console.log(`Processing consultation scheduling for ${schedulingData.email}`);
            // 1. Create consultation request
            const requestId = await this.calendar.createConsultationRequest({
                email: schedulingData.email,
                firstName: schedulingData.firstName,
                lastName: schedulingData.lastName,
                company: schedulingData.company,
                role: schedulingData.role,
                service: schedulingData.service,
                persona: schedulingData.persona,
                readinessScore: schedulingData.readinessScore,
                preferredTimes: schedulingData.preferredTimes,
                timezone: schedulingData.timezone,
                message: schedulingData.message
            });
            // 2. Update CRM lead status
            await this.crm.updateLeadStatus(schedulingData.email, 'consultation_scheduled', {
                consultationRequestId: requestId,
                service: schedulingData.service,
                preferredTimes: schedulingData.preferredTimes
            });
            // 3. Send webhook notification
            await this.webhooks.triggerEvent('consultation_requested', {
                requestId,
                email: schedulingData.email,
                service: schedulingData.service,
                persona: schedulingData.persona,
                source: schedulingData.source
            });
            // 4. Log CRM activity
            const lead = await this.crm.getLeadByEmail(schedulingData.email);
            if (lead) {
                await this.crm.logActivity(lead.id, 'consultation_scheduled', `Requested consultation for ${schedulingData.service}`, {
                    requestId,
                    preferredTimes: schedulingData.preferredTimes,
                    timezone: schedulingData.timezone
                });
            }
            console.log(`✅ Consultation scheduling processed successfully: ${requestId}`);
            return requestId;
        }
        catch (error) {
            console.error('❌ Failed to handle consultation scheduling:', error);
            throw error;
        }
    }
    /**
     * Handle lead capture from various sources
     */
    async handleLeadCapture(leadData) {
        try {
            console.log(`Processing lead capture for ${leadData.email} from ${leadData.source}`);
            // 1. Create or update lead in CRM
            const crmLead = await this.crm.createOrUpdateLead({
                firstName: leadData.firstName,
                email: leadData.email,
                company: leadData.company,
                role: leadData.role,
                source: leadData.source,
                persona: leadData.persona,
                readinessScore: leadData.readinessScore,
                status: 'new_lead',
                timestamp: new Date().toISOString(),
                customFields: leadData.customFields
            });
            // 2. Subscribe to email marketing
            await this.emailMarketing.subscribeUser({
                email: leadData.email,
                firstName: leadData.firstName,
                company: leadData.company,
                role: leadData.role,
                persona: leadData.persona,
                readinessScore: leadData.readinessScore,
                customFields: leadData.customFields || {}
            });
            // 3. Send webhook notification
            await this.webhooks.triggerEvent('lead_captured', {
                leadId: crmLead.id,
                email: leadData.email,
                source: leadData.source,
                persona: leadData.persona
            });
            console.log(`✅ Lead capture processed successfully for ${leadData.email}`);
        }
        catch (error) {
            console.error('❌ Failed to handle lead capture:', error);
            throw error;
        }
    }
    /**
     * Handle email engagement tracking
     */
    async handleEmailEngagement(engagementData) {
        try {
            // 1. Track in email marketing system
            if (engagementData.type === 'opened') {
                // Email marketing system handles this via tracking pixel
            }
            else if (engagementData.type === 'clicked' && engagementData.url) {
                // Email marketing system handles this via click tracking
            }
            // 2. Update CRM activity
            const lead = await this.crm.getLeadByEmail(engagementData.email);
            if (lead) {
                const activityType = engagementData.type === 'opened' ? 'email_opened' : 'link_clicked';
                await this.crm.logActivity(lead.id, activityType, `Email ${engagementData.type}: ${engagementData.templateId}`, {
                    campaignId: engagementData.campaignId,
                    templateId: engagementData.templateId,
                    url: engagementData.url
                });
            }
            // 3. Send webhook notification
            await this.webhooks.triggerEvent('email_engagement', {
                email: engagementData.email,
                type: engagementData.type,
                campaignId: engagementData.campaignId,
                templateId: engagementData.templateId,
                url: engagementData.url
            });
        }
        catch (error) {
            console.error('❌ Failed to handle email engagement:', error);
        }
    }
    /**
     * Setup default email campaigns
     */
    async setupDefaultEmailCampaigns() {
        try {
            console.log('Setting up default email campaigns...');
            // Assessment completion campaign for Strategic Architects
            await this.emailMarketing.createAssessmentBasedCampaign({
                name: 'Strategic Architect Assessment Follow-up',
                trigger: 'assessment_completed',
                personaTargets: ['Strategic Architect'],
                readinessScoreRange: { min: 70, max: 100 },
                emailSequence: [
                    {
                        subject: '{{firstName}}, your Strategic Intelligence roadmap is ready',
                        htmlContent: this.getEmailTemplate('strategic_architect_welcome'),
                        textContent: 'Your strategic intelligence roadmap is ready...',
                        delayHours: 0.5, // 30 minutes
                        cta: {
                            text: 'Schedule Your Executive Consultation',
                            url: '/calendar/consultation?service=mastery',
                            trackingId: 'strategic_architect_cta_1'
                        }
                    },
                    {
                        subject: 'The #1 mistake executives make with AI (and how to avoid it)',
                        htmlContent: this.getEmailTemplate('strategic_architect_mistake'),
                        textContent: 'The #1 mistake executives make with AI...',
                        delayHours: 24,
                        cta: {
                            text: 'Learn More About Executive AI Mastery',
                            url: '/services/mastery',
                            trackingId: 'strategic_architect_cta_2'
                        }
                    },
                    {
                        subject: '{{firstName}}, ready to amplify your strategic intelligence?',
                        htmlContent: this.getEmailTemplate('strategic_architect_final'),
                        textContent: 'Ready to amplify your strategic intelligence?',
                        delayHours: 72,
                        cta: {
                            text: 'Schedule Your Free Consultation',
                            url: '/calendar/consultation?service=mastery',
                            trackingId: 'strategic_architect_cta_3'
                        }
                    }
                ]
            });
            // Assessment completion campaign for Strategic Contributors
            await this.emailMarketing.createAssessmentBasedCampaign({
                name: 'Strategic Contributor Assessment Follow-up',
                trigger: 'assessment_completed',
                personaTargets: ['Strategic Contributor'],
                readinessScoreRange: { min: 40, max: 80 },
                emailSequence: [
                    {
                        subject: '{{firstName}}, your Strategic Foundation plan is ready',
                        htmlContent: this.getEmailTemplate('strategic_contributor_welcome'),
                        textContent: 'Your strategic foundation plan is ready...',
                        delayHours: 1,
                        cta: {
                            text: 'Get Started with Foundation Program',
                            url: '/services/foundation',
                            trackingId: 'strategic_contributor_cta_1'
                        }
                    },
                    {
                        subject: 'How to build strategic AI capabilities in your department',
                        htmlContent: this.getEmailTemplate('strategic_contributor_department'),
                        textContent: 'How to build strategic AI capabilities...',
                        delayHours: 48,
                        cta: {
                            text: 'Schedule Your Strategy Session',
                            url: '/calendar/consultation?service=foundation',
                            trackingId: 'strategic_contributor_cta_2'
                        }
                    }
                ]
            });
            // Welcome campaign for newsletter subscribers
            await this.emailMarketing.createAssessmentBasedCampaign({
                name: 'Newsletter Welcome Sequence',
                trigger: 'user_subscribed',
                personaTargets: [], // All personas
                emailSequence: [
                    {
                        subject: 'Welcome to Strategic Intelligence Amplification, {{firstName}}',
                        htmlContent: this.getEmailTemplate('newsletter_welcome'),
                        textContent: 'Welcome to Strategic Intelligence Amplification...',
                        delayHours: 0.25, // 15 minutes
                        cta: {
                            text: 'Take Your Strategic Assessment',
                            url: '/assessment/',
                            trackingId: 'newsletter_welcome_cta'
                        }
                    }
                ]
            });
            console.log('✅ Default email campaigns set up successfully');
        }
        catch (error) {
            console.error('❌ Failed to setup default email campaigns:', error);
        }
    }
    /**
     * Get email template content (placeholder - would load from templates)
     */
    getEmailTemplate(templateName) {
        const templates = {
            strategic_architect_welcome: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2E5BBA;">{{firstName}}, Your Strategic Intelligence Roadmap</h1>
                    <p>Based on your assessment results, you're positioned as a <strong>Strategic Architect</strong> with exceptional potential for enterprise-wide AI transformation.</p>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Your Next Steps:</h3>
                        <ul>
                            <li>Executive-level strategic planning session</li>
                            <li>Enterprise implementation roadmap</li>
                            <li>Board presentation frameworks</li>
                            <li>ROI measurement systems</li>
                        </ul>
                    </div>
                    <p>Ready to amplify your strategic intelligence across your entire organization?</p>
                </div>
            `,
            strategic_contributor_welcome: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2E5BBA;">{{firstName}}, Your Strategic Foundation Plan</h1>
                    <p>Your assessment shows you're a <strong>Strategic Contributor</strong> ready to build AI capabilities within your department.</p>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Your Foundation Program Includes:</h3>
                        <ul>
                            <li>Department-level optimization strategies</li>
                            <li>Process automation frameworks</li>
                            <li>Team productivity enhancement</li>
                            <li>Tactical implementation support</li>
                        </ul>
                    </div>
                    <p>Let's build your strategic foundation together.</p>
                </div>
            `,
            newsletter_welcome: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2E5BBA;">Welcome to Strategic Intelligence Amplification</h1>
                    <p>Hi {{firstName}},</p>
                    <p>Thank you for joining our community of strategic leaders who are amplifying their intelligence with AI.</p>
                    <p>Every week, you'll receive insights on:</p>
                    <ul>
                        <li>Strategic AI implementation frameworks</li>
                        <li>Leadership transformation case studies</li>
                        <li>Practical tools and templates</li>
                        <li>Industry-specific applications</li>
                    </ul>
                    <p>Haven't taken your Strategic Intelligence Assessment yet? It takes just 15 minutes and provides personalized recommendations for your AI journey.</p>
                </div>
            `
        };
        return templates[templateName] || '<p>Template not found</p>';
    }
    /**
     * Get integration routes for Express app
     */
    getRoutes() {
        const router = require('express').Router();
        // Mount CRM routes
        router.use('/crm', this.crm.getRoutes());
        // Mount email marketing routes
        router.use('/email', this.emailMarketing.getRoutes());
        // Mount calendar routes
        router.use('/calendar', this.calendar.getRoutes());
        // Mount webhook routes
        router.use('/webhooks', this.webhooks.getRoutes());
        // Integration health check
        router.get('/health', async (req, res) => {
            try {
                // Check database connection
                await this.db.query('SELECT 1');
                // Check email transporter
                await this.transporter.verify();
                res.json({
                    success: true,
                    status: 'healthy',
                    integrations: {
                        database: 'connected',
                        email: 'connected',
                        crm: 'active',
                        emailMarketing: 'active',
                        calendar: 'active',
                        webhooks: 'active'
                    }
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    status: 'unhealthy',
                    error: error.message
                });
            }
        });
        return router;
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            await this.db.end();
            this.transporter.close();
            console.log('✅ Integration manager cleanup completed');
        }
        catch (error) {
            console.error('❌ Failed to cleanup integration manager:', error);
        }
    }
}
exports.IntegrationManager = IntegrationManager;
//# sourceMappingURL=integrationManager.js.map