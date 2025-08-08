/**
 * Privacy Compliance Service
 * Handles GDPR, CCPA, and other privacy regulation compliance
 */

import { PrivacyConsent, ConsentType, SecurityEventType } from './types';
import { SecurityConfig } from './SecurityConfig';
import { DataProtectionService } from './DataProtectionService';

export class PrivacyComplianceService {
  private static instance: PrivacyComplianceService;
  private config = SecurityConfig.getPrivacyConfig();
  private dataProtectionService = DataProtectionService.getInstance();
  private consents = new Map<string, PrivacyConsent[]>();

  private constructor() {}

  public static getInstance(): PrivacyComplianceService {
    if (!PrivacyComplianceService.instance) {
      PrivacyComplianceService.instance = new PrivacyComplianceService();
    }
    return PrivacyComplianceService.instance;
  }

  /**
   * Record user consent
   */
  public recordConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    ipAddress: string,
    version: string = '1.0',
    metadata: Record<string, any> = {}
  ): PrivacyConsent {
    const consent: PrivacyConsent = {
      id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      consentType,
      granted,
      timestamp: new Date(),
      ipAddress,
      version,
      metadata
    };

    const userConsents = this.consents.get(userId) || [];
    userConsents.push(consent);
    this.consents.set(userId, userConsents);

    this.logPrivacyEvent('consent_recorded', userId, {
      consentType,
      granted,
      version,
      ipAddress
    });

    return consent;
  }

  /**
   * Check if user has given consent
   */
  public hasConsent(userId: string, consentType: ConsentType): boolean {
    const userConsents = this.consents.get(userId) || [];
    
    // Get the most recent consent for this type
    const relevantConsents = userConsents
      .filter(c => c.consentType === consentType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (relevantConsents.length === 0) {
      return !this.config.consentRequired; // Default based on configuration
    }

    return relevantConsents[0].granted;
  }

  /**
   * Get user consent history
   */
  public getConsentHistory(userId: string): PrivacyConsent[] {
    return this.consents.get(userId) || [];
  }

  /**
   * Withdraw consent
   */
  public withdrawConsent(userId: string, consentType: ConsentType, ipAddress: string): boolean {
    const consent = this.recordConsent(userId, consentType, false, ipAddress);
    
    // Trigger data processing changes based on withdrawn consent
    this.handleConsentWithdrawal(userId, consentType);
    
    return true;
  }

  /**
   * Handle consent withdrawal
   */
  private async handleConsentWithdrawal(userId: string, consentType: ConsentType): Promise<void> {
    switch (consentType) {
      case ConsentType.DATA_PROCESSING:
        // Stop all data processing and initiate deletion
        await this.dataProtectionService.processRightToBeForgotten(userId);
        break;
      
      case ConsentType.MARKETING:
        // Remove from marketing lists
        await this.removeFromMarketing(userId);
        break;
      
      case ConsentType.ANALYTICS:
        // Anonymize analytics data
        await this.dataProtectionService.anonymizeUserData(userId, 'analytics_data');
        break;
      
      case ConsentType.THIRD_PARTY_SHARING:
        // Stop third-party data sharing
        await this.stopThirdPartySharing(userId);
        break;
    }
  }

  /**
   * Generate privacy notice
   */
  public generatePrivacyNotice(language: string = 'en'): string {
    const notices = {
      en: {
        title: 'Privacy Notice - AI Integration Assessment Platform',
        content: `
          <h2>Privacy Notice</h2>
          <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
          
          <h3>Data Controller</h3>
          <p>The Obvious Company<br>
          Strategic Intelligence Amplification<br>
          Contact: privacy@theobviouscompany.com</p>
          
          <h3>Data We Collect</h3>
          <ul>
            <li><strong>Assessment Data:</strong> Your responses to strategic readiness assessments</li>
            <li><strong>Profile Information:</strong> Name, email, company, role, industry</li>
            <li><strong>Usage Data:</strong> How you interact with our platform</li>
            <li><strong>Communication Data:</strong> Emails and messages exchanged</li>
          </ul>
          
          <h3>Legal Basis for Processing</h3>
          <ul>
            <li><strong>Consent:</strong> For marketing communications and analytics</li>
            <li><strong>Legitimate Interest:</strong> For service delivery and improvement</li>
            <li><strong>Contract:</strong> For providing assessment services</li>
          </ul>
          
          <h3>Your Rights</h3>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate personal data</li>
            <li><strong>Erasure:</strong> Request deletion of your personal data</li>
            <li><strong>Portability:</strong> Receive your data in a structured format</li>
            <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Restriction:</strong> Restrict processing in certain circumstances</li>
          </ul>
          
          <h3>Data Retention</h3>
          <p>We retain your data for ${this.config.gdprCompliance ? '365 days' : 'as required by law'} 
          unless you request earlier deletion or longer retention is required by law.</p>
          
          <h3>International Transfers</h3>
          <p>Your data may be transferred to and processed in countries outside your jurisdiction. 
          We ensure appropriate safeguards are in place.</p>
          
          <h3>Contact Us</h3>
          <p>For privacy-related questions or to exercise your rights, contact us at:</p>
          <p>Email: privacy@theobviouscompany.com<br>
          Data Protection Officer: dpo@theobviouscompany.com</p>
        `
      }
    };

    return notices[language]?.content || notices.en.content;
  }

  /**
   * Generate consent form
   */
  public generateConsentForm(userId: string, language: string = 'en'): string {
    const forms = {
      en: `
        <form id="privacy-consent-form" data-user-id="${userId}">
          <h3>Privacy Preferences</h3>
          
          <div class="consent-item">
            <input type="checkbox" id="data-processing" name="consent" value="data_processing" required>
            <label for="data-processing">
              <strong>Data Processing (Required)</strong><br>
              I consent to the processing of my personal data for providing assessment services.
            </label>
          </div>
          
          <div class="consent-item">
            <input type="checkbox" id="marketing" name="consent" value="marketing">
            <label for="marketing">
              <strong>Marketing Communications</strong><br>
              I consent to receiving marketing communications about strategic AI services.
            </label>
          </div>
          
          <div class="consent-item">
            <input type="checkbox" id="analytics" name="consent" value="analytics">
            <label for="analytics">
              <strong>Analytics</strong><br>
              I consent to the use of my data for analytics and service improvement.
            </label>
          </div>
          
          <div class="consent-item">
            <input type="checkbox" id="third-party" name="consent" value="third_party_sharing">
            <label for="third-party">
              <strong>Third-Party Sharing</strong><br>
              I consent to sharing my data with trusted partners for enhanced services.
            </label>
          </div>
          
          <button type="submit">Save Preferences</button>
          <p><small>You can change these preferences at any time by contacting us.</small></p>
        </form>
      `
    };

    return forms[language] || forms.en;
  }

  /**
   * Process data subject request
   */
  public async processDataSubjectRequest(
    userId: string,
    requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection',
    details: Record<string, any> = {}
  ): Promise<{ success: boolean; data?: any; message: string }> {
    try {
      this.logPrivacyEvent('data_subject_request', userId, { requestType, details });

      switch (requestType) {
        case 'access':
          const userData = await this.dataProtectionService.exportUserData(userId);
          return {
            success: true,
            data: userData,
            message: 'Data access request processed successfully'
          };

        case 'erasure':
          const deleted = await this.dataProtectionService.processRightToBeForgotten(userId);
          return {
            success: deleted,
            message: deleted ? 'Data erasure completed' : 'Data erasure failed'
          };

        case 'portability':
          const exportData = await this.dataProtectionService.exportUserData(userId);
          return {
            success: true,
            data: exportData,
            message: 'Data portability request processed successfully'
          };

        case 'rectification':
          // In production, this would update the user's data
          return {
            success: true,
            message: 'Data rectification request received and will be processed within 30 days'
          };

        case 'restriction':
          // In production, this would restrict data processing
          return {
            success: true,
            message: 'Data processing restriction applied'
          };

        case 'objection':
          // In production, this would stop processing based on legitimate interests
          return {
            success: true,
            message: 'Objection to processing recorded'
          };

        default:
          return {
            success: false,
            message: 'Unknown request type'
          };
      }
    } catch (error) {
      console.error('Data subject request processing failed:', error);
      return {
        success: false,
        message: 'Request processing failed'
      };
    }
  }

  /**
   * Check compliance status
   */
  public checkComplianceStatus(): { gdpr: boolean; ccpa: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check GDPR compliance
    let gdprCompliant = true;
    if (this.config.gdprCompliance) {
      if (!this.config.consentRequired) {
        issues.push('GDPR requires explicit consent for data processing');
        gdprCompliant = false;
      }
      
      if (!this.config.dataProcessingBasis.includes('consent')) {
        issues.push('GDPR requires consent as a legal basis for processing');
        gdprCompliant = false;
      }
    }

    // Check CCPA compliance
    let ccpaCompliant = true;
    if (this.config.ccpaCompliance) {
      // CCPA compliance checks would go here
    }

    return {
      gdpr: gdprCompliant,
      ccpa: ccpaCompliant,
      issues
    };
  }

  /**
   * Generate compliance report
   */
  public generateComplianceReport(): any {
    const report = {
      timestamp: new Date(),
      gdprCompliance: this.config.gdprCompliance,
      ccpaCompliance: this.config.ccpaCompliance,
      consentMetrics: this.getConsentMetrics(),
      dataSubjectRequests: this.getDataSubjectRequestMetrics(),
      retentionStatus: this.getRetentionStatus(),
      complianceIssues: this.checkComplianceStatus().issues
    };

    return report;
  }

  /**
   * Get consent metrics
   */
  private getConsentMetrics(): any {
    let totalConsents = 0;
    let grantedConsents = 0;
    const consentsByType: Record<string, { granted: number; total: number }> = {};

    for (const userConsents of this.consents.values()) {
      for (const consent of userConsents) {
        totalConsents++;
        if (consent.granted) grantedConsents++;

        const type = consent.consentType;
        if (!consentsByType[type]) {
          consentsByType[type] = { granted: 0, total: 0 };
        }
        consentsByType[type].total++;
        if (consent.granted) consentsByType[type].granted++;
      }
    }

    return {
      totalConsents,
      grantedConsents,
      consentRate: totalConsents > 0 ? (grantedConsents / totalConsents) * 100 : 0,
      consentsByType
    };
  }

  /**
   * Get data subject request metrics
   */
  private getDataSubjectRequestMetrics(): any {
    // In production, this would query actual request data
    return {
      totalRequests: 0,
      requestsByType: {},
      averageProcessingTime: 0,
      completionRate: 100
    };
  }

  /**
   * Get retention status
   */
  private getRetentionStatus(): any {
    // In production, this would get actual retention status
    return {
      dataTypesManaged: Array.from(this.dataProtectionService['retentionPolicies'].keys()),
      automatedRetention: true,
      lastRetentionRun: new Date()
    };
  }

  /**
   * Remove from marketing
   */
  private async removeFromMarketing(userId: string): Promise<void> {
    console.log(`Removing user ${userId} from marketing communications`);
    // In production, this would update marketing systems
  }

  /**
   * Stop third-party sharing
   */
  private async stopThirdPartySharing(userId: string): Promise<void> {
    console.log(`Stopping third-party data sharing for user ${userId}`);
    // In production, this would notify third-party systems
  }

  /**
   * Log privacy events
   */
  private logPrivacyEvent(eventType: string, userId: string, metadata: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date(),
      eventType,
      userId,
      metadata,
      compliance: {
        gdpr: this.config.gdprCompliance,
        ccpa: this.config.ccpaCompliance
      }
    };

    // In production, this would be stored in a secure audit log
    console.log('Privacy Event:', JSON.stringify(logEntry, null, 2));
  }

  /**
   * Validate privacy configuration
   */
  public validatePrivacyConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.gdprCompliance && !this.config.consentRequired) {
      errors.push('GDPR compliance requires consent to be required');
    }

    if (this.config.dataProcessingBasis.length === 0) {
      errors.push('At least one legal basis for data processing must be specified');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get privacy dashboard data
   */
  public getPrivacyDashboard(userId: string): any {
    const userConsents = this.getConsentHistory(userId);
    const currentConsents: Record<string, boolean> = {};

    // Get current consent status for each type
    for (const consentType of Object.values(ConsentType)) {
      currentConsents[consentType] = this.hasConsent(userId, consentType);
    }

    return {
      userId,
      currentConsents,
      consentHistory: userConsents,
      dataRetentionStatus: 'active', // In production, would get actual status
      rightsAvailable: [
        'access',
        'rectification',
        'erasure',
        'portability',
        'restriction',
        'objection'
      ],
      lastUpdated: new Date()
    };
  }
}