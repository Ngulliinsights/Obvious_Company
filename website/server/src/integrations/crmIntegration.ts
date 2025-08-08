/**
 * CRM Integration System
 * Handles lead capture, contact management, and follow-up automation
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
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

export class CRMIntegration {
    private db: Pool;
    private webhookUrl?: string;
    private apiKey?: string;

    constructor(db: Pool, config?: { webhookUrl?: string; apiKey?: string }) {
        this.db = db;
        this.webhookUrl = config?.webhookUrl;
        this.apiKey = config?.apiKey;
        this.initializeDatabase();
    }

    /**
     * Initialize CRM database tables
     */
    private async initializeDatabase(): Promise<void> {
        try {
            // Create leads table
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS crm_leads (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    first_name VARCHAR(100) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    company VARCHAR(200),
                    role VARCHAR(100),
                    source VARCHAR(100) NOT NULL,
                    assessment_type VARCHAR(100),
                    persona VARCHAR(100),
                    readiness_score INTEGER,
                    recommended_service VARCHAR(100),
                    status VARCHAR(50) DEFAULT 'new_lead',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_activity TIMESTAMP,
                    notes TEXT,
                    custom_fields JSONB DEFAULT '{}'::jsonb
                );
            `);

            // Create activities table
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS crm_activities (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
                    type VARCHAR(100) NOT NULL,
                    description TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    metadata JSONB DEFAULT '{}'::jsonb
                );
            `);

            // Create indexes for better performance
            await this.db.query(`
                CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON crm_leads(email);
                CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
                CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON crm_leads(source);
                CREATE INDEX IF NOT EXISTS idx_crm_activities_lead_id ON crm_activities(lead_id);
                CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON crm_activities(type);
            `);

            console.log('✅ CRM database tables initialized');
        } catch (error) {
            console.error('❌ Failed to initialize CRM database:', error);
            throw error;
        }
    }

    /**
     * Create or update lead
     */
    async createOrUpdateLead(leadData: Omit<LeadData, 'id'>): Promise<LeadData> {
        try {
            const leadId = uuidv4();
            
            // Check if lead already exists
            const existingLead = await this.db.query(
                'SELECT * FROM crm_leads WHERE email = $1',
                [leadData.email]
            );

            let lead: LeadData;

            if (existingLead.rows.length > 0) {
                // Update existing lead
                const updateResult = await this.db.query(`
                    UPDATE crm_leads 
                    SET first_name = $1, company = $2, role = $3, source = $4,
                        assessment_type = $5, persona = $6, readiness_score = $7,
                        recommended_service = $8, status = $9, updated_at = CURRENT_TIMESTAMP,
                        last_activity = CURRENT_TIMESTAMP, custom_fields = $10
                    WHERE email = $11
                    RETURNING *
                `, [
                    leadData.firstName,
                    leadData.company,
                    leadData.role,
                    leadData.source,
                    leadData.assessmentType,
                    leadData.persona,
                    leadData.readinessScore,
                    leadData.recommendedService,
                    leadData.status,
                    JSON.stringify(leadData.customFields || {}),
                    leadData.email
                ]);

                lead = this.mapDbRowToLead(updateResult.rows[0]);
                
                // Log activity
                await this.logActivity(lead.id!, 'lead_updated', 'Lead information updated', {
                    source: leadData.source,
                    persona: leadData.persona
                });
            } else {
                // Create new lead
                const insertResult = await this.db.query(`
                    INSERT INTO crm_leads (
                        id, first_name, email, company, role, source,
                        assessment_type, persona, readiness_score, recommended_service,
                        status, custom_fields
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING *
                `, [
                    leadId,
                    leadData.firstName,
                    leadData.email,
                    leadData.company,
                    leadData.role,
                    leadData.source,
                    leadData.assessmentType,
                    leadData.persona,
                    leadData.readinessScore,
                    leadData.recommendedService,
                    leadData.status,
                    JSON.stringify(leadData.customFields || {})
                ]);

                lead = this.mapDbRowToLead(insertResult.rows[0]);
                
                // Log activity
                await this.logActivity(lead.id!, 'lead_created', 'New lead created', {
                    source: leadData.source,
                    persona: leadData.persona
                });
            }

            // Send webhook notification
            await this.sendWebhookNotification('lead_created_or_updated', lead);

            return lead;
        } catch (error) {
            console.error('CRM: Failed to create/update lead:', error);
            throw error;
        }
    }

    /**
     * Get lead by email
     */
    async getLeadByEmail(email: string): Promise<LeadData | null> {
        try {
            const result = await this.db.query(
                'SELECT * FROM crm_leads WHERE email = $1',
                [email]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapDbRowToLead(result.rows[0]);
        } catch (error) {
            console.error('CRM: Failed to get lead by email:', error);
            throw error;
        }
    }

    /**
     * Update lead status
     */
    async updateLeadStatus(email: string, status: LeadData['status'], metadata?: Record<string, any>): Promise<void> {
        try {
            await this.db.query(`
                UPDATE crm_leads 
                SET status = $1, updated_at = CURRENT_TIMESTAMP, last_activity = CURRENT_TIMESTAMP
                WHERE email = $2
            `, [status, email]);

            // Get lead ID for activity logging
            const lead = await this.getLeadByEmail(email);
            if (lead) {
                await this.logActivity(lead.id!, 'status_changed', `Status changed to ${status}`, metadata);
                
                // Send webhook notification
                await this.sendWebhookNotification('lead_status_updated', { ...lead, status });
            }
        } catch (error) {
            console.error('CRM: Failed to update lead status:', error);
            throw error;
        }
    }

    /**
     * Log activity for a lead
     */
    async logActivity(leadId: string, type: CRMActivity['type'], description: string, metadata?: Record<string, any>): Promise<void> {
        try {
            await this.db.query(`
                INSERT INTO crm_activities (lead_id, type, description, metadata)
                VALUES ($1, $2, $3, $4)
            `, [leadId, type, description, JSON.stringify(metadata || {})]);
        } catch (error) {
            console.error('CRM: Failed to log activity:', error);
        }
    }

    /**
     * Get lead activities
     */
    async getLeadActivities(leadId: string): Promise<CRMActivity[]> {
        try {
            const result = await this.db.query(`
                SELECT * FROM crm_activities 
                WHERE lead_id = $1 
                ORDER BY created_at DESC
            `, [leadId]);

            return result.rows.map(row => ({
                id: row.id,
                leadId: row.lead_id,
                type: row.type,
                description: row.description,
                timestamp: row.created_at.toISOString(),
                metadata: row.metadata
            }));
        } catch (error) {
            console.error('CRM: Failed to get lead activities:', error);
            return [];
        }
    }

    /**
     * Get leads by status
     */
    async getLeadsByStatus(status: LeadData['status'], limit: number = 50): Promise<LeadData[]> {
        try {
            const result = await this.db.query(`
                SELECT * FROM crm_leads 
                WHERE status = $1 
                ORDER BY created_at DESC 
                LIMIT $2
            `, [status, limit]);

            return result.rows.map(row => this.mapDbRowToLead(row));
        } catch (error) {
            console.error('CRM: Failed to get leads by status:', error);
            return [];
        }
    }

    /**
     * Get lead pipeline statistics
     */
    async getPipelineStats(): Promise<Record<string, number>> {
        try {
            const result = await this.db.query(`
                SELECT status, COUNT(*) as count
                FROM crm_leads
                GROUP BY status
            `);

            const stats: Record<string, number> = {};
            result.rows.forEach(row => {
                stats[row.status] = parseInt(row.count);
            });

            return stats;
        } catch (error) {
            console.error('CRM: Failed to get pipeline stats:', error);
            return {};
        }
    }

    /**
     * Search leads
     */
    async searchLeads(query: string, filters?: { status?: string; source?: string; persona?: string }): Promise<LeadData[]> {
        try {
            let sql = `
                SELECT * FROM crm_leads 
                WHERE (first_name ILIKE $1 OR email ILIKE $1 OR company ILIKE $1)
            `;
            const params: any[] = [`%${query}%`];
            let paramIndex = 2;

            if (filters?.status) {
                sql += ` AND status = $${paramIndex}`;
                params.push(filters.status);
                paramIndex++;
            }

            if (filters?.source) {
                sql += ` AND source = $${paramIndex}`;
                params.push(filters.source);
                paramIndex++;
            }

            if (filters?.persona) {
                sql += ` AND persona = $${paramIndex}`;
                params.push(filters.persona);
                paramIndex++;
            }

            sql += ` ORDER BY created_at DESC LIMIT 100`;

            const result = await this.db.query(sql, params);
            return result.rows.map(row => this.mapDbRowToLead(row));
        } catch (error) {
            console.error('CRM: Failed to search leads:', error);
            return [];
        }
    }

    /**
     * Send webhook notification
     */
    private async sendWebhookNotification(event: string, data: any): Promise<void> {
        if (!this.webhookUrl) return;

        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
                    'X-Event-Type': event
                },
                body: JSON.stringify({
                    event,
                    data,
                    timestamp: new Date().toISOString(),
                    source: 'obvious-company-crm'
                })
            });

            if (!response.ok) {
                throw new Error(`Webhook failed with status ${response.status}`);
            }
        } catch (error) {
            console.error('CRM: Failed to send webhook notification:', error);
        }
    }

    /**
     * Map database row to LeadData
     */
    private mapDbRowToLead(row: any): LeadData {
        return {
            id: row.id,
            firstName: row.first_name,
            email: row.email,
            company: row.company,
            role: row.role,
            source: row.source,
            assessmentType: row.assessment_type,
            persona: row.persona,
            readinessScore: row.readiness_score,
            recommendedService: row.recommended_service,
            status: row.status,
            timestamp: row.created_at.toISOString(),
            lastActivity: row.last_activity?.toISOString(),
            notes: row.notes,
            customFields: row.custom_fields
        };
    }

    /**
     * Express middleware for CRM endpoints
     */
    getRoutes() {
        const router = require('express').Router();

        // Get lead by email
        router.get('/leads/:email', async (req: Request, res: Response) => {
            try {
                const lead = await this.getLeadByEmail(req.params.email);
                if (!lead) {
                    return res.status(404).json({ success: false, message: 'Lead not found' });
                }
                res.json({ success: true, data: lead });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Failed to get lead' });
            }
        });

        // Get lead activities
        router.get('/leads/:email/activities', async (req: Request, res: Response) => {
            try {
                const lead = await this.getLeadByEmail(req.params.email);
                if (!lead) {
                    return res.status(404).json({ success: false, message: 'Lead not found' });
                }
                const activities = await this.getLeadActivities(lead.id!);
                res.json({ success: true, data: activities });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Failed to get activities' });
            }
        });

        // Update lead status
        router.put('/leads/:email/status', async (req: Request, res: Response) => {
            try {
                const { status, metadata } = req.body;
                await this.updateLeadStatus(req.params.email, status, metadata);
                res.json({ success: true, message: 'Status updated successfully' });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Failed to update status' });
            }
        });

        // Search leads
        router.get('/leads', async (req: Request, res: Response) => {
            try {
                const { q, status, source, persona } = req.query;
                const leads = await this.searchLeads(
                    q as string || '',
                    { status: status as string, source: source as string, persona: persona as string }
                );
                res.json({ success: true, data: leads });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Failed to search leads' });
            }
        });

        // Get pipeline stats
        router.get('/pipeline/stats', async (req: Request, res: Response) => {
            try {
                const stats = await this.getPipelineStats();
                res.json({ success: true, data: stats });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Failed to get pipeline stats' });
            }
        });

        return router;
    }
}