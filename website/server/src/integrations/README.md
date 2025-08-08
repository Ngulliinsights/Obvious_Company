# External System Integrations

This directory contains the external system integrations for The Obvious Company's AI Assessment Platform. The integrations provide comprehensive CRM, email marketing, calendar scheduling, and webhook capabilities.

## Components

### 1. CRM Integration (`crmIntegration.ts`)

Handles lead capture, contact management, and follow-up automation.

**Features:**
- Lead creation and updates
- Activity tracking
- Status management
- Pipeline analytics
- Search and filtering

**Database Tables:**
- `crm_leads` - Lead information and status
- `crm_activities` - Activity history and engagement tracking

**API Endpoints:**
- `GET /api/integrations/crm/leads/:email` - Get lead by email
- `GET /api/integrations/crm/leads/:email/activities` - Get lead activities
- `PUT /api/integrations/crm/leads/:email/status` - Update lead status
- `GET /api/integrations/crm/leads` - Search leads
- `GET /api/integrations/crm/pipeline/stats` - Get pipeline statistics

### 2. Email Marketing Integration (`emailMarketingIntegration.ts`)

Manages assessment-based campaigns, automated sequences, and personalized messaging.

**Features:**
- Subscriber management
- Assessment-based campaign triggers
- Personalized email sequences
- Email tracking (opens, clicks)
- Unsubscribe management

**Database Tables:**
- `email_campaigns` - Campaign definitions and sequences
- `email_subscribers` - Subscriber information and preferences
- `email_send_records` - Delivery tracking and engagement metrics

**API Endpoints:**
- `GET /api/integrations/email/track/open` - Track email opens
- `GET /api/integrations/email/track/click` - Track email clicks
- `GET /api/integrations/email/unsubscribe` - Handle unsubscribe requests

### 3. Calendar Integration (`calendarIntegration.ts`)

Handles consultation scheduling with multiple calendar providers.

**Features:**
- Consultation request management
- Automatic scheduling based on availability
- Calendly webhook integration
- Google Calendar support (configurable)
- Reminder email automation

**Database Tables:**
- `calendar_events` - Scheduled events and metadata
- `consultation_requests` - Consultation requests and preferences
- `calendar_providers` - Provider configurations

**API Endpoints:**
- `POST /api/integrations/calendar/consultation-request` - Create consultation request
- `POST /api/integrations/calendar/webhooks/calendly` - Calendly webhook handler
- `GET /api/integrations/calendar/available-slots` - Get available time slots

### 4. Webhook System (`webhookSystem.ts`)

Provides real-time data synchronization with external platforms.

**Features:**
- Webhook endpoint registration
- Event triggering and delivery
- Retry logic with exponential backoff
- Delivery tracking and analytics
- Signature verification

**Database Tables:**
- `webhook_endpoints` - Registered webhook endpoints
- `webhook_events` - Event queue and status
- `webhook_deliveries` - Delivery history and metrics

**API Endpoints:**
- `POST /api/integrations/webhooks/endpoints` - Register webhook endpoint
- `GET /api/integrations/webhooks/stats/:endpointId?` - Get webhook statistics
- `POST /api/integrations/webhooks/test/:endpointId` - Trigger test webhook

### 5. Integration Manager (`integrationManager.ts`)

Orchestrates all integrations and provides unified API.

**Features:**
- End-to-end assessment completion handling
- Consultation scheduling orchestration
- Lead capture from multiple sources
- Email engagement tracking
- Default campaign setup

**Key Methods:**
- `handleAssessmentCompletion()` - Process assessment completion
- `handleConsultationScheduling()` - Process consultation requests
- `handleLeadCapture()` - Process lead capture from various sources
- `handleEmailEngagement()` - Track email engagement

## Setup and Configuration

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=obvious_company
DB_USER=postgres
DB_PASSWORD=your-db-password

# Integration Secrets
WEBHOOK_SECRET=your-webhook-secret-key
CALENDAR_WEBHOOK_SECRET=your-calendar-webhook-secret
UNSUBSCRIBE_SECRET=your-unsubscribe-secret-key

