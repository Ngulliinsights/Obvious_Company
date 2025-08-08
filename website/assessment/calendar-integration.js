/**
 * Calendar Integration for Consultation Scheduling
 * Handles seamless integration with Calendly and other calendar systems
 */

class CalendarIntegration {
    constructor() {
        this.calendlyUrl = 'https://calendly.com/obvious-company/strategic-consultation';
        this.fallbackEmail = 'contact@theobviouscompany.com';
        this.init();
    }

    init() {
        this.loadCalendlyWidget();
        this.bindEvents();
        this.setupAnalytics();
    }

    /**
     * Load Calendly widget script
     */
    loadCalendlyWidget() {
        if (!document.querySelector('script[src*="calendly"]')) {
            const script = document.createElement('script');
            script.src = 'https://assets.calendly.com/assets/external/widget.js';
            script.async = true;
            document.head.appendChild(script);
        }
    }

    /**
     * Schedule consultation with context
     */
    scheduleConsultation(options = {}) {
        const {
            service = '',
            persona = '',
            readinessScore = '',
            email = '',
            firstName = '',
            source = 'assessment'
        } = options;

        // Prepare Calendly URL with prefilled data
        const calendlyParams = new URLSearchParams({
            hide_event_type_details: '1',
            hide_gdpr_banner: '1',
            primary_color: '2E5BBA'
        });

        // Add prefill parameters
        if (email) calendlyParams.set('prefill_email', email);
        if (firstName) calendlyParams.set('prefill_name', firstName);
        if (service) calendlyParams.set('prefill_custom_1', service);
        if (persona) calendlyParams.set('prefill_custom_2', persona);
        if (readinessScore) calendlyParams.set('prefill_custom_3', `${readinessScore}%`);

        const fullCalendlyUrl = `${this.calendlyUrl}?${calendlyParams.toString()}`;

        // Track scheduling attempt
        this.trackSchedulingAttempt(options);

        // Try to open Calendly widget inline if available
        if (window.Calendly && this.shouldUseInlineWidget()) {
            this.openInlineWidget(fullCalendlyUrl, options);
        } else {
            // Fallback to popup or new tab
            this.openCalendlyPopup(fullCalendlyUrl, options);
        }
    }

    /**
     * Determine if inline widget should be used
     */
    shouldUseInlineWidget() {
        // Use inline widget on desktop, popup on mobile
        return window.innerWidth > 768 && !this.isMobile();
    }

    /**
     * Open Calendly inline widget
     */
    openInlineWidget(url, options) {
        // Create modal container for inline widget
        const modal = this.createCalendlyModal();
        document.body.appendChild(modal);

        // Initialize Calendly inline widget
        window.Calendly.initInlineWidget({
            url: url,
            parentElement: modal.querySelector('.calendly-container'),
            prefill: this.getPrefillData(options),
            utm: this.getUTMParameters(options)
        });

        // Show modal
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);

