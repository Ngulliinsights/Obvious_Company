import { describe, it, expect } from 'vitest';
import { UserProfileModel, UserProfile } from '../../models/UserProfile';

describe('UserProfile', () => {
  describe('UserProfileModel.create', () => {
    it('should create a user profile with default values', () => {
      const profileData = {
        id: 'test-user-id',
        email: 'test@example.com',
      };

      const profile = UserProfileModel.create(profileData);

      expect(profile.id).toBe('test-user-id');
      expect(profile.email).toBe('test@example.com');
      expect(profile.demographics.culturalContext).toEqual([]);
      expect(profile.demographics.languages).toEqual([]);
      expect(profile.preferences.assessmentModality).toEqual([]);
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect(profile.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a user profile with provided demographics', () => {
      const profileData = {
        id: 'test-user-id',
        demographics: {
          ageRange: '30-40',
          geographicRegion: 'East Africa',
          culturalContext: ['Kenyan', 'Swahili'],
          languages: ['en', 'sw'],
        },
      };

      const profile = UserProfileModel.create(profileData);

      expect(profile.demographics.ageRange).toBe('30-40');
      expect(profile.demographics.geographicRegion).toBe('East Africa');
      expect(profile.demographics.culturalContext).toEqual(['Kenyan', 'Swahili']);
      expect(profile.demographics.languages).toEqual(['en', 'sw']);
    });

    it('should create a user profile with professional information', () => {
      const profileData = {
        id: 'test-user-id',
        professional: {
          industry: 'Financial Services',
          roleLevel: 'Senior Executive',
          organizationSize: 'Large (1000+)',
          decisionAuthority: 8,
          yearsExperience: 15,
        },
      };

      const profile = UserProfileModel.create(profileData);

      expect(profile.professional.industry).toBe('Financial Services');
      expect(profile.professional.roleLevel).toBe('Senior Executive');
      expect(profile.professional.decisionAuthority).toBe(8);
      expect(profile.professional.yearsExperience).toBe(15);
    });
  });

  describe('UserProfileModel methods', () => {
    let userProfile: UserProfileModel;
    let profileData: UserProfile;

    beforeEach(() => {
      profileData = UserProfileModel.create({
        id: 'test-user-id',
        email: 'test@example.com',
        professional: {
          industry: 'Healthcare',
          decisionAuthority: 6,
        },
        demographics: {
          culturalContext: ['Kenyan'],
        },
        preferences: {
          assessmentModality: ['questionnaire', 'scenario-based'],
        },
      });
      userProfile = new UserProfileModel(profileData);
    });

    it('should return correct ID', () => {
      expect(userProfile.getId()).toBe('test-user-id');
    });

    it('should return correct industry', () => {
      expect(userProfile.getIndustry()).toBe('Healthcare');
    });

    it('should return cultural context', () => {
      expect(userProfile.getCulturalContext()).toEqual(['Kenyan']);
    });

    it('should return decision authority', () => {
      expect(userProfile.getDecisionAuthority()).toBe(6);
    });

    it('should return preferred assessment modalities', () => {
      expect(userProfile.getPreferredAssessmentModalities()).toEqual(['questionnaire', 'scenario-based']);
    });

    it('should update profile and return new instance', async () => {
      // Add small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const updates = {
        professional: {
          ...profileData.professional,
          industry: 'Manufacturing',
        },
      };

      const updatedProfile = userProfile.update(updates);

      expect(updatedProfile.professional.industry).toBe('Manufacturing');
      expect(updatedProfile.updatedAt.getTime()).toBeGreaterThanOrEqual(profileData.updatedAt.getTime());
    });

    it('should return JSON representation', () => {
      const json = userProfile.toJSON();

      expect(json).toEqual(profileData);
      expect(json).not.toBe(profileData); // Should be a copy
    });
  });
});