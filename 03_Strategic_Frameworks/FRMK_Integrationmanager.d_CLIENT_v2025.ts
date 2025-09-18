---
title: "Integrationmanager.d"
type: "framework"
audience: "clients"
version: "v2025.ts"
dependencies:
  - "" # Add dependencies here
implementations:
  - "" # Add implementations here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

/**
 * Integration Manager
 * Coordinates all external system integrations
 */
import { CRMIntegration } from './crmIntegration';
import { EmailMarketingIntegration } from './emailMarketingIntegration';
import { CalendarIntegration } from './calendarIntegration';
import { WebhookSystem } from './webhookSystem';
export interface IntegrationConfig {
    database: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
    };
    email: {
        host: string;
        port: number;
        user: string;
        password: string;
    };
    webhook: {
        baseUrl: string;
        secret: string;
    };
    calendar: {
        baseUrl: string;
        webhookSecret: string;
    };
    emailMarketing: {
        baseUrl: string;
        unsubscribeSecret: string;
    };
}
export declare class IntegrationManager {
    private db;
    private transporter;
    crm: CRMIntegration;
    emailMarketing: EmailMarketingIntegration;
    calendar: CalendarIntegration;
    webhooks: WebhookSystem;
    constructor(config: IntegrationConfig);
    /**
     * Initialize database connection
     */
    private initializeDatabase;
    /**
     * Initialize email transporter
     */
    private initializeEmailTransporter;
    /**
     * Initialize all integrations
     */
    private initializeIntegrations;
    /**
     * Handle assessment completion - orchestrates all integrations
     */
    handleAssessmentCompletion(assessmentData: {
        email: string;
        firstName: string;
        lastName?: string;
        company?: string;
        role?: string;
        assessmentType: string;
        persona: string;
        industry?: string;
        readinessScore: number;
        serviceRecommendation: string;
        assessmentResults: Record<string, any>;
        timestamp: string;
    }): Promise<void>;
    /**
     * Handle consultation scheduling
     */
    handleConsultationScheduling(schedulingData: {
        email: string;
        firstName: string;
        lastName?: string;
        company?: string;
        role?: string;
        service: string;
        persona?: string;
        readinessScore?: number;
        preferredTimes: string[];
        timezone: string;
        message?: string;
        source: string;
    }): Promise<string>;
    /**
     * Handle lead capture from various sources
     */
    handleLeadCapture(leadData: {
        firstName: string;
        email: string;
        company?: string;
        role?: string;
        source: string;
        persona?: string;
        readinessScore?: number;
        customFields?: Record<string, any>;
    }): Promise<void>;
    /**
     * Handle email engagement tracking
     */
    handleEmailEngagement(engagementData: {
        email: string;
        type: 'opened' | 'clicked';
        campaignId: string;
        templateId: string;
        url?: string;
    }): Promise<void>;
    /**
     * Setup default email campaigns
     */
    setupDefaultEmailCampaigns(): Promise<void>;
    /**
     * Get email template content (placeholder - would load from templates)
     */
    private getEmailTemplate;
    /**
     * Get integration routes for Express app
     */
    getRoutes(): any;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=integrationManager.d.ts.map