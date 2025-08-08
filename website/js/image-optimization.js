/**
 * Image Optimization and Enhancement System
 * Handles lazy loading, modern format detection, and performance optimization
 */

class ImageOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.detectModernFormats();
        this.setupLazyLoading();
        this.optimizeExistingImages();
        this.setupImageErrorHandling();
        console.log('🖼️ Image optimization system initialized');
    }

    /**
     * Detect support for modern image formats
     */
    detectModernFormats() {
        // Test WebP support
        const webpTest = new Image();
        webpTest.onload = webpTest.onerror = () => {
            if (webpTest.height === 2) {
                document.documentElement.classList.add('webp');
            }
        };
        webpTest.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';

        // Test AVIF support
        const avifTest = new Image();
        avifTest.onload = avifTest.onerror = () => {
            if (avifTest.height === 2) {
                document.documentElement.classList.add('avif');
            }
        };
        avifTest.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    }

    /**
     * Setup intersection observer for lazy loading
     */
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            // Observe all lazy images
            document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                imageObserver.observe(img);
            });
        } else {
            // Fallback for browsers without IntersectionObserver
            document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                this.loadImage(img);
            });
        }
    }

    /**
     * Load image with optimization
     */
    loadImage(img) {
        const src = img.dataset.src || img.src;
        
        if (src) {
            // Create a new image to preload
            const imageLoader = new Image();
            
            imageLoader.onload = () => {
                img.src = src;
                img.classList.add('loaded');
                
                // Remove loading attribute
                img.removeAttribute('loading');
                
                // Trigger fade-in animation
                requestAnimationFrame(() => {
                    img.style.opacity = '1';
                });
            };
            
            imageLoader.onerror = () => {
                this.handleImageError(img);
            };
            
            // Start loading
            imageLoader.src = src;
        }
    }

    /**
     * Optimize existing images
     */
    optimizeExistingImages() {
        document.querySelectorAll('img').forEach(img => {
            // Add loading optimization
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }

            // Add decoding optimization
            if (!img.hasAttribute('decoding')) {
                img.setAttribute('decoding', 'async');
            }

            // Ensure proper sizing attributes
            if (!img.hasAttribute('width') && !img.hasAttribute('height')) {
                // Try to get dimensions from CSS or natural size
                if (img.complete && img.naturalWidth) {
                    img.setAttribute('width', img.naturalWidth);
                    img.setAttribute('height', img.naturalHeight);
                }
            }
        });
    }

    /**
     * Setup error handling for images
     */
    setupImageErrorHandling() {
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                this.handleImageError(e.target);
            }
        }, true);
    }

    /**
     * Handle image loading errors
     */
    handleImageError(img) {
        // Add error class for styling
        img.classList.add('image-error');
        
        // Try to load a fallback image
        const fallback = img.dataset.fallback;
        if (fallback && img.src !== fallback) {
            img.src = fallback;
            return;
        }

        // Create a placeholder if no fallback
        this.createImagePlaceholder(img);
    }

    /**
     * Create placeholder for failed images
     */
    createImagePlaceholder(img) {
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.style.cssText = `
            width: ${img.offsetWidth || 300}px;
            height: ${img.offsetHeight || 200}px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
        `;
        
        placeholder.innerHTML = `
            <div style="text-align: center;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.5; margin-bottom: 8px;">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <div>Image unavailable</div>
            </div>
        `;
        
        // Replace the image with placeholder
        img.parentNode.replaceChild(placeholder, img);
    }

    /**
     * Preload critical images
     */
    preloadCriticalImages() {
        const criticalImages = document.querySelectorAll('img[data-critical="true"]');
        
        criticalImages.forEach(img => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = img.src || img.dataset.src;
            
            // Add to head
            document.head.appendChild(link);
        });
    }

    /**
     * Setup responsive image switching
     */
    setupResponsiveImages() {
        const updateImages = () => {
            document.querySelectorAll('img[data-responsive]').forEach(img => {
                const breakpoints = JSON.parse(img.dataset.responsive);
                const currentWidth = window.innerWidth;
                
                let selectedSrc = img.dataset.src;
                
                // Find the appropriate image for current screen size
                Object.keys(breakpoints)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .forEach(breakpoint => {
                        if (currentWidth >= parseInt(breakpoint)) {
                            selectedSrc = breakpoints[breakpoint];
                        }
                    });
                
                if (img.src !== selectedSrc) {
                    img.src = selectedSrc;
                }
            });
        };

        // Update on load and resize
        window.addEventListener('resize', this.debounce(updateImages, 250));
        updateImages();
    }

    /**
     * Utility: Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Monitor image performance
     */
    monitorImagePerformance() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.initiatorType === 'img') {
                        // Log slow loading images
                        if (entry.duration > 1000) {
                            console.warn(`Slow loading image: ${entry.name} (${entry.duration}ms)`);
                        }
                    }
                });
            });
            
            observer.observe({ entryTypes: ['resource'] });
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.imageOptimizer = new ImageOptimizer();
    });
} else {
    window.imageOptimizer = new ImageOptimizer();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageOptimizer;
}