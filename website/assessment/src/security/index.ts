import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { DataSecurityFramework, SecurityConfig } from './DataSecurityFramework';
import { PrivacyComplianceSystem, PrivacyConfig } from './PrivacyComplianceSystem';
import { AuthenticationSystem, AuthConfig } from './AuthenticationSystem';
import { DataRetentionSystem, RetentionConfig } from './DataRetentionSystem';
import { AuditComplianceSystem, AuditConfig } from './AuditComplianceSystem';

export interface SecuritySystemConfig {
  security: SecurityConfig;
  privacy: PrivacyConfig;
  auth: AuthConfig;
  retention: RetentionConfig;
  audit: AuditConfig;
}

export class SecuritySystem {
  private db: Pool;
  private redis: RedisClientType;
  
  public security: DataSecurityFramework;
  public privacy: PrivacyComplianceSystem;
  public auth: AuthenticationSystem;
  public retention: DataRetentionSystem;
  public audit: AuditComplianceSystem;

  constructor(config: SecuritySystemConfig, db: Pool, redis: RedisClientType) {
    this.db = db;
    this.redis = redis;

    // Initialize security components
    this.security = new DataSecurityFramework(config.security, db, redis);
    this.privacy = new PrivacyComplianceSystem(config.privacy, db, redis, this.security);
    this.auth = new AuthenticationSystem(config.auth, db, redis, this.security, this.privacy);
    this.retention = new DataRetentionSystem(config.retention, db, redis, this.security);
    this.audit = new AuditComplianceSystem(config.audit, db, redis, this.security);
  }

  async initialize(): Promise<void> {
    try {
      // Create security-related database tables
      await this.createSecurityTables();

      // Initialize retention system
      await this.retention.initialize();

      // Initialize audit and compliance system
      await this.audit.initialize();

      console.log('Security system initialized successfully');
    } catch (error) {
      console.error('Security system initialization failed:', error);
      throw error;
    }
  }

