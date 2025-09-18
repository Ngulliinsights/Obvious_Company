---
title: "Webhooksystem"
type: "framework"
audience: "consultants"
version: "v2025.js"
dependencies:
  - "" # Add dependencies here
implementations:
  - "" # Add implementations here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

"use strict";
/**
 * Webhook System for Real-time Data Synchronization
 * Handles outgoing webhooks and incoming webhook processing
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookSystem = void 0;
const uuid_1 = require("uuid");
const crypto = __importStar(require("crypto"));
class WebhookSystem {
    constructor(db, config) {
        this.retryQueue = new Map();
        this.maxConcurrentDeliveries = 10;
        this.currentDeliveries = 0;
        this.db = db;
        this.maxConcurrentDeliveries = config?.maxConcurrentDeliveries || 10;
        this.initializeDatabase();
        this.startRetryProcessor();
    }
    /**
     * Initialize webhook database tables
     */
    async initializeDatabase() {
        try {
            // Webhook endpoints table
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS webhook_endpoints (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(200) NOT NULL,
                    url TEXT NOT NULL,
                    events TEXT[] NOT NULL,
                    secret VARCHAR(255) NOT NULL,
                    is_active BOOLEAN DEFAULT true,
                    max_retries INTEGER DEFAULT 3,
                    backoff_multiplier DECIMAL DEFAULT 2.0,
                    initial_delay INTEGER DEFAULT 1000,
                    headers JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            // Webhook events table
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS webhook_events (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    endpoint_id UUID REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
                    event_type VARCHAR(100) NOT NULL,
                    payload JSONB NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    attempts INTEGER DEFAULT 0,
                    last_attempt_at TIMESTAMP,
                    next_retry_at TIMESTAMP,
                    response_status INTEGER,
                    response_body TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            // Webhook deliveries table
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS webhook_deliveries (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    event_id UUID REFERENCES webhook_events(id) ON DELETE CASCADE,
                    endpoint_id UUID REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
                    http_status INTEGER NOT NULL,
                    response_time INTEGER NOT NULL,
                    response_headers JSONB DEFAULT '{}'::jsonb,
                    response_body TEXT,
                    delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            // Create indexes
            await this.db.query(`
                CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
                CREATE INDEX IF NOT EXISTS idx_webhook_events_next_retry ON webhook_events(next_retry_at);
                CREATE INDEX IF NOT EXISTS idx_webhook_events_endpoint ON webhook_events(endpoint_id);
                CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON webhook_deliveries(event_id);
                CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON webhook_deliveries(endpoint_id);
            `);
            console.log('✅ Webhook system database tables initialized');
        }
        catch (error) {
            console.error('❌ Failed to initialize webhook database:', error);
            throw error;
        }
    }
    /**
     * Register webhook endpoint
     */
    async registerEndpoint(endpointData) {
        try {
            const endpointId = (0, uuid_1.v4)();
            const secret = endpointData.secret || this.generateSecret();
            const retryPolicy = {
                maxRetries: 3,
                backoffMultiplier: 2.0,
                initialDelay: 1000,
                ...endpointData.retryPolicy
            };
            const result = await this.db.query(`
                INSERT INTO webhook_endpoints (
                    id, name, url, events, secret, max_retries,
                    backoff_multiplier, initial_delay, headers
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [
                endpointId,
                endpointData.name,
                endpointData.url,
                endpointData.events,
                secret,
                retryPolicy.maxRetries,
                retryPolicy.backoffMultiplier,
                retryPolicy.initialDelay,
                JSON.stringify(endpointData.headers || {})
            ]);
            return this.mapDbRowToEndpoint(result.rows[0]);
        }
        catch (error) {
            console.error('Webhook: Failed to register endpoint:', error);
            throw error;
        }
    }
    /**
     * Trigger webhook event
     */
    async triggerEvent(eventType, payload, metadata) {
        try {
            // Get all active endpoints that listen to this event
            const endpoints = await this.getEndpointsForEvent(eventType);
            if (endpoints.length === 0) {
                console.log(`No webhook endpoints registered for event: ${eventType}`);
                return;
            }
            // Create webhook events for each endpoint
            const eventPromises = endpoints.map(endpoint => this.createWebhookEvent(endpoint.id, eventType, payload, metadata));
            await Promise.all(eventPromises);
            // Process events immediately if capacity allows
            this.processQueuedEvents();
        }
        catch (error) {
            console.error('Webhook: Failed to trigger event:', error);
        }
    }
    /**
     * Create webhook event
     */
    async createWebhookEvent(endpointId, eventType, payload, metadata) {
        try {
            const eventId = (0, uuid_1.v4)();
            const enrichedPayload = {
                ...payload,
                event_type: eventType,
                event_id: eventId,
                timestamp: new Date().toISOString(),
                metadata: metadata || {}
            };
            await this.db.query(`
                INSERT INTO webhook_events (id, endpoint_id, event_type, payload)
                VALUES ($1, $2, $3, $4)
            `, [eventId, endpointId, eventType, JSON.stringify(enrichedPayload)]);
            return eventId;
        }
        catch (error) {
            console.error('Webhook: Failed to create webhook event:', error);
            throw error;
        }
    }
    /**
     * Process queued webhook events
     */
    async processQueuedEvents() {
        if (this.currentDeliveries >= this.maxConcurrentDeliveries) {
            return;
        }
        try {
            // Get pending events
            const result = await this.db.query(`
                SELECT we.*, wep.url, wep.secret, wep.headers, wep.max_retries,
                       wep.backoff_multiplier, wep.initial_delay
                FROM webhook_events we
                JOIN webhook_endpoints wep ON we.endpoint_id = wep.id
                WHERE we.status = 'pending' AND wep.is_active = true
                ORDER BY we.created_at ASC
                LIMIT $1
            `, [this.maxConcurrentDeliveries - this.currentDeliveries]);
            const events = result.rows;
            if (events.length === 0) {
                return;
            }
            // Process events concurrently
            const deliveryPromises = events.map(event => this.deliverWebhook(event));
            await Promise.allSettled(deliveryPromises);
        }
        catch (error) {
            console.error('Webhook: Failed to process queued events:', error);
        }
    }
    /**
     * Deliver webhook to endpoint
     */
    async deliverWebhook(eventData) {
        this.currentDeliveries++;
        const startTime = Date.now();
        try {
            const { id: eventId, endpoint_id: endpointId, payload, url, secret, headers } = eventData;
            // Update event status to sending
            await this.db.query(`
                UPDATE webhook_events 
                SET status = 'sending', attempts = attempts + 1, 
                    last_attempt_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [eventId]);
            // Prepare request
            const signature = this.generateSignature(payload, secret);
            const requestHeaders = {
                'Content-Type': 'application/json',
                'User-Agent': 'ObviousCompany-Webhooks/1.0',
                'X-Webhook-Signature': signature,
                'X-Webhook-Event': JSON.parse(payload).event_type,
                'X-Webhook-ID': eventId,
                'X-Webhook-Timestamp': new Date().toISOString(),
                ...JSON.parse(headers || '{}')
            };
            // Send webhook
            const response = await fetch(url, {
                method: 'POST',
                headers: requestHeaders,
                body: payload
            });
            const responseTime = Date.now() - startTime;
            const responseBody = await response.text();
            // Record delivery
            await this.recordDelivery(eventId, endpointId, {
                httpStatus: response.status,
                responseTime,
                responseHeaders: Object.fromEntries(response.headers.entries()),
                responseBody
            });
            if (response.ok) {
                // Success
                await this.db.query(`
                    UPDATE webhook_events 
                    SET status = 'sent', response_status = $1, response_body = $2,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                `, [response.status, responseBody, eventId]);
                console.log(`Webhook delivered successfully: ${eventId} to ${url}`);
            }
            else {
                // HTTP error - schedule retry
                await this.scheduleRetry(eventData, response.status, responseBody);
            }
        }
        catch (error) {
            console.error(`Webhook delivery failed: ${eventData.id}`, error);
            await this.scheduleRetry(eventData, 0, error.message || 'Unknown error');
        }
        finally {
            this.currentDeliveries--;
        }
    }
    /**
     * Schedule webhook retry
     */
    async scheduleRetry(eventData, responseStatus, responseBody) {
        try {
            const { id: eventId, attempts, max_retries, initial_delay, backoff_multiplier } = eventData;
            if (attempts >= max_retries) {
                // Max retries reached - mark as failed
                await this.db.query(`
                    UPDATE webhook_events 
                    SET status = 'failed', response_status = $1, response_body = $2,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                `, [responseStatus, responseBody, eventId]);
                console.log(`Webhook failed permanently: ${eventId} after ${attempts} attempts`);
                return;
            }
            // Calculate next retry time with exponential backoff
            const delay = initial_delay * Math.pow(backoff_multiplier, attempts - 1);
            const nextRetryAt = new Date(Date.now() + delay);
            await this.db.query(`
                UPDATE webhook_events 
                SET status = 'retrying', next_retry_at = $1, response_status = $2,
                    response_body = $3, updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
            `, [nextRetryAt, responseStatus, responseBody, eventId]);
            // Schedule retry
            const timeoutId = setTimeout(() => {
                this.retryWebhook(eventId);
                this.retryQueue.delete(eventId);
            }, delay);
            this.retryQueue.set(eventId, timeoutId);
            console.log(`Webhook retry scheduled: ${eventId} in ${delay}ms (attempt ${attempts}/${max_retries})`);
        }
        catch (error) {
            console.error('Webhook: Failed to schedule retry:', error);
        }
    }
    /**
     * Retry webhook delivery
     */
    async retryWebhook(eventId) {
        try {
            const result = await this.db.query(`
                SELECT we.*, wep.url, wep.secret, wep.headers, wep.max_retries,
                       wep.backoff_multiplier, wep.initial_delay
                FROM webhook_events we
                JOIN webhook_endpoints wep ON we.endpoint_id = wep.id
                WHERE we.id = $1 AND we.status = 'retrying'
            `, [eventId]);
            if (result.rows.length === 0) {
                return;
            }
            await this.deliverWebhook(result.rows[0]);
        }
        catch (error) {
            console.error('Webhook: Failed to retry webhook:', error);
        }
    }
    /**
     * Start retry processor for missed retries
     */
    startRetryProcessor() {
        setInterval(async () => {
            try {
                // Find events that need retry
                const result = await this.db.query(`
                    SELECT we.*, wep.url, wep.secret, wep.headers, wep.max_retries,
                           wep.backoff_multiplier, wep.initial_delay
                    FROM webhook_events we
                    JOIN webhook_endpoints wep ON we.endpoint_id = wep.id
                    WHERE we.status = 'retrying' AND we.next_retry_at <= CURRENT_TIMESTAMP
                    AND wep.is_active = true
                    LIMIT 10
                `);
                const events = result.rows;
                for (const event of events) {
                    if (this.currentDeliveries < this.maxConcurrentDeliveries) {
                        this.deliverWebhook(event);
                    }
                }
            }
            catch (error) {
                console.error('Webhook: Retry processor error:', error);
            }
        }, 30000); // Check every 30 seconds
    }
    /**
     * Record webhook delivery
     */
    async recordDelivery(eventId, endpointId, delivery) {
        try {
            await this.db.query(`
                INSERT INTO webhook_deliveries (
                    event_id, endpoint_id, http_status, response_time,
                    response_headers, response_body
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                eventId,
                endpointId,
                delivery.httpStatus,
                delivery.responseTime,
                JSON.stringify(delivery.responseHeaders),
                delivery.responseBody
            ]);
        }
        catch (error) {
            console.error('Webhook: Failed to record delivery:', error);
        }
    }
    /**
     * Get endpoints for event type
     */
    async getEndpointsForEvent(eventType) {
        try {
            const result = await this.db.query(`
                SELECT * FROM webhook_endpoints
                WHERE is_active = true AND $1 = ANY(events)
            `, [eventType]);
            return result.rows.map(row => this.mapDbRowToEndpoint(row));
        }
        catch (error) {
            console.error('Webhook: Failed to get endpoints for event:', error);
            return [];
        }
    }
    /**
     * Generate webhook signature
     */
    generateSignature(payload, secret) {
        return crypto.createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
    }
    /**
     * Verify webhook signature
     */
    verifySignature(payload, signature, secret) {
        const expectedSignature = this.generateSignature(payload, secret);
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    /**
     * Generate webhook secret
     */
    generateSecret() {
        return crypto.randomBytes(32).toString('hex');
    }
    /**
     * Get webhook statistics
     */
    async getWebhookStats(endpointId) {
        try {
            let whereClause = '';
            const params = [];
            if (endpointId) {
                whereClause = 'WHERE we.endpoint_id = $1';
                params.push(endpointId);
            }
            const result = await this.db.query(`
                SELECT 
                    COUNT(we.id) as total_events,
                    COUNT(CASE WHEN we.status = 'sent' THEN 1 END) as successful_deliveries,
                    COUNT(CASE WHEN we.status = 'failed' THEN 1 END) as failed_deliveries,
                    COALESCE(AVG(wd.response_time), 0) as average_response_time
                FROM webhook_events we
                LEFT JOIN webhook_deliveries wd ON we.id = wd.event_id
                ${whereClause}
            `, params);
            const stats = result.rows[0];
            const totalEvents = parseInt(stats.total_events);
            const successfulDeliveries = parseInt(stats.successful_deliveries);
            const failedDeliveries = parseInt(stats.failed_deliveries);
            const averageResponseTime = parseFloat(stats.average_response_time);
            return {
                totalEvents,
                successfulDeliveries,
                failedDeliveries,
                averageResponseTime,
                successRate: totalEvents > 0 ? (successfulDeliveries / totalEvents) * 100 : 0
            };
        }
        catch (error) {
            console.error('Webhook: Failed to get webhook stats:', error);
            return {
                totalEvents: 0,
                successfulDeliveries: 0,
                failedDeliveries: 0,
                averageResponseTime: 0,
                successRate: 0
            };
        }
    }
    /**
     * Map database row to endpoint
     */
    mapDbRowToEndpoint(row) {
        return {
            id: row.id,
            name: row.name,
            url: row.url,
            events: row.events,
            secret: row.secret,
            isActive: row.is_active,
            retryPolicy: {
                maxRetries: row.max_retries,
                backoffMultiplier: parseFloat(row.backoff_multiplier),
                initialDelay: row.initial_delay
            },
            headers: row.headers,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString()
        };
    }
    /**
     * Get webhook system routes
     */
    getRoutes() {
        const router = require('express').Router();
        // Register webhook endpoint
        router.post('/endpoints', async (req, res) => {
            try {
                const endpoint = await this.registerEndpoint(req.body);
                res.json({
                    success: true,
                    data: endpoint,
                    message: 'Webhook endpoint registered successfully'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to register webhook endpoint'
                });
            }
        });
        // Get webhook statistics
        router.get('/stats/:endpointId?', async (req, res) => {
            try {
                const stats = await this.getWebhookStats(req.params.endpointId);
                res.json({ success: true, data: stats });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to get webhook statistics'
                });
            }
        });
        // Trigger test webhook
        router.post('/test/:endpointId', async (req, res) => {
            try {
                await this.triggerEvent('test_event', {
                    message: 'This is a test webhook',
                    timestamp: new Date().toISOString()
                });
                res.json({
                    success: true,
                    message: 'Test webhook triggered'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to trigger test webhook'
                });
            }
        });
        return router;
    }
}
exports.WebhookSystem = WebhookSystem;
//# sourceMappingURL=webhookSystem.js.map