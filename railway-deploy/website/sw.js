const CACHE_NAME = 'obvious-company-v2.0';
const STATIC_CACHE = 'static-v2.0';
const DYNAMIC_CACHE = 'dynamic-v2.0';
const API_CACHE = 'api-v2.0';

// Enhanced cache strategy with different cache types
const urlsToCache = [
    '/',
    '/index.html',
    '/about.html',
    '/services.html',
    '/contact.html',
    '/methodology.html',
    '/case-studies.html',
    '/assessment/',
    '/assessment/index.html',
    '/css/styles.css',
    '/js/main.js',
    '/js/analytics.js',
    '/js/assessment-cta.js',
    '/js/assessment-integration.js',
    '/404.html',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// API endpoints to cache
const apiEndpoints = [
    '/api/health',
    '/api/analytics/track'
];

// Install event - enhanced with better error handling
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE).then(cache => {
                console.log('Caching static assets...');
                return cache.addAll(urlsToCache.filter(url => !url.startsWith('/api/')));
            }),
            // Pre-cache API endpoints that are safe to cache
            caches.open(API_CACHE).then(cache => {
                console.log('Pre-caching API endpoints...');
                return Promise.allSettled(
                    apiEndpoints.map(endpoint => 
                        fetch(endpoint).then(response => {
                            if (response.ok) {
                                return cache.put(endpoint, response);
                            }
                        }).catch(err => {
                            console.warn('Failed to pre-cache API endpoint:', endpoint, err);
                        })
                    )
                );
            })
        ]).then(() => {
            console.log('Service Worker installation complete');
            // Force activation of new service worker
            return self.skipWaiting();
        }).catch(error => {
            console.error('Service Worker installation failed:', error);
        })
    );
});

// Enhanced fetch event with intelligent caching strategies
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests and chrome-extension requests
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Handle different types of requests with appropriate strategies
    if (url.pathname.startsWith('/api/')) {
        // API requests - network first with cache fallback
        event.respondWith(handleApiRequest(request));
    } else if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/)) {
        // Static assets - cache first
        event.respondWith(handleStaticAssets(request));
    } else {
        // HTML pages - network first with cache fallback
        event.respondWith(handlePageRequest(request));
    }
});

// API request handler - network first, cache fallback
async function handleApiRequest(request) {
    const url = new URL(request.url);
    
    // Don't cache POST requests or sensitive endpoints
    if (request.method !== 'GET' || 
        url.pathname.includes('/contact') || 
        url.pathname.includes('/assessment/start') ||
        url.pathname.includes('/assessment/response')) {
        return fetch(request);
    }
    
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(API_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('Network request failed, trying cache:', request.url);
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response for analytics
        if (url.pathname.includes('/analytics/')) {
            return new Response(JSON.stringify({ 
                success: true, 
                message: 'Offline - request queued' 
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        throw error;
    }
}

// Static assets handler - cache first
async function handleStaticAssets(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('Failed to fetch static asset:', request.url);
        throw error;
    }
}

// Page request handler - network first with cache fallback
async function handlePageRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful HTML responses
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('Network request failed, trying cache:', request.url);
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback to offline page
        const offlinePage = await caches.match('/404.html');
        if (offlinePage) {
            return offlinePage;
        }
        
        throw error;
    }
}

// Enhanced activate event with better cache management
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== API_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all clients
            self.clients.claim()
        ]).then(() => {
            console.log('Service Worker activation complete');
            
            // Notify clients about cache update
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'CACHE_UPDATED',
                        payload: 'Service Worker updated and caches refreshed'
                    });
                });
            });
        })
    );
});

// Background sync for offline analytics
self.addEventListener('sync', event => {
    if (event.tag === 'analytics-sync') {
        event.waitUntil(syncAnalytics());
    }
});

// Sync queued analytics when back online
async function syncAnalytics() {
    try {
        // Get queued analytics from IndexedDB or localStorage
        const queuedEvents = await getQueuedAnalytics();
        
        if (queuedEvents.length > 0) {
            console.log('Syncing', queuedEvents.length, 'queued analytics events');
            
            for (const event of queuedEvents) {
                try {
                    await fetch('/api/analytics/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(event)
                    });
                } catch (error) {
                    console.warn('Failed to sync analytics event:', error);
                }
            }
            
            // Clear queued events after successful sync
            await clearQueuedAnalytics();
        }
    } catch (error) {
        console.error('Analytics sync failed:', error);
    }
}

// Helper functions for analytics queue (simplified)
async function getQueuedAnalytics() {
    // In a real implementation, this would use IndexedDB
    return JSON.parse(localStorage.getItem('queuedAnalytics') || '[]');
}

async function clearQueuedAnalytics() {
    localStorage.removeItem('queuedAnalytics');
}

// Handle push notifications (future enhancement)
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/images/icon-192x192.png',
            badge: '/images/badge-72x72.png',
            data: data.data
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});

console.log('Service Worker script loaded');