  private async createSecurityTables(): Promise<void> {
    try {
      await this.db.query(`
        -- User authentication table
        CREATE TABLE IF NOT EXISTS user_auth (
          user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
          password_hash TEXT NOT NULL,
          email_verified BOOLEAN DEFAULT FALSE,
          verification_token TEXT,
          reset_token TEXT,
          reset_token_expires TIMESTAMP WITH TIME ZONE,
          account_locked BOOLEAN DEFAULT FALSE,
          lockout_expires TIMESTAMP WITH TIME ZONE,
          last_login TIMESTAMP WITH TIME ZONE,
          password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          role VARCHAR(50) DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- User sessions table
        CREATE TABLE IF NOT EXISTS user_sessions (
          session_id VARCHAR(255) PRIMARY KEY,
          user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          invalidated_at TIMESTAMP WITH TIME ZONE,
          ip_address INET,
          user_agent TEXT,
          last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Password history table
        CREATE TABLE IF NOT EXISTS password_history (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- User consent table
        CREATE TABLE IF NOT EXISTS user_consent (
          user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
          consent_type VARCHAR(100) NOT NULL,
          consent_given BOOLEAN NOT NULL,
          consent_date TIMESTAMP WITH TIME ZONE NOT NULL,
          consent_version VARCHAR(20) NOT NULL,
          ip_address INET,
          user_agent TEXT,
          withdrawal_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          PRIMARY KEY (user_id, consent_type)
        );

        -- Privacy requests table
        CREATE TABLE IF NOT EXISTS privacy_requests (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
          request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection')),
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
          request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          completion_date TIMESTAMP WITH TIME ZONE,
          request_details JSONB,
          response_data JSONB
        );

        -- Security audit log table
        CREATE TABLE IF NOT EXISTS security_audit_log (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          event_type VARCHAR(100) NOT NULL,
          user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
          event_details JSONB,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Legal obligations table
        CREATE TABLE IF NOT EXISTS legal_obligations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
          obligation_type VARCHAR(100) NOT NULL,
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'expired')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE
        );

        -- Add processing restriction column to user_profiles
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS processing_restricted BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS restriction_date TIMESTAMP WITH TIME ZONE;

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_user_auth_user_id ON user_auth(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_auth_verification_token ON user_auth(verification_token);
        CREATE INDEX IF NOT EXISTS idx_user_auth_reset_token ON user_auth(reset_token);

        CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_invalidated_at ON user_sessions(invalidated_at);

        CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_password_history_created_at ON password_history(created_at);

        CREATE INDEX IF NOT EXISTS idx_user_consent_user_id ON user_consent(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_consent_type ON user_consent(consent_type);

        CREATE INDEX IF NOT EXISTS idx_privacy_requests_user_id ON privacy_requests(user_id);
        CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON privacy_requests(status);
        CREATE INDEX IF NOT EXISTS idx_privacy_requests_request_date ON privacy_requests(request_date);

        CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
        CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
        CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);

        CREATE INDEX IF NOT EXISTS idx_legal_obligations_user_id ON legal_obligations(user_id);
        CREATE INDEX IF NOT EXISTS idx_legal_obligations_status ON legal_obligations(status);

        -- Create updated_at triggers
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_user_auth_updated_at ON user_auth;
        CREATE TRIGGER update_user_auth_updated_at 
          BEFORE UPDATE ON user_auth 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);

      console.log('Security database tables created successfully');
    } catch (error) {
      console.error('Failed to create security tables:', error);
      throw error;
    }
  }

  // Get comprehensive security status
  async getSecurityStatus(): Promise<any> {
    try {
      const [
        activeUsers,
        activeSessions,
        recentSecurityEvents,
        privacyRequests,
        retentionStatus
      ] = await Promise.all([
        this.getActiveUsersCount(),
        this.getActiveSessionsCount(),
        this.getRecentSecurityEvents(),
        this.getPrivacyRequestsStatus(),
        this.retention.getRetentionStatus()
      ]);

      return {
        timestamp: new Date().toISOString(),
        activeUsers,
        activeSessions,
        recentSecurityEvents,
        privacyRequests,
        retentionStatus,
        systemHealth: await this.checkSystemHealth()
      };
    } catch (error) {
      throw new Error(`Failed to get security status: ${error}`);
    }
  }

  private async getActiveUsersCount(): Promise<number> {
    const result = await this.db.query(
      `SELECT COUNT(DISTINCT user_id) as count 
       FROM user_sessions 
       WHERE expires_at > NOW() AND invalidated_at IS NULL`
    );
    return (result as any[])[0].count;
  }

  private async getActiveSessionsCount(): Promise<number> {
    const result = await this.db.query(
      `SELECT COUNT(*) as count 
       FROM user_sessions 
       WHERE expires_at > NOW() AND invalidated_at IS NULL`
    );
    return (result as any[])[0].count;
  }

  private async getRecentSecurityEvents(): Promise<any[]> {
    const result = await this.db.query(
      `SELECT event_type, COUNT(*) as count
       FROM security_audit_log 
       WHERE created_at > NOW() - INTERVAL '24 hours'
       GROUP BY event_type
       ORDER BY count DESC
       LIMIT 10`
    );
    return result as any[];
  }

  private async getPrivacyRequestsStatus(): Promise<any> {
    const result = await this.db.query(
      `SELECT 
         status,
         COUNT(*) as count,
         AVG(EXTRACT(EPOCH FROM (completion_date - request_date))/86400) as avg_processing_days
       FROM privacy_requests 
       WHERE request_date > NOW() - INTERVAL '30 days'
       GROUP BY status`
    );
    return result;
  }

  private async checkSystemHealth(): Promise<any> {
    try {
      // Check database connection
      await this.db.query('SELECT 1');
      
      // Check Redis connection
      await this.redis.ping();

      return {
        database: 'healthy',
        redis: 'healthy',
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        database: 'error',
        redis: 'error',
        error: error.toString(),
        lastCheck: new Date().toISOString()
      };
    }
  }

  // Security middleware factory
  createSecurityMiddleware() {
    return {
      authenticate: this.auth.requireAuthentication,
      requirePermission: this.auth.requirePermission,
      requireRole: this.auth.requireRole,
      securityHeaders: (req: any, res: any, next: any) => {
        const headers = this.security.getSecurityHeaders();
        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        next();
      }
    };
  }

  // Shutdown security system
  async shutdown(): Promise<void> {
    try {
      await this.retention.shutdown();
      console.log('Security system shutdown completed');
    } catch (error) {
      console.error('Security system shutdown failed:', error);
    }
  }
}

// Export all security components
export {
  DataSecurityFramework,
  PrivacyComplianceSystem,
  AuthenticationSystem,
  DataRetentionSystem,
  AuditComplianceSystem
};

export * from './DataSecurityFramework';
export * from './PrivacyComplianceSystem';
export * from './AuthenticationSystem';
export * from './DataRetentionSystem';
export * from './AuditComplianceSystem';