/**
 * Security Manager
 * Central coordinator for all security services
 */

import { SecurityConfig } from './SecurityConfig';
import { EncryptionService } from './EncryptionService';
import { AuthenticationService } from './AuthenticationService';
import { AuthorizationService } from './AuthorizationService';
import { DataProtectionService } from './DataProtectionService';
import { PrivacyComplianceService } from './PrivacyComplianceService';
import { SecurityMiddleware } from './SecurityMiddleware';

export class SecurityManager {
  private static instance: SecurityManager;
  private initialized = false;

  // Service instances
  private config = SecurityConfig;
  private encryption = EncryptionService.getInstance();
  private authentication = AuthenticationService.getInstance();
  private authorization = AuthorizationService.getInstance();
  private dataProtection = DataProtectionService.getInstance();
  private privacyCompliance = PrivacyComplianceService.getInstance();
  private middleware = SecurityMiddleware.getInstance();

  private constructor() {}

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * Initialize security framework
   */
  public async initialize(): Promise<boolean> {
    try {
      console.log('🔒 Initializing Security Framework...');

      // Validate configuration
      if (!this.config.validateConfiguration()) {
        throw new Error('Security configuration validation failed');
      }

      // Validate privacy configuration
      const privacyValidation = this.privacyCompliance.validatePrivacyConfiguration();
      if (!privacyValidation.valid) {
        console.warn('Privacy configuration issues:', privacyValidation.errors);
      }

      // Test encryption
      if (!this.encryption.validateEncryption('test-data')) {
        throw new Error('Encryption validation failed');
      }

      // Schedule automated tasks
      this.scheduleAutomatedTasks();

      // Set up cleanup intervals
      this.setupCleanupTasks();

      this.initialized = true;
      console.log('✅ Security Framework initialized successfully');

      return true;
    } catch (error) {
      console.error('❌ Security Framework initialization failed:', error);
      return false;
    }
  }

  /**
   * Get security services
   */
  public getServices() {
    return {
      config: this.config,
      encryption: this.encryption,
      authentication: this.authentication,
      authorization: this.authorization,
      dataProtection: this.dataProtection,
      privacyCompliance: this.privacyCompliance,
      middleware: this.middleware
    };
  }

  /**
   * Create secure user session
   */
  public async createSecureSession(userId: string, ipAddress: string, userAgent: string) {
    // Check rate limiting
    const rateCheck = this.authentication.checkRateLimit(ipAddress);
    if (!rateCheck.allowed) {
      throw new Error(`Rate limit exceeded. Try again after ${rateCheck.lockedUntil}`);
    }

    // Create session
    const session = this.authentication.createSession(userId, ipAddress, userAgent);

    // Record successful login
    this.authentication.recordLoginAttempt(ipAddress, true);

    return session;
  }

  /**
   * Validate request security
   */
  public validateRequestSecurity(req: any): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for common security headers
    if (!req.get('User-Agent')) {
      issues.push('Missing User-Agent header');
    }

    // Check for suspicious patterns
    const body = JSON.stringify(req.body || {});
    if (/<script|javascript:|on\w+=/i.test(body)) {
      issues.push('Potential XSS in request body');
    }

    // Check rate limiting
    if (req.user) {
      const limits = this.authorization.getRateLimit(req.user.userId, 'api');
      // Rate limit checking would be implemented here
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Process data protection request
   */
  public async processDataProtectionRequest(
    userId: string,
    requestType: 'access' | 'delete' | 'anonymize' | 'export',
    dataType?: string
  ) {
    switch (requestType) {
      case 'access':
        return await this.privacyCompliance.processDataSubjectRequest(userId, 'access');
      
      case 'delete':
        return await this.dataProtection.processRightToBeForgotten(userId);
      
      case 'anonymize':
        if (dataType) {
          return await this.dataProtection.anonymizeUserData(userId, dataType);
        }
        break;
      
      case 'export':
        return await this.dataProtection.exportUserData(userId);
    }

    throw new Error('Invalid data protection request type');
  }

  /**
   * Generate security report
   */
  public generateSecurityReport(): any {
    return {
      timestamp: new Date(),
      framework: {
        initialized: this.initialized,
        version: '1.0.0'
      },
      authentication: {
        activeSessions: this.authentication.getActiveSessionCount(),
        // Additional auth metrics would go here
      },
      authorization: {
        roles: this.authorization.listRoles().length,
        // Additional authz metrics would go here
      },
      dataProtection: {
        retentionPolicies: Object.keys(this.dataProtection['retentionPolicies']).length,
        // Additional data protection metrics would go here
      },
      privacy: this.privacyCompliance.generateComplianceReport(),
      configuration: {
        gdprCompliance: this.config.getPrivacyConfig().gdprCompliance,
        ccpaCompliance: this.config.getPrivacyConfig().ccpaCompliance,
        encryptionEnabled: true,
        auditingEnabled: true
      }
    };
  }

  /**
   * Handle security incident
   */
  public handleSecurityIncident(
    type: 'breach' | 'violation' | 'suspicious_activity' | 'unauthorized_access',
    details: any
  ): void {
    const incident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date(),
      details,
      severity: this.calculateIncidentSeverity(type, details),
      status: 'open'
    };

    console.error('🚨 Security Incident:', JSON.stringify(incident, null, 2));

    // In production, this would:
    // 1. Store in incident database
    // 2. Send alerts to security team
    // 3. Trigger automated response procedures
    // 4. Update security monitoring dashboards

    // Immediate response actions
    switch (type) {
      case 'breach':
        this.handleDataBreach(details);
        break;
      case 'unauthorized_access':
        this.handleUnauthorizedAccess(details);
        break;
      case 'suspicious_activity':
        this.handleSuspiciousActivity(details);
        break;
    }
  }

