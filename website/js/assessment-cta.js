/**
 * Assessment CTA Components
 * Strategic entry points for the AI Integration Assessment Platform
 */

class AssessmentCTA {
    constructor() {
        this.init();
    }

    init() {
        this.createCTAComponents();
        this.bindEvents();
        this.trackEngagement();
    }

    /**
     * Create different types of assessment CTAs based on context
     */
    createCTAComponents() {
        // Homepage Hero CTA
        this.createHeroCTA();
        
        // Service Page Contextual CTAs
        this.createServiceCTAs();
        
        // Blog/Insights Content CTAs
        this.createContentCTAs();
        
        // Floating Assessment Widget
        this.createFloatingWidget();
    }

    /**
     * Homepage Hero Assessment CTA
     */
    createHeroCTA() {
        // Skip hero CTA creation - it's already in the HTML
        // This prevents duplicate buttons and indicators
        return;
    }

    /**
     * Service Page Contextual CTAs
     */
    createServiceCTAs() {
        const serviceCards = document.querySelectorAll('.service-card');
        
        serviceCards.forEach((card, index) => {
            const serviceType = this.getServiceType(card);
            const ctaText = this.getServiceCTAText(serviceType);
            
            // Add assessment recommendation
            const assessmentRec = document.createElement('div');
            assessmentRec.className = 'service-assessment-rec';
            assessmentRec.style.cssText = `
                background: rgba(46, 91, 186, 0.05);
                border: 1px solid rgba(46, 91, 186, 0.1);
                border-radius: 8px;
                padding: 1rem;
                margin-top: 1rem;
                text-align: center;
            `;
            
            assessmentRec.innerHTML = `
                <div style="font-size: 0.9rem; color: var(--calm-gray); margin-bottom: 0.5rem;">
                    <i class="fas fa-lightbulb" style="color: var(--energy-amber); margin-right: 0.5rem;"></i>
                    Not sure if this is right for you?
                </div>
                <a href="assessment/?service=${serviceType}" class="btn btn-outline btn-sm assessment-cta-service">
                    <i class="fas fa-compass"></i>
                    ${ctaText}
                </a>
            `;
            
            const serviceContent = card.querySelector('.service-content');
            if (serviceContent && !serviceContent.querySelector('.service-assessment-rec')) {
                serviceContent.appendChild(assessmentRec);
            }
        });
    }

    /**
     * Blog/Insights Content CTAs
     */
    createContentCTAs() {
        // Article page CTAs
        const articleContent = document.querySelector('.article-content');
        if (articleContent) {
            this.createArticleCTA(articleContent);
        }

        // Blog listing page CTAs
        const blogGrid = document.querySelector('.articles-grid');
        if (blogGrid) {
            this.createBlogListingCTA(blogGrid);
        }

        // Insights hub CTAs
        const insightsSection = document.querySelector('.insights-section');
        if (insightsSection) {
            this.createInsightsCTA(insightsSection);
        }
    }

    /**
     * Article-specific assessment CTA
     */
    createArticleCTA(articleContent) {
        const existingCTA = articleContent.querySelector('.article-cta');
        if (existingCTA) {
            // Enhance existing CTA
            const assessmentLink = existingCTA.querySelector('a');
            if (assessmentLink && !assessmentLink.href.includes('assessment')) {
                const assessmentBtn = document.createElement('a');
                assessmentBtn.className = 'btn btn-secondary assessment-cta-article';
                assessmentBtn.href = 'assessment/?source=article';
                assessmentBtn.innerHTML = `
                    <i class="fas fa-compass"></i>
                    Assess Your Strategic Readiness
                `;
                assessmentLink.parentNode.insertBefore(assessmentBtn, assessmentLink.nextSibling);
            }
        } else {
            // Create new article CTA
            const articleCTA = document.createElement('div');
            articleCTA.className = 'article-cta assessment-cta-container';
            articleCTA.style.cssText = `
                background: var(--gradient-subtle);
                border: 2px solid rgba(46, 91, 186, 0.1);
                border-radius: var(--border-radius);
                padding: 2rem;
                margin: 3rem 0;
                text-align: center;
            `;
            
            articleCTA.innerHTML = `
                <h3 style="color: var(--depth-charcoal); margin-bottom: 1rem;">
                    Ready to Apply These Insights?
                </h3>
                <p style="color: var(--calm-gray); margin-bottom: 1.5rem; max-width: 500px; margin-left: auto; margin-right: auto;">
                    Discover how these strategic concepts apply to your specific situation with our comprehensive AI readiness assessment.
                </p>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <a href="../../assessment/?source=article" class="btn btn-primary assessment-cta-article">
                        <i class="fas fa-compass"></i>
                        Start Your Assessment
                    </a>
                    <a href="../../services.html" class="btn btn-outline">
                        <i class="fas fa-arrow-right"></i>
                        Explore Programs
                    </a>
                </div>
            `;
            
            // Insert before related articles or at end of content
            const relatedSection = articleContent.parentNode.querySelector('.related-articles');
            if (relatedSection) {
                relatedSection.parentNode.insertBefore(articleCTA, relatedSection);
            } else {
                articleContent.appendChild(articleCTA);
            }
        }
    }