# Calendly Integration (Optional)
CALENDLY_WEBHOOK_URL=https://calendly.com/webhooks/your-webhook-url
CALENDLY_ACCESS_TOKEN=your-calendly-access-token
CALENDLY_ORGANIZATION_URI=https://api.calendly.com/organizations/your-org-id
CALENDLY_EVENT_TYPE_URI=https://api.calendly.com/event_types/your-event-type-id

# Consultant Information
CONSULTANT_EMAIL=consultant@theobviouscompany.com
SALES_EMAIL=sales@theobviouscompany.com
```

### 2. Database Setup

The integrations require PostgreSQL. The database tables will be created automatically when the integration manager initializes.

### 3. Build and Run

```bash
# Build TypeScript integrations
npm run build:integrations

# Start the server (integrations will initialize automatically)
npm start
```

## Usage Examples

### Assessment Completion Flow

```javascript
// When a user completes an assessment
await integrationManager.handleAssessmentCompletion({
    email: 'user@example.com',
    firstName: 'John',
    assessmentType: 'strategic_readiness',
    persona: 'Strategic Contributor',
    readinessScore: 75,
    serviceRecommendation: 'foundation',
    assessmentResults: { /* assessment data */ },
    timestamp: new Date().toISOString()
});
```

This will:
1. Create/update lead in CRM
2. Subscribe to email marketing with assessment-based campaigns
3. Send webhook notifications
4. Log CRM activities

### Consultation Scheduling

```javascript
// When a user requests consultation
const requestId = await integrationManager.handleConsultationScheduling({
    email: 'user@example.com',
    firstName: 'John',
    service: 'foundation',
    preferredTimes: ['2024-01-15T10:00:00Z'],
    timezone: 'UTC',
    source: 'assessment_completion'
});
```

This will:
1. Create consultation request
2. Update CRM lead status
3. Send webhook notifications
4. Attempt automatic scheduling
5. Log CRM activities

### Email Campaign Triggers

The system automatically triggers email campaigns based on:
- Assessment completion (persona-specific)
- Newsletter subscription
- Consultation scheduling
- Lead capture from various sources

### Webhook Integration

External systems can register webhooks to receive real-time notifications:

```javascript
// Register webhook endpoint
await integrationManager.webhooks.registerEndpoint({
    name: 'External CRM',
    url: 'https://external-system.com/webhook',
    events: ['assessment_completed', 'consultation_scheduled'],
    secret: 'webhook-secret'
});
```

## Event Types

The system triggers the following webhook events:

- `assessment_completed` - User completes assessment
- `lead_captured` - New lead captured
- `consultation_requested` - Consultation requested
- `consultation_scheduled` - Consultation scheduled
- `email_engagement` - Email opened or clicked
- `lead_status_updated` - Lead status changed

## Error Handling

All integrations include comprehensive error handling:
- Database connection failures
- Email delivery failures
- Webhook delivery failures with retry logic
- API rate limiting
- Data validation errors

## Monitoring and Analytics

The integrations provide detailed analytics:
- CRM pipeline statistics
- Email campaign performance
- Webhook delivery metrics
- Lead conversion tracking
- Assessment completion rates

## Security

Security features include:
- Webhook signature verification
- Database connection encryption
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure unsubscribe token generation

## Testing

Run integration tests:

```bash
npm test src/integrations/integration.test.ts
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Email Delivery Failures**
   - Verify SMTP credentials
   - Check email provider settings
   - Review rate limiting

3. **Webhook Delivery Failures**
   - Check endpoint URL accessibility
   - Verify webhook signature
   - Review retry logic in logs

### Logs

Integration activities are logged with prefixes:
- `CRM:` - CRM integration logs
- `Email Marketing:` - Email marketing logs
- `Calendar:` - Calendar integration logs
- `Webhook:` - Webhook system logs

## Future Enhancements

Planned improvements:
- Salesforce CRM integration
- HubSpot integration
- Advanced email templates
- SMS notifications
- Advanced analytics dashboard
- Machine learning for lead scoring