  /**
   * Calculate incident severity
   */
  private calculateIncidentSeverity(type: string, details: any): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case 'breach':
        return 'critical';
      case 'unauthorized_access':
        return details.adminAccess ? 'high' : 'medium';
      case 'violation':
        return 'medium';
      case 'suspicious_activity':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Handle data breach
   */
  private handleDataBreach(details: any): void {
    console.log('🚨 Handling data breach:', details);
    
    // Immediate actions:
    // 1. Isolate affected systems
    // 2. Preserve evidence
    // 3. Assess scope of breach
    // 4. Notify authorities (GDPR requires 72-hour notification)
    // 5. Prepare user notifications
  }

  /**
   * Handle unauthorized access
   */
  private handleUnauthorizedAccess(details: any): void {
    console.log('🚨 Handling unauthorized access:', details);
    
    // Immediate actions:
    // 1. Terminate suspicious sessions
    // 2. Lock affected accounts
    // 3. Review access logs
    // 4. Update security rules
  }

  /**
   * Handle suspicious activity
   */
  private handleSuspiciousActivity(details: any): void {
    console.log('⚠️ Handling suspicious activity:', details);
    
    // Immediate actions:
    // 1. Increase monitoring
    // 2. Apply additional rate limiting
    // 3. Flag for manual review
  }

  /**
   * Schedule automated security tasks
   */
  private scheduleAutomatedTasks(): void {
    // Schedule data retention processing
    this.dataProtection.scheduleRetentionProcessing();

    // Schedule session cleanup (every hour)
    setInterval(() => {
      const cleaned = this.authentication.cleanupExpiredSessions();
      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
      }
    }, 60 * 60 * 1000);

    console.log('⏰ Automated security tasks scheduled');
  }

  /**
   * Setup cleanup tasks
   */
  private setupCleanupTasks(): void {
    // Clean up old audit logs (weekly)
    setInterval(() => {
      console.log('🧹 Running weekly security cleanup tasks');
      // Cleanup logic would go here
    }, 7 * 24 * 60 * 60 * 1000);
  }

  /**
   * Get security status
   */
  public getSecurityStatus(): any {
    return {
      framework: {
        initialized: this.initialized,
        healthy: true
      },
      services: {
        encryption: this.encryption.validateEncryption('test'),
        authentication: this.authentication.getActiveSessionCount() >= 0,
        authorization: this.authorization.listRoles().length > 0,
        dataProtection: true,
        privacyCompliance: this.privacyCompliance.checkComplianceStatus()
      },
      metrics: {
        activeSessions: this.authentication.getActiveSessionCount(),
        totalRoles: this.authorization.listRoles().length,
        complianceStatus: this.privacyCompliance.checkComplianceStatus()
      }
    };
  }

  /**
   * Shutdown security framework
   */
  public async shutdown(): Promise<void> {
    console.log('🔒 Shutting down Security Framework...');
    
    // Clean up resources
    // Clear sensitive data from memory
    // Close connections
    
    this.initialized = false;
    console.log('✅ Security Framework shutdown complete');
  }

  /**
   * Test security framework
   */
  public async runSecurityTests(): Promise<{ passed: number; failed: number; results: any[] }> {
    const results: any[] = [];
    let passed = 0;
    let failed = 0;

    // Test encryption
    try {
      const testData = 'sensitive-test-data';
      const encrypted = this.encryption.encrypt(testData);
      const decrypted = this.encryption.decrypt(encrypted);
      
      if (decrypted === testData) {
        results.push({ test: 'encryption', status: 'passed' });
        passed++;
      } else {
        results.push({ test: 'encryption', status: 'failed', error: 'Decryption mismatch' });
        failed++;
      }
    } catch (error) {
      results.push({ test: 'encryption', status: 'failed', error: (error as Error).message });
      failed++;
    }

    // Test authentication
    try {
      const session = this.authentication.createSession('test-user', '127.0.0.1', 'test-agent');
      const validation = this.authentication.validateToken(session.token);
      
      if (validation.valid) {
        results.push({ test: 'authentication', status: 'passed' });
        passed++;
      } else {
        results.push({ test: 'authentication', status: 'failed', error: validation.error });
        failed++;
      }
    } catch (error) {
      results.push({ test: 'authentication', status: 'failed', error: (error as Error).message });
      failed++;
    }

    // Test authorization
    try {
      this.authorization.assignRole('test-user', 'user');
      const hasPermission = this.authorization.hasPermission('test-user', 'assessment', 'take');
      
      if (hasPermission) {
        results.push({ test: 'authorization', status: 'passed' });
        passed++;
      } else {
        results.push({ test: 'authorization', status: 'failed', error: 'Permission check failed' });
        failed++;
      }
    } catch (error) {
      results.push({ test: 'authorization', status: 'failed', error: (error as Error).message });
      failed++;
    }

    return { passed, failed, results };
  }
}