    /**
     * Floating Assessment Widget
     */
    createFloatingWidget() {
        // Only show on certain pages and after user engagement
        if (this.shouldShowFloatingWidget()) {
            const widget = document.createElement('div');
            widget.className = 'assessment-floating-widget';
            widget.style.cssText = `
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                background: var(--gradient-primary);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 50px;
                box-shadow: var(--shadow-hover);
                cursor: pointer;
                z-index: 1000;
                transform: translateY(100px);
                opacity: 0;
                transition: var(--transition-base);
                max-width: 280px;
            `;
            
            widget.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="background: rgba(255,255,255,0.2); padding: 0.5rem; border-radius: 50%; flex-shrink: 0;">
                        <i class="fas fa-brain"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 0.9rem;">AI Readiness Check</div>
                        <div style="font-size: 0.75rem; opacity: 0.9;">Free 15-minute assessment</div>
                    </div>
                    <button class="widget-close" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; padding: 0.25rem;">
                        ×
                    </button>
                </div>
            `;
            
            document.body.appendChild(widget);
            
            // Show widget after delay
            setTimeout(() => {
                widget.style.transform = 'translateY(0)';
                widget.style.opacity = '1';
            }, 3000);
            
            // Widget interactions
            widget.addEventListener('click', (e) => {
                if (!e.target.classList.contains('widget-close')) {
                    window.location.href = 'assessment/?source=floating-widget';
                }
            });
            
            widget.querySelector('.widget-close').addEventListener('click', (e) => {
                e.stopPropagation();
                widget.style.transform = 'translateY(100px)';
                widget.style.opacity = '0';
                setTimeout(() => widget.remove(), 300);
                localStorage.setItem('assessment-widget-dismissed', Date.now());
            });
        }
    }

    /**
     * Determine service type from card content
     */
    getServiceType(card) {
        const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
        if (title.includes('foundation')) return 'foundation';
        if (title.includes('amplification')) return 'amplification';
        if (title.includes('mastery')) return 'mastery';
        if (title.includes('enterprise')) return 'enterprise';
        return 'general';
    }

    /**
     * Get contextual CTA text based on service type
     */
    getServiceCTAText(serviceType) {
        const ctaTexts = {
            foundation: 'Check Your Readiness',
            amplification: 'Assess Your Amplification Potential',
            mastery: 'Evaluate Your Leadership Readiness',
            enterprise: 'Organizational Assessment',
            general: 'Find Your Perfect Fit'
        };
        return ctaTexts[serviceType] || ctaTexts.general;
    }

    /**
     * Determine if floating widget should be shown
     */
    shouldShowFloatingWidget() {
        // Don't show on assessment pages
        if (window.location.pathname.includes('assessment')) return false;
        
        // Don't show on homepage - it already has prominent CTAs
        if (window.location.pathname === '/' || window.location.pathname.endsWith('/index.html')) return false;
        
        // Don't show if recently dismissed
        const dismissed = localStorage.getItem('assessment-widget-dismissed');
        if (dismissed && (Date.now() - parseInt(dismissed)) < 24 * 60 * 60 * 1000) {
            return false;
        }
        
        // Show on key pages (excluding homepage)
        const showOnPages = ['/services.html', '/about.html'];
        return showOnPages.some(page => 
            window.location.pathname === page || 
            window.location.pathname.endsWith(page)
        );
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Track CTA clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.assessment-cta-hero, .assessment-cta-service, .assessment-cta-article')) {
                this.trackCTAClick(e.target.closest('[class*="assessment-cta"]'));
            }
        });

        // Show contextual CTAs based on scroll behavior
        this.setupScrollTriggers();
    }

    /**
     * Setup scroll-based CTA triggers
     */
    setupScrollTriggers() {
        // Don't show scroll CTAs on homepage - it already has prominent assessment CTAs
        if (window.location.pathname === '/' || window.location.pathname.endsWith('/index.html')) {
            return;
        }

        let scrollTimeout;
        let hasShownScrollCTA = false;

        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
                
                // Show assessment suggestion after significant engagement
                if (scrollPercent > 60 && !hasShownScrollCTA && !document.querySelector('.scroll-assessment-cta')) {
                    this.showScrollCTA();
                    hasShownScrollCTA = true;
                }
            }, 100);
        });
    }

    /**
     * Show scroll-triggered assessment CTA
     */
    showScrollCTA() {
        const scrollCTA = document.createElement('div');
        scrollCTA.className = 'scroll-assessment-cta';
        scrollCTA.style.cssText = `
            position: fixed;
            top: 50%;
            right: 2rem;
            transform: translateY(-50%);
            background: white;
            border: 2px solid var(--clarity-blue);
            border-radius: var(--border-radius);
            padding: 1.5rem;
            box-shadow: var(--shadow-hover);
            z-index: 999;
            max-width: 300px;
            animation: slideInRight 0.5s ease-out;
        `;
        
        scrollCTA.innerHTML = `
            <button class="close-btn" style="position: absolute; top: 0.5rem; right: 0.5rem; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--calm-gray);">×</button>
            <div style="text-align: center;">
                <div style="background: var(--gradient-primary); color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                    <i class="fas fa-lightbulb"></i>
                </div>
                <h4 style="color: var(--depth-charcoal); margin-bottom: 0.5rem;">Interested in Learning More?</h4>
                <p style="color: var(--calm-gray); font-size: 0.9rem; margin-bottom: 1rem;">
                    Take our strategic assessment to see how these insights apply to your situation.
                </p>
                <a href="assessment/?source=scroll-trigger" class="btn btn-primary btn-sm">
                    <i class="fas fa-compass"></i>
                    Start Assessment
                </a>
            </div>
        `;
        
        document.body.appendChild(scrollCTA);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (scrollCTA.parentNode) {
                scrollCTA.style.animation = 'slideOutRight 0.5s ease-in';
                setTimeout(() => scrollCTA.remove(), 500);
            }
        }, 10000);
        
        // Close button
        scrollCTA.querySelector('.close-btn').addEventListener('click', () => {
            scrollCTA.style.animation = 'slideOutRight 0.5s ease-in';
            setTimeout(() => scrollCTA.remove(), 500);
        });
    }

    /**
     * Track CTA engagement
     */
    trackCTAClick(element) {
        const ctaType = element.className.match(/assessment-cta-(\w+)/)?.[1] || 'unknown';
        const source = new URL(element.href).searchParams.get('source') || ctaType;
        
        // Analytics tracking (implement based on your analytics setup)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'assessment_cta_click', {
                cta_type: ctaType,
                source: source,
                page: window.location.pathname
            });
        }
        
        console.log('Assessment CTA clicked:', { ctaType, source, page: window.location.pathname });
    }

    /**
     * Track general engagement metrics
     */
    trackEngagement() {
        // Track time on page
        const startTime = Date.now();
        
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Date.now() - startTime;
            if (timeOnPage > 30000) { // More than 30 seconds
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'engaged_user', {
                        time_on_page: Math.round(timeOnPage / 1000),
                        page: window.location.pathname
                    });
                }
            }
        });
    }
}

// CSS animations for scroll CTA
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%) translateY(-50%);
            opacity: 0;
        }
        to {
            transform: translateX(0) translateY(-50%);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0) translateY(-50%);
            opacity: 1;
        }
        to {
            transform: translateX(100%) translateY(-50%);
            opacity: 0;
        }
    }
    
    .assessment-cta-container {
        position: relative;
        overflow: hidden;
    }
    
    .assessment-cta-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        transition: left 0.5s;
    }
    
    .assessment-cta-container:hover::before {
        left: 100%;
    }
    
    @media (max-width: 768px) {
        .assessment-floating-widget,
        .scroll-assessment-cta {
            right: 1rem;
            max-width: 250px;
        }
        
        .assessment-indicators {
            flex-direction: column !important;
            gap: 0.5rem !important;
            text-align: center;
        }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new AssessmentCTA());
} else {
    new AssessmentCTA();
}