/**
 * Assessment Completion Flow
 * Handles seamless transition from assessment completion to service pathways
 */

class AssessmentCompletionFlow {
    constructor() {
        this.assessmentResults = null;
        this.userProfile = null;
        this.serviceRecommendations = null;
        this.init();
    }

    init() {
        this.loadAssessmentSession();
        this.bindEvents();
        this.setupAnalytics();
    }

    /**
     * Load assessment session data
     */
    loadAssessmentSession() {
        const sessionData = localStorage.getItem('assessment-session');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            this.assessmentResults = session.results;
            this.userProfile = session.userProfile;
            this.generateServiceRecommendations();
        }
    }

    /**
     * Generate service recommendations based on assessment results
     */
    generateServiceRecommendations() {
        if (!this.assessmentResults) return;

        const { overallScore, personaClassification, industryInsights } = this.assessmentResults;
        
        // Service tier mapping based on assessment results
        const serviceMapping = {
            'Strategic Architect': {
                primary: 'mastery',
                secondary: 'enterprise',
                investment: '$15,000 - $25,000',
                timeline: '12-16 weeks'
            },
            'Strategic Catalyst': {
                primary: 'amplification',
                secondary: 'mastery',
                investment: '$7,500 - $15,000',
                timeline: '8-12 weeks'
            },
            'Strategic Contributor': {
                primary: 'foundation',
                secondary: 'amplification',
                investment: '$2,500 - $7,500',
                timeline: '6-8 weeks'
            },
            'Strategic Explorer': {
                primary: 'foundation',
                secondary: 'consultation',
                investment: '$2,500 - $5,000',
                timeline: '4-6 weeks'
            },
            'Strategic Observer': {
                primary: 'consultation',
                secondary: 'foundation',
                investment: 'Free - $2,500',
                timeline: '2-4 weeks'
            }
        };

        const persona = personaClassification?.primary_persona || 'Strategic Contributor';
        const baseRecommendation = serviceMapping[persona];

        this.serviceRecommendations = {
            ...baseRecommendation,
            persona: persona,
            readinessScore: overallScore,
            industryFocus: industryInsights?.sector_readiness || 'General Business',
            customizations: this.generateCustomizations(persona, industryInsights),
            nextSteps: this.generateNextSteps(persona, overallScore)
        };
    }

    /**
     * Generate persona-specific customizations
     */
    generateCustomizations(persona, industryInsights) {
        const customizations = {
            'Strategic Architect': [
                'Executive-level strategic planning sessions',
                'Board presentation templates and frameworks',
                'Enterprise-wide implementation roadmaps',
                'ROI measurement and reporting systems'
            ],
            'Strategic Catalyst': [
                'Change management and team alignment strategies',
                'Cross-functional collaboration frameworks',
                'Innovation pipeline development',
                'Cultural transformation guidance'
            ],
            'Strategic Contributor': [
                'Department-level optimization strategies',
                'Process automation and efficiency gains',
                'Team productivity enhancement tools',
                'Tactical implementation support'
            ],
            'Strategic Explorer': [
                'Foundational AI literacy and strategic thinking',
                'Personal productivity optimization',
                'Career development and skill building',
                'Mentorship and guidance programs'
            ],
            'Strategic Observer': [
                'Assessment-based consultation',
                'Strategic readiness evaluation',
                'Customized learning recommendations',
                'Flexible engagement options'
            ]
        };

        const industryCustomizations = {
            'Financial Services': ['Regulatory compliance integration', 'Risk management frameworks'],
            'Healthcare': ['Patient outcome optimization', 'Ethical AI implementation'],
            'Manufacturing': ['Supply chain intelligence', 'Predictive maintenance systems'],
            'Government': ['Public service delivery', 'Transparency and accountability'],
            'Technology': ['Innovation acceleration', 'Product development optimization']
        };

        const baseCustomizations = customizations[persona] || customizations['Strategic Contributor'];
        const industryAddons = industryCustomizations[industryInsights?.industry] || [];

        return [...baseCustomizations, ...industryAddons];
    }

    /**
     * Generate next steps based on persona and readiness
     */
    generateNextSteps(persona, readinessScore) {
        const immediateSteps = [];
        const shortTermSteps = [];
        const longTermSteps = [];

        // Immediate steps (next 24-48 hours)
        immediateSteps.push('Schedule your free strategic consultation');
        immediateSteps.push('Review your personalized assessment report');
        
        if (readinessScore >= 70) {
            immediateSteps.push('Begin program enrollment process');
        } else {
            immediateSteps.push('Complete readiness preparation checklist');
        }

        // Short-term steps (next 1-2 weeks)
        shortTermSteps.push('Attend program orientation session');
        shortTermSteps.push('Complete strategic baseline assessment');
        shortTermSteps.push('Set up implementation tracking systems');

        // Long-term steps (next 3-6 months)
        longTermSteps.push('Execute strategic transformation roadmap');
        longTermSteps.push('Measure and optimize implementation results');
        longTermSteps.push('Scale successful strategies across organization');

        return {
            immediate: immediateSteps,
            shortTerm: shortTermSteps,
            longTerm: longTermSteps
        };
    }

    /**
     * Create completion interface
     */
    createCompletionInterface() {
        const completionContainer = document.createElement('div');
        completionContainer.className = 'assessment-completion-container';
        completionContainer.innerHTML = this.generateCompletionHTML();

        // Replace assessment interface with completion flow
        const assessmentContainer = document.querySelector('.assessment-container');
        if (assessmentContainer) {
            assessmentContainer.replaceWith(completionContainer);
        }

        this.bindCompletionEvents(completionContainer);
        this.startLeadCaptureFlow();
    }

    /**
     * Generate completion HTML
     */
    generateCompletionHTML() {
        const { serviceRecommendations } = this;
        if (!serviceRecommendations) return '';

        return `
            <div class="completion-hero">
                <div class="completion-badge">
                    <i class="fas fa-check-circle"></i>
                    Assessment Complete
                </div>
                <h1 class="completion-title">
                    Your Strategic Intelligence Profile: 
                    <span class="persona-highlight">${serviceRecommendations.persona}</span>
                </h1>
                <div class="readiness-score">
                    <div class="score-circle">
                        <div class="score-number">${serviceRecommendations.readinessScore}%</div>
                        <div class="score-label">Strategic Readiness</div>
                    </div>
                </div>
            </div>

            <div class="completion-content">
                <!-- Service Recommendation -->
                <div class="service-recommendation-card">
                    <div class="card-header">
                        <h2>Recommended Program</h2>
                        <div class="confidence-indicator">
                            <i class="fas fa-bullseye"></i>
                            95% Match Confidence
                        </div>
                    </div>
                    
                    <div class="recommended-service">
                        <div class="service-info">
                            <h3>${this.getServiceTitle(serviceRecommendations.primary)}</h3>
                            <div class="service-details">
                                <div class="detail-item">
                                    <i class="fas fa-dollar-sign"></i>
                                    <span>Investment: ${serviceRecommendations.investment}</span>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-clock"></i>
                                    <span>Timeline: ${serviceRecommendations.timeline}</span>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-industry"></i>
                                    <span>Focus: ${serviceRecommendations.industryFocus}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="service-actions">
                            <button class="btn btn-primary schedule-consultation" data-service="${serviceRecommendations.primary}">
                                <i class="fas fa-calendar"></i>
                                Schedule Free Consultation
                            </button>
                            <button class="btn btn-outline learn-more" data-service="${serviceRecommendations.primary}">
                                <i class="fas fa-info-circle"></i>
                                Learn More About This Program
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Customizations -->
                <div class="customizations-card">
                    <h3>Your Program Will Include:</h3>
                    <div class="customizations-grid">
                        ${serviceRecommendations.customizations.map(item => `
                            <div class="customization-item">
                                <i class="fas fa-check"></i>
                                <span>${item}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Next Steps -->
                <div class="next-steps-card">
                    <h3>Your Strategic Roadmap</h3>
                    <div class="steps-timeline">
                        <div class="step-group">
                            <h4><i class="fas fa-rocket"></i> Immediate (24-48 hours)</h4>
                            <ul>
                                ${serviceRecommendations.nextSteps.immediate.map(step => `<li>${step}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="step-group">
                            <h4><i class="fas fa-cogs"></i> Short-term (1-2 weeks)</h4>
                            <ul>
                                ${serviceRecommendations.nextSteps.shortTerm.map(step => `<li>${step}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="step-group">
                            <h4><i class="fas fa-trophy"></i> Long-term (3-6 months)</h4>
                            <ul>
                                ${serviceRecommendations.nextSteps.longTerm.map(step => `<li>${step}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Alternative Options -->
                <div class="alternative-options-card">
                    <h3>Not Ready Yet? Alternative Options</h3>
                    <div class="alternatives-grid">
                        <div class="alternative-option">
                            <h4>Free Resources</h4>
                            <p>Access our strategic frameworks and self-assessment tools</p>
                            <a href="../learn/" class="btn btn-outline btn-sm">
                                <i class="fas fa-book"></i>
                                Explore Resources
                            </a>
                        </div>
                        <div class="alternative-option">
                            <h4>Newsletter</h4>
                            <p>Weekly strategic insights and AI implementation tips</p>
                            <button class="btn btn-outline btn-sm newsletter-signup">
                                <i class="fas fa-envelope"></i>
                                Subscribe
                            </button>
                        </div>
                        <div class="alternative-option">
                            <h4>Community</h4>
                            <p>Join our network of strategic leaders and innovators</p>
                            <a href="../success/community/" class="btn btn-outline btn-sm">
                                <i class="fas fa-users"></i>
                                Join Community
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lead Capture Modal -->
            <div id="leadCaptureModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Get Your Detailed Results</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Enter your details to receive your comprehensive assessment report and schedule your free consultation.</p>
                        <form id="leadCaptureForm" class="lead-capture-form">
                            <div class="form-group">
                                <label for="firstName">First Name *</label>
                                <input type="text" id="firstName" name="firstName" required>
                            </div>
                            <div class="form-group">
                                <label for="email">Email Address *</label>
                                <input type="email" id="email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="company">Company/Organization</label>
                                <input type="text" id="company" name="company">
                            </div>
                            <div class="form-group">
                                <label for="role">Your Role</label>
                                <select id="role" name="role">
                                    <option value="">Select your role...</option>
                                    <option value="ceo">CEO/Founder</option>
                                    <option value="executive">C-Level Executive</option>
                                    <option value="director">Director/VP</option>
                                    <option value="manager">Manager</option>
                                    <option value="consultant">Consultant</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-download"></i>
                                Get My Results & Schedule Consultation
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get service title from service key
     */
    getServiceTitle(serviceKey) {
        const titles = {
            foundation: 'Foundation Program',
            amplification: 'Amplification Program', 
            mastery: 'Mastery Program',
            enterprise: 'Enterprise Solutions',
            consultation: 'Strategic Consultation'
        };
        return titles[serviceKey] || 'Custom Program';
    }

    /**
     * Bind completion interface events
     */
    bindCompletionEvents(container) {
        // Schedule consultation buttons
        container.querySelectorAll('.schedule-consultation').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const service = e.target.dataset.service;
                this.scheduleConsultation(service);
            });
        });

        // Learn more buttons
        container.querySelectorAll('.learn-more').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const service = e.target.dataset.service;
                this.showServiceDetails(service);
            });
        });

        // Newsletter signup
        const newsletterBtn = container.querySelector('.newsletter-signup');
        if (newsletterBtn) {
            newsletterBtn.addEventListener('click', () => {
                this.showNewsletterSignup();
            });
        }

        // Lead capture form
        const leadForm = container.querySelector('#leadCaptureForm');
        if (leadForm) {
            leadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLeadCapture(new FormData(leadForm));
            });
        }

        // Modal close
        const modalClose = container.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.hideLeadCaptureModal();
            });
        }
    }

    /**
     * Start lead capture flow
     */
    startLeadCaptureFlow() {
        // Show lead capture modal after 30 seconds if no action taken
        setTimeout(() => {
            if (!this.hasUserEngaged()) {
                this.showLeadCaptureModal();
            }
        }, 30000);

        // Track user engagement
        this.trackUserEngagement();
    }

    /**
     * Check if user has engaged with completion interface
     */
    hasUserEngaged() {
        return localStorage.getItem('assessment-user-engaged') === 'true';
    }

    /**
     * Track user engagement
     */
    trackUserEngagement() {
        const engagementEvents = ['click', 'scroll', 'keydown'];
        
        const markEngaged = () => {
            localStorage.setItem('assessment-user-engaged', 'true');
            engagementEvents.forEach(event => {
                document.removeEventListener(event, markEngaged);
            });
        };

        engagementEvents.forEach(event => {
            document.addEventListener(event, markEngaged, { once: true });
        });
    }

    /**
     * Show lead capture modal
     */
    showLeadCaptureModal() {
        const modal = document.getElementById('leadCaptureModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
            
            // Focus first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 300);
            }
        }
    }

    /**
     * Hide lead capture modal
     */
    hideLeadCaptureModal() {
        const modal = document.getElementById('leadCaptureModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Handle lead capture form submission
     */
    async handleLeadCapture(formData) {
        const submitBtn = document.querySelector('#leadCaptureForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            // Show loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;

            // Prepare lead data
            const leadData = {
                firstName: formData.get('firstName'),
                email: formData.get('email'),
                company: formData.get('company'),
                role: formData.get('role'),
                assessmentResults: this.assessmentResults,
                serviceRecommendation: this.serviceRecommendations,
                timestamp: new Date().toISOString(),
                source: 'assessment-completion'
            };

            // Submit to server
            const response = await fetch('/api/assessment-lead-capture', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(leadData)
            });

            if (response.ok) {
                // Success - hide modal and show success message
                this.hideLeadCaptureModal();
                this.showSuccessMessage();
                this.startAutomatedFollowUp(leadData);
                
                // Track conversion
                this.trackConversion('lead_captured', leadData);
            } else {
                throw new Error('Failed to submit lead information');
            }

        } catch (error) {
            console.error('Lead capture error:', error);
            this.showErrorMessage('Failed to submit information. Please try again.');
        } finally {
            // Restore button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * Schedule consultation
     */
    scheduleConsultation(service) {
        // Track consultation scheduling intent
        this.trackConversion('consultation_scheduled', { service });

        // Redirect to calendar scheduling with context
        const params = new URLSearchParams({
            service: service,
            persona: this.serviceRecommendations?.persona || '',
            readiness: this.serviceRecommendations?.readinessScore || '',
            source: 'assessment-completion'
        });

        window.open(`https://calendly.com/obvious-company/strategic-consultation?${params.toString()}`, '_blank');
    }

    /**
     * Show service details
     */
    showServiceDetails(service) {
        // Track service interest
        this.trackConversion('service_details_viewed', { service });

        // Redirect to service page with context
        window.location.href = `../services.html#${service}?source=assessment&persona=${this.serviceRecommendations?.persona || ''}`;
    }

    /**
     * Start automated follow-up sequence
     */
    startAutomatedFollowUp(leadData) {
        // This would typically integrate with your email marketing system
        // For now, we'll simulate the process
        
        console.log('Starting automated follow-up for:', leadData.email);
        
        // Schedule follow-up emails based on service recommendation
        const followUpSequence = this.getFollowUpSequence(leadData.serviceRecommendation);
        
        // In a real implementation, this would trigger your email automation
        this.scheduleFollowUpEmails(leadData, followUpSequence);
    }

    /**
     * Get follow-up email sequence based on service recommendation
     */
    getFollowUpSequence(serviceRecommendation) {
        const sequences = {
            'mastery': [
                { delay: 2, template: 'executive_welcome', subject: 'Your Strategic Transformation Roadmap' },
                { delay: 24, template: 'mastery_deep_dive', subject: 'Executive AI Mastery: What to Expect' },
                { delay: 72, template: 'consultation_reminder', subject: 'Ready to discuss your strategic goals?' }
            ],
            'amplification': [
                { delay: 2, template: 'catalyst_welcome', subject: 'Your Strategic Amplification Journey Begins' },
                { delay: 24, template: 'amplification_case_study', subject: 'How leaders like you achieve 3x strategic impact' },
                { delay: 72, template: 'consultation_reminder', subject: 'Let\'s discuss your amplification strategy' }
            ],
            'foundation': [
                { delay: 2, template: 'foundation_welcome', subject: 'Building Your Strategic Foundation' },
                { delay: 24, template: 'foundation_roadmap', subject: 'Your 6-week transformation plan' },
                { delay: 72, template: 'consultation_reminder', subject: 'Questions about getting started?' }
            ],
            'consultation': [
                { delay: 2, template: 'consultation_welcome', subject: 'Your Strategic Assessment Results' },
                { delay: 24, template: 'preparation_guide', subject: 'How to prepare for your consultation' },
                { delay: 48, template: 'consultation_reminder', subject: 'Ready to schedule your free consultation?' }
            ]
        };

        return sequences[serviceRecommendation?.primary] || sequences['consultation'];
    }

    /**
     * Schedule follow-up emails (placeholder for email automation integration)
     */
    scheduleFollowUpEmails(leadData, sequence) {
        sequence.forEach(email => {
            setTimeout(() => {
                console.log(`Sending ${email.template} to ${leadData.email}`);
                // In real implementation, this would call your email service API
            }, email.delay * 60 * 60 * 1000); // Convert hours to milliseconds
        });
    }

    /**
     * Show success message
     */
    showSuccessMessage() {
        const successMessage = document.createElement('div');
        successMessage.className = 'success-notification';
        successMessage.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <div>
                    <h4>Success!</h4>
                    <p>Your detailed results have been sent to your email. Check your inbox in the next few minutes.</p>
                </div>
                <button class="notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(successMessage);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            successMessage.remove();
        }, 5000);

        // Manual close
        successMessage.querySelector('.notification-close').addEventListener('click', () => {
            successMessage.remove();
        });
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-notification';
        errorMessage.innerHTML = `
            <div class="notification-content error">
                <i class="fas fa-exclamation-circle"></i>
                <div>
                    <h4>Error</h4>
                    <p>${message}</p>
                </div>
                <button class="notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(errorMessage);

        // Auto-hide after 8 seconds
        setTimeout(() => {
            errorMessage.remove();
        }, 8000);

        // Manual close
        errorMessage.querySelector('.notification-close').addEventListener('click', () => {
            errorMessage.remove();
        });
    }

    /**
     * Track conversion events
     */
    trackConversion(event, data) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', event, {
                ...data,
                assessment_type: this.assessmentResults?.assessmentType,
                persona: this.serviceRecommendations?.persona,
                readiness_score: this.serviceRecommendations?.readinessScore
            });
        }

        console.log('Conversion tracked:', event, data);
    }

    /**
     * Setup analytics tracking
     */
    setupAnalytics() {
        // Track completion page view
        if (typeof gtag !== 'undefined') {
            gtag('event', 'assessment_completed', {
                assessment_type: this.assessmentResults?.assessmentType,
                persona: this.serviceRecommendations?.persona,
                readiness_score: this.serviceRecommendations?.readinessScore
            });
        }
    }

    /**
     * Bind general events
     */
    bindEvents() {
        // Handle browser back button
        window.addEventListener('popstate', () => {
            // Prevent going back to assessment
            if (confirm('Are you sure you want to leave? Your results will be lost.')) {
                window.location.href = '../';
            } else {
                history.pushState(null, null, window.location.href);
            }
        });

        // Prevent accidental page refresh
        window.addEventListener('beforeunload', (e) => {
            if (!this.hasUserEngaged()) {
                e.preventDefault();
                e.returnValue = 'Your assessment results will be lost. Are you sure you want to leave?';
            }
        });
    }
}

// Initialize completion flow when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only initialize if we're on the completion page
        if (window.location.pathname.includes('completion') || 
            new URLSearchParams(window.location.search).get('completed') === 'true') {
            new AssessmentCompletionFlow();
        }
    });
} else {
    if (window.location.pathname.includes('completion') || 
        new URLSearchParams(window.location.search).get('completed') === 'true') {
        new AssessmentCompletionFlow();
    }
}