        // Bind modal events
        this.bindModalEvents(modal, options);
    }

    /**
     * Open Calendly popup
     */
    openCalendlyPopup(url, options) {
        if (window.Calendly) {
            window.Calendly.initPopupWidget({
                url: url,
                prefill: this.getPrefillData(options),
                utm: this.getUTMParameters(options)
            });
        } else {
            // Fallback to new window
            const popup = window.open(url, 'calendly', 'width=800,height=600,scrollbars=yes,resizable=yes');
            
            // Check if popup was blocked
            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                this.showPopupBlockedMessage(url);
            } else {
                this.trackPopupOpened(options);
            }
        }
    }

    /**
     * Create modal for inline Calendly widget
     */
    createCalendlyModal() {
        const modal = document.createElement('div');
        modal.className = 'calendly-modal';
        modal.innerHTML = `
            <div class="calendly-modal-overlay"></div>
            <div class="calendly-modal-content">
                <div class="calendly-modal-header">
                    <h3>Schedule Your Strategic Consultation</h3>
                    <button class="calendly-modal-close" aria-label="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="calendly-container"></div>
            </div>
        `;

        // Add styles
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease-out;
        `;

        const overlay = modal.querySelector('.calendly-modal-overlay');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
        `;

        const content = modal.querySelector('.calendly-modal-content');
        content.style.cssText = `
            position: relative;
            background: white;
            margin: 2rem;
            border-radius: 12px;
            height: calc(100vh - 4rem);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        const header = modal.querySelector('.calendly-modal-header');
        header.style.cssText = `
            padding: 1.5rem 2rem;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8fafc;
        `;

        const container = modal.querySelector('.calendly-container');
        container.style.cssText = `
            flex: 1;
            overflow: hidden;
        `;

        const closeBtn = modal.querySelector('.calendly-modal-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            color: #6b7280;
            padding: 0.5rem;
            border-radius: 4px;
            transition: all 0.2s ease;
        `;

        return modal;
    }

    /**
     * Bind modal events
     */
    bindModalEvents(modal, options) {
        const closeBtn = modal.querySelector('.calendly-modal-close');
        const overlay = modal.querySelector('.calendly-modal-overlay');

        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
            this.trackModalClosed(options);
        };

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);

        // ESC key to close
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Listen for Calendly events
        window.addEventListener('message', (e) => {
            if (e.data.event && e.data.event.indexOf('calendly') === 0) {
                this.handleCalendlyEvent(e.data.event, e.data.payload, options);
            }
        });
    }

    /**
     * Handle Calendly events
     */
    handleCalendlyEvent(event, payload, options) {
        switch (event) {
            case 'calendly.event_scheduled':
                this.handleEventScheduled(payload, options);
                break;
            case 'calendly.profile_page_viewed':
                this.trackProfileViewed(options);
                break;
            case 'calendly.date_and_time_selected':
                this.trackTimeSelected(payload, options);
                break;
            case 'calendly.event_type_viewed':
                this.trackEventTypeViewed(options);
                break;
        }
    }

    /**
     * Handle successful event scheduling
     */
    async handleEventScheduled(payload, options) {
        const { event } = payload;
        
        // Track successful scheduling
        this.trackEventScheduled(event, options);

        // Close modal if open
        const modal = document.querySelector('.calendly-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }

        // Show success message
        this.showSchedulingSuccess(event, options);

        // Send confirmation to server
        await this.sendSchedulingConfirmation(event, options);

        // Trigger follow-up sequence
        this.triggerPostSchedulingFlow(event, options);
    }

    /**
     * Show scheduling success message
     */
    showSchedulingSuccess(event, options) {
        const successModal = document.createElement('div');
        successModal.className = 'scheduling-success-modal';
        successModal.innerHTML = `
            <div class="success-modal-overlay"></div>
            <div class="success-modal-content">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>Consultation Scheduled Successfully!</h2>
                <div class="event-details">
                    <p><strong>Date & Time:</strong> ${this.formatEventTime(event)}</p>
                    <p><strong>Duration:</strong> 45 minutes</p>
                    <p><strong>Meeting Type:</strong> Strategic Consultation</p>
                </div>
                <div class="next-steps">
                    <h3>What Happens Next?</h3>
                    <ul>
                        <li>You'll receive a calendar invitation within 5 minutes</li>
                        <li>We'll send a preparation guide to maximize your consultation value</li>
                        <li>Our team will review your assessment results before the call</li>
                    </ul>
                </div>
                <div class="success-actions">
                    <button class="btn btn-primary continue-exploring">
                        <i class="fas fa-arrow-right"></i>
                        Continue Exploring
                    </button>
                    <button class="btn btn-outline add-to-calendar">
                        <i class="fas fa-calendar-plus"></i>
                        Add to Calendar
                    </button>
                </div>
            </div>
        `;

        // Style the success modal
        this.styleSuccessModal(successModal);
        
        document.body.appendChild(successModal);
        
        // Show modal
        setTimeout(() => {
            successModal.classList.add('show');
        }, 100);

        // Bind success modal events
        this.bindSuccessModalEvents(successModal, event, options);
    }

    /**
     * Style success modal
     */
    styleSuccessModal(modal) {
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10001;
            opacity: 0;
            transition: opacity 0.3s ease-out;
        `;

        const overlay = modal.querySelector('.success-modal-overlay');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
        `;

        const content = modal.querySelector('.success-modal-content');
        content.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 12px;
            padding: 3rem;
            max-width: 500px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        `;

        const icon = modal.querySelector('.success-icon');
        icon.style.cssText = `
            font-size: 4rem;
            color: #00A676;
            margin-bottom: 1.5rem;
        `;

        const details = modal.querySelector('.event-details');
        details.style.cssText = `
            background: #f8fafc;
            padding: 1.5rem;
            border-radius: 8px;
            margin: 1.5rem 0;
            text-align: left;
        `;

        const nextSteps = modal.querySelector('.next-steps');
        nextSteps.style.cssText = `
            text-align: left;
            margin: 1.5rem 0;
        `;

        const actions = modal.querySelector('.success-actions');
        actions.style.cssText = `
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 2rem;
            flex-wrap: wrap;
        `;
    }

    /**
     * Bind success modal events
     */
    bindSuccessModalEvents(modal, event, options) {
        const continueBtn = modal.querySelector('.continue-exploring');
        const calendarBtn = modal.querySelector('.add-to-calendar');
        const overlay = modal.querySelector('.success-modal-overlay');

        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        };

        continueBtn.addEventListener('click', () => {
            closeModal();
            // Redirect to services or resources page
            window.location.href = '../services.html';
        });

        calendarBtn.addEventListener('click', () => {
            this.addToCalendar(event);
        });

        overlay.addEventListener('click', closeModal);

        // Auto-close after 30 seconds
        setTimeout(closeModal, 30000);
    }

    /**
     * Add event to user's calendar
     */
    addToCalendar(event) {
        const startTime = new Date(event.start_time);
        const endTime = new Date(event.end_time);
        
        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Strategic Consultation - The Obvious Company')}&dates=${this.formatCalendarDate(startTime)}/${this.formatCalendarDate(endTime)}&details=${encodeURIComponent('Strategic Intelligence Assessment consultation with The Obvious Company')}&location=${encodeURIComponent(event.location?.join_url || 'Online')}`;
        
        window.open(calendarUrl, '_blank');
    }

    /**
     * Format date for calendar URL
     */
    formatCalendarDate(date) {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    /**
     * Format event time for display
     */
    formatEventTime(event) {
        const startTime = new Date(event.start_time);
        return startTime.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
        });
    }

    /**
     * Send scheduling confirmation to server
     */
    async sendSchedulingConfirmation(event, options) {
        try {
            const response = await fetch('/api/consultation-scheduled', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    calendlyEvent: event,
                    assessmentContext: options,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send confirmation');
            }

            console.log('Scheduling confirmation sent successfully');
        } catch (error) {
            console.error('Failed to send scheduling confirmation:', error);
        }
    }

    /**
     * Trigger post-scheduling follow-up flow
     */
    triggerPostSchedulingFlow(event, options) {
        // This would typically trigger email sequences, CRM updates, etc.
        console.log('Triggering post-scheduling flow:', { event, options });
        
        // Example: Schedule preparation email
        setTimeout(() => {
            this.sendPreparationEmail(event, options);
        }, 5 * 60 * 1000); // 5 minutes after scheduling
    }

    /**
     * Send preparation email (placeholder)
     */
    async sendPreparationEmail(event, options) {
        try {
            await fetch('/api/send-preparation-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event,
                    options,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Failed to send preparation email:', error);
        }
    }

    /**
     * Get prefill data for Calendly
     */
    getPrefillData(options) {
        const prefill = {};
        
        if (options.email) prefill.email = options.email;
        if (options.firstName) prefill.name = options.firstName;
        if (options.service) prefill.customAnswers = { a1: options.service };
        if (options.persona) prefill.customAnswers = { ...prefill.customAnswers, a2: options.persona };
        
        return prefill;
    }

    /**
     * Get UTM parameters for tracking
     */
    getUTMParameters(options) {
        return {
            utmCampaign: 'assessment-completion',
            utmSource: options.source || 'assessment',
            utmMedium: 'calendar-integration',
            utmContent: options.service || 'consultation'
        };
    }

    /**
     * Show popup blocked message
     */
    showPopupBlockedMessage(url) {
        const message = document.createElement('div');
        message.className = 'popup-blocked-message';
        message.innerHTML = `
            <div class="message-content">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <h4>Popup Blocked</h4>
                    <p>Please allow popups for this site or <a href="${url}" target="_blank">click here to schedule</a>.</p>
                </div>
                <button class="message-close">&times;</button>
            </div>
        `;

        // Style the message
        message.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            z-index: 10002;
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 1rem;
            max-width: 350px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        `;

        document.body.appendChild(message);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 10000);

        // Manual close
        message.querySelector('.message-close').addEventListener('click', () => {
            message.remove();
        });
    }

    /**
     * Check if device is mobile
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Bind general events
     */
    bindEvents() {
        // Listen for consultation scheduling requests
        document.addEventListener('schedule-consultation', (e) => {
            this.scheduleConsultation(e.detail);
        });

        // Handle direct scheduling buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.schedule-consultation, .schedule-consultation *')) {
                e.preventDefault();
                const button = e.target.closest('.schedule-consultation');
                const options = {
                    service: button.dataset.service,
                    persona: button.dataset.persona,
                    readinessScore: button.dataset.readinessScore,
                    source: button.dataset.source || 'direct'
                };
                this.scheduleConsultation(options);
            }
        });
    }

    /**
     * Setup analytics tracking
     */
    setupAnalytics() {
        // Track calendar integration initialization
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calendar_integration_loaded', {
                integration_type: 'calendly',
                page: window.location.pathname
            });
        }
    }

    /**
     * Analytics tracking methods
     */
    trackSchedulingAttempt(options) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'consultation_scheduling_attempted', {
                service: options.service,
                persona: options.persona,
                source: options.source
            });
        }
    }

    trackEventScheduled(event, options) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'consultation_scheduled', {
                service: options.service,
                persona: options.persona,
                event_time: event.start_time,
                conversion_value: this.getConversionValue(options.service)
            });
        }
    }

    trackPopupOpened(options) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calendly_popup_opened', {
                service: options.service,
                source: options.source
            });
        }
    }

    trackModalClosed(options) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calendly_modal_closed', {
                service: options.service,
                source: options.source
            });
        }
    }

    trackProfileViewed(options) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calendly_profile_viewed', {
                service: options.service
            });
        }
    }

    trackTimeSelected(payload, options) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calendly_time_selected', {
                service: options.service,
                selected_time: payload.start_time
            });
        }
    }

    trackEventTypeViewed(options) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calendly_event_type_viewed', {
                service: options.service
            });
        }
    }

    /**
     * Get conversion value for different services
     */
    getConversionValue(service) {
        const values = {
            mastery: 15000,
            amplification: 7500,
            foundation: 2500,
            consultation: 500
        };
        return values[service] || 500;
    }
}

// Initialize calendar integration when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.calendarIntegration = new CalendarIntegration();
    });
} else {
    window.calendarIntegration = new CalendarIntegration();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendarIntegration;
}