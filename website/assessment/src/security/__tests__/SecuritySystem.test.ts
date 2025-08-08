import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { SecuritySystem, SecuritySystemConfig } from '../index';
import { DataSecurityFramework } from '../DataSecurityFramework';
import { PrivacyComplianceSystem } from '../PrivacyComplianceSystem';
import { AuthenticationSystem } from '../AuthenticationSystem';
import { DataRetentionSystem } from '../DataRetentionSystem';
import { AuditComplianceSystem } from '../AuditComplianceSystem';

// Mock dependencies
jest.mock('pg');
jest.mock('redis');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('node-cron');

describe('SecuritySystem', () => {
  let mockDb: jest.Mocked<Pool>;
  let mockRedis: jest.Mocked<RedisClientType>;
  let securitySystem: SecuritySystem;
  let config: SecuritySystemConfig;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
    } as any;

    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      lpush: jest.fn(),
      ltrim: jest.fn(),
      ping: jest.fn(),
      multi: jest.fn(() => ({
        incr: jest.fn(),
        expire: jest.fn(),
        exec: jest.fn()
      })),
    } as any;

    config = {
      security: {
        jwtSecret: 'test-secret',
        jwtExpiresIn: '1h',
        bcryptRounds: 4,
        encryptionKey: 'test-encryption-key',
        sessionTimeout: 3600,
        maxLoginAttempts: 5,
        lockoutDuration: 900
      },
      privacy: {
        dataRetentionDays: 1095,
        anonymizationDelay: 30,
        consentValidityDays: 365,
        gdprEnabled: true,
        ccpaEnabled: false,
        regionalCompliance: ['EU']
      },
      auth: {
        requireEmailVerification: false,
        sessionTimeout: 3600,
        refreshTokenEx