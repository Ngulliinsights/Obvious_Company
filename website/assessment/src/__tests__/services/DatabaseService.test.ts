import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Pool } from 'pg';
import { DatabaseService } from '../../services/DatabaseService';
import { UserProfileModel } from '../../models/UserProfile';

// Mock pg Pool
vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  })),
}));

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
      connect: vi.fn(),
      end: vi.fn(),
    };
    databaseService = new DatabaseService(mockPool);
  });

  describe('createUserProfile', () => {
    it('should create a user profile successfully', async () => {
      const profile = UserProfileModel.create({
        id: 'test-user-id',
        email: 'test@example.com',
        demographics: {
          ageRange: '30-40',
          geographicRegion: 'East Africa',
        },
        professional: {
          industry: 'Healthcare',
          decisionAuthority: 7,
        },
      });

      const mockRow = {
        id: 'test-user-id',
        email: 'test@example.com',
        age_range: '30-40',
        geographic_region: 'East Africa',
        cultural_context: [],
        languages: [],
        industry: 'Healthcare',
        role_level: null,
        organization_size: null,
        decision_authority: 7,
        years_experience: null,
        assessment_modality: [],
        learning_style: null,
        communication_preference: null,
        timezone: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      const result = await databaseService.createUserProfile(profile);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_profiles'),
        expect.arrayContaining([
          'test-user-id',
          'test@example.com',
          '30-40',
          'East Africa',
        ])
      );

      expect(result.id).toBe('test-user-id');
      expect(result.email).toBe('test@example.com');
      expect(result.demographics.ageRange).toBe('30-40');
      expect(result.professional.industry).toBe('Healthcare');
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile when found', async () => {
      const mockRow = {
        id: 'test-user-id',
        email: 'test@example.com',
        age_range: '25-35',
        geographic_region: 'East Africa',
        cultural_context: ['Kenyan'],
        languages: ['en', 'sw'],
        industry: 'Financial Services',
        role_level: 'Manager',
        organization_size: 'Medium',
        decision_authority: 6,
        years_experience: 10,
        assessment_modality: ['questionnaire'],
        learning_style: 'Visual',
        communication_preference: 'Email',
        timezone: 'Africa/Nairobi',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      const result = await databaseService.getUserProfile('test-user-id');

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM user_profiles WHERE id = $1',
        ['test-user-id']
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-user-id');
      expect(result?.demographics.culturalContext).toEqual(['Kenyan']);
      expect(result?.professional.decisionAuthority).toBe(6);
    });

    it('should return null when user not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await databaseService.getUserProfile('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('healthCheck', () => {
    it('should return true when database is healthy', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ now: new Date() }] });

      const result = await databaseService.healthCheck();

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT NOW()');
    });

    it('should return false when database is unhealthy', async () => {
      mockPool.query.mockRejectedValue(new Error('Connection failed'));

      const result = await databaseService.healthCheck();

      expect(result).toBe(false);
    });
  });
});