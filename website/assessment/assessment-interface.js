/**
 * Assessment Interface Controller
 * Handles assessment modality selection and user flow
 */

class AssessmentInterface {
    constructor() {
        this.currentModality = null;
        this.userPreferences = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupAnimations();
        this.handleURLParams();
        this.trackPageView();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Assessment start buttons
        document.querySelectorAll('.start-assessment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const assessmentType = e.target.dataset.type;
                this.startAssessment(assessmentType);
            });
        });

        // Quick start buttons
        document.querySelectorAll('.quick-start').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showModalitySelector('quick');
            });
        });

        // Comprehensive start buttons
        document.querySelectorAll('.comprehensive-start').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showModalitySelector('comprehensive');
            });
        });

        // Modality card interactions
        document.querySelectorAll('.modality-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.start-assessment')) {
                    const modality = card.dataset.modality;
                    this.highlightModality(modality);
                }
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.closest('.modality-card')) {
                const btn = e.target.closest('.modality-card').querySelector('.start-assessment');
                if (btn) btn.click();
            }
        });
    }

    /**
     * Setup scroll animations
     */
    setupAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.modality-card, .outcome-card, .value-prop').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Handle URL parameters for direct assessment access
     */
    handleURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const service = urlParams.get('service');
        const source = urlParams.get('source');
        const type = urlParams.get('type');

        if (type) {
            // Direct assessment type specified
            this.startAssessment(type, { source, service });
        } else if (service) {
            // Service-specific recommendation
            this.showServiceRecommendation(service);
        } else if (source) {
            // Track source for analytics
            this.userPreferences.source = source;
            this.highlightRecommendedModality(source);
        }
    }

    /**
     * Show service-specific assessment recommendation
     */
    showServiceRecommendation(service) {
        const recommendations = {
            foundation: 'questionnaire',
            amplification: 'scenario',
            mastery: 'hybrid',
            enterprise: 'hybrid'
        };

        const recommendedModality = recommendations[service] || 'questionnaire';
        this.highlightModality(recommendedModality);
        
        // Show service context banner
        this.showServiceBanner(service);
    }

    /**
     * Show service context banner
     */
    showServiceBanner(service) {
        const serviceNames = {
            foundation: 'Foundation Program',
            amplification: 'Amplification Program',
            mastery: 'Mastery Program',
            enterprise: 'Enterprise Solutions'
        };

        const banner = document.createElement('div');
        banner.className = 'service-context-banner';
        banner.style.cssText = `
            background: var(--gradient-primary);
            color: white;
            padding: 1rem;
            text-align: center;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1001;
            transform: translateY(-100%);
            transition: transform 0.3s ease-out;
        `;
        
        banner.innerHTML = `
            <div class="container">
                <p style="margin: 0; font-weight: 500;">
                    <i class="fas fa-info-circle" style="margin-right: 0.5rem;"></i>
                    Interested in ${serviceNames[service]}? This assessment will help determine if it's the right fit.
                    <button class="banner-close" style="background: none; border: none; color: white; margin-left: 1rem; cursor: pointer;">×</button>
                </p>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Show banner
        setTimeout(() => {
            banner.style.transform = 'translateY(0)';
        }, 500);
        
        // Close functionality
        banner.querySelector('.banner-close').addEventListener('click', () => {
            banner.style.transform = 'translateY(-100%)';
            setTimeout(() => banner.remove(), 300);
        });
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            if (banner.parentNode) {
                banner.style.transform = 'translateY(-100%)';
                setTimeout(() => banner.remove(), 300);
            }
        }, 8000);
    }

    /**
     * Highlight recommended modality based on source
     */
    highlightRecommendedModality(source) {
        const sourceRecommendations = {
            'article': 'conversational',
            'blog': 'questionnaire',
            'homepage': 'scenario',
            'services': 'questionnaire',
            'floating-widget': 'scenario',
            'scroll-trigger': 'conversational'
        };

        const recommended = sourceRecommendations[source];
        if (recommended) {
            this.highlightModality(recommended);
        }
    }

    /**
     * Highlight a specific modality
     */
    highlightModality(modalityType) {
        // Remove existing highlights
        document.querySelectorAll('.modality-card').forEach(card => {
            card.classList.remove('highlighted');
        });

        // Add highlight to specified modality
        const targetCard = document.querySelector(`[data-modality="${modalityType}"]`);
        if (targetCard) {
            targetCard.classList.add('highlighted');
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add temporary glow effect
            targetCard.style.boxShadow = '0 0 20px rgba(46, 91, 186, 0.3)';
            setTimeout(() => {
                targetCard.style.boxShadow = '';
            }, 3000);
        }
    }

    /**
     * Show modality selector modal
     */
    showModalitySelector(type) {
        const modal = document.createElement('div');
        modal.className = 'modality-selector-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1002;
            opacity: 0;
            transition: opacity 0.3s ease-out;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: var(--border-radius);
            padding: 3rem;
            max-width: 500px;
            width: 90%;
            text-align: center;
            transform: scale(0.9);
            transition: transform 0.3s ease-out;
        `;
        
        const title = type === 'quick' ? 'Quick Assessment' : 'Comprehensive Assessment';
        const description = type === 'quick' 
            ? 'Get immediate insights in just 5 minutes'
            : 'Complete strategic analysis in 15-20 minutes';
        
        content.innerHTML = `
            <h3 style="color: var(--depth-charcoal); margin-bottom: 1rem;">${title}</h3>
            <p style="color: var(--calm-gray); margin-bottom: 2rem;">${description}</p>
            <div class="quick-modality-options">
                ${this.getModalityOptions(type)}
            </div>
            <button class="modal-close" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--calm-gray);">×</button>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => {
            modal.style.opacity = '1';
            content.style.transform = 'scale(1)';
        }, 10);
        
        // Close functionality
        const closeModal = () => {
            modal.style.opacity = '0';
            content.style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        };
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        content.querySelector('.modal-close').addEventListener('click', closeModal);
        
        // Bind option clicks
        content.querySelectorAll('.quick-option').forEach(option => {
            option.addEventListener('click', () => {
                const assessmentType = option.dataset.type;
                closeModal();
                this.startAssessment(assessmentType, { mode: type });
            });
        });
    }

    /**
     * Get modality options for quick selector
     */
    getModalityOptions(type) {
        if (type === 'quick') {
            return `
                <div class="quick-option" data-type="behavioral" style="padding: 1rem; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 1rem; cursor: pointer; transition: all 0.3s;">
                    <i class="fas fa-eye" style="color: var(--clarity-blue); margin-right: 0.5rem;"></i>
                    <strong>Behavioral Analysis</strong> - 5 minutes
                </div>
                <div class="quick-option" data-type="visual" style="padding: 1rem; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 1rem; cursor: pointer; transition: all 0.3s;">
                    <i class="fas fa-project-diagram" style="color: var(--insight-green); margin-right: 0.5rem;"></i>
                    <strong>Visual Patterns</strong> - 8 minutes
                </div>
            `;
        } else {
            return `
                <div class="quick-option" data-type="scenario" style="padding: 1rem; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 1rem; cursor: pointer; transition: all 0.3s;">
                    <i class="fas fa-theater-masks" style="color: var(--clarity-blue); margin-right: 0.5rem;"></i>
                    <strong>Interactive Scenarios</strong> - 15 minutes
                </div>
                <div class="quick-option" data-type="hybrid" style="padding: 1rem; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 1rem; cursor: pointer; transition: all 0.3s;">
                    <i class="fas fa-layer-group" style="color: var(--energy-amber); margin-right: 0.5rem;"></i>
                    <strong>Hybrid Assessment</strong> - 20 minutes
                </div>
            `;
        }
    }

    /**
     * Start assessment with specified type
     */
    startAssessment(type, options = {}) {
        // Show loading state
        const button = document.querySelector(`[data-type="${type}"]`);
        if (button) {
            button.classList.add('loading');
            button.disabled = true;
        }

        // Track assessment start
        this.trackAssessmentStart(type, options);

        // Store user preferences
        this.userPreferences = {
            ...this.userPreferences,
            assessmentType: type,
            startTime: Date.now(),
            ...options
        };

        // Simulate assessment initialization
        setTimeout(() => {
            this.initializeAssessment(type, options);
        }, 1500);
    }

    /**
     * Initialize assessment interface
     */
    initializeAssessment(type, options) {
        // For now, simulate assessment completion and redirect to completion page
        // In a full implementation, this would load the actual assessment interface
        const params = new URLSearchParams({
            type: type,
            ...options,
            timestamp: Date.now()
        });

        // Create assessment session with mock results
        const sessionId = this.generateSessionId();
        const mockResults = this.generateMockResults(type, options);
        
        localStorage.setItem('assessment-session', JSON.stringify({
            sessionId,
            type,
            options,
            startTime: Date.now(),
            results: mockResults.assessmentResults,
            userProfile: mockResults.userProfile,
            completedAt: Date.now()
        }));

        // Simulate assessment time delay
        setTimeout(() => {
            // Redirect to completion page
            window.location.href = `completion.html?completed=true&session=${sessionId}`;
        }, 2000);
    }

    /**
     * Generate mock assessment results for demonstration
     */
    generateMockResults(type, options) {
        // Mock assessment results based on type
        const personas = ['Strategic Architect', 'Strategic Catalyst', 'Strategic Contributor', 'Strategic Explorer', 'Strategic Observer'];
        const industries = ['Technology', 'Financial Services', 'Healthcare', 'Manufacturing', 'Government'];
        
        const randomPersona = personas[Math.floor(Math.random() * personas.length)];
        const randomIndustry = industries[Math.floor(Math.random() * industries.length)];
        const readinessScore = Math.floor(Math.random() * 40) + 60; // 60-100%
        
        return {
            assessmentResults: {
                assessmentType: type,
                overallScore: readinessScore,
                dimensionScores: {
                    strategic_authority: Math.floor(Math.random() * 30) + 70,
                    organizational_influence: Math.floor(Math.random() * 30) + 65,
                    resource_availability: Math.floor(Math.random() * 40) + 50,
                    implementation_readiness: Math.floor(Math.random() * 35) + 60,
                    cultural_alignment: Math.floor(Math.random() * 25) + 70
                },
                personaClassification: {
                    primary_persona: randomPersona,
                    confidence_score: Math.floor(Math.random() * 20) + 80,
                    secondary_characteristics: ['Strategic thinking', 'Change leadership', 'Innovation focus']
                },
                industryInsights: {
                    sector_readiness: Math.floor(Math.random() * 30) + 65,
                    industry: randomIndustry,
                    regulatory_considerations: ['Data privacy', 'Compliance requirements'],
                    implementation_priorities: ['Process optimization', 'Strategic decision support', 'Team productivity']
                },
                recommendations: {
                    program: this.getRecommendedProgram(randomPersona, readinessScore),
                    description: 'Based on your strategic profile and readiness assessment',
                    timeline: this.getRecommendedTimeline(randomPersona),
                    investment: this.getRecommendedInvestment(randomPersona)
                }
            },
            userProfile: {
                assessmentType: type,
                completionTime: Date.now(),
                source: options.source || 'direct',
                preferences: options
            }
        };
    }

    /**
     * Get recommended program based on persona
     */
    getRecommendedProgram(persona, readinessScore) {
        if (persona === 'Strategic Architect' && readinessScore >= 80) return 'mastery';
        if (persona === 'Strategic Catalyst' && readinessScore >= 70) return 'amplification';
        if (persona === 'Strategic Contributor' && readinessScore >= 60) return 'foundation';
        if (persona === 'Strategic Explorer') return 'foundation';
        return 'consultation';
    }

    /**
     * Get recommended timeline based on persona
     */
    getRecommendedTimeline(persona) {
        const timelines = {
            'Strategic Architect': '12-16 weeks',
            'Strategic Catalyst': '8-12 weeks',
            'Strategic Contributor': '6-8 weeks',
            'Strategic Explorer': '4-6 weeks',
            'Strategic Observer': '2-4 weeks'
        };
        return timelines[persona] || '4-6 weeks';
    }

    /**
     * Get recommended investment based on persona
     */
    getRecommendedInvestment(persona) {
        const investments = {
            'Strategic Architect': '$15,000 - $25,000',
            'Strategic Catalyst': '$7,500 - $15,000',
            'Strategic Contributor': '$2,500 - $7,500',
            'Strategic Explorer': '$2,500 - $5,000',
            'Strategic Observer': 'Free - $2,500'
        };
        return investments[persona] || '$2,500 - $5,000';
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return 'assess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Track assessment start
     */
    trackAssessmentStart(type, options) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'assessment_started', {
                assessment_type: type,
                source: options.source || 'direct',
                service_interest: options.service || 'none',
                mode: options.mode || 'standard'
            });
        }

        console.log('Assessment started:', { type, options });
    }

    /**
     * Track page view
     */
    trackPageView() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: 'Assessment Landing Page',
                page_location: window.location.href
            });
        }
    }
}

// Add CSS for modal and interactions
const style = document.createElement('style');
style.textContent = `
    .modality-card.highlighted {
        border-color: var(--clarity-blue) !important;
        transform: scale(1.02);
        box-shadow: var(--shadow-hover);
    }
    
    .quick-option:hover {
        border-color: var(--clarity-blue) !important;
        background: rgba(46, 91, 186, 0.05);
        transform: translateY(-2px);
    }
    
    .service-context-banner {
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .banner-close:hover {
        opacity: 0.7;
    }
    
    @media (max-width: 768px) {
        .modality-selector-modal .quick-option {
            font-size: 0.9rem;
            padding: 0.75rem;
        }
        
        .service-context-banner {
            font-size: 0.9rem;
            padding: 0.75rem;
        }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new AssessmentInterface());
} else {
    new AssessmentInterface();
}