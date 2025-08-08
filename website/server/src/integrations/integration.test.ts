/**
 * Integration Tests for External System Integrations
 */

const { Pool } = require('pg');
const nodemailer = require('nodemailer');

// Mock database for testing
const mockDb = {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    on: jest.fn(),
    end: jest.fn()
};

// Mock email transporter for testing
const mockTransporter = {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    verify: jest.fn().mockResolvedValue(true),
    close: jest.fn()
};

describe('External System Integrations', () => {
    let integrationManager: any;

    beforeAll(async () => {
        // Mock the dependencies
        jest.mock('pg', () => ({
            Pool: jest.fn(() => mockDb)
        }));

        jest.mock('nodemailer', () => ({
            createTransport: jest.fn(() => mockTransporter)
        }));

        // Import after mocking
        const { IntegrationManager } = require('./integrationManager');
        
        integrationManager = new IntegrationManager({
            database: {
                host: 'localhost',
                port: 5432,
                database: 'test_db',
                user: 'test_user',
                password: 'test_password'
            },
            email: {
                host: 'smtp.test.com',
                port: 587,
                user: 'test@test.com',
                password: 'test_password'
            },
            webhook: {
                baseUrl: 'http://localhost:3000',
                secret: 'test-webhook-secret'
            },
            calendar: {
                baseUrl: 'http://localhost:3000',
                webhookSecret: 'test-calendar-secret'
            },
            emailMarketing: {
                baseUrl: 'http://localhost:3000',
                unsubscribeSecret: 'test-unsubscribe-secret'
            }
        });
    });

    afterAll(async () => {
        if (integrationManager) {
            await integrationManager.cleanup();
        }
    });

    describe('CRM Integration', () => {
        test('should create lead successfully', async () => {
            // Mock successful database insert
            mockDb.query.mockResolvedValueOnce({
                rows: [{
                    id: 'test-lead-id',
                    first_name: 'John',
                    email: 'john@test.com',
                    source: 'assessment_completion',
                    created_at: new Date()
                }]
            });

            const leadData = {
                firstName: 'John',
                email: 'john@test.com',
                source: 'assessment_completion',
                status: 'new_lead',
                timestamp: new Date().toISOString()
            };

            const result = await integrationManager.crm.createOrUpdateLead(leadData);
            
            expect(result).toBeDefined();
            expect(result.firstName).toBe('John');
            expect(result.email).toBe('john@test.com');
        });

        test('should handle lead creation errors gracefully', async () => {
            // Mock database error
            mockDb.query.mockRejectedValueOnce(new Error('Database connection failed'));

            const leadData = {
                firstName: 'Jane',
                email: 'jane@test.com',
                source: 'newsletter_signup',
                status: 'new_lead',
                timestamp: new Date().toISOString()
            };

            await expect(integrationManager.crm.createOrUpdateLead(leadData))
                .rejects.toThrow('Database connection failed');
        });
    });

    describe('Email Marketing Integration', () => {
        test('should subscribe user successfully', async () => {
            // Mock successful database operations
            mockDb.query.mockResolvedValueOnce({
                rows: [{
                    id: 'test-subscriber-id',
                    email: 'subscriber@test.com',
                    first_name: 'Test',
                    subscription_date: new Date(),
                    status: 'active'
                }]
            });

            const subscriberData = {
                email: 'subscriber@test.com',
                firstName: 'Test',
                customFields: {}
            };

            const result = await integrationManager.emailMarketing.subscribeUser(subscriberData);
            
            expect(result).toBeDefined();
            expect(result.email).toBe('subscriber@test.com');
            expect(result.status).toBe('active');
        });

        test('should trigger assessment campaign', async () => {
            // Mock database operations for campaign matching
            mockDb.query.mockResolvedValueOnce({
                rows: [{
                    id: 'test-campaign-id',
                    name: 'Test Campaign',
                    trigger_event: 'assessment_completed',
                    email_sequence: JSON.stringify([{
                        id: 'template-1',
                        subject: 'Test Subject',
                        htmlContent: 'Test Content',
                        delayHours: 1
                    }])
                }]
            });

            const assessmentData = {
                email: 'test@test.com',
                firstName: 'Test',
                persona: 'Strategic Contributor',
                readinessScore: 75,
                assessmentType: 'strategic_readiness',
                serviceRecommendation: 'foundation'
            };

            // Should not throw error
            await expect(integrationManager.emailMarketing.triggerAssessmentCampaign(assessmentData))
                .resolves.not.toThrow();
        });
    });

    describe('Calendar Integration', () => {
        test('should create consultation request', async () => {
            // Mock successful database insert
            mockDb.query.mockResolvedValueOnce({
                rows: [{ id: 'test-request-id' }]
            });

            const requestData = {
                email: 'client@test.com',
                firstName: 'Client',
                service: 'foundation',
                preferredTimes: ['2024-01-15T10:00:00Z'],
                timezone: 'UTC'
            };

            const requestId = await integrationManager.calendar.createConsultationRequest(requestData);
            
            expect(requestId).toBeDefined();
            expect(typeof requestId).toBe('string');
        });
    });

    describe('Webhook System', () => {
        test('should register webhook endpoint', async () => {
            // Mock successful database insert
            mockDb.query.mockResolvedValueOnce({
                rows: [{
                    id: 'test-endpoint-id',
                    name: 'Test Endpoint',
                    url: 'https://test.com/webhook',
                    events: ['test_event'],
                    is_active: true,
                    created_at: new Date()
                }]
            });

            const endpointData = {
                name: 'Test Endpoint',
                url: 'https://test.com/webhook',
                events: ['test_event']
            };

            const result = await integrationManager.webhooks.registerEndpoint(endpointData);
            
            expect(result).toBeDefined();
            expect(result.name).toBe('Test Endpoint');
            expect(result.url).toBe('https://test.com/webhook');
        });

        test('should trigger webhook event', async () => {
            // Mock database operations
            mockDb.query
                .mockResolvedValueOnce({ rows: [] }) // No matching endpoints
                .mockResolvedValueOnce({ rows: [] }); // Event creation

            const eventData = {
                type: 'test_event',
                payload: { message: 'Test message' }
            };

            // Should not throw error even with no endpoints
            await expect(integrationManager.webhooks.triggerEvent(eventData.type, eventData.payload))
                .resolves.not.toThrow();
        });
    });

    describe('Integration Manager Orchestration', () => {
        test('should handle assessment completion end-to-end', async () => {
            // Mock all database operations
            mockDb.query
                .mockResolvedValueOnce({ rows: [{ id: 'lead-id', first_name: 'Test', email: 'test@test.com', created_at: new Date() }] }) // CRM lead creation
                .mockResolvedValueOnce({ rows: [{ id: 'subscriber-id', email: 'test@test.com', first_name: 'Test', subscription_date: new Date(), status: 'active' }] }) // Email subscription
                .mockResolvedValueOnce({ rows: [] }) // Webhook endpoints query
                .mockResolvedValueOnce({ rows: [] }); // Activity logging

            const assessmentData = {
                email: 'test@test.com',
                firstName: 'Test',
                assessmentType: 'strategic_readiness',
                persona: 'Strategic Contributor',
                readinessScore: 80,
                serviceRecommendation: 'foundation',
                assessmentResults: { overallScore: 80 },
                timestamp: new Date().toISOString()
            };

            // Should complete without errors
            await expect(integrationManager.handleAssessmentCompletion(assessmentData))
                .resolves.not.toThrow();
        });

        test('should handle consultation scheduling end-to-end', async () => {
            // Mock database operations
            mockDb.query
                .mockResolvedValueOnce({ rows: [] }) // Consultation request creation
                .mockResolvedValueOnce({ rows: [{ id: 'lead-id', email: 'test@test.com' }] }) // Get lead by email
                .mockResolvedValueOnce({ rows: [] }) // Update lead status
                .mockResolvedValueOnce({ rows: [] }) // Webhook endpoints query
                .mockResolvedValueOnce({ rows: [] }); // Activity logging

            const schedulingData = {
                email: 'test@test.com',
                firstName: 'Test',
                service: 'foundation',
                preferredTimes: ['2024-01-15T10:00:00Z'],
                timezone: 'UTC',
                source: 'direct_scheduling'
            };

            const requestId = await integrationManager.handleConsultationScheduling(schedulingData);
            
            expect(requestId).toBeDefined();
            expect(typeof requestId).toBe('string');
        });
    });
});

// Test configuration
module.exports = {
    testEnvironment: 'node',
    testTimeout: 10000,
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};