# Audit and Compliance System

This directory contains the comprehensive audit and compliance system for the AI Integration Assessment Platform, implementing task 11.2 from the project specifications.

## Overview

The audit and compliance system provides:

1. **Comprehensive Audit Logging** - All user interactions and data access
2. **Compliance Monitoring** - Real-time compliance rule checking and violation detection
3. **Data Anonymization** - Privacy-preserving analytics and reporting
4. **Security Testing** - Automated vulnerability assessment and testing

## Components

### AuditLogger (`AuditLogger.ts`)

Handles comprehensive logging of all system events with encryption and compliance tracking.

**Key Features:**
- Encrypted storage of sensitive data
- Configurable retention policies (default: 7 years)
- Compliance flag tracking (GDPR, CCPA, etc.)
- Real-time event logging with severity classification
- Query interface with filtering and pagination

**Usage:**
```typescript
const auditLogger = auditSystem.getAuditLogger();

// Log a user interaction
await auditLogger.logEvent({
  eventType: 'user_interaction',
  userId: 'user123',
  resource: 'assessment_system',
  action: 'start_assessment',
  details: { assessmentType: 'questionnaire' },
  severity: 'low',
  complianceFlags: ['assessment_data']
});

// Log data access
await auditLogger.logDataAccess(
  'user123',
  'user_profile',
  'read',
  { fields: ['email', 'name'] },
  request
);
```

### ComplianceMonitor (`ComplianceMonitor.ts`)

Monitors system compliance against predefined rules and regulations.

**Key Features:**
- Real-time compliance rule checking
- Automated violation detection
- GDPR, CCPA, and internal policy compliance
- Violation resolution tracking
- Compliance metrics and scoring

**Default Rules:**
- Excessive data access detection
- Unauthorized export attempts
- GDPR consent violations
- Data retention policy violations
- Failed authentication threshold monitoring
- Suspicious data access patterns

**Usage:**
```typescript
const complianceMonitor = auditSystem.getComplianceMonitor();

// Start continuous monitoring
complianceMonitor.startMonitoring(15); // Check every 15 minutes

// Manual compliance check
const violations = await complianceMonitor.checkCompliance();

// Get compliance metrics
const metrics = await complianceMonitor.getComplianceMetrics(30);
```

### DataAnonymizer (`DataAnonymizer.ts`)

Provides privacy-preserving data processing for analytics and research.

**Key Features:**
- Configurable anonymization strategies
- Hash-based consistent anonymization
- Temporal data generalization
- Sensitive field detection and removal
- Analytics data aggregation

**Usage:**
```typescript
const dataAnonymizer = auditSystem.getDataAnonymizer();

// Generate anonymized analytics
const analytics = await dataAnonymizer.anonymizeForAnalytics(
  startDate,
  endDate
);

// Export anonymized assessment data
const assessmentData = await dataAnonymizer.anonymizeAssessmentData(
  'questionnaire'
);
```

### SecurityTester (`SecurityTester.ts`)

Automated security testing and vulnerability assessment.

**Key Features:**
- Automated security test execution
- Multiple test categories (authentication, authorization, input validation, etc.)
- Vulnerability detection and tracking
- Continuous and scheduled testing
- Security metrics and reporting

**Test Categories:**
- SQL Injection testing
- Cross-Site Scripting (XSS) testing
- Authentication bypass testing
- Session management testing
- Rate limiting validation
- Data exposure detection
- CSRF protection testing
- Input validation testing
- Encryption verification
- Access control testing

**Usage:**
```typescript
const securityTester = auditSystem.getSecurityTester();

// Start automated testing
securityTester.startAutomatedTesting();

// Run all tests manually
const results = await securityTester.runAllTests();
```

## Middleware Integration

The system includes Express.js middleware for automatic audit logging:

### AuditMiddleware (`middleware.ts`)

**Features:**
- Automatic request/response logging
- Sensitive data sanitization
- Configurable logging levels
- Path exclusion support

**Usage:**
```typescript
import { createAuditMiddleware } from './audit/middleware';

app.use(createAuditMiddleware({
  auditSystem,
  excludePaths: ['/static', '/assets'],
  sensitiveFields: ['password', 'token'],
  logLevel: 'all'
}));
```

