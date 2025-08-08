import { SecuritySystemConfig } from '../security';

export const securityConfig: SecuritySystemConfig = {
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-encryption-key-change-in-production',
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600'), // 1 hour
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900') // 15 minutes
  },

  privacy: {
    dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '1095'), // 3 years
    anonymizationDelay: parseInt(process.env.ANONYMIZATION_DELAY || '30'), // 30 days
    consentValidityDays: parseInt(process.env.CONSENT_VALIDITY_DAYS || '365'), // 1 year
    gdprEnabled: process.env.GDPR_ENABLED === 'true',
    ccpaEnabled: process.env.CCPA_ENABLED === 'true',
    regionalCompliance: (process.env.REGIONAL_COMPLIANCE || 'EU,US-CA,UK').split(',')
  },

  auth: {
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600'),
    refreshTokenExpiry: parseInt(process.env.REFRESH_TOKEN_EXPIRY || '604800'), // 7 days
    multiFactorEnabled: process.env.MFA_ENABLED === 'true',
    passwordPolicy: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
      requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
      requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
      requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
      requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
      preventReuse: parseInt(process.env.PASSWORD_PREVENT_REUSE || '5')
    }
  },

  retention: {
    policies: [
      {
        dataType: 'assessment_sessions',
        retentionPeriodDays: parseInt(process.env.ASSESSMENT_RETENTION_DAYS || '1095'), // 3 years
        anonymizationDelay: 30,
        deletionMethod: 'anonymize',
        legalBasis: 'Legitimate interest for service improvement',
        exceptions: ['legal_hold', 'active_dispute']
      },
      {
        dataType: 'user_analytics',
        retentionPeriodDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '730'), // 2 years
        anonymizationDelay: 0,
        deletionMethod: 'anonymize',
        legalBasis: 'Legitimate interest for analytics',
        exceptions: ['legal_hold']
      },
      {
        dataType: 'audit_logs',
        retentionPeriodDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '2555'), // 7 years
        anonymizationDelay: 0,
        deletionMethod: 'hard_delete',
        legalBasis: 'Legal obligation for audit trail',
        exceptions: ['regulatory_requirement']
      },
      {
        dataType: 'user_sessions',
        retentionPeriodDays: parseInt(process.env.SESSION_RETENTION_DAYS || '90'), // 3 months
        anonymizationDelay: 0,
        deletionMethod: 'hard_delete',
        legalBasis: 'Technical necessity',
        exceptions: []
      }
    ],
    automatedEnforcement: process.env.AUTOMATED_RETENTION === 'true',
    scheduleExpression: process.env.RETENTION_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    batchSize: parseInt(process.env.RETENTION_BATCH_SIZE || '1000'),
    notificationEmail: process.env.RETENTION_NOTIFICATION_EMAIL
  },

  audit: {
    enableRealTimeAuditing: process.env.ENABLE_REAL_TIME_AUDITING === 'true',
    auditRetentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '2555'), // 7 years
    complianceReportingInterval: parseInt(process.env.COMPLIANCE_REPORTING_INTERVAL || '24'), // 24 hours
    alertThresholds: {
      failedLogins: parseInt(process.env.ALERT_THRESHOLD_FAILED_LOGINS || '10'),
      dataAccess: parseInt(process.env.ALERT_THRESHOLD_DATA_ACCESS || '100'),
      privacyRequests: parseInt(process.env.ALERT_THRESHOLD_PRIVACY_REQUESTS || '5')
    },
    anonymizationRules: [
      {
        field: 'email',
        method: 'hash',
        pattern: '',
        replacement: ''
      },
      {
        field: 'ip_address',
        method: 'mask',
        pattern: '',
        replacement: '***.***.***'
      },
      {
        field: 'user_agent',
        method: 'generalize',
        pattern: '\\d+\\.\\d+\\.\\d+',
        replacement: 'X.X.X'
      }
    ]
  }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
  // More lenient settings for development
  securityConfig.security.bcryptRounds = 4;
  securityConfig.auth.passwordPolicy.minLength = 6;
  securityConfig.retention.automatedEnforcement = false;
  securityConfig.audit.enableRealTimeAuditing = false;
}

if (process.env.NODE_ENV === 'test') {
  // Fast settings for testing
  securityConfig.security.bcryptRounds = 1;
  securityConfig.security.sessionTimeout = 60; // 1 minute
  securityConfig.retention.automatedEnforcement = false;
  securityConfig.audit.enableRealTimeAuditing = false;
}

export default securityConfig;