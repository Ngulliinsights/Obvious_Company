---
title: "Crmintegration.d"
type: "framework"
audience: "executives"
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
 * CRM Integration System
 * Handles lead capture, contact management, and follow-up automation
 */
import { Pool } from 'pg';
interface LeadData {
    id?: string;
    firstName: string;
    email: string;
    company?: string;
    role?: string;
    source: string;
    assessmentType?: string;
    persona?: string;
    readinessScore?: number;
    recommendedService?: string;
    status: 'new_lead' | 'contacted' | 'qualified' | 'consultation_scheduled' | 'converted' | 'lost';
    timestamp: string;
    lastActivity?: string;
    notes?: string;
    customFields?: Record<string, any>;
}
interface CRMActivity {
    id: string;
    leadId: string;
    type: 'email_sent' | 'email_opened' | 'link_clicked' | 'consultation_scheduled' | 'assessment_completed' | 'service_viewed' | 'lead_created' | 'lead_updated' | 'status_changed';
    description: string;
    timestamp: string;
    metadata?: Record<string, any>;
}
export declare class CRMIntegration {
    private db;
    private webhookUrl?;
    private apiKey?;
    constructor(db: Pool, config?: {
        webhookUrl?: string;
        apiKey?: string;
    });
    /**
     * Initialize CRM database tables
     */
    private initializeDatabase;
    /**
     * Create or update lead
     */
    createOrUpdateLead(leadData: Omit<LeadData, 'id'>): Promise<LeadData>;
    /**
     * Get lead by email
     */
    getLeadByEmail(email: string): Promise<LeadData | null>;
    /**
     * Update lead status
     */
    updateLeadStatus(email: string, status: LeadData['status'], metadata?: Record<string, any>): Promise<void>;
    /**
     * Log activity for a lead
     */
    logActivity(leadId: string, type: CRMActivity['type'], description: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Get lead activities
     */
    getLeadActivities(leadId: string): Promise<CRMActivity[]>;
    /**
     * Get leads by status
     */
    getLeadsByStatus(status: LeadData['status'], limit?: number): Promise<LeadData[]>;
    /**
     * Get lead pipeline statistics
     */
    getPipelineStats(): Promise<Record<string, number>>;
    /**
     * Search leads
     */
    searchLeads(query: string, filters?: {
        status?: string;
        source?: string;
        persona?: string;
    }): Promise<LeadData[]>;
    /**
     * Send webhook notification
     */
    private sendWebhookNotification;
    /**
     * Map database row to LeadData
     */
    private mapDbRowToLead;
    /**
     * Express middleware for CRM endpoints
     */
    getRoutes(): any;
}
export {};
//# sourceMappingURL=crmIntegration.d.ts.map