// Load analytics tracking
const analyticsScript = document.createElement('script');
analyticsScript.src = '/js/analytics.js';
analyticsScript.async = true;
document.head.appendChild(analyticsScript);

// Optimized JavaScript with improved performance and resource efficiency
class WebsiteController {
    constructor() {
        // Cache frequently accessed DOM elements
        this.elements = {
            mobileMenuBtn: null,
            navLinks: null,
            header: null,
            blurOverlay: null,
            forms: null
        };
        
        // Performance tracking
        this.performance = {
            lastScrollY: 0,
            isScrolled: false,
            scrollTicking: false,
            observers: new Set(),
            animationFrames: new Set()
        };
        
        // Configuration
        this.config = {
            scrollThreshold: 30,
            maxBlur: 100,
            animationDuration: 800,
            staggerDelay: 150,
            scrollDebounceMs: 16, // ~60fps
            notificationTimeout: 5000
        };
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
        } else {
            this.initializeComponents();
        }
    }
    
    initializeComponents() {
        // Initialize image loading optimization
        this.initializeImageLoading();
        // Cache DOM elements once
        this.cacheElements();
        
        // Initialize all components
        this.setupMobileMenu();
        this.setupSmoothScrolling();
        this.setupHeaderEffects();
        this.setupFormHandling();
        this.setupRevealAnimations();
        this.setupAdvancedFeatures();
        this.setupPerformanceOptimizations();
        
        console.log('Website controller initialized successfully');
    }
    
    cacheElements() {
        // Cache all frequently accessed DOM elements to avoid repeated queries
        this.elements = {
            mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
            navLinks: document.querySelector('.nav-links'),
            header: document.querySelector('.header'),
            blurOverlay: document.querySelector('.blur-gradient-overlay'),
            forms: document.querySelectorAll('form'),
            body: document.body,
            logo: document.querySelector('.logo'),
            logoDots: document.querySelectorAll('.logo-dot')
        };
    }
    
    setupMobileMenu() {
        const { mobileMenuBtn, navLinks } = this.elements;
        
        if (!mobileMenuBtn || !navLinks) return;
        
        // Optimized mobile menu toggle with single event listener
        mobileMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const isActive = navLinks.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            
            if (icon) {
                // More efficient class toggling
                icon.className = isActive ? 'fa-times' : 'fa-bars';
            }
            
            // Update ARIA attributes for accessibility
            mobileMenuBtn.setAttribute('aria-expanded', isActive);
            navLinks.setAttribute('aria-hidden', !isActive);
        }, { passive: false });
    }
    
    setupSmoothScrolling() {
        // Use event delegation for better performance with anchor links
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a[href^="#"]');
            if (!anchor) return;
            
            e.preventDefault();
            const targetId = anchor.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                // Use modern scrollIntoView with optimized settings
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                });
            }
        }, { passive: false });
    }
    
    setupHeaderEffects() {
        const { header, blurOverlay } = this.elements;
        if (!header) return;
        
        // Consolidated scroll handler for better performance
        let scrollTimeout;
        const handleScroll = () => {
            if (this.performance.scrollTicking) return;
            
            this.performance.scrollTicking = true;
            
            // Use requestAnimationFrame for smooth animations
            const rafId = requestAnimationFrame(() => {
                this.updateHeaderState();
                this.performance.scrollTicking = false;
            });
            
            this.performance.animationFrames.add(rafId);
            
            // Debounced final state update
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => this.updateHeaderState(), this.config.scrollDebounceMs);
        };
        
        // Optimized scroll listener with passive flag
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Handle resize events efficiently
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.updateHeaderState(), 100);
        }, { passive: true });
        
        // Initialize header state
        this.updateHeaderState();
        
        // Setup intersection observer for performance optimization
        this.setupHeaderObserver();
    }
    
    updateHeaderState() {
        const { header, blurOverlay, body } = this.elements;
        const scrollY = window.pageYOffset;
        const { scrollThreshold, maxBlur } = this.config;
        
        // Calculate values once
        const blurIntensity = Math.min(scrollY / maxBlur, 1);
        const shouldBeScrolled = scrollY > scrollThreshold;
        
        // Only update if state has changed to avoid unnecessary DOM manipulation
        if (shouldBeScrolled !== this.performance.isScrolled) {
            this.performance.isScrolled = shouldBeScrolled;
            
            // Batch DOM updates for better performance
            if (shouldBeScrolled) {
                header.classList.add('scrolled');
                body.classList.add('header-blur-active');
                header.style.setProperty('--blur-intensity', blurIntensity);
                
                // Enhanced scrolled state with backdrop filter
                requestAnimationFrame(() => {
                    header.style.backdropFilter = 'blur(20px)';
                    header.style.background = 'rgba(255, 255, 255, 0.85)';
                    header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
                    header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.08)';
                });
            } else {
                header.classList.remove('scrolled');
                body.classList.remove('header-blur-active');
                header.style.removeProperty('--blur-intensity');
                
                // Reset to transparent state
                requestAnimationFrame(() => {
                    header.style.backdropFilter = 'blur(0px)';
                    header.style.background = 'transparent';
                    header.style.borderBottom = 'none';
                    header.style.boxShadow = 'none';
                });
            }
        }
        
        // Update blur overlay efficiently
        if (blurOverlay) {
            blurOverlay.style.opacity = Math.min(blurIntensity * 1.2, 1);
        }
        
        this.performance.lastScrollY = scrollY;
    }
    
    setupHeaderObserver() {
        const { header, body } = this.elements;
        if (!header) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Toggle header effects based on visibility for performance
                body.classList.toggle('header-effects-enabled', entry.isIntersecting);
            });
        }, { threshold: 0 });
        
        observer.observe(header);
        this.performance.observers.add(observer);
    }
    
    setupFormHandling() {
        const { forms } = this.elements;
        if (!forms.length) return;
        
        // Use event delegation for form handling
        document.addEventListener('submit', (e) => {
            if (e.target.tagName === 'FORM') {
                e.preventDefault();
                this.handleFormSubmit(e);
            }
        });
    }
    
    async handleFormSubmit(e) {
        const form = e.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        
        if (!submitBtn) return;
        
        // Store original state
        const originalText = submitBtn.textContent;
        const originalDisabled = submitBtn.disabled;
        
        // Update UI to show loading state
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(Object.fromEntries(formData)),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const result = await response.json();
                this.showNotification('Message sent successfully!', 'success');
                form.reset();
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            let message = 'Failed to send message. Please try again.';
            
            if (error.name === 'AbortError') {
                message = 'Request timed out. Please try again.';
            } else if (error.message.includes('Failed to fetch')) {
                message = 'Network error. Please check your connection and try again.';
            } else if (error.message.includes('rate limit')) {
                message = 'Too many requests. Please wait a moment and try again.';
            }
            
            this.showNotification(message, 'error');
        } finally {
            // Restore original state
            submitBtn.textContent = originalText;
            submitBtn.disabled = originalDisabled;
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element efficiently
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Define styles as object for better performance
        const styles = {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 2rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'
        };
        
        // Apply styles efficiently
        Object.assign(notification.style, styles);
        
        document.body.appendChild(notification);
        
        // Animate in with RAF for smoothness
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        // Remove notification after timeout
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, this.config.notificationTimeout);
    }
    
    setupRevealAnimations() {
        // Optimized intersection observer for reveal animations
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -80px 0px'
        };
        
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (!entry.isIntersecting) return;
                
                // Use setTimeout for staggered animations but optimize with RAF
                setTimeout(() => {
                    const target = entry.target;
                    
                    // Batch style updates
                    requestAnimationFrame(() => {
                        target.classList.add('revealed');
                        target.style.opacity = '1';
                        target.style.transform = 'translateY(0)';
                        
                        // Handle special element types
                        this.handleSpecialAnimations(target);
                    });
                    
                }, index * this.config.staggerDelay);
                
                // Unobserve element after animation to save resources
                revealObserver.unobserve(entry.target);
            });
        }, observerOptions);
        
        // Initialize reveal animations for relevant elements
        const revealElements = document.querySelectorAll(
            '.reveal-on-scroll, .philosophy-card, .service-card, .section-header, .metric-card, .framework-card'
        );
        
        revealElements.forEach(el => {
            // Set initial styles efficiently
            Object.assign(el.style, {
                opacity: '0',
                transform: 'translateY(40px)',
                transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            });
            
            revealObserver.observe(el);
        });
        
        this.performance.observers.add(revealObserver);
    }
    
    handleSpecialAnimations(target) {
        // Handle metric cards with counting animation
        if (target.classList.contains('metric-card')) {
            this.animateMetricValue(target);
        }
        
        // Handle framework cards with special effects
        if (target.classList.contains('framework-card')) {
            target.style.animation = 'insightEmerge 0.8s ease-out forwards';
        }
    }
    
    animateMetricValue(card) {
        const valueElement = card.querySelector('.metric-value');
        if (!valueElement) return;
        
        const finalValue = valueElement.textContent;
        const numericValue = parseInt(finalValue.replace(/[^\d]/g, ''));
        
        if (isNaN(numericValue) || numericValue === 0) return;
        
        // Optimize animation parameters
        const duration = 1500; // Animation duration in ms
        const startTime = performance.now();
        const isPercentage = finalValue.includes('%');
        const isMultiplier = finalValue.includes('x');
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easing function for smooth animation
            const easedProgress = this.easeOutCubic(progress);
            const currentValue = Math.floor(numericValue * easedProgress);
            
            // Update display
            let displayValue = currentValue.toString();
            if (isPercentage) displayValue += '%';
            if (isMultiplier) displayValue += 'x';
            
            valueElement.textContent = displayValue;
            
            if (progress < 1) {
                const rafId = requestAnimationFrame(animate);
                this.performance.animationFrames.add(rafId);
            } else {
                valueElement.textContent = finalValue;
            }
        };
        
        const rafId = requestAnimationFrame(animate);
        this.performance.animationFrames.add(rafId);
    }
    
    setupAdvancedFeatures() {
        this.setupNeuralLogo();
        this.setupIntelligentHovers();
        this.setupStrategicIndicators();
        this.injectOptimizedStyles();
    }
    
    setupNeuralLogo() {
        const { logo, logoDots } = this.elements;
        if (!logo || !logoDots.length) return;
        
        let isAnimating = false;
        
        const handleLogoEnter = () => {
            if (isAnimating) return;
            isAnimating = true;
            
            // Create the "OC" pattern reveal effect
            const ocPattern = [1, 2, 3, 7, 9, 11, 12, 13, 14, 15, 17, 18];
            
            logoDots.forEach((dot, index) => {
                setTimeout(() => {
                    if (ocPattern.includes(index + 1)) {
                        Object.assign(dot.style, {
                            transform: 'scale(1.4)',
                            background: 'var(--insight-green)',
                            boxShadow: '0 0 12px rgba(0, 166, 118, 0.6)',
                            opacity: '1'
                        });
                    } else {
                        Object.assign(dot.style, {
                            transform: 'scale(1.1)',
                            opacity: '0.7',
                            background: 'var(--energy-amber)'
                        });
                    }
                }, index * 50);
            });
            
            setTimeout(() => { isAnimating = false; }, 800);
        };
        
        const handleLogoLeave = () => {
            const ocPattern = [1, 2, 3, 7, 9, 11, 12, 13, 14, 15, 17, 18];
            
            logoDots.forEach((dot, index) => {
                setTimeout(() => {
                    if (ocPattern.includes(index + 1)) {
                        Object.assign(dot.style, {
                            transform: 'scale(1)',
                            background: 'var(--clarity-blue)',
                            boxShadow: 'none',
                            opacity: '1'
                        });
                    } else {
                        Object.assign(dot.style, {
                            transform: 'scale(1)',
                            opacity: '0.3',
                            background: 'var(--clarity-blue)'
                        });
                    }
                }, index * 30);
            });
        };
        
        logo.addEventListener('mouseenter', handleLogoEnter);
        logo.addEventListener('mouseleave', handleLogoLeave);
    }
    
    setupIntelligentHovers() {
        // Use event delegation for better performance
        document.addEventListener('mouseenter', (e) => {
            const card = e.target.closest('.framework-card, .philosophy-card, .service-card');
            if (!card) return;
            
            this.createRippleEffect(e, card);
        }, true);
    }
    
    createRippleEffect(e, card) {
        const rect = card.getBoundingClientRect();
        const ripple = document.createElement('div');
        
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        Object.assign(ripple.style, {
            position: 'absolute',
            left: x + 'px',
            top: y + 'px',
            width: size + 'px',
            height: size + 'px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(46, 91, 186, 0.1) 0%, transparent 70%)',
            transform: 'scale(0)',
            animation: 'rippleEffect 0.6s linear',
            pointerEvents: 'none',
            zIndex: '1'
        });
        
        card.style.position = 'relative';
        card.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode === card) {
                card.removeChild(ripple);
            }
        }, 600);
    }
    
    setupStrategicIndicators() {
        const indicators = document.querySelectorAll('.strategic-indicator');
        
        indicators.forEach(indicator => {
            // Optimize pulse timing to reduce resource usage
            const createPulse = () => {
                const pulse = document.createElement('div');
                
                Object.assign(pulse.style, {
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '8px',
                    height: '8px',
                    background: 'var(--energy-amber)',
                    borderRadius: '50%',
                    animation: 'neuralPulse 2s ease-out',
                    pointerEvents: 'none',
                    zIndex: '10'
                });
                
                indicator.style.position = 'relative';
                indicator.appendChild(pulse);
                
                setTimeout(() => {
                    if (pulse.parentNode === indicator) {
                        indicator.removeChild(pulse);
                    }
                }, 2000);
            };
            
            // Start with random delay to spread out animations
            const initialDelay = Math.random() * 3000;
            setTimeout(() => {
                createPulse();
                // Set regular interval
                setInterval(createPulse, 6000 + Math.random() * 2000);
            }, initialDelay);
        });
    }
    
    setupPerformanceOptimizations() {
        // Performance monitoring with reduced overhead
        this.setupPerformanceMonitoring();
        
        // Service worker registration
        this.registerServiceWorker();
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => this.cleanup());
    }
    
    setupPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        const monitoringInterval = 2000; // Check every 2 seconds instead of every second
        
        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= monitoringInterval) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // Optimize animations based on performance
                if (fps < 30 && !document.body.classList.contains('reduced-motion')) {
                    console.warn('Low FPS detected, enabling reduced motion');
                    document.body.classList.add('reduced-motion');
                } else if (fps > 45 && document.body.classList.contains('reduced-motion')) {
                    document.body.classList.remove('reduced-motion');
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            const rafId = requestAnimationFrame(measureFPS);
            this.performance.animationFrames.add(rafId);
        };
        
        const rafId = requestAnimationFrame(measureFPS);
        this.performance.animationFrames.add(rafId);
    }
    
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('Service Worker registered successfully:', registration.scope);
                        
                        // Check for updates
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New content is available, show update notification
                                    this.showUpdateNotification();
                                }
                            });
                        });
                    })
                    .catch(error => {
                        console.warn('Service Worker registration failed:', error);
                    });
                    
                // Listen for service worker messages
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data && event.data.type === 'CACHE_UPDATED') {
                        console.log('Cache updated:', event.data.payload);
                    }
                });
            });
        }
    }
    
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <i class="fas fa-sync-alt"></i>
                <span>New version available!</span>
                <button class="update-btn">Update</button>
                <button class="dismiss-btn">&times;</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--clarity-blue);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: var(--shadow-hover);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Handle update
        notification.querySelector('.update-btn').addEventListener('click', () => {
            window.location.reload();
        });
        
        // Handle dismiss
        notification.querySelector('.dismiss-btn').addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }
    
    injectOptimizedStyles() {
        if (document.querySelector('#optimized-animations')) return;
        
        const styles = `
            @keyframes rippleEffect {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            @keyframes intelligentGlow {
                0%, 100% { 
                    box-shadow: 0 0 5px rgba(46, 91, 186, 0.3);
                    filter: brightness(1);
                }
                50% { 
                    box-shadow: 0 0 20px rgba(46, 91, 186, 0.6);
                    filter: brightness(1.1);
                }
            }
            
            @keyframes neuralPulse {
                0% {
                    transform: scale(0);
                    opacity: 1;
                }
                100% {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            @keyframes insightEmerge {
                0% {
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            /* Performance optimizations for reduced motion */
            @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
            
            .reduced-motion * {
                animation-duration: 0.3s !important;
                transition-duration: 0.2s !important;
            }
            
            /* GPU acceleration for better performance */
            .framework-card, .philosophy-card, .service-card,
            .header, .logo, .metric-card {
                will-change: transform;
                backface-visibility: hidden;
                perspective: 1000px;
            }
            
            /* Optimize hover states */
            .intelligent-element:hover {
                animation: intelligentGlow 2s ease-in-out infinite;
                transform: translateZ(0); /* Force GPU acceleration */
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'optimized-animations';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    // Utility functions
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    // Cleanup method to prevent memory leaks
    cleanup() {
        // Cancel all animation frames
        this.performance.animationFrames.forEach(id => {
            cancelAnimationFrame(id);
        });
        this.performance.animationFrames.clear();
        
        // Disconnect all observers
        this.performance.observers.forEach(observer => {
            observer.disconnect();
        });
        this.performance.observers.clear();
        
        console.log('Website controller cleanup completed');
    }
    
    // Image loading optimization
    initializeImageLoading() {
        // Add lazy loading support for images
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => img.classList.add('loaded'));
        }
        
        // Add error handling for images
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('error', function() {
                console.warn('Failed to load image:', this.src);
                this.style.display = 'none';
            });
            
            img.addEventListener('load', function() {
                this.style.opacity = '1';
            });
        });
        
        // Add hover effects for image containers
        document.querySelectorAll('.image-overlay').forEach(container => {
            container.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.02)';
            });
            
            container.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        });
    }
}

// Initialize the website controller
const websiteController = new WebsiteController();

// Load assessment integration and CTA functionality
function loadAssessmentScripts() {
    const currentPath = window.location.pathname;
    
    // Load assessment integration for all pages
    const integrationScript = document.createElement('script');
    let integrationPath = 'js/assessment-integration.js';
    
    // Adjust path for subdirectories
    if (currentPath.includes('/insights/') || currentPath.includes('/learn/')) {
        integrationPath = '../../js/assessment-integration.js';
    }
    
    integrationScript.src = integrationPath;
    integrationScript.async = true;
    integrationScript.onload = () => {
        console.log('Assessment integration loaded successfully');
        
        // Load assessment UI after integration
        loadAssessmentUI();
    };
    integrationScript.onerror = () => {
        console.warn('Assessment integration failed to load - some features may not work');
    };
    document.head.appendChild(integrationScript);
    
    function loadAssessmentUI() {
        const uiScript = document.createElement('script');
        let uiPath = 'js/assessment-ui.js';
        
        // Adjust path for subdirectories
        if (currentPath.includes('/insights/') || currentPath.includes('/learn/')) {
            uiPath = '../../js/assessment-ui.js';
        }
        
        uiScript.src = uiPath;
        uiScript.async = true;
        uiScript.onload = () => {
            console.log('Assessment UI loaded successfully');
        };
        uiScript.onerror = () => {
            console.warn('Assessment UI failed to load - assessment interface may not work');
        };
        document.head.appendChild(uiScript);
    }
    
    // Load assessment CTA functionality (except on assessment pages)
    if (!currentPath.includes('assessment')) {
        const ctaScript = document.createElement('script');
        let ctaPath = 'js/assessment-cta.js';
        
        // Adjust path for subdirectories
        if (currentPath.includes('/insights/') || currentPath.includes('/learn/')) {
            ctaPath = '../../js/assessment-cta.js';
        }
        
        ctaScript.src = ctaPath;
        ctaScript.async = true;
        ctaScript.onload = () => {
            console.log('Assessment CTA script loaded successfully');
        };
        ctaScript.onerror = () => {
            console.warn('Assessment CTA script failed to load from:', ctaPath);
            // Try alternative path
            if (ctaPath !== 'js/assessment-cta.js') {
                const fallbackScript = document.createElement('script');
                fallbackScript.src = 'js/assessment-cta.js';
                fallbackScript.async = true;
                fallbackScript.onerror = () => {
                    console.warn('Assessment CTA fallback also failed - continuing without CTA enhancements');
                };
                document.head.appendChild(fallbackScript);
            }
        };
        document.head.appendChild(ctaScript);
    }
}

// Load assessment scripts
loadAssessmentScripts();