import { Pool } from 'pg';
import { AuditSystem, AuditLogger, ComplianceMonitor, DataAnonymizer, SecurityTester } from './index';
import { EncryptionService } from '../security/EncryptionService';

// Mock database pool for testing
const mockDb = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn()
} as unknown as Pool;

// Mock encryption service
const mockEncryptionService = {
  encrypt: jest.fn().mockResolvedValue('encrypted_data'),
  decrypt: jest.fn().mockResolvedValue('decrypted_data'),
  generateKey: jest.fn().mockReturnValue('test_key'),
  hash: jest.fn().mockReturnValue('hashed_value')
} as unknown as EncryptionService;

describe('Audit System', () => {
  let auditSystem: AuditSystem;
  let auditLogger: AuditLogger;
  let complianceMonitor: ComplianceMonitor;
  let dataAnonymizer: DataAnonymizer;
  let securityTester: SecurityTester;

  beforeEach(() => {
    jest.clearAllMocks();
    auditSystem = new AuditSystem(mockDb, mockEncryptionService);
    auditLogger = auditSystem.getAuditLogger();
    complianceMonitor = auditSystem.getComplianceMonitor();
    dataAnonymizer = auditSystem.getDataAnonymizer();
    securityTester = auditSystem.getSecurityTester();
  });

  describe('AuditLogger', () => {
    test('should log audit events successfully', async () => {
      // Mock successful database insert
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const eventId = await auditLogger.logEvent({
        eventType: 'test_event',
        resource: 'test_resource',
        action: 'test_action',
        details: { test: 'data' },
        severity: 'low'
      });

      expect(eventId).toBeDefined();
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.arrayContaining([
          expect.any(String), // id
          'test_event',
          undefined, // user_id
          undefined, // session_id
          'test_resource',
          'test_action',
          expect.any(String), // encrypted details
          undefined, // ip_address
          undefined, // user_agent
          expect.any(Date), // timestamp
          'low',
          null // compliance_flags
        ])
      );
    });

    test('should query audit logs with filters', async () => {
      const mockResults = [
        {
          id: 'test-id',
          event_type: 'test_event',
          details: '{"test": "data"}',
          compliance_flags: '[]'
        }
      ];
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: mockResults });

      const logs = await auditLogger.queryLogs({
        eventType: 'test_event',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        limit: 10
      });

      expect(logs).toHaveLength(1);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM audit_logs WHERE 1=1'),
        expect.arrayContaining(['test_event', new Date('2024-01-01'), new Date('2024-12-31'), 10])
      );
    });

    test('should log data access events', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const mockRequest = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-user-agent')
      };

      await auditLogger.logDataAccess(
        'user123',
        'user_data',
        'read',
        { dataFields: ['email', 'name'] },
        mockRequest
      );

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.arrayContaining([
          expect.any(String),
          'data_access',
          'user123',
          undefined,
          'user_data',
          'read',
          expect.any(String),
          '127.0.0.1',
          'test-user-agent',
          expect.any(Date),
          expect.any(String),
          expect.any(String)
        ])
      );
    });

    test('should generate compliance reports', async () => {
      const mockReportData = [
        {
          event_type: 'data_access',
          action: 'read',
          severity: 'low',
          compliance_flags: '["gdpr_relevant"]',
          event_count: '5',
          unique_users: '3',
          first_occurrence: new Date(),
          last_occurrence: new Date()
        }
      ];
      // Mock both the main query and the compliance status query
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockReportData })
        .mockResolvedValueOnce({ rows: [] }); // For compliance status

      const report = await auditLogger.generateComplianceReport(
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );

      expect(report).toHaveProperty('reportPeriod');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('eventBreakdown');
      expect(report.eventBreakdown).toHaveLength(1);
    });
  });

  describe('ComplianceMonitor', () => {
    test('should check compliance rules', async () => {
      // Mock audit log query
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // For storing violations
        .mockResolvedValueOnce({ rows: [] }); // For compliance status

      const violations = await complianceMonitor.checkCompliance();

      expect(Array.isArray(violations)).toBe(true);
    });

    test('should get compliance metrics', async () => {
      const mockMetricsData = [
        { count: '2', severity: 'high' },
        { count: '1', severity: 'critical' }
      ];
      // Mock the audit logger query first, then the violations query
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // For audit logs query
        .mockResolvedValueOnce({ rows: mockMetricsData }); // For violations query

      const metrics = await complianceMonitor.getComplianceMetrics(30);

      expect(metrics).toHaveProperty('totalEvents');
      expect(metrics).toHaveProperty('violations');
      expect(metrics).toHaveProperty('violationRate');
      expect(metrics).toHaveProperty('complianceScore');
      expect(metrics).toHaveProperty('riskLevel');
    });

    test('should resolve violations', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await complianceMonitor.resolveViolation(
        'violation-123',
        'admin-user',
        'Fixed the issue'
      );

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE compliance_violations'),
        expect.arrayContaining([
          expect.any(Date),
          'admin-user',
          'Fixed the issue',
          'violation-123'
        ])
      );
    });
  });

  describe('DataAnonymizer', () => {
    test('should anonymize data for analytics', async () => {
      const mockRawData = [
        {
          id: 'event-1',
          event_type: 'assessment_interaction',
          details: { industry: 'technology', persona: 'architect' },
          timestamp: new Date()
        }
      ];
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: mockRawData });

      const analyticsData = await dataAnonymizer.anonymizeForAnalytics(
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );

      expect(analyticsData).toHaveProperty('assessmentCompletions');
      expect(analyticsData).toHaveProperty('averageCompletionTime');
      expect(analyticsData).toHaveProperty('industryDistribution');
      expect(analyticsData).toHaveProperty('personaDistribution');
    });

    test('should anonymize assessment data', async () => {
      const mockAssessmentData = [
        {
          id: 'assessment-1',
          event_type: 'assessment_interaction',
          details: { assessmentType: 'questionnaire' },
          ip_address: '127.0.0.1',
          user_agent: 'test-agent'
        }
      ];
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: mockAssessmentData });

      const anonymizedData = await dataAnonymizer.anonymizeAssessmentData('questionnaire');

      expect(Array.isArray(anonymizedData)).toBe(true);
      // Should not contain sensitive fields
      if (anonymizedData.length > 0) {
        expect(anonymizedData[0]).not.toHaveProperty('ip_address');
        expect(anonymizedData[0]).not.toHaveProperty('user_agent');
      }
    });
  });

  describe('SecurityTester', () => {
    test('should run all security tests', async () => {
      // Mock database operations for storing results
      (mockDb.query as jest.Mock)
        .mockResolvedValue({ rows: [] }); // For storing test results and vulnerabilities

      const results = await securityTester.runAllTests();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Each result should have required properties
      results.forEach(result => {
        expect(result).toHaveProperty('testId');
        expect(result).toHaveProperty('testName');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('vulnerabilities');
        expect(result).toHaveProperty('executionTime');
        expect(result).toHaveProperty('timestamp');
      });
    });

    test('should start and stop automated testing', () => {
      // Start automated testing
      securityTester.startAutomatedTesting();
      
      // Stop automated testing
      securityTester.stopAutomatedTesting();
      
      // No exceptions should be thrown
      expect(true).toBe(true);
    });
  });

  describe('AuditSystem Integration', () => {
    test('should initialize successfully', async () => {
      // Mock table creation queries
      (mockDb.query as jest.Mock).mockResolvedValue({ rows: [] });

      await auditSystem.initialize();

      // Should have called database queries to create tables
      expect(mockDb.query).toHaveBeenCalled();
    });

    test('should generate comprehensive compliance report', async () => {
      // Mock all the database queries needed for the report
      (mockDb.query as jest.Mock)
        .mockResolvedValue({ rows: [] }) // Default mock for any query
        .mockResolvedValueOnce({ rows: [{ event_count: '10', unique_users: '5', compliance_flags: '[]' }] }) // Audit report
        .mockResolvedValueOnce({ rows: [] }) // Compliance status
        .mockResolvedValueOnce({ rows: [] }) // Audit logs for metrics
        .mockResolvedValueOnce({ rows: [{ count: '2', severity: 'medium' }] }) // Compliance violations
        .mockResolvedValueOnce({ rows: [{ total_tests: '5', passed_tests: '4', failed_tests: '1', total_vulnerabilities: '2' }] }) // Security summary
        .mockResolvedValueOnce({ rows: [] }); // Analytics data

      const report = await auditSystem.generateComplianceReport(
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );

      expect(report).toHaveProperty('reportPeriod');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('auditSummary');
      expect(report).toHaveProperty('complianceMetrics');
      expect(report).toHaveProperty('securitySummary');
      expect(report).toHaveProperty('dataPrivacy');
      expect(report).toHaveProperty('recommendations');
      expect(report.summary).toHaveProperty('overallComplianceScore');
      expect(report.summary).toHaveProperty('riskLevel');
    });

    test('should shutdown gracefully', async () => {
      await auditSystem.shutdown();
      
      // No exceptions should be thrown
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      (mockDb.query as jest.Mock).mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(auditLogger.logEvent({
        eventType: 'test_event',
        resource: 'test_resource',
        action: 'test_action',
        details: {},
        severity: 'low'
      })).rejects.toThrow('Audit logging failed');
    });

    test('should handle encryption errors gracefully', async () => {
      (mockEncryptionService.encrypt as jest.Mock).mockRejectedValueOnce(new Error('Encryption failed'));
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      // Should still log the event even if encryption fails
      const eventId = await auditLogger.logEvent({
        eventType: 'test_event',
        resource: 'test_resource',
        action: 'test_action',
        details: { sensitive: 'data' },
        severity: 'low'
      });

      expect(eventId).toBeDefined();
    });
  });
});

// Integration test with real database (if available)
describe('Audit System Integration Tests', () => {
  // These tests would run against a real test database
  // Skip if no test database is available
  const testDbAvailable = process.env.TEST_DATABASE_URL !== undefined;

  test.skip('should work with real database', async () => {
    if (!testDbAvailable) return;

    // Real integration test implementation would go here
    // This would test the full flow with a real PostgreSQL database
  });
});

export {};