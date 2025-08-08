/**
 * Client-side Launch Monitoring and Feedback Collection
 * Handles user feedback, issue reporting, and performance tracking
 */

class LaunchMonitoring {
    constructor() {
        this.apiBase = '/api/launch';
        this.sessionId = this.generateSessionId();
        this.performanceMetrics = [];
        this.userInteractions = [];
        this.errorLog = [];
        
        this.init();
    }

    /**
     * Initialize monitoring system
     */
    init() {
        this.setupPerformanceMonitoring();
        this.setupErrorTracking();
        this.setupUserInteractionTracking();
        this.setupFeedbackUI();
        this.startMetricsCollection();
        
        console.log('Launch monitoring initialized');
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Track page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.recordPageLoadMetrics();
            }, 100);
        });

        // Track navigation performance
        if ('navigation' in performance) {
            this.recordNavigationMetrics();
        }

        // Track resource loading
        if ('getEntriesByType' in performance) {
            this.recordResourceMetrics();
        }
    }

    /**
     * Setup error tracking
     */
    setupErrorTracking() {
        // JavaScript errors
        window.addEventListener('error', (event) => {
            this.recordError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: new Date()
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.recordError({
                type: 'promise_rejection',
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack,
                timestamp: new Date()
            });
        });

        // Network errors
        this.setupNetworkErrorTracking();
    }

    /**
     * Setup network error tracking
     */
    setupNetworkErrorTracking() {
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            const startTime = performance.now();
            
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                
                // Record successful request metrics
                this.recordNetworkMetric({
                    url: args[0],
                    method: args[1]?.method || 'GET',
                    status: response.status,
                    duration: endTime - startTime,
                    success: response.ok
                });
                
                return response;
            } catch (error) {
                const endTime = performance.now();
                
                // Record network error
                this.recordError({
                    type: 'network',
                    message: error.message,
                    url: args[0],
                    method: args[1]?.method || 'GET',
                    duration: endTime - startTime,
                    timestamp: new Date()
                });
                
                throw error;
            }
        };
    }

    /**
     * Setup user interaction tracking
     */
    setupUserInteractionTracking() {
        // Track clicks on important elements
        document.addEventListener('click', (event) => {
            const target = event.target;
            
            // Track assessment-related interactions
            if (target.closest('.assessment-container') || 
                target.closest('[data-assessment]') ||
                target.classList.contains('assessment-button')) {
                
                this.recordUserInteraction({
                    type: 'assessment_interaction',
                    element: target.tagName.toLowerCase(),
                    className: target.className,
                    text: target.textContent?.substring(0, 50),
                    timestamp: new Date()
                });
            }
            
            // Track feedback interactions
            if (target.closest('.feedback-widget') || 
                target.classList.contains('feedback-trigger')) {
                
                this.recordUserInteraction({
                    type: 'feedback_interaction',
                    element: target.tagName.toLowerCase(),
                    action: target.dataset.action,
                    timestamp: new Date()
                });
            }
        });

        // Track form submissions
        document.addEventListener('submit', (event) => {
            const form = event.target;
            
            this.recordUserInteraction({
                type: 'form_submission',
                formId: form.id,
                formClass: form.className,
                action: form.action,
                timestamp: new Date()
            });
        });

        // Track time on page
        this.startTimeTracking();
    }

    /**
     * Setup feedback UI
     */
    setupFeedbackUI() {
        this.createFeedbackWidget();
        this.createIssueReportingButton();
    }

    /**
     * Create feedback widget
     */
    createFeedbackWidget() {
        const widget = document.createElement('div');
        widget.className = 'feedback-widget';
        widget.innerHTML = `
            <div class="feedback-trigger" onclick="launchMonitoring.showFeedbackModal()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                <span>Feedback</span>
            </div>
        `;
        
        widget.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            background: #2E5BBA;
            color: white;
            border-radius: 25px;
            padding: 10px 15px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(46, 91, 186, 0.3);
            transition: all 0.3s ease;
            font-family: Arial, sans-serif;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        widget.addEventListener('mouseenter', () => {
            widget.style.transform = 'translateY(-2px)';
            widget.style.boxShadow = '0 6px 16px rgba(46, 91, 186, 0.4)';
        });
        
        widget.addEventListener('mouseleave', () => {
            widget.style.transform = 'translateY(0)';
            widget.style.boxShadow = '0 4px 12px rgba(46, 91, 186, 0.3)';
        });
        
        document.body.appendChild(widget);
    }

    /**
     * Create issue reporting button
     */
    createIssueReportingButton() {
        // Add issue reporting to existing error messages or create global handler
        window.addEventListener('error', () => {
            setTimeout(() => {
                this.showIssueReportingPrompt();
            }, 1000);
        });
    }

    /**
     * Show feedback modal
     */
    showFeedbackModal() {
        const modal = this.createModal('feedback');
        document.body.appendChild(modal);
        
        // Focus on first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    /**
     * Show issue reporting modal
     */
    showIssueReportingModal() {
        const modal = this.createModal('issue');
        document.body.appendChild(modal);
    }

    /**
     * Show issue reporting prompt
     */
    showIssueReportingPrompt() {
        if (this.errorLog.length === 0) return;
        
        const prompt = document.createElement('div');
        prompt.className = 'issue-prompt';
        prompt.innerHTML = `
            <div class="issue-prompt-content">
                <h4>Oops! Something went wrong</h4>
                <p>We detected an issue. Would you like to report it to help us improve?</p>
                <div class="issue-prompt-buttons">
                    <button onclick="launchMonitoring.showIssueReportingModal(); this.closest('.issue-prompt').remove();">
                        Report Issue
                    </button>
                    <button onclick="this.closest('.issue-prompt').remove();">
                        Dismiss
                    </button>
                </div>
            </div>
        `;
        
        prompt.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1001;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            max-width: 300px;
            font-family: Arial, sans-serif;
        `;
        
        document.body.appendChild(prompt);
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (prompt.parentNode) {
                prompt.remove();
            }
        }, 10000);
    }

    /**
     * Create modal for feedback or issue reporting
     */
    createModal(type) {
        const modal = document.createElement('div');
        modal.className = `${type}-modal modal-overlay`;
        
        const content = type === 'feedback' ? this.createFeedbackForm() : this.createIssueForm();
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${type === 'feedback' ? 'Share Your Feedback' : 'Report an Issue'}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove();">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1002;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
        `;
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.parentNode) {
                modal.remove();
            }
        });
        
        return modal;
    }

    /**
     * Create feedback form HTML
     */
    createFeedbackForm() {
        return `
            <form id="feedback-form" onsubmit="launchMonitoring.submitFeedback(event)">
                <div class="form-group">
                    <label for="feedback-category">Category:</label>
                    <select id="feedback-category" name="category" required>
                        <option value="">Select a category</option>
                        <option value="user_experience">User Experience</option>
                        <option value="assessment_accuracy">Assessment Accuracy</option>
                        <option value="technical_issue">Technical Issue</option>
                        <option value="feature_request">Feature Request</option>
                        <option value="content_quality">Content Quality</option>
                        <option value="performance">Performance</option>
                        <option value="accessibility">Accessibility</option>
                        <option value="cultural_sensitivity">Cultural Sensitivity</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="feedback-rating">Overall Rating:</label>
                    <div class="rating-stars">
                        ${[1,2,3,4,5].map(i => `
                            <span class="star" data-rating="${i}" onclick="launchMonitoring.setRating(${i})">★</span>
                        `).join('')}
                    </div>
                    <input type="hidden" id="feedback-rating" name="rating" value="">
                </div>
                
                <div class="form-group">
                    <label for="feedback-message">Your Feedback:</label>
                    <textarea id="feedback-message" name="message" rows="4" required 
                              placeholder="Please share your thoughts, suggestions, or concerns..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="feedback-email">Email (optional):</label>
                    <input type="email" id="feedback-email" name="email" 
                           placeholder="your@email.com (for follow-up)">
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="this.closest('.modal-overlay').remove();">Cancel</button>
                    <button type="submit">Submit Feedback</button>
                </div>
            </form>
            
            <style>
                .modal-content { background: white; border-radius: 8px; padding: 0; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; }
                .modal-header { padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
                .modal-header h3 { margin: 0; color: #2E5BBA; }
                .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; }
                .modal-body { padding: 20px; }
                .form-group { margin-bottom: 20px; }
                .form-group label { display: block; margin-bottom: 5px; font-weight: bold; color: #374151; }
                .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; }
                .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #2E5BBA; box-shadow: 0 0 0 3px rgba(46, 91, 186, 0.1); }
                .rating-stars { display: flex; gap: 5px; margin: 10px 0; }
                .star { font-size: 24px; color: #d1d5db; cursor: pointer; transition: color 0.2s; }
                .star:hover, .star.active { color: #fbbf24; }
                .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
                .form-actions button { padding: 10px 20px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-size: 14px; }
                .form-actions button[type="submit"] { background: #2E5BBA; color: white; border-color: #2E5BBA; }
                .form-actions button[type="submit"]:hover { background: #1e40af; }
            </style>
        `;
    }

    /**
     * Create issue form HTML
     */
    createIssueForm() {
        const recentErrors = this.errorLog.slice(-3);
        
        return `
            <form id="issue-form" onsubmit="launchMonitoring.submitIssue(event)">
                <div class="form-group">
                    <label for="issue-severity">Severity:</label>
                    <select id="issue-severity" name="severity" required>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                        <option value="low">Low</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="issue-category">Category:</label>
                    <select id="issue-category" name="category" required>
                        <option value="technical_issue">Technical Issue</option>
                        <option value="assessment_blocking">Assessment Blocking</option>
                        <option value="performance">Performance</option>
                        <option value="accessibility">Accessibility</option>
                        <option value="security">Security</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="issue-title">Issue Title:</label>
                    <input type="text" id="issue-title" name="title" required 
                           placeholder="Brief description of the issue">
                </div>
                
                <div class="form-group">
                    <label for="issue-description">Detailed Description:</label>
                    <textarea id="issue-description" name="description" rows="4" required 
                              placeholder="Please describe what happened, what you expected, and any error messages you saw..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="issue-steps">Steps to Reproduce:</label>
                    <textarea id="issue-steps" name="stepsToReproduce" rows="3" 
                              placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="issue-email">Email (optional):</label>
                    <input type="email" id="issue-email" name="email" 
                           placeholder="your@email.com (for updates)">
                </div>
                
                ${recentErrors.length > 0 ? `
                    <div class="form-group">
                        <label>Recent Errors Detected:</label>
                        <div class="error-list">
                            ${recentErrors.map(error => `
                                <div class="error-item">
                                    <strong>${error.type}:</strong> ${error.message}
                                    <small>${new Date(error.timestamp).toLocaleTimeString()}</small>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="form-actions">
                    <button type="button" onclick="this.closest('.modal-overlay').remove();">Cancel</button>
                    <button type="submit">Report Issue</button>
                </div>
            </form>
            
            <style>
                .error-list { background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 10px; }
                .error-item { margin-bottom: 8px; font-size: 12px; }
                .error-item:last-child { margin-bottom: 0; }
                .error-item strong { color: #dc2626; }
                .error-item small { display: block; color: #6b7280; margin-top: 2px; }
            </style>
        `;
    }

    /**
     * Set rating for feedback
     */
    setRating(rating) {
        document.getElementById('feedback-rating').value = rating;
        
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
    }

    /**
     * Submit feedback
     */
    async submitFeedback(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        const feedbackData = {
            category: formData.get('category'),
            rating: parseInt(formData.get('rating')) || null,
            message: formData.get('message'),
            email: formData.get('email') || null,
            sessionId: this.sessionId,
            url: window.location.href,
            assessmentType: this.getCurrentAssessmentType(),
            browserInfo: this.getBrowserInfo(),
            screenResolution: `${screen.width}x${screen.height}`,
            timeOnPage: this.getTimeOnPage()
        };
        
        try {
            const response = await fetch(`${this.apiBase}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedbackData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccessMessage('Thank you for your feedback!');
                form.closest('.modal-overlay').remove();
            } else {
                this.showErrorMessage('Failed to submit feedback. Please try again.');
            }
            
        } catch (error) {
            console.error('Feedback submission error:', error);
            this.showErrorMessage('Failed to submit feedback. Please try again.');
        }
    }

    /**
     * Submit issue report
     */
    async submitIssue(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        const stepsText = formData.get('stepsToReproduce');
        const stepsArray = stepsText ? stepsText.split('\n').filter(step => step.trim()) : [];
        
        const issueData = {
            severity: formData.get('severity'),
            category: formData.get('category'),
            title: formData.get('title'),
            description: formData.get('description'),
            stepsToReproduce: stepsArray,
            email: formData.get('email') || null,
            sessionId: this.sessionId,
            url: window.location.href,
            browserInfo: this.getBrowserInfo(),
            screenResolution: `${screen.width}x${screen.height}`,
            errorMessages: this.errorLog.slice(-5).map(e => e.message),
            consoleErrors: this.errorLog.slice(-5),
            networkErrors: this.errorLog.filter(e => e.type === 'network').slice(-3)
        };
        
        try {
            const response = await fetch(`${this.apiBase}/issues`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(issueData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccessMessage(`Issue reported successfully! Ticket ID: ${result.issueId}`);
                form.closest('.modal-overlay').remove();
            } else {
                this.showErrorMessage('Failed to report issue. Please try again.');
            }
            
        } catch (error) {
            console.error('Issue submission error:', error);
            this.showErrorMessage('Failed to report issue. Please try again.');
        }
    }

    /**
     * Record page load metrics
     */
    recordPageLoadMetrics() {
        if (!performance.timing) return;
        
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
        const firstPaint = performance.getEntriesByType('paint')
            .find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
        
        this.recordPerformanceMetric('pageLoadTime', {
            value: loadTime,
            metadata: {
                domReady,
                firstPaint,
                url: window.location.href,
                referrer: document.referrer
            }
        });
    }

    /**
     * Record navigation metrics
     */
    recordNavigationMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return;
        
        this.recordPerformanceMetric('navigationTiming', {
            value: navigation.loadEventEnd - navigation.fetchStart,
            metadata: {
                dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
                tcpConnect: navigation.connectEnd - navigation.connectStart,
                serverResponse: navigation.responseEnd - navigation.requestStart,
                domProcessing: navigation.domContentLoadedEventEnd - navigation.responseEnd
            }
        });
    }

    /**
     * Record resource metrics
     */
    recordResourceMetrics() {
        const resources = performance.getEntriesByType('resource');
        
        resources.forEach(resource => {
            if (resource.duration > 1000) { // Only track slow resources
                this.recordPerformanceMetric('slowResource', {
                    value: resource.duration,
                    metadata: {
                        name: resource.name,
                        type: resource.initiatorType,
                        size: resource.transferSize
                    }
                });
            }
        });
    }

    /**
     * Record error
     */
    recordError(error) {
        this.errorLog.push(error);
        
        // Keep only last 50 errors
        if (this.errorLog.length > 50) {
            this.errorLog = this.errorLog.slice(-50);
        }
        
        console.error('Recorded error:', error);
    }

    /**
     * Record network metric
     */
    recordNetworkMetric(metric) {
        this.recordPerformanceMetric('networkRequest', {
            value: metric.duration,
            metadata: metric
        });
    }

    /**
     * Record user interaction
     */
    recordUserInteraction(interaction) {
        this.userInteractions.push(interaction);
        
        // Keep only last 100 interactions
        if (this.userInteractions.length > 100) {
            this.userInteractions = this.userInteractions.slice(-100);
        }
    }

    /**
     * Record performance metric
     */
    recordPerformanceMetric(metricType, data) {
        const metric = {
            metricType,
            sessionId: this.sessionId,
            timestamp: new Date(),
            ...data
        };
        
        this.performanceMetrics.push(metric);
        
        // Send to server periodically
        if (this.performanceMetrics.length >= 10) {
            this.sendMetricsToServer();
        }
    }

    /**
     * Send metrics to server
     */
    async sendMetricsToServer() {
        if (this.performanceMetrics.length === 0) return;
        
        const metricsToSend = [...this.performanceMetrics];
        this.performanceMetrics = [];
        
        try {
            await fetch(`${this.apiBase}/metrics/performance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    metricType: 'batch',
                    data: {
                        metrics: metricsToSend,
                        sessionId: this.sessionId,
                        userAgent: navigator.userAgent,
                        url: window.location.href
                    }
                })
            });
        } catch (error) {
            console.error('Failed to send metrics:', error);
            // Re-add metrics to queue for retry
            this.performanceMetrics.unshift(...metricsToSend);
        }
    }

    /**
     * Start metrics collection
     */
    startMetricsCollection() {
        // Send metrics every 30 seconds
        setInterval(() => {
            this.sendMetricsToServer();
        }, 30000);
        
        // Send metrics before page unload
        window.addEventListener('beforeunload', () => {
            if (this.performanceMetrics.length > 0) {
                navigator.sendBeacon(
                    `${this.apiBase}/metrics/performance`,
                    JSON.stringify({
                        metricType: 'batch',
                        data: {
                            metrics: this.performanceMetrics,
                            sessionId: this.sessionId
                        }
                    })
                );
            }
        });
    }

    /**
     * Start time tracking
     */
    startTimeTracking() {
        this.pageStartTime = Date.now();
        
        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.recordTimeMetric();
            } else {
                this.pageStartTime = Date.now();
            }
        });
    }

    /**
     * Record time metric
     */
    recordTimeMetric() {
        const timeOnPage = Date.now() - this.pageStartTime;
        
        this.recordPerformanceMetric('timeOnPage', {
            value: timeOnPage,
            metadata: {
                url: window.location.href,
                interactions: this.userInteractions.length
            }
        });
    }

    /**
     * Helper methods
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getCurrentAssessmentType() {
        // Try to detect current assessment type from URL or page content
        const url = window.location.href;
        if (url.includes('assessment')) {
            if (url.includes('strategic')) return 'strategic_readiness';
            if (url.includes('industry')) return 'industry_specific';
            if (url.includes('persona')) return 'persona_classification';
            return 'general_assessment';
        }
        return null;
    }

    getBrowserInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    getTimeOnPage() {
        return Date.now() - this.pageStartTime;
    }

    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1003;
            padding: 15px 20px;
            border-radius: 4px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize launch monitoring when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.launchMonitoring = new LaunchMonitoring();
    });
} else {
    window.launchMonitoring = new LaunchMonitoring();
}