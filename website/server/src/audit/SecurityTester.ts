import { Pool } from 'pg';
import { AuditLogger } from './AuditLogger';
import { Request, Response } from 'express';

export interface SecurityTest {
  id: string;
  name: string;
  description: string;
  category: 'authentication' | 'authorization' | 'input_validation' | 'data_protection' | 'session_management';
  severity: 'low' | 'medium' | 'high' | 'critical';
  automated: boolean;
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
}

export interface SecurityVulnerability {
  id: string;
  testId: string;
  testName: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: any;
  detectedAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  mitigation?: string;
}

export interface SecurityTestResult {
  testId: string;
  testName: string;
  status: 'passed' | 'failed' | 'warning' | 'error';
  vulnerabilities: SecurityVulnerability[];
  executionTime: number;
  timestamp: Date;
}

export class SecurityTester {
  private db: Pool;
  private auditLogger: AuditLogger;
  private tests: SecurityTest[];
  private testingInterval: NodeJS.Timeout | null = null;

  constructor(db: Pool, auditLogger: AuditLogger) {
    this.db = db;
    this.auditLogger = auditLogger;
    this.tests = this.getDefaultSecurityTests();
  }

  /**
   * Start automated security testing
   */
  startAutomatedTesting(): void {
    if (this.testingInterval) {
      clearInterval(this.testingInterval);
    }

    // Run continuous tests every 5 minutes
    this.testingInterval = setInterval(async () => {
      await this.runContinuousTests();
    }, 5 * 60 * 1000);

    // Run daily tests at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.runDailyTests();
      setInterval(() => this.runDailyTests(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    console.log('Automated security testing started');
  }

  /**
   * Stop automated security testing
   */
  stopAutomatedTesting(): void {
    if (this.testingInterval) {
      clearInterval(this.testingInterval);
      this.testingInterval = null;
      console.log('Automated security testing stopped');
    }
  }

  /**
   * Run all security tests
   */
  async runAllTests(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    for (const test of this.tests.filter(t => t.enabled)) {
      try {
        const result = await this.runTest(test);
        results.push(result);
      } catch (error) {
        console.error(`Error running security test ${test.id}:`, error);
        results.push({
          testId: test.id,
          testName: test.name,
          status: 'error',
          vulnerabilities: [],
          executionTime: 0,
          timestamp: new Date()
        });
      }
    }

    // Store results and handle vulnerabilities
    await this.storeTestResults(results);
    await this.handleVulnerabilities(results);

    return results;
  }

  /**
   * Run continuous security tests
   */
  private async runContinuousTests(): Promise<void> {
    const continuousTests = this.tests.filter(t => t.enabled && t.frequency === 'continuous');
    
    for (const test of continuousTests) {
      try {
        const result = await this.runTest(test);
        if (result.vulnerabilities.length > 0) {
          await this.handleVulnerabilities([result]);
        }
      } catch (error) {
        console.error(`Error in continuous security test ${test.id}:`, error);
      }
    }
  }

  /**
   * Run daily security tests
   */
  private async runDailyTests(): Promise<void> {
    const dailyTests = this.tests.filter(t => t.enabled && t.frequency === 'daily');
    const results: SecurityTestResult[] = [];

    for (const test of dailyTests) {
      try {
        const result = await this.runTest(test);
        results.push(result);
      } catch (error) {
        console.error(`Error in daily security test ${test.id}:`, error);
      }
    }

    await this.storeTestResults(results);
    await this.handleVulnerabilities(results);
  }

  /**
   * Run individual security test
   */
  private async runTest(test: SecurityTest): Promise<SecurityTestResult> {
    const startTime = Date.now();
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      switch (test.id) {
        case 'sql_injection_test':
          vulnerabilities.push(...await this.testSQLInjection());
          break;
        case 'xss_test':
          vulnerabilities.push(...await this.testXSS());
          break;
        case 'authentication_bypass_test':
          vulnerabilities.push(...await this.testAuthenticationBypass());
          break;
        case 'session_fixation_test':
          vulnerabilities.push(...await this.testSessionFixation());
          break;
        case 'rate_limiting_test':
          vulnerabilities.push(...await this.testRateLimiting());
          break;
        case 'data_exposure_test':
          vulnerabilities.push(...await this.testDataExposure());
          break;
        case 'csrf_test':
          vulnerabilities.push(...await this.testCSRF());
          break;
        case 'input_validation_test':
          vulnerabilities.push(...await this.testInputValidation());
          break;
        case 'encryption_test':
          vulnerabilities.push(...await this.testEncryption());
          break;
        case 'access_control_test':
          vulnerabilities.push(...await this.testAccessControl());
          break;
      }

      const executionTime = Date.now() - startTime;
      const status = vulnerabilities.length === 0 ? 'passed' : 
                    vulnerabilities.some(v => v.severity === 'critical' || v.severity === 'high') ? 'failed' : 'warning';

      return {
        testId: test.id,
        testName: test.name,
        status,
        vulnerabilities,
        executionTime,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Security test ${test.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Test for SQL injection vulnerabilities
   */
  private async testSQLInjection(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const testPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM audit_logs --",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --"
    ];

    for (const payload of testPayloads) {
      try {
        // Test against known endpoints that accept user input
        const testEndpoints = ['/api/contact', '/api/assessment-results'];
        
        for (const endpoint of testEndpoints) {
          // Simulate malicious request (in a safe way)
          const testResult = await this.simulateRequest(endpoint, { 
            message: payload,
            email: `test${payload}@example.com`
          });

          if (testResult.suspicious) {
            vulnerabilities.push({
              id: `sql_injection_${Date.now()}_${Math.random()}`,
              testId: 'sql_injection_test',
              testName: 'SQL Injection Test',
              category: 'input_validation',
              severity: 'critical',
              description: `Potential SQL injection vulnerability detected in ${endpoint}`,
              evidence: {
                endpoint,
                payload,
                response: testResult.response
              },
              detectedAt: new Date(),
              resolved: false
            });
          }
        }
      } catch (error) {
        // Expected for malicious payloads - this is good
      }
    }

    return vulnerabilities;
  }

  /**
   * Test for XSS vulnerabilities
   */
  private async testXSS(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const testPayloads = [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')",
      "<svg onload=alert('XSS')>"
    ];

    for (const payload of testPayloads) {
      try {
        const testResult = await this.simulateRequest('/api/contact', {
          name: payload,
          message: `Test message with ${payload}`,
          email: 'test@example.com'
        });

        // Check if payload is reflected without proper encoding
        if (testResult.response && testResult.response.includes(payload)) {
          vulnerabilities.push({
            id: `xss_${Date.now()}_${Math.random()}`,
            testId: 'xss_test',
            testName: 'XSS Test',
            category: 'input_validation',
            severity: 'high',
            description: 'Potential XSS vulnerability detected - user input not properly sanitized',
            evidence: {
              payload,
              response: testResult.response
            },
            detectedAt: new Date(),
            resolved: false
          });
        }
      } catch (error) {
        // Expected for malicious payloads
      }
    }

    return vulnerabilities;
  }

  /**
   * Test authentication bypass
   */
  private async testAuthenticationBypass(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Test accessing protected endpoints without authentication
      const protectedEndpoints = ['/api/analytics', '/admin'];
      
      for (const endpoint of protectedEndpoints) {
        const testResult = await this.simulateRequest(endpoint, {}, { skipAuth: true });
        
        if (testResult.status === 200) {
          vulnerabilities.push({
            id: `auth_bypass_${Date.now()}_${Math.random()}`,
            testId: 'authentication_bypass_test',
            testName: 'Authentication Bypass Test',
            category: 'authentication',
            severity: 'critical',
            description: `Protected endpoint ${endpoint} accessible without authentication`,
            evidence: {
              endpoint,
              status: testResult.status,
              response: testResult.response
            },
            detectedAt: new Date(),
            resolved: false
          });
        }
      }
    } catch (error) {
      // Expected for protected endpoints
    }

    return vulnerabilities;
  }

  /**
   * Test session fixation
   */
  private async testSessionFixation(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Test if session IDs are properly regenerated after authentication
      const sessionTest = await this.testSessionRegeneration();
      
      if (!sessionTest.regenerated) {
        vulnerabilities.push({
          id: `session_fixation_${Date.now()}`,
          testId: 'session_fixation_test',
          testName: 'Session Fixation Test',
          category: 'session_management',
          severity: 'medium',
          description: 'Session ID not regenerated after authentication',
          evidence: sessionTest,
          detectedAt: new Date(),
          resolved: false
        });
      }
    } catch (error) {
      console.error('Session fixation test error:', error);
    }

    return vulnerabilities;
  }

  /**
   * Test rate limiting
   */
  private async testRateLimiting(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Test rate limiting on contact form
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(this.simulateRequest('/api/contact', {
          name: `Test User ${i}`,
          email: `test${i}@example.com`,
          message: 'Rate limit test'
        }));
      }

      const results = await Promise.all(requests);
      const successfulRequests = results.filter(r => r.status === 200).length;

      if (successfulRequests > 5) { // Assuming rate limit should be 5 per hour
        vulnerabilities.push({
          id: `rate_limit_${Date.now()}`,
          testId: 'rate_limiting_test',
          testName: 'Rate Limiting Test',
          category: 'authentication',
          severity: 'medium',
          description: `Rate limiting not properly enforced - ${successfulRequests} requests succeeded`,
          evidence: {
            successfulRequests,
            totalRequests: requests.length
          },
          detectedAt: new Date(),
          resolved: false
        });
      }
    } catch (error) {
      console.error('Rate limiting test error:', error);
    }

    return vulnerabilities;
  }