### Assessment-Specific Middleware

Specialized middleware for assessment interactions:

```typescript
app.use(createAssessmentAuditMiddleware({ auditSystem }));
```

### Authentication Middleware

Specialized middleware for authentication events:

```typescript
app.use(createAuthAuditMiddleware({ auditSystem }));
```

## API Routes

The system exposes REST API endpoints for audit and compliance management:

### Audit Logs
- `GET /api/audit/logs` - Query audit logs with filtering
- `GET /api/audit/status` - Get system status

### Compliance
- `POST /api/audit/compliance/report` - Generate compliance report
- `GET /api/audit/compliance/metrics` - Get compliance metrics
- `POST /api/audit/compliance/check` - Run compliance check
- `POST /api/audit/compliance/violations/:id/resolve` - Resolve violation

### Data Anonymization
- `GET /api/audit/analytics/anonymized` - Get anonymized analytics
- `GET /api/audit/data/assessment/export` - Export anonymized assessment data
- `POST /api/audit/data/cohorts` - Create anonymized cohorts

### Security Testing
- `POST /api/audit/security/test` - Run security tests
- `GET /api/audit/security/history` - Get test history
- `GET /api/audit/security/vulnerabilities` - Get vulnerabilities

## Database Schema

The system creates the following tables:

### audit_logs
Stores all audit events with encryption for sensitive data.

### compliance_violations
Tracks detected compliance violations and their resolution status.

### security_test_results
Records security test execution results.

### security_vulnerabilities
Stores detected security vulnerabilities.

### anonymization_log
Logs data anonymization activities.

## Configuration

The audit system can be configured during initialization:

```typescript
const auditSystem = new AuditSystem(db, encryptionService, {
  retentionPeriodDays: 2555, // 7 years
  monitoringIntervalMinutes: 15,
  enableAutomatedTesting: true,
  anonymizationConfig: {
    preserveStructure: true,
    saltLength: 32,
    hashAlgorithm: 'sha256',
    dateGranularity: 'week',
    numericRounding: 5
  }
});
```

## Security Considerations

1. **Data Encryption**: All sensitive data in audit logs is encrypted at rest
2. **Access Control**: Admin-only access to audit APIs (implement proper authentication)
3. **Data Retention**: Configurable retention policies with automatic cleanup
4. **Privacy Protection**: Comprehensive data anonymization for analytics
5. **Secure Communication**: All API endpoints should use HTTPS in production

## Compliance Standards

The system supports compliance with:

- **GDPR** (General Data Protection Regulation)
- **CCPA** (California Consumer Privacy Act)
- **PIPEDA** (Personal Information Protection and Electronic Documents Act)
- **Internal Security Policies**

## Monitoring and Alerting

The system provides:

- Real-time compliance violation detection
- Security vulnerability alerts
- Performance metrics tracking
- Automated reporting capabilities

## Testing

Run the audit system tests:

```bash
npm run test:audit
```

The test suite includes:
- Unit tests for all components
- Integration tests
- Error handling validation
- Security test verification

## Deployment

1. Ensure PostgreSQL database is available
2. Set required environment variables
3. Run database migrations to create audit tables
4. Initialize the audit system in your application
5. Configure monitoring and alerting

## Environment Variables

```env
DATABASE_URL=postgresql://localhost:5432/obvious_company
AUDIT_RETENTION_DAYS=2555
COMPLIANCE_MONITORING_INTERVAL=15
ENABLE_SECURITY_TESTING=true
```

## Performance Considerations

- Database indexes are created for optimal query performance
- Configurable cleanup processes for old data
- Efficient anonymization algorithms
- Asynchronous processing for non-blocking operations

## Troubleshooting

Common issues and solutions:

1. **Database Connection Issues**: Check DATABASE_URL and database availability
2. **Encryption Errors**: Verify encryption service configuration
3. **Performance Issues**: Review database indexes and query patterns
4. **Compliance Violations**: Check rule configurations and thresholds

## Future Enhancements

Potential improvements:
- Machine learning-based anomaly detection
- Advanced threat detection algorithms
- Integration with external SIEM systems
- Real-time dashboard for compliance monitoring
- Automated remediation capabilities