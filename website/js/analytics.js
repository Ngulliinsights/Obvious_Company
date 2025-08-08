/**
 * Client-side Analytics Tracking
 * Tracks user behavior and assessment interactions
 */

class ClientAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
        this.isTracking = true;
        this.apiEndpoint = '/api/analytics/track';
        
        // Initialize tracking
        this.init();
    }

    /**
     * Initialize analytics tracking
     */
    init() {
        // Track page view
        this.trackPageView();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start engagement tracking
        this.startEngagementTracking();
        
        console.log('Analytics tracking initialized');
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Track page view
     */
    trackPageView() {
        const pageData = {
            page: this.getCurrentPage(),
            referrer: document.referrer || 'direct',
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            title: document.title
        };

        this.trackEvent('page_view', pageData);
    }

    /**
     * Get current page identifier
     */
    getCurrentPage() {
        const path = window.location.pathname;
        
        if (path === '/' || path === '/index.html') return 'homepage';
        if (path.includes('assessment')) return 'assessment';
        if (path.includes('services')) return 'services';
        if (path.includes('about')) return 'about';
        if (path.includes('contact')) return 'contact';
        if (path.includes('insights')) return 'insights';
        if (path.includes('learn')) return 'learn';
        
        return path.replace(/^\//, '').replace(/\.html$/, '') || 'unknown';
    }

    /**
     * Set up event listeners for user interactions
     */
    setupEventListeners() {
        // Track clicks on important elements
        document.addEventListener('click', (event) => {
            const target = event.target;
            
            // Track CTA clicks
            if (target.matches('.cta-button, .btn-primary, .assessment-cta')) {
                this.trackEvent('cta_click', {
                    element: target.className,
                    text: target.textContent.trim(),
                    page: this.getCurrentPage()
                });
            }
            
            // Track navigation clicks
            if (target.matches('nav a, .nav-link')) {
                this.trackEvent('navigation_click', {
                    destination: target.href,
                    text: target.textContent.trim(),
                    page: this.getCurrentPage()
                });
            }
            
            // Track form submissions
            if (target.matches('button[type="submit"], input[type="submit"]')) {
                const form = target.closest('form');
                if (form) {
                    this.trackEvent('form_submit_attempt', {
                        formId: form.id || 'unknown',
                        formClass: form.className,
                        page: this.getCurrentPage()
                    });
                }
            }
        });

        // Track form interactions
        document.addEventListener('focus', (event) => {
            if (event.target.matches('input, textarea, select')) {
                this.trackEvent('form_field_focus', {
                    fieldType: event.target.type || event.target.tagName.toLowerCase(),
                    fieldName: event.target.name || event.target.id,
                    page: this.getCurrentPage()
                });
            }
        });

        // Track scroll depth
        let maxScrollDepth = 0;
        window.addEventListener('scroll', this.throttle(() => {
            const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            
            if (scrollDepth > maxScrollDepth && scrollDepth % 25 === 0) {
                maxScrollDepth = scrollDepth;
                this.trackEvent('scroll_depth', {
                    depth: scrollDepth,
                    page: this.getCurrentPage()
                });
            }
        }, 1000));

        // Track time on page when leaving
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Date.now() - this.startTime;
            this.trackEvent('page_exit', {
                timeOnPage,
                page: this.getCurrentPage()
            });
        });

        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            this.trackEvent('visibility_change', {
                hidden: document.hidden,
                page: this.getCurrentPage()
            });
        });
    }

    /**
     * Start engagement tracking
     */
    startEngagementTracking() {
        let engagementStartTime = Date.now();
        let isEngaged = true;

        // Track mouse movement for engagement
        document.addEventListener('mousemove', this.throttle(() => {
            if (!isEngaged) {
                isEngaged = true;
                engagementStartTime = Date.now();
            }
        }, 1000));

        // Track keyboard activity for engagement
        document.addEventListener('keydown', () => {
            if (!isEngaged) {
                isEngaged = true;
                engagementStartTime = Date.now();
            }
        });

        // Check for inactivity
        setInterval(() => {
            if (isEngaged && Date.now() - engagementStartTime > 30000) { // 30 seconds of inactivity
                isEngaged = false;
                this.trackEvent('user_engagement', {
                    engagementType: 'active_session',
                    duration: Date.now() - engagementStartTime,
                    page: this.getCurrentPage()
                });
            }
        }, 30000);
    }

    /**
     * Track assessment-specific events
     */
    trackAssessmentStart(assessmentType, userId = null) {
        this.trackEvent('assessment_started', {
            assessmentType,
            userId,
            sessionId: this.sessionId
        });
    }

    trackQuestionAnswer(questionId, responseTime, questionType, response) {
        this.trackEvent('question_answered', {
            sessionId: this.sessionId,
            questionId,
            responseTime,
            questionType,
            response: this.sanitizeResponse(response)
        });
    }

    trackAssessmentCompletion(assessmentType, completionTime, results) {
        this.trackEvent('assessment_completed', {
            assessmentType,
            sessionId: this.sessionId,
            completionTime,
            results: this.sanitizeResults(results)
        });
    }

    trackAssessmentAbandonment(assessmentType, abandonmentPoint, timeSpent) {
        this.trackEvent('assessment_abandoned', {
            assessmentType,
            sessionId: this.sessionId,
            abandonmentPoint,
            timeSpent
        });
    }

    /**
     * Track lead capture
     */
    trackLeadCapture(email, source = 'unknown') {
        this.trackEvent('lead_captured', {
            sessionId: this.sessionId,
            email: this.hashEmail(email), // Hash for privacy
            source,
            page: this.getCurrentPage()
        });
    }

    /**
     * Track consultation scheduling
     */
    trackConsultationScheduling(service, persona = null) {
        this.trackEvent('consultation_scheduled', {
            sessionId: this.sessionId,
            service,
            persona,
            page: this.getCurrentPage()
        });
    }

    /**
     * Generic event tracking
     */
    trackEvent(eventType, eventData) {
        if (!this.isTracking) return;

        const event = {
            eventType,
            eventData: {
                ...eventData,
                sessionId: this.sessionId,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            },
            sessionId: this.sessionId
        };

        // Store locally for retry mechanism
        this.events.push(event);

        // Send to server
        this.sendEvent(event);
    }

    /**
     * Send event to server with enhanced error handling
     */
    async sendEvent(event) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                console.warn('Analytics tracking failed:', result.message);
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('Analytics request timed out - continuing silently');
            } else if (error.message.includes('Failed to fetch')) {
                console.warn('Analytics service unavailable - continuing silently');
            } else {
                console.warn('Failed to send analytics event:', error.message);
            }
            // Fail silently to not disrupt user experience
        }
    }

    /**
     * Batch send events (for performance) with enhanced error handling
     */
    async sendBatchEvents() {
        if (this.events.length === 0) return;

        const eventsToSend = [...this.events];
        this.events = [];

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for batch
            
            const response = await fetch('/api/analytics/batch-track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ events: eventsToSend }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn('Batch analytics failed with status:', response.status);
                // Don't re-add events to prevent infinite retry loops
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('Batch analytics request timed out - events discarded');
            } else if (error.message.includes('Failed to fetch')) {
                console.warn('Analytics service unavailable for batch - events discarded');
            } else {
                console.warn('Failed to send batch analytics events:', error.message);
            }
            // Don't re-add events to prevent memory buildup and infinite retries
        }
    }

    /**
     * Sanitize response data for privacy
     */
    sanitizeResponse(response) {
        if (typeof response === 'object' && response !== null) {
            const sanitized = { ...response };
            // Remove potentially sensitive fields
            delete sanitized.email;
            delete sanitized.phone;
            delete sanitized.personalInfo;
            delete sanitized.name;
            return sanitized;
        }
        return response;
    }

    /**
     * Sanitize results data for privacy
     */
    sanitizeResults(results) {
        if (typeof results === 'object' && results !== null) {
            const sanitized = { ...results };
            // Keep only non-sensitive analytical data
            return {
                overallScore: sanitized.overallScore,
                persona: sanitized.persona,
                completionTime: sanitized.completionTime,
                assessmentType: sanitized.assessmentType
            };
        }
        return results;
    }

    /**
     * Hash email for privacy
     */
    hashEmail(email) {
        // Simple hash for privacy - in production, use proper hashing
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            const char = email.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return `hashed_${Math.abs(hash)}`;
    }

    /**
     * Throttle function to limit event frequency
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Enable/disable tracking
     */
    setTracking(enabled) {
        this.isTracking = enabled;
        console.log(`Analytics tracking ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get session information
     */
    getSessionInfo() {
        return {
            sessionId: this.sessionId,
            startTime: this.startTime,
            currentPage: this.getCurrentPage(),
            eventsTracked: this.events.length,
            isTracking: this.isTracking
        };
    }

    /**
     * Manual flush of pending events
     */
    flush() {
        this.sendBatchEvents();
    }
}

// Initialize analytics when DOM is ready
let analytics = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        analytics = new ClientAnalytics();
        window.analytics = analytics; // Make available globally
    });
} else {
    analytics = new ClientAnalytics();
    window.analytics = analytics; // Make available globally
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientAnalytics;
}