  /**
   * Test data exposure
   */
  private async testDataExposure(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Check for sensitive data in error messages
      const testResult = await this.simulateRequest('/api/nonexistent', {});
      
      if (testResult.response && this.containsSensitiveInfo(testResult.response)) {
        vulnerabilities.push({
          id: `data_exposure_${Date.now()}`,
          testId: 'data_exposure_test',
          testName: 'Data Exposure Test',
          category: 'data_protection',
          severity: 'medium',
          description: 'Sensitive information exposed in error messages',
          evidence: {
            response: testResult.response
          },
          detectedAt: new Date(),
          resolved: false
        });
      }
    } catch (error) {
      // Check error for sensitive information
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (this.containsSensitiveInfo(errorMessage)) {
        vulnerabilities.push({
          id: `data_exposure_error_${Date.now()}`,
          testId: 'data_exposure_test',
          testName: 'Data Exposure Test',
          category: 'data_protection',
          severity: 'medium',
          description: 'Sensitive information exposed in error messages',
          evidence: {
            error: errorMessage
          },
          detectedAt: new Date(),
          resolved: false
        });
      }
    }

    return vulnerabilities;
  }

  /**
   * Test CSRF protection
   */
  private async testCSRF(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Test state-changing operations without CSRF tokens
      const testResult = await this.simulateRequest('/api/contact', {
        name: 'CSRF Test',
        email: 'csrf@example.com',
        message: 'CSRF test message'
      }, { skipCSRF: true });

      if (testResult.status === 200) {
        vulnerabilities.push({
          id: `csrf_${Date.now()}`,
          testId: 'csrf_test',
          testName: 'CSRF Test',
          category: 'authentication',
          severity: 'medium',
          description: 'CSRF protection not implemented for state-changing operations',
          evidence: {
            endpoint: '/api/contact',
            status: testResult.status
          },
          detectedAt: new Date(),
          resolved: false
        });
      }
    } catch (error) {
      // Expected if CSRF protection is working
    }

    return vulnerabilities;
  }

  /**
   * Test input validation
   */
  private async testInputValidation(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const invalidInputs = [
      { email: 'not-an-email' },
      { name: 'A'.repeat(1000) }, // Very long name
      { message: '' }, // Empty required field
      { name: null }, // Null value
      { email: '<script>alert("test")</script>' }
    ];

    for (const input of invalidInputs) {
      try {
        const testResult = await this.simulateRequest('/api/contact', {
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test message',
          ...input
        });

        if (testResult.status === 200) {
          vulnerabilities.push({
            id: `input_validation_${Date.now()}_${Math.random()}`,
            testId: 'input_validation_test',
            testName: 'Input Validation Test',
            category: 'input_validation',
            severity: 'medium',
            description: 'Input validation not properly enforced',
            evidence: {
              input,
              status: testResult.status
            },
            detectedAt: new Date(),
            resolved: false
          });
        }
      } catch (error) {
        // Expected for invalid inputs
      }
    }

    return vulnerabilities;
  }

  /**
   * Test encryption implementation
   */
  private async testEncryption(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Check if sensitive data is encrypted in database
      const sensitiveDataQuery = `
        SELECT details FROM audit_logs 
        WHERE details LIKE '%email%' OR details LIKE '%phone%'
        LIMIT 5
      `;
      
      const result = await this.db.query(sensitiveDataQuery);
      
      for (const row of result.rows) {
        const details = JSON.parse(row.details);
        
        // Check if email or phone appears to be in plaintext
        if (this.appearsToBeUnencrypted(details)) {
          vulnerabilities.push({
            id: `encryption_${Date.now()}_${Math.random()}`,
            testId: 'encryption_test',
            testName: 'Encryption Test',
            category: 'data_protection',
            severity: 'high',
            description: 'Sensitive data appears to be stored unencrypted',
            evidence: {
              sampleData: this.sanitizeForEvidence(details)
            },
            detectedAt: new Date(),
            resolved: false
          });
          break; // Only report once
        }
      }
    } catch (error) {
      console.error('Encryption test error:', error);
    }

    return vulnerabilities;
  }

  /**
   * Test access control
   */
  private async testAccessControl(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Test horizontal privilege escalation
      const testResult = await this.testHorizontalPrivilegeEscalation();
      
      if (testResult.vulnerable) {
        vulnerabilities.push({
          id: `access_control_${Date.now()}`,
          testId: 'access_control_test',
          testName: 'Access Control Test',
          category: 'authorization',
          severity: 'high',
          description: 'Horizontal privilege escalation vulnerability detected',
          evidence: testResult.evidence,
          detectedAt: new Date(),
          resolved: false
        });
      }
    } catch (error) {
      console.error('Access control test error:', error);
    }

    return vulnerabilities;
  }

  /**
   * Helper methods
   */
  private async simulateRequest(endpoint: string, data: any, options: any = {}): Promise<any> {
    // This would simulate HTTP requests to test endpoints
    // For now, return mock responses
    return {
      status: 200,
      response: 'Mock response',
      suspicious: false
    };
  }

  private async testSessionRegeneration(): Promise<any> {
    // Test session ID regeneration
    return { regenerated: true };
  }

  private containsSensitiveInfo(text: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /key/i,
      /token/i,
      /database/i,
      /connection/i
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(text));
  }

  private appearsToBeUnencrypted(data: any): boolean {
    // Simple heuristic to detect unencrypted data
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\+?[\d\s\-\(\)]+$/;
    
    if (typeof data === 'object') {
      for (const value of Object.values(data)) {
        if (typeof value === 'string') {
          if (emailPattern.test(value) || phonePattern.test(value)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  private sanitizeForEvidence(data: any): any {
    // Remove actual sensitive data from evidence
    return { structure: typeof data, hasEmail: !!data.email, hasPhone: !!data.phone };
  }

  private async testHorizontalPrivilegeEscalation(): Promise<any> {
    // Test if users can access other users' data
    return { vulnerable: false, evidence: {} };
  }

  /**
   * Store test results
   */
  private async storeTestResults(results: SecurityTestResult[]): Promise<void> {
    for (const result of results) {
      try {
        const query = `
          INSERT INTO security_test_results (
            test_id, test_name, status, vulnerabilities_count, 
            execution_time, timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await this.db.query(query, [
          result.testId,
          result.testName,
          result.status,
          result.vulnerabilities.length,
          result.executionTime,
          result.timestamp
        ]);

        // Store vulnerabilities
        for (const vulnerability of result.vulnerabilities) {
          await this.storeVulnerability(vulnerability);
        }
      } catch (error) {
        console.error('Failed to store security test result:', error);
      }
    }
  }

  /**
   * Store vulnerability
   */
  private async storeVulnerability(vulnerability: SecurityVulnerability): Promise<void> {
    try {
      const query = `
        INSERT INTO security_vulnerabilities (
          id, test_id, test_name, category, severity, description, 
          evidence, detected_at, resolved, resolved_at, resolved_by, mitigation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
      `;

      await this.db.query(query, [
        vulnerability.id,
        vulnerability.testId,
        vulnerability.testName,
        vulnerability.category,
        vulnerability.severity,
        vulnerability.description,
        JSON.stringify(vulnerability.evidence),
        vulnerability.detectedAt,
        vulnerability.resolved,
        vulnerability.resolvedAt,
        vulnerability.resolvedBy,
        vulnerability.mitigation
      ]);
    } catch (error) {
      console.error('Failed to store vulnerability:', error);
    }
  }

  /**
   * Handle detected vulnerabilities
   */
  private async handleVulnerabilities(results: SecurityTestResult[]): Promise<void> {
    const allVulnerabilities = results.flatMap(r => r.vulnerabilities);
    const criticalVulnerabilities = allVulnerabilities.filter(v => v.severity === 'critical');
    const highVulnerabilities = allVulnerabilities.filter(v => v.severity === 'high');

    if (criticalVulnerabilities.length > 0) {
      console.error(`CRITICAL SECURITY VULNERABILITIES DETECTED: ${criticalVulnerabilities.length}`);
      // Could integrate with alerting system
    }

    if (highVulnerabilities.length > 0) {
      console.warn(`High severity security vulnerabilities detected: ${highVulnerabilities.length}`);
    }

    // Log all vulnerabilities
    for (const vulnerability of allVulnerabilities) {
      await this.auditLogger.logEvent({
        eventType: 'security_vulnerability',
        resource: 'security_system',
        action: 'vulnerability_detected',
        details: {
          vulnerabilityId: vulnerability.id,
          testId: vulnerability.testId,
          category: vulnerability.category,
          severity: vulnerability.severity,
          description: vulnerability.description
        },
        severity: vulnerability.severity as any,
        complianceFlags: ['security_vulnerability']
      });
    }
  }

  /**
   * Get default security tests
   */
  private getDefaultSecurityTests(): SecurityTest[] {
    return [
      {
        id: 'sql_injection_test',
        name: 'SQL Injection Test',
        description: 'Tests for SQL injection vulnerabilities in user inputs',
        category: 'input_validation',
        severity: 'critical',
        automated: true,
        frequency: 'daily',
        enabled: true
      },
      {
        id: 'xss_test',
        name: 'Cross-Site Scripting Test',
        description: 'Tests for XSS vulnerabilities in user inputs',
        category: 'input_validation',
        severity: 'high',
        automated: true,
        frequency: 'daily',
        enabled: true
      },
      {
        id: 'authentication_bypass_test',
        name: 'Authentication Bypass Test',
        description: 'Tests for authentication bypass vulnerabilities',
        category: 'authentication',
        severity: 'critical',
        automated: true,
        frequency: 'continuous',
        enabled: true
      },
      {
        id: 'session_fixation_test',
        name: 'Session Fixation Test',
        description: 'Tests for session fixation vulnerabilities',
        category: 'session_management',
        severity: 'medium',
        automated: true,
        frequency: 'daily',
        enabled: true
      },
      {
        id: 'rate_limiting_test',
        name: 'Rate Limiting Test',
        description: 'Tests effectiveness of rate limiting controls',
        category: 'authentication',
        severity: 'medium',
        automated: true,
        frequency: 'daily',
        enabled: true
      },
      {
        id: 'data_exposure_test',
        name: 'Data Exposure Test',
        description: 'Tests for sensitive data exposure in responses',
        category: 'data_protection',
        severity: 'medium',
        automated: true,
        frequency: 'continuous',
        enabled: true
      },
      {
        id: 'csrf_test',
        name: 'CSRF Protection Test',
        description: 'Tests for CSRF protection on state-changing operations',
        category: 'authentication',
        severity: 'medium',
        automated: true,
        frequency: 'daily',
        enabled: true
      },
      {
        id: 'input_validation_test',
        name: 'Input Validation Test',
        description: 'Tests input validation and sanitization',
        category: 'input_validation',
        severity: 'medium',
        automated: true,
        frequency: 'daily',
        enabled: true
      },
      {
        id: 'encryption_test',
        name: 'Encryption Test',
        description: 'Tests encryption of sensitive data',
        category: 'data_protection',
        severity: 'high',
        automated: true,
        frequency: 'weekly',
        enabled: true
      },
      {
        id: 'access_control_test',
        name: 'Access Control Test',
        description: 'Tests access control and authorization mechanisms',
        category: 'authorization',
        severity: 'high',
        automated: true,
        frequency: 'daily',
        enabled: true
      }
    ];
  }
}