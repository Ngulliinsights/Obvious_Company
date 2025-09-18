---
title: "Calendarintegration.d"
type: "framework"
audience: "consultants"
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
 * Calendar Integration System
 * Handles consultation scheduling with multiple calendar providers
 */
import { Pool } from 'pg';
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
export declare class CalendarIntegration {
    private db;
    private providers;
    private baseUrl;
    private webhookSecret;
    constructor(db: Pool, config: {
        baseUrl: string;
        webhookSecret: string;
    });
    /**
     * Initialize calendar database tables
     */
    private initializeDatabase;
    /**
     * Setup calendar providers
     */
    private setupProviders;
    /**
     * Create consultation request
     */
    createConsultationRequest(requestData: ConsultationRequest): Promise<string>;
    /**
     * Attempt automatic scheduling based on availability
     */
    private attemptAutomaticScheduling;
    /**
     * Find available slot matching preferences
     */
    private findAvailableSlot;
    /**
     * Check if time slot is available
     */
    private isSlotAvailable;
    /**
     * Schedule consultation
     */
    scheduleConsultation(requestId: string, slot: {
        startTime: string;
        endTime: string;
    }): Promise<CalendarEvent>;
    /**
     * Handle Calendly webhook
     */
    handleCalendlyWebhook(payload: any): Promise<void>;
    /**
     * Handle Calendly invitee created
     */
    private handleCalendlyInviteeCreated;
    /**
     * Handle Calendly invitee canceled
     */
    private handleCalendlyInviteeCanceled;
    /**
     * Get available time slots
     */
    private getAvailableSlots;
    /**
     * Generate consultation description
     */
    private generateConsultationDescription;
    /**
     * Generate Calendly description
     */
    private generateCalendlyDescription;
    /**
     * Send consultation request confirmation
     */
    private sendConsultationRequestConfirmation;
    /**
     * Send manual scheduling email
     */
    private sendManualSchedulingEmail;
    /**
     * Send scheduling confirmation
     */
    private sendSchedulingConfirmation;
    /**
     * Schedule reminder emails
     */
    private scheduleReminderEmails;
    /**
     * Schedule preparation email
     */
    private schedulePreparationEmail;
    /**
     * Send internal notification
     */
    private sendInternalNotification;
    /**
     * Send cancellation notification
     */
    private sendCancellationNotification;
    /**
     * Get consultation request by ID
     */
    private getConsultationRequest;
    /**
     * Get calendar integration routes
     */
    getRoutes(): any;
}
export {};
//# sourceMappingURL=calendarIntegration.d.ts.map