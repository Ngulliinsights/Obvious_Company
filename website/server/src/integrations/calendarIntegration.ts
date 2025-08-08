/**
 * Calendar Integration System
 * Handles consultation scheduling with multiple calendar providers
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    timezone: string;
    location?: string;
    attendees: CalendarAttendee[];
    metadata: Record<string, any>;
    status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
    createdAt: string;
    updatedAt: string;
}

interface CalendarAttendee {
    email: string;
    name: string;
    role: 'organizer' | 'attendee';
    status: 'pending' | 'accepted' | 'declined';
}

interface ConsultationRequest {
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
    assessmentContext?: Record<string, any>;
}

interface CalendarProvider {
    name: string;
    type: 'calendly' | 'google' | 'outlook' | 'custom';
    config: Record<string, any>;
    isActive: boolean;
}

export class CalendarIntegration {
    private db: Pool;
    private providers: Map<string, CalendarProvider> = new Map();
    private baseUrl: string;
    private webhookSecret: string;

    constructor(db: Pool, config: { baseUrl: string; webhookSecret: string }) {
        this.db = db;
        this.baseUrl = config.baseUrl;
        this.webhookSecret = config.webhookSecret;
        this.initializeDatabase();
        this.setupProviders();
    }

    /**
     * Initialize calendar database tables
     */
    private async initializeDatabase(): Promise<void> {
        try {
            // Calendar events table
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS calendar_events (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    external_id VARCHAR(255),
                    provider VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
                    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
                    timezone VARCHAR(100) NOT NULL,
                    location TEXT,
                    attendees JSONB NOT NULL DEFAULT '[]'::jsonb,
                    metadata JSONB DEFAULT '{}'::jsonb,
                    status VARCHAR(20) DEFAULT 'scheduled',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Consultation requests table
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS consultation_requests (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) NOT NULL,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100),
                    company VARCHAR(200),
                    role VARCHAR(100),
                    service VARCHAR(100) NOT NULL,
                    persona VARCHAR(100),
                    readiness_score INTEGER,
                    preferred_times TEXT[] NOT NULL,
                    timezone VARCHAR(100) NOT NULL,
                    message TEXT,
                    assessment_context JSONB DEFAULT '{}'::jsonb,
                    status VARCHAR(20) DEFAULT 'pending',
                    calendar_event_id UUID REFERENCES calendar_events(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Calendar providers table
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS calendar_providers (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(100) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    config JSONB NOT NULL,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Create indexes
            await this.db.query(`
                CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
                CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
                CREATE INDEX IF NOT EXISTS idx_calendar_events_provider ON calendar_events(provider);
                CREATE INDEX IF NOT EXISTS idx_consultation_requests_email ON consultation_requests(email);
                CREATE INDEX IF NOT EXISTS idx_consultation_requests_status ON consultation_requests(status);
            `);

            console.log('✅ Calendar integration database tables initialized');
        } catch (error) {
            console.error('❌ Failed to initialize calendar database:', error);
            throw error;
        }
    }

    /**
     * Setup calendar providers
     */
    private setupProviders(): void {
        // Calendly provider
        this.providers.set('calendly', {
            name: 'Calendly',
            type: 'calendly',
            config: {
                webhookUrl: process.env.CALENDLY_WEBHOOK_URL,
                accessToken: process.env.CALENDLY_ACCESS_TOKEN,
                organizationUri: process.env.CALENDLY_ORGANIZATION_URI,
                eventTypeUri: process.env.CALENDLY_EVENT_TYPE_URI
            },
            isActive: true
        });

        // Google Calendar provider (placeholder)
        this.providers.set('google', {
            name: 'Google Calendar',
            type: 'google',
            config: {
                clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
                redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI
            },
            isActive: false // Enable when configured
        });

        // Custom provider for direct scheduling
        this.providers.set('custom', {
            name: 'Direct Scheduling',
            type: 'custom',
            config: {
                availableSlots: this.getAvailableSlots(),
                duration: 45, // minutes
                buffer: 15 // minutes between meetings
            },
            isActive: true
        });
    }

    /**
     * Create consultation request
     */
    async createConsultationRequest(requestData: ConsultationRequest): Promise<string> {
        try {
            const requestId = uuidv4();

            await this.db.query(`
                INSERT INTO consultation_requests (
                    id, email, first_name, last_name, company, role, service,
                    persona, readiness_score, preferred_times, timezone, message,
                    assessment_context
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `, [
                requestId,
                requestData.email,
                requestData.firstName,
                requestData.lastName,
                requestData.company,
                requestData.role,
                requestData.service,
                requestData.persona,
                requestData.readinessScore,
                requestData.preferredTimes,
                requestData.timezone,
                requestData.message,
                JSON.stringify(requestData.assessmentContext || {})
            ]);

            // Send confirmation email
            await this.sendConsultationRequestConfirmation(requestData, requestId);

            // Attempt automatic scheduling if possible
            await this.attemptAutomaticScheduling(requestId);

            return requestId;
        } catch (error) {
            console.error('Calendar: Failed to create consultation request:', error);
            throw error;
        }
    }

    /**
     * Attempt automatic scheduling based on availability
     */
    private async attemptAutomaticScheduling(requestId: string): Promise<void> {
        try {
            const request = await this.getConsultationRequest(requestId);
            if (!request) return;

            // Find available slot that matches preferred times
            const availableSlot = await this.findAvailableSlot(
                request.preferredTimes,
                request.timezone
            );

            if (availableSlot) {
                await this.scheduleConsultation(requestId, availableSlot);
            } else {
                // Send manual scheduling email
                await this.sendManualSchedulingEmail(request);
            }
        } catch (error) {
            console.error('Calendar: Failed automatic scheduling:', error);
        }
    }

    /**
     * Find available slot matching preferences
     */
    private async findAvailableSlot(preferredTimes: string[], timezone: string): Promise<{
        startTime: string;
        endTime: string;
    } | null> {
        try {
            const customProvider = this.providers.get('custom');
            if (!customProvider) return null;

            const { duration } = customProvider.config;
            const availableSlots = await this.getAvailableSlots();

            // Convert preferred times to Date objects
            const preferences = preferredTimes.map(time => new Date(time));

            // Find first available slot that matches preferences
            for (const preference of preferences) {
                const slotStart = new Date(preference);
                const slotEnd = new Date(slotStart.getTime() + duration * 60000);

                // Check if slot is available
                const isAvailable = await this.isSlotAvailable(slotStart, slotEnd);
                if (isAvailable) {
                    return {
                        startTime: slotStart.toISOString(),
                        endTime: slotEnd.toISOString()
                    };
                }
            }

            return null;
        } catch (error) {
            console.error('Calendar: Failed to find available slot:', error);
            return null;
        }
    }

    /**
     * Check if time slot is available
     */
    private async isSlotAvailable(startTime: Date, endTime: Date): Promise<boolean> {
        try {
            const result = await this.db.query(`
                SELECT COUNT(*) as count
                FROM calendar_events
                WHERE status IN ('scheduled', 'confirmed')
                AND (
                    (start_time <= $1 AND end_time > $1) OR
                    (start_time < $2 AND end_time >= $2) OR
                    (start_time >= $1 AND end_time <= $2)
                )
            `, [startTime, endTime]);

            return parseInt(result.rows[0].count) === 0;
        } catch (error) {
            console.error('Calendar: Failed to check slot availability:', error);
            return false;
        }
    }

    /**
     * Schedule consultation
     */
    async scheduleConsultation(requestId: string, slot: { startTime: string; endTime: string }): Promise<CalendarEvent> {
        try {
            const request = await this.getConsultationRequest(requestId);
            if (!request) {
                throw new Error('Consultation request not found');
            }

            const eventId = uuidv4();
            const event: CalendarEvent = {
                id: eventId,
                title: `Strategic Consultation - ${request.firstName} ${request.lastName || ''}`.trim(),
                description: this.generateConsultationDescription(request),
                startTime: slot.startTime,
                endTime: slot.endTime,
                timezone: request.timezone,
                location: 'Online (Zoom link will be provided)',
                attendees: [
                    {
                        email: process.env.CONSULTANT_EMAIL || 'consultant@theobviouscompany.com',
                        name: 'The Obvious Company Consultant',
                        role: 'organizer',
                        status: 'accepted'
                    },
                    {
                        email: request.email,
                        name: `${request.firstName} ${request.lastName || ''}`.trim(),
                        role: 'attendee',
                        status: 'pending'
                    }
                ],
                metadata: {
                    service: request.service,
                    persona: request.persona,
                    readinessScore: request.readinessScore,
                    assessmentContext: request.assessmentContext
                },
                status: 'scheduled',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save event to database
            await this.db.query(`
                INSERT INTO calendar_events (
                    id, provider, title, description, start_time, end_time,
                    timezone, location, attendees, metadata, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
                eventId,
                'custom',
                event.title,
                event.description,
                event.startTime,
                event.endTime,
                event.timezone,
                event.location,
                JSON.stringify(event.attendees),
                JSON.stringify(event.metadata),
                event.status
            ]);

            // Update consultation request
            await this.db.query(`
                UPDATE consultation_requests
                SET status = 'scheduled', calendar_event_id = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [eventId, requestId]);

            // Send confirmation emails
            await this.sendSchedulingConfirmation(request, event);

            // Schedule reminder emails
            await this.scheduleReminderEmails(request, event);

            return event;
        } catch (error) {
            console.error('Calendar: Failed to schedule consultation:', error);
            throw error;
        }
    }

    /**
     * Handle Calendly webhook
     */
    async handleCalendlyWebhook(payload: any): Promise<void> {
        try {
            const { event, payload: eventData } = payload;

            switch (event) {
                case 'invitee.created':
                    await this.handleCalendlyInviteeCreated(eventData);
                    break;
                case 'invitee.canceled':
                    await this.handleCalendlyInviteeCanceled(eventData);
                    break;
                default:
                    console.log('Unhandled Calendly webhook event:', event);
            }
        } catch (error) {
            console.error('Calendar: Failed to handle Calendly webhook:', error);
        }
    }

    /**
     * Handle Calendly invitee created
     */
    private async handleCalendlyInviteeCreated(eventData: any): Promise<void> {
        try {
            const { event, invitee } = eventData;
            
            const calendarEvent: CalendarEvent = {
                id: uuidv4(),
                title: `Strategic Consultation - ${invitee.name}`,
                description: this.generateCalendlyDescription(event, invitee),
                startTime: event.start_time,
                endTime: event.end_time,
                timezone: invitee.timezone,
                location: event.location?.join_url || 'Online',
                attendees: [
                    {
                        email: process.env.CONSULTANT_EMAIL || 'consultant@theobviouscompany.com',
                        name: 'The Obvious Company Consultant',
                        role: 'organizer',
                        status: 'accepted'
                    },
                    {
                        email: invitee.email,
                        name: invitee.name,
                        role: 'attendee',
                        status: 'accepted'
                    }
                ],
                metadata: {
                    calendlyEventUri: event.uri,
                    calendlyInviteeUri: invitee.uri,
                    customAnswers: invitee.questions_and_answers || []
                },
                status: 'confirmed',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save to database
            await this.db.query(`
                INSERT INTO calendar_events (
                    id, external_id, provider, title, description, start_time, end_time,
                    timezone, location, attendees, metadata, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
                calendarEvent.id,
                event.uri,
                'calendly',
                calendarEvent.title,
                calendarEvent.description,
                calendarEvent.startTime,
                calendarEvent.endTime,
                calendarEvent.timezone,
                calendarEvent.location,
                JSON.stringify(calendarEvent.attendees),
                JSON.stringify(calendarEvent.metadata),
                calendarEvent.status
            ]);

            // Send internal notification
            await this.sendInternalNotification(calendarEvent);

            // Schedule preparation email
            await this.schedulePreparationEmail(invitee.email, calendarEvent);
        } catch (error) {
            console.error('Calendar: Failed to handle Calendly invitee created:', error);
        }
    }

    /**
     * Handle Calendly invitee canceled
     */
    private async handleCalendlyInviteeCanceled(eventData: any): Promise<void> {
        try {
            const { event } = eventData;

            // Update event status
            await this.db.query(`
                UPDATE calendar_events
                SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
                WHERE external_id = $1 AND provider = 'calendly'
            `, [event.uri]);

            // Send cancellation notification
            await this.sendCancellationNotification(event);
        } catch (error) {
            console.error('Calendar: Failed to handle Calendly cancellation:', error);
        }
    }

    /**
     * Get available time slots
     */
    private getAvailableSlots(): Array<{ start: string; end: string }> {
        // This would typically integrate with your actual calendar system
        // For now, return sample business hours
        const slots = [];
        const now = new Date();
        
        // Generate slots for next 30 days, Monday-Friday, 9 AM - 5 PM
        for (let day = 1; day <= 30; day++) {
            const date = new Date(now);
            date.setDate(date.getDate() + day);
            
            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) continue;
            
            // Generate hourly slots from 9 AM to 5 PM
            for (let hour = 9; hour < 17; hour++) {
                const slotStart = new Date(date);
                slotStart.setHours(hour, 0, 0, 0);
                
                const slotEnd = new Date(slotStart);
                slotEnd.setMinutes(45); // 45-minute slots
                
                slots.push({
                    start: slotStart.toISOString(),
                    end: slotEnd.toISOString()
                });
            }
        }
        
        return slots;
    }

    /**
     * Generate consultation description
     */
    private generateConsultationDescription(request: ConsultationRequest): string {
        return `
Strategic Intelligence Consultation

Client: ${request.firstName} ${request.lastName || ''}
Company: ${request.company || 'Not specified'}
Role: ${request.role || 'Not specified'}
Service Interest: ${request.service}
Strategic Persona: ${request.persona || 'Not assessed'}
Readiness Score: ${request.readinessScore || 'Not assessed'}%

${request.message ? `Message: ${request.message}` : ''}

This consultation will focus on strategic intelligence amplification and AI integration opportunities specific to the client's context and readiness level.
        `.trim();
    }

    /**
     * Generate Calendly description
     */
    private generateCalendlyDescription(event: any, invitee: any): string {
        const customAnswers = invitee.questions_and_answers || [];
        const answersText = customAnswers.map((qa: any) => `${qa.question}: ${qa.answer}`).join('\n');
        
        return `
Strategic Intelligence Consultation via Calendly

Client: ${invitee.name}
Email: ${invitee.email}
Timezone: ${invitee.timezone}

${answersText ? `Custom Answers:\n${answersText}` : ''}

Calendly Event: ${event.uri}
        `.trim();
    }

    /**
     * Send consultation request confirmation
     */
    private async sendConsultationRequestConfirmation(request: ConsultationRequest, requestId: string): Promise<void> {
        // This would integrate with your email system
        console.log(`Sending consultation request confirmation to ${request.email} for request ${requestId}`);
    }

    /**
     * Send manual scheduling email
     */
    private async sendManualSchedulingEmail(request: ConsultationRequest): Promise<void> {
        // This would integrate with your email system
        console.log(`Sending manual scheduling email to ${request.email}`);
    }

    /**
     * Send scheduling confirmation
     */
    private async sendSchedulingConfirmation(request: ConsultationRequest, event: CalendarEvent): Promise<void> {
        // This would integrate with your email system
        console.log(`Sending scheduling confirmation to ${request.email} for event ${event.id}`);
    }

    /**
     * Schedule reminder emails
     */
    private async scheduleReminderEmails(request: ConsultationRequest, event: CalendarEvent): Promise<void> {
        const eventTime = new Date(event.startTime);
        
        // 24-hour reminder
        const reminder24h = new Date(eventTime.getTime() - 24 * 60 * 60 * 1000);
        if (reminder24h > new Date()) {
            setTimeout(() => {
                console.log(`Sending 24h reminder to ${request.email}`);
            }, reminder24h.getTime() - Date.now());
        }
        
        // 1-hour reminder
        const reminder1h = new Date(eventTime.getTime() - 60 * 60 * 1000);
        if (reminder1h > new Date()) {
            setTimeout(() => {
                console.log(`Sending 1h reminder to ${request.email}`);
            }, reminder1h.getTime() - Date.now());
        }
    }

    /**
     * Schedule preparation email
     */
    private async schedulePreparationEmail(email: string, event: CalendarEvent): Promise<void> {
        // Send preparation email 2 hours after booking
        setTimeout(() => {
            console.log(`Sending preparation email to ${email}`);
        }, 2 * 60 * 60 * 1000);
    }

    /**
     * Send internal notification
     */
    private async sendInternalNotification(event: CalendarEvent): Promise<void> {
        console.log(`Internal notification: New consultation scheduled - ${event.title}`);
    }

    /**
     * Send cancellation notification
     */
    private async sendCancellationNotification(event: any): Promise<void> {
        console.log(`Cancellation notification for event: ${event.uri}`);
    }

    /**
     * Get consultation request by ID
     */
    private async getConsultationRequest(requestId: string): Promise<ConsultationRequest | null> {
        try {
            const result = await this.db.query(
                'SELECT * FROM consultation_requests WHERE id = $1',
                [requestId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return {
                email: row.email,
                firstName: row.first_name,
                lastName: row.last_name,
                company: row.company,
                role: row.role,
                service: row.service,
                persona: row.persona,
                readinessScore: row.readiness_score,
                preferredTimes: row.preferred_times,
                timezone: row.timezone,
                message: row.message,
                assessmentContext: row.assessment_context
            };
        } catch (error) {
            console.error('Calendar: Failed to get consultation request:', error);
            return null;
        }
    }

    /**
     * Get calendar integration routes
     */
    getRoutes() {
        const router = require('express').Router();

        // Create consultation request
        router.post('/consultation-request', async (req: Request, res: Response) => {
            try {
                const requestId = await this.createConsultationRequest(req.body);
                res.json({
                    success: true,
                    requestId,
                    message: 'Consultation request created successfully'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to create consultation request'
                });
            }
        });

        // Calendly webhook
        router.post('/webhooks/calendly', async (req: Request, res: Response) => {
            try {
                // Verify webhook signature if needed
                await this.handleCalendlyWebhook(req.body);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false });
            }
        });

        // Get available slots
        router.get('/available-slots', async (req: Request, res: Response) => {
            try {
                const slots = this.getAvailableSlots();
                res.json({ success: true, data: slots });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to get available slots'
                });
            }
        });

        return router;
    }
}