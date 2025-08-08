import { describe, it, expect, beforeEach } from 'vitest';
import { AssessmentEngine } from '../../services/AssessmentEngine';
import { UserContext, AssessmentType } from '../../models/types';

describe('AssessmentEngine', () => {
  let assessmentEngine: AssessmentEngine;
  let userContext: UserContext;

  beforeEach(() => {
    assessmentEngine = new AssessmentEngine();
    userContext = {
      userId: 'test-user',
      industry: 'technology',
      geographicRegion: 'east_africa',
      culturalContext: ['kenyan'],
      preferredLanguage: 'en'
    };
  });

  describe('startAssessment', () => {
    it('should start a questionnaire assessment', async () => {
      const result = await assessmentEngine.startAssessment('questionnaire', userContext);
      
      expect(result.session).toBeDefined();
      expect(result.session.assessmentType).toBe('questionnaire');
      expect(result.session.status).toBe('in_progress');
      expect(result.firstQuestion).toBeDefined();
    });

    it('should start a scenario-based assessment', async () => {
      const result = await assessmentEngine.startAssessment('scenario-based', userContext);
      
      expect(result.session).toBeDefined();
      expect(result.session.assessmentType).toBe('scenario-based');
      expect(result.firstQuestion).toBeDefined();
    });

    it('should start a conversational assessment', async () => {
      const result = await assessmentEngine.startAssessment('conversational', userContext);
      
      expect(result.session).toBeDefined();
      expect(result.session.assessmentType).toBe('conversational');
      expect(result.firstQuestion).toBeDefined();
    });

    it('should start a visual assessment', async () => {
      const result = await assessmentEngine.startAssessment('visual-pattern', userContext);
      
      expect(result.session).toBeDefined();
      expect(result.session.assessmentType).toBe('visual-pattern');
      expect(result.firstQuestion).toBeDefined();
    });

    it('should start a behavioral assessment', async () => {
      const result = await assessmentEngine.startAssessment('behavioral-observation', userContext);
      
      expect(result.session).toBeDefined();
      expect(result.session.assessmentType).toBe('behavioral-observation');
      expect(result.firstQuestion).toBeDefined();
    });
  });

  describe('getAvailableAssessmentTypes', () => {
    it('should return all available assessment types', () => {
      const types = AssessmentEngine.getAvailableAssessmentTypes();
      
      expect(types).toContain('questionnaire');
      expect(types).toContain('scenario-based');
      expect(types).toContain('conversational');
      expect(types).toContain('visual-pattern');
      expect(types).toContain('behavioral-observation');
      expect(types).toHaveLength(5);
    });
  });

  describe('recommendAssessmentType', () => {
    it('should recommend questionnaire for users with no assessment history', () => {
      const contextWithNoHistory = { ...userContext, assessmentHistory: [] };
      const recommendation = AssessmentEngine.recommendAssessmentType(contextWithNoHistory);
      
      expect(recommendation).toBe('questionnaire');
    });

    it('should recommend scenario-based for Kenyan users', () => {
      const recommendation = AssessmentEngine.recommendAssessmentType(userContext);
      
      expect(recommendation).toBe('scenario-based');
    });

    it('should recommend visual-pattern for technology industry', () => {
      const techContext = { 
        ...userContext, 
        culturalContext: ['western'],
        industry: 'technology' 
      };
      const recommendation = AssessmentEngine.recommendAssessmentType(techContext);
      
      expect(recommendation).toBe('visual-pattern');
    });
  });

  describe('getAssessmentMetadata', () => {
    it('should return metadata for questionnaire assessment', () => {
      const metadata = AssessmentEngine.getAssessmentMetadata('questionnaire');
      
      expect(metadata.name).toBe('Traditional Questionnaire');
      expect(metadata.difficulty).toBe('easy');
      expect(metadata.culturalAdaptations).toBe(true);
      expect(metadata.estimatedDuration).toBeGreaterThan(0);
    });

    it('should return metadata for behavioral assessment', () => {
      const metadata = AssessmentEngine.getAssessmentMetadata('behavioral-observation');
      
      expect(metadata.name).toBe('Behavioral Analysis');
      expect(metadata.difficulty).toBe('advanced');
      expect(metadata.culturalAdaptations).toBe(false);
      expect(metadata.estimatedDuration).toBeGreaterThan(0);
    });
  });
});