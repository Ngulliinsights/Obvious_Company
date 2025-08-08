/**
 * Security Framework Tests
 * Comprehensive tests for the data security framework
 */

import { SecurityManager } from '../SecurityManager';
import { EncryptionService } from '../EncryptionService';
import { AuthenticationService } from '../AuthenticationService';
import { AuthorizationService } from '../AuthorizationService';
import { DataProtectionService } from '../DataProtectionService';
import { PrivacyComplianceService } from '../PrivacyComplianceService';
import { ConsentType } from '../types';

describe('Security Framework', () => {
  let securityManager: SecurityManager;
  let encryptionService: EncryptionService;
  let authService: AuthenticationService;
  let authzService: AuthorizationService;
  let dataProtectionService: DataProtectionService;
  let privacyService: PrivacyComplianceService;

  beforeAll(async () => {
    securityManager = SecurityManager.getInstance();
    encryptionService = EncryptionService.getInstance();
    authService = AuthenticationService.getInstance();
    authzService = AuthorizationService.getInstance();
    dataProtectionService = DataProtectionService.getInstance();
    privacyService = PrivacyComplianceService.getInstance();

    await securityManager.initialize();
  });

  describe('Encryption Service', () => {
    test('should encrypt and decrypt data correctly', () => {
      const testData = 'sensitive-assessment-data';
      const encrypted = encryptionService.encrypt(testData);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(testData);
      expect(encrypted.data).not.toBe(testData);
      expect(encrypted.algorithm).toBe('aes-256-gcm');
    });

    test('should hash and verify passwords correctly', () => {
      const password = 'secure-password-123';
      const { hash, salt } = encryptionService.hash(password);
      
      expect(encryptionService.verifyHash(password, hash, salt)).toBe(true);
      expect(encryptionService.verifyHash('wrong-password', hash, salt)).toBe(false);
    });

    test('should encrypt assessment data with PII protection', () => {
      const assessmentData = {
        email: 'user@example.com',
        name: 'John Doe',
        company: 'Test Company',
        responses: { q1: 'answer1', q2: 'answer2' }
      };

      const encrypted = encryptionService.encryptAssessmentData(assessmentData);
      const decrypted = encryptionService.decryptAssessmentData(encrypted);

      expect(decrypted.email).toBe('user@example.com');
      expect(decrypted.name).toBe('John Doe');
      expect(decrypted.responses).toEqual({ q1: 'answer1', q2: 'answer2' });
    });

    test('should generate secure tokens', () => {
      const token1 = encryptionService.generateSecureToken();
      const token2 = encryptionService.generateSecureToken();
      const apiKey = encryptionService.generateApiKey();

      expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
      expect(apiKey).toMatch(/^ak_\d+_[a-f0-9]{32}$/);
    });
  });

  describe('Authentication Service', () => {
    test('should create and validate user sessions', () => {
      const userId = 'test-user-123';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0 Test Browser';

      const session = authService.createSession(userId, ipAddress, userAgent);

      expect(session.userId).toBe(userId);
      expect(session.ipAddress).toBe(ipAddress);
      expect(session.userAgent).toBe(userAgent);
      expect(session.isActive).toBe(true);

      const validation = authService.validateToken(session.token);
      expect(validation.valid).toBe(true);
      expect(validation.payload.userId).toBe(userId);
    });

    test('should handle rate limiting correctly', () => {
      const identifier = '192.168.1.100';

      // First few attempts should be allowed
      for (let i = 0; i < 4; i++) {
        const check = authService.checkRateLimit(identifier);
        expect(check.allowed).toBe(true);
        authService.recordLoginAttempt(identifier, false);
      }

      // After max attempts, should be locked
      authService.recordLoginAttempt(identifier, false);
      const lockedCheck = authService.checkRateLimit(identifier);
      expect(lockedCheck.allowed).toBe(false);
      expect(lockedCheck.lockedUntil).toBeDefined();
    });

    test('should refresh tokens securely', () => {
      const session = authService.createSession('test-user', '192.168.1.1', 'test-agent');
      const refreshResult = authService.refreshSession(session.refreshToken, '192.168.1.1');

      expect(refreshResult.success).toBe(true);
      expect(refreshResult.session).toBeDefined();
      expect(refreshResult.session!.token).not.toBe(session.token);
    });

    test('should detect session security violations', () => {
      const session = authService.createSession('test-user', '192.168.1.1', 'test-agent');
      
      // Different IP should trigger security check
      const securityCheck = authService.validateSessionSecurity(
        session.id,
        '192.168.1.2', // Different IP
        'test-agent'
      );

      // Should still be valid but logged as suspicious
      expect(securityCheck).toBe(true);
    });
  });

  describe('Authorization Service', () => {
    test('should manage roles and permissions correctly', () => {
      const userId = 'test-user-456';
      
      // Assign user role
      authzService.assignRole(userId, 'user');
      const roles = authzService.getUserRoles(userId);
      expect(roles).toContain('user');

      // Check permissions
      expect(authzService.hasPermission(userId, 'assessment', 'take')).toBe(true);
      expect(authzService.hasPermission(userId, 'admin', 'access')).toBe(false);
    });

    test('should handle assessment access permissions', () => {
      const userId = 'test-user-789';
      const assessmentId = 'assessment-123';

      authzService.assignRole(userId, 'user');
      
      expect(authzService.canAccessAssessment(userId, assessmentId, 'take')).toBe(true);
      expect(authzService.canAccessAssessment(userId, assessmentId, 'view_results')).toBe(true);
    });

    test('should validate API access correctly', () => {
      const userId = 'api-user-123';
      authzService.assignRole(userId, 'user');

      expect(authzService.validateApiAccess(userId, '/api/assessment', 'GET')).toBe(true);
      expect(authzService.validateApiAccess(userId, '/api/admin', 'GET')).toBe(false);
    });

    test('should provide appropriate rate limits by role', () => {
      const adminUser = 'admin-user';
      const regularUser = 'regular-user';

      authzService.assignRole(adminUser, 'system_admin');
      authzService.assignRole(regularUser, 'user');

      const adminLimits = authzService.getRateLimit(adminUser, 'api');
      const userLimits = authzService.getRateLimit(regularUser, 'api');

      expect(adminLimits.requests).toBeGreaterThan(userLimits.requests);
    });
  });

  describe('Data Protection Service', () => {
    test('should have proper retention policies', () => {
      const assessmentPolicy = dataProtectionService.getRetentionPolicy('assessment_responses');
      const userPolicy = dataProtectionService.getRetentionPolicy('user_profiles');

      expect(assessmentPolicy).toBeDefined();
      expect(assessmentPolicy!.anonymizationRequired).toBe(true);
      expect(userPolicy).toBeDefined();
      expect(userPolicy!.deletionRequired).toBe(true);
    });

    test('should process data anonymization', async () => {
      const userId = 'user-to-anonymize';
      const result = await dataProtectionService.anonymizeUserData(userId, 'assessment_responses');
      expect(result).toBe(true);
    });

    test('should handle right to be forgotten', async () => {
      const userId = 'user-to-forget';
      const result = await dataProtectionService.processRightToBeForgotten(userId);
      expect(result).toBe(true);
    });

    test('should export user data for portability', async () => {
      const userId = 'user-export-test';
      const exportData = await dataProtectionService.exportUserData(userId);
      
      expect(exportData).toBeDefined();
      expect(exportData.userId).toBe(userId);
      expect(exportData.exportedAt).toBeDefined();
    });
  });

  describe('Privacy Compliance Service', () => {
    test('should record and check consent correctly', () => {
      const userId = 'consent-test-user';
      
      // Record consent
      const consent = privacyService.recordConsent(
        userId,
        ConsentType.DATA_PROCESSING,
        true,
        '192.168.1.1'
      );

      expect(consent.granted).toBe(true);
      expect(consent.consentType).toBe(ConsentType.DATA_PROCESSING);

      // Check consent
      expect(privacyService.hasConsent(userId, ConsentType.DATA_PROCESSING)).toBe(true);
      expect(privacyService.hasConsent(userId, ConsentType.MARKETING)).toBe(false);
    });

    test('should handle consent withdrawal', () => {
      const userId = 'withdrawal-test-user';
      
      // Grant consent first
      privacyService.recordConsent(userId, ConsentType.MARKETING, true, '192.168.1.1');
      expect(privacyService.hasConsent(userId, ConsentType.MARKETING)).toBe(true);

      // Withdraw consent
      privacyService.withdrawConsent(userId, ConsentType.MARKETING, '192.168.1.1');
      expect(privacyService.hasConsent(userId, ConsentType.MARKETING)).toBe(false);
    });

    test('should process data subject requests', async () => {
      const userId = 'dsr-test-user';
      
      const accessRequest = await privacyService.processDataSubjectRequest(userId, 'access');
      expect(accessRequest.success).toBe(true);
      expect(accessRequest.data).toBeDefined();

      const erasureRequest = await privacyService.processDataSubjectRequest(userId, 'erasure');
      expect(erasureRequest.success).toBe(true);
    });

    test('should generate privacy notices and consent forms', () => {
      const privacyNotice = privacyService.generatePrivacyNotice('en');
      const consentForm = privacyService.generateConsentForm('test-user', 'en');

      expect(privacyNotice).toContain('Privacy Notice');
      expect(privacyNotice).toContain('Data Controller');
      expect(consentForm).toContain('Privacy Preferences');
      expect(consentForm).toContain('data-user-id="test-user"');
    });

    test('should check compliance status', () => {
      const compliance = privacyService.checkComplianceStatus();
      
      expect(compliance).toHaveProperty('gdpr');
      expect(compliance).toHaveProperty('ccpa');
      expect(compliance).toHaveProperty('issues');
      expect(Array.isArray(compliance.issues)).toBe(true);
    });
  });

  describe('Security Manager Integration', () => {
    test('should initialize successfully', async () => {
      const status = securityManager.getSecurityStatus();
      
      expect(status.framework.initialized).toBe(true);
      expect(status.framework.healthy).toBe(true);
      expect(status.services.encryption).toBe(true);
      expect(status.services.authentication).toBe(true);
    });

    test('should create secure sessions', async () => {
      const session = await securityManager.createSecureSession(
        'integration-test-user',
        '192.168.1.1',
        'test-browser'
      );

      expect(session).toBeDefined();
      expect(session.userId).toBe('integration-test-user');
      expect(session.isActive).toBe(true);
    });

    test('should validate request security', () => {
      const mockRequest = {
        get: (header: string) => header === 'User-Agent' ? 'test-browser' : null,
        body: { test: 'data' },
        user: { userId: 'test-user' }
      };

      const validation = securityManager.validateRequestSecurity(mockRequest);
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    test('should generate comprehensive security report', () => {
      const report = securityManager.generateSecurityReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('framework');
      expect(report).toHaveProperty('authentication');
      expect(report).toHaveProperty('authorization');
      expect(report).toHaveProperty('dataProtection');
      expect(report).toHaveProperty('privacy');
      expect(report).toHaveProperty('configuration');
    });

    test('should run security tests successfully', async () => {
      const testResults = await securityManager.runSecurityTests();
      
      expect(testResults.passed).toBeGreaterThan(0);
      expect(testResults.results).toBeInstanceOf(Array);
      expect(testResults.results.length).toBeGreaterThan(0);
      
      // All core tests should pass
      const encryptionTest = testResults.results.find(r => r.test === 'encryption');
      const authTest = testResults.results.find(r => r.test === 'authentication');
      const authzTest = testResults.results.find(r => r.test === 'authorization');
      
      expect(encryptionTest?.status).toBe('passed');
      expect(authTest?.status).toBe('passed');
      expect(authzTest?.status).toBe('passed');
    });
  });

  afterAll(async () => {
    await securityManager.shutdown();
  });
});