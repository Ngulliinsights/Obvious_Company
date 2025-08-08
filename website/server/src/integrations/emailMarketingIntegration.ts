/**
 * Email Marketing Integration System
 * Handles assessment-based campaigns, automated sequences, and personalized messaging
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

interface EmailCampaign {
    id: string;
    name: string;
    type: 'assessment_based' | 'nurture_sequence' | 'promotional' | 'educational';
    trigger: string;
    status: 'active' | 'paused' | 'completed';
    personaTargets: string[];
    industryTargets: string[];
    readinessScoreRange: { min: number; max: number };
    emailSequence: EmailTemplate[];
    createdAt: string;
    updatedAt: string;
}

interface EmailTemplate {
    id: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    delayHours: number;
    conditions?: {
        persona?: string[];
        industry?: string[];
        readinessScore?: { min: number; max: number };
    };
    cta?: {
        text: string;
        url: string;
        trackingId: string;
    };
}

interface EmailSubscriber {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    company?: string;
    role?: string;
    persona?: string;
    industry?: string;
    readinessScore?: number;
    subscriptionDate: string;
    status: 'active' | 'unsubscribed' | 'bounced';
    tags: string[];
    customFields: Record<string, any>;
    unsubscribeToken?: string;
}

interface EmailSendRecord {
    id: string;
    subscriberId: string;
    campaignId: string;
    templateId: string;
    sentAt: string;
    status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';
    openedAt?: string;
    clickedAt?: string;
    clickedLinks: string[];
}

export class EmailMarketingIntegration {
    private db: Pool;
    private transporter: nodemailer.Transporter;
    private baseUrl: string;
    private unsubscribeSecret: string;

    constructor(db: Pool, transporter: nodemailer.Transporter, config: { baseUrl: string; unsubscribeSecret: string }) {
        this.db = db;
        this.transporter = transporter;
        this.baseUrl = config.baseUrl;
        this.unsubscribeSecret = config.unsubscribeSecret;
        this.initializeDatabase();
    }

    /**
     * Initialize email marketing database tables
     */
    private async initializeDatabase(): Promise<void> {
        try {
            // Email campaigns table
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS email_campaigns (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(200) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    trigger_event VARCHAR(100) NOT NULL,
                    status VARCHAR(20) DEFAULT 'active',
                    persona_targets TEXT[],
                    industry_targets TEXT[],
                    readiness_score_min INTEGER DEFAULT 0,
                    readiness_score_max INTEGER DEFAULT 100,
                    email_sequence JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Email subscribers table
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS email_subscribers (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100),
                    company VARCHAR(200),
                    role VARCHAR(100),
                    persona VARCHAR(100),
                    industry VARCHAR(100),
                    readiness_score INTEGER,
                    subscription_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(20) DEFAULT 'active',
                    tags TEXT[] DEFAULT '{}',
                    custom_fields JSONB DEFAULT '{}'::jsonb,
                    unsubscribe_token VARCHAR(100) UNIQUE
                );
            `);

            // Email send records table
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS email_send_records (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    subscriber_id UUID REFERENCES email_subscribers(id) ON DELETE CASCADE,
                    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
                    template_id VARCHAR(100) NOT NULL,
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(20) DEFAULT 'sent',
                    opened_at TIMESTAMP,
                    clicked_at TIMESTAMP,
                    clicked_links TEXT[] DEFAULT '{}',
                    metadata JSONB DEFAULT '{}'::jsonb
                );
            `);

            // Create indexes
            await this.db.query(`
                CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
                CREATE INDEX IF NOT EXISTS idx_email_subscribers_status ON email_subscribers(status);
                CREATE INDEX IF NOT EXISTS idx_email_subscribers_persona ON email_subscribers(persona);
                CREATE INDEX IF NOT EXISTS idx_email_send_records_subscriber ON email_send_records(subscriber_id);
                CREATE INDEX IF NOT EXISTS idx_email_send_records_campaign ON email_send_records(campaign_id);
                CREATE INDEX IF NOT EXISTS idx_email_send_records_status ON email_send_records(status);
            `);

            console.log('✅ Email marketing database tables initialized');
        } catch (error) {
            console.error('❌ Failed to initialize email marketing database:', error);
            throw error;
        }
    }

    /**
     * Subscribe user to email marketing
     */
    async subscribeUser(subscriberData: Omit<EmailSubscriber, 'id' | 'subscriptionDate' | 'status' | 'tags'>): Promise<EmailSubscriber> {
        try {
            const subscriberId = uuidv4();
            const unsubscribeToken = this.generateUnsubscribeToken(subscriberData.email);

            const result = await this.db.query(`
                INSERT INTO email_subscribers (
                    id, email, first_name, last_name, company, role, persona,
                    industry, readiness_score, custom_fields, unsubscribe_token
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (email) DO UPDATE SET
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    company = EXCLUDED.company,
                    role = EXCLUDED.role,
                    persona = EXCLUDED.persona,
                    industry = EXCLUDED.industry,
                    readiness_score = EXCLUDED.readiness_score,
                    custom_fields = EXCLUDED.custom_fields,
                    status = 'active'
                RETURNING *
            `, [
                subscriberId,
                subscriberData.email,
                subscriberData.firstName,
                subscriberData.lastName,
                subscriberData.company,
                subscriberData.role,
                subscriberData.persona,
                subscriberData.industry,
                subscriberData.readinessScore,
                JSON.stringify(subscriberData.customFields || {}),
                unsubscribeToken
            ]);

            const subscriber = this.mapDbRowToSubscriber(result.rows[0]);

            // Trigger welcome email campaign
            await this.triggerCampaign('user_subscribed', subscriber);

            return subscriber;
        } catch (error) {
            console.error('Email Marketing: Failed to subscribe user:', error);
            throw error;
        }
    }

    /**
     * Create assessment-based email campaign
     */
    async createAssessmentBasedCampaign(campaignData: {
        name: string;
        trigger: string;
        personaTargets: string[];
        industryTargets?: string[];
        readinessScoreRange?: { min: number; max: number };
        emailSequence: Omit<EmailTemplate, 'id'>[];
    }): Promise<EmailCampaign> {
        try {
            const campaignId = uuidv4();
            
            // Add IDs to email templates
            const emailSequence = campaignData.emailSequence.map(template => ({
                ...template,
                id: uuidv4()
            }));

            const result = await this.db.query(`
                INSERT INTO email_campaigns (
                    id, name, type, trigger_event, persona_targets, industry_targets,
                    readiness_score_min, readiness_score_max, email_sequence
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [
                campaignId,
                campaignData.name,
                'assessment_based',
                campaignData.trigger,
                campaignData.personaTargets,
                campaignData.industryTargets || [],
                campaignData.readinessScoreRange?.min || 0,
                campaignData.readinessScoreRange?.max || 100,
                JSON.stringify(emailSequence)
            ]);

            return this.mapDbRowToCampaign(result.rows[0]);
        } catch (error) {
            console.error('Email Marketing: Failed to create campaign:', error);
            throw error;
        }
    }

    /**
     * Trigger campaign based on assessment completion
     */
    async triggerAssessmentCampaign(assessmentData: {
        email: string;
        firstName: string;
        persona: string;
        industry?: string;
        readinessScore: number;
        assessmentType: string;
        serviceRecommendation: string;
    }): Promise<void> {
        try {
            // Subscribe user if not already subscribed
            await this.subscribeUser({
                email: assessmentData.email,
                firstName: assessmentData.firstName,
                persona: assessmentData.persona,
                industry: assessmentData.industry,
                readinessScore: assessmentData.readinessScore,
                customFields: {
                    assessmentType: assessmentData.assessmentType,
                    serviceRecommendation: assessmentData.serviceRecommendation,
                    assessmentCompletedAt: new Date().toISOString()
                }
            });

            // Find matching campaigns
            const campaigns = await this.getMatchingCampaigns('assessment_completed', {
                persona: assessmentData.persona,
                industry: assessmentData.industry,
                readinessScore: assessmentData.readinessScore
            });

            // Start email sequences for matching campaigns
            for (const campaign of campaigns) {
                await this.startEmailSequence(assessmentData.email, campaign);
            }
        } catch (error) {
            console.error('Email Marketing: Failed to trigger assessment campaign:', error);
        }
    }

    /**
     * Get matching campaigns for trigger and criteria
     */
    private async getMatchingCampaigns(trigger: string, criteria: {
        persona?: string;
        industry?: string;
        readinessScore?: number;
    }): Promise<EmailCampaign[]> {
        try {
            let sql = `
                SELECT * FROM email_campaigns 
                WHERE trigger_event = $1 AND status = 'active'
            `;
            const params: any[] = [trigger];
            let paramIndex = 2;

            if (criteria.persona) {
                sql += ` AND ($${paramIndex} = ANY(persona_targets) OR array_length(persona_targets, 1) IS NULL)`;
                params.push(criteria.persona);
                paramIndex++;
            }

            if (criteria.industry) {
                sql += ` AND ($${paramIndex} = ANY(industry_targets) OR array_length(industry_targets, 1) IS NULL)`;
                params.push(criteria.industry);
                paramIndex++;
            }

            if (criteria.readinessScore !== undefined) {
                sql += ` AND $${paramIndex} BETWEEN readiness_score_min AND readiness_score_max`;
                params.push(criteria.readinessScore);
                paramIndex++;
            }

            const result = await this.db.query(sql, params);
            return result.rows.map(row => this.mapDbRowToCampaign(row));
        } catch (error) {
            console.error('Email Marketing: Failed to get matching campaigns:', error);
            return [];
        }
    }

    /**
     * Start email sequence for subscriber
     */
    private async startEmailSequence(email: string, campaign: EmailCampaign): Promise<void> {
        try {
            const subscriber = await this.getSubscriberByEmail(email);
            if (!subscriber || subscriber.status !== 'active') {
                return;
            }

            // Schedule emails in the sequence
            for (const template of campaign.emailSequence) {
                // Check if template conditions match subscriber
                if (!this.templateMatchesSubscriber(template, subscriber)) {
                    continue;
                }

                // Schedule email
                setTimeout(async () => {
                    await this.sendTemplateEmail(subscriber, campaign, template);
                }, template.delayHours * 60 * 60 * 1000);
            }
        } catch (error) {
            console.error('Email Marketing: Failed to start email sequence:', error);
        }
    }

    /**
     * Check if template conditions match subscriber
     */
    private templateMatchesSubscriber(template: EmailTemplate, subscriber: EmailSubscriber): boolean {
        if (!template.conditions) return true;

        if (template.conditions.persona && !template.conditions.persona.includes(subscriber.persona || '')) {
            return false;
        }

        if (template.conditions.industry && !template.conditions.industry.includes(subscriber.industry || '')) {
            return false;
        }

        if (template.conditions.readinessScore && subscriber.readinessScore !== undefined) {
            const { min, max } = template.conditions.readinessScore;
            if (subscriber.readinessScore < min || subscriber.readinessScore > max) {
                return false;
            }
        }

        return true;
    }

    /**
     * Send template email to subscriber
     */
    private async sendTemplateEmail(subscriber: EmailSubscriber, campaign: EmailCampaign, template: EmailTemplate): Promise<void> {
        try {
            // Check if subscriber is still active
            const currentSubscriber = await this.getSubscriberByEmail(subscriber.email);
            if (!currentSubscriber || currentSubscriber.status !== 'active') {
                return;
            }

            // Personalize email content
            const personalizedSubject = this.personalizeContent(template.subject, subscriber);
            const personalizedHtml = this.personalizeContent(template.htmlContent, subscriber);
            const personalizedText = this.personalizeContent(template.textContent, subscriber);

            // Add tracking pixels and links
            const trackingId = uuidv4();
            const htmlWithTracking = this.addEmailTracking(personalizedHtml, subscriber.id, campaign.id, template.id, trackingId);

            // Send email
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: subscriber.email,
                subject: personalizedSubject,
                html: htmlWithTracking,
                text: personalizedText,
                headers: {
                    'List-Unsubscribe': `<${this.baseUrl}/unsubscribe?token=${subscriber.unsubscribeToken}>`,
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
                }
            };

            await this.transporter.sendMail(mailOptions);

            // Record send
            await this.recordEmailSend(subscriber.id, campaign.id, template.id, trackingId);

            console.log(`Email sent: ${template.subject} to ${subscriber.email}`);
        } catch (error) {
            console.error('Email Marketing: Failed to send template email:', error);
        }
    }

    /**
     * Personalize email content with subscriber data
     */
    private personalizeContent(content: string, subscriber: EmailSubscriber): string {
        return content
            .replace(/\{\{firstName\}\}/g, subscriber.firstName)
            .replace(/\{\{lastName\}\}/g, subscriber.lastName || '')
            .replace(/\{\{company\}\}/g, subscriber.company || '')
            .replace(/\{\{role\}\}/g, subscriber.role || '')
            .replace(/\{\{persona\}\}/g, subscriber.persona || '')
            .replace(/\{\{industry\}\}/g, subscriber.industry || '')
            .replace(/\{\{readinessScore\}\}/g, subscriber.readinessScore?.toString() || '');
    }

    /**
     * Add email tracking pixels and link tracking
     */
    private addEmailTracking(html: string, subscriberId: string, campaignId: string, templateId: string, trackingId: string): string {
        // Add open tracking pixel
        const trackingPixel = `<img src="${this.baseUrl}/api/email/track/open?s=${subscriberId}&c=${campaignId}&t=${templateId}&tid=${trackingId}" width="1" height="1" style="display:none;" />`;
        
        // Add click tracking to links
        const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi;
        const trackedHtml = html.replace(linkRegex, (match, quote, url) => {
            if (url.startsWith('http') && !url.includes('/api/email/track/')) {
                const trackingUrl = `${this.baseUrl}/api/email/track/click?s=${subscriberId}&c=${campaignId}&t=${templateId}&tid=${trackingId}&url=${encodeURIComponent(url)}`;
                return match.replace(url, trackingUrl);
            }
            return match;
        });

        return trackedHtml + trackingPixel;
    }

    /**
     * Record email send
     */
    private async recordEmailSend(subscriberId: string, campaignId: string, templateId: string, trackingId: string): Promise<void> {
        try {
            await this.db.query(`
                INSERT INTO email_send_records (subscriber_id, campaign_id, template_id, metadata)
                VALUES ($1, $2, $3, $4)
            `, [subscriberId, campaignId, templateId, JSON.stringify({ trackingId })]);
        } catch (error) {
            console.error('Email Marketing: Failed to record email send:', error);
        }
    }

    /**
     * Track email open
     */
    async trackEmailOpen(subscriberId: string, campaignId: string, templateId: string, trackingId: string): Promise<void> {
        try {
            await this.db.query(`
                UPDATE email_send_records 
                SET status = 'opened', opened_at = CURRENT_TIMESTAMP
                WHERE subscriber_id = $1 AND campaign_id = $2 AND template_id = $3
                AND metadata->>'trackingId' = $4 AND opened_at IS NULL
            `, [subscriberId, campaignId, templateId, trackingId]);
        } catch (error) {
            console.error('Email Marketing: Failed to track email open:', error);
        }
    }

    /**
     * Track email click
     */
    async trackEmailClick(subscriberId: string, campaignId: string, templateId: string, trackingId: string, url: string): Promise<void> {
        try {
            await this.db.query(`
                UPDATE email_send_records 
                SET status = 'clicked', clicked_at = CURRENT_TIMESTAMP,
                    clicked_links = array_append(clicked_links, $5)
                WHERE subscriber_id = $1 AND campaign_id = $2 AND template_id = $3
                AND metadata->>'trackingId' = $4
            `, [subscriberId, campaignId, templateId, trackingId, url]);
        } catch (error) {
            console.error('Email Marketing: Failed to track email click:', error);
        }
    }

    /**
     * Get subscriber by email
     */
    private async getSubscriberByEmail(email: string): Promise<EmailSubscriber | null> {
        try {
            const result = await this.db.query(
                'SELECT * FROM email_subscribers WHERE email = $1',
                [email]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapDbRowToSubscriber(result.rows[0]);
        } catch (error) {
            console.error('Email Marketing: Failed to get subscriber:', error);
            return null;
        }
    }

    /**
     * Unsubscribe user
     */
    async unsubscribeUser(token: string): Promise<boolean> {
        try {
            const result = await this.db.query(`
                UPDATE email_subscribers 
                SET status = 'unsubscribed' 
                WHERE unsubscribe_token = $1
                RETURNING email
            `, [token]);

            return result.rows.length > 0;
        } catch (error) {
            console.error('Email Marketing: Failed to unsubscribe user:', error);
            return false;
        }
    }

    /**
     * Generate unsubscribe token
     */
    private generateUnsubscribeToken(email: string): string {
        const crypto = require('crypto');
        return crypto.createHmac('sha256', this.unsubscribeSecret)
            .update(email + Date.now())
            .digest('hex');
    }

    /**
     * Trigger campaign for any event
     */
    async triggerCampaign(event: string, subscriber: EmailSubscriber): Promise<void> {
        try {
            const campaigns = await this.getMatchingCampaigns(event, {
                persona: subscriber.persona,
                industry: subscriber.industry,
                readinessScore: subscriber.readinessScore
            });

            for (const campaign of campaigns) {
                await this.startEmailSequence(subscriber.email, campaign);
            }
        } catch (error) {
            console.error('Email Marketing: Failed to trigger campaign:', error);
        }
    }

    /**
     * Map database row to subscriber
     */
    private mapDbRowToSubscriber(row: any): EmailSubscriber {
        return {
            id: row.id,
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            company: row.company,
            role: row.role,
            persona: row.persona,
            industry: row.industry,
            readinessScore: row.readiness_score,
            subscriptionDate: row.subscription_date.toISOString(),
            status: row.status,
            tags: row.tags || [],
            customFields: row.custom_fields || {},
            unsubscribeToken: row.unsubscribe_token
        };
    }

    /**
     * Map database row to campaign
     */
    private mapDbRowToCampaign(row: any): EmailCampaign {
        return {
            id: row.id,
            name: row.name,
            type: row.type,
            trigger: row.trigger_event,
            status: row.status,
            personaTargets: row.persona_targets || [],
            industryTargets: row.industry_targets || [],
            readinessScoreRange: {
                min: row.readiness_score_min,
                max: row.readiness_score_max
            },
            emailSequence: row.email_sequence,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString()
        };
    }

    /**
     * Get email marketing routes
     */
    getRoutes() {
        const router = require('express').Router();

        // Track email open
        router.get('/track/open', async (req: Request, res: Response) => {
            const { s: subscriberId, c: campaignId, t: templateId, tid: trackingId } = req.query;
            
            if (subscriberId && campaignId && templateId && trackingId) {
                await this.trackEmailOpen(
                    subscriberId as string,
                    campaignId as string,
                    templateId as string,
                    trackingId as string
                );
            }

            // Return 1x1 transparent pixel
            const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
            res.set('Content-Type', 'image/gif');
            res.send(pixel);
        });

        // Track email click
        router.get('/track/click', async (req: Request, res: Response) => {
            const { s: subscriberId, c: campaignId, t: templateId, tid: trackingId, url } = req.query;
            
            if (subscriberId && campaignId && templateId && trackingId && url) {
                await this.trackEmailClick(
                    subscriberId as string,
                    campaignId as string,
                    templateId as string,
                    trackingId as string,
                    url as string
                );
            }

            // Redirect to original URL
            res.redirect(url as string || '/');
        });

        // Unsubscribe
        router.get('/unsubscribe', async (req: Request, res: Response) => {
            const { token } = req.query;
            
            if (token) {
                const success = await this.unsubscribeUser(token as string);
                if (success) {
                    res.send(`
                        <html>
                            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                                <h2>Successfully Unsubscribed</h2>
                                <p>You have been unsubscribed from our email list.</p>
                                <p>We're sorry to see you go!</p>
                                <a href="/">Return to website</a>
                            </body>
                        </html>
                    `);
                } else {
                    res.status(400).send('Invalid unsubscribe token');
                }
            } else {
                res.status(400).send('Missing unsubscribe token');
            }
        });

        return router;
    }
}