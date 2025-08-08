import { describe, it, expect } from 'vitest';
import { AssessmentFactory } from '../../services/assessments/AssessmentFactory';
import { QuestionnaireAssessment } from '../../services/assessments/QuestionnaireAssessment';
import { ScenarioAssessment } from '../../services/assessments/ScenarioAssessment';
import { ConversationalAssessment } from '../../services/assessments/ConversationalAssessment';
import { VisualAssessment } from '../../services/assessments/VisualAssessment';
import { BehavioralAssessment } from '../../services/assessments/BehavioralAssessment';
import { UserContext } from '../../models/types';
import { AssessmentSessionModel } from '../../models/AssessmentSession';

describe('AssessmentFactory', () => {
  const userContext: UserContext = {
    userId: 'test-user',
    industry: 'technology',
    geographicRegion: 'east_africa',
    culturalContext: ['kenyan']
  };

  const session = AssessmentSessionModel.create({
    id: 'test-session',
    userId: 'test-user',
    assessmentType: 'questionnaire'
  });

  describe('createAssessment', () => {
    it('should create QuestionnaireAssessment', () => {
      const assessment = AssessmentFactory.createAssessment('questionnaire', userContext, session);
      expect(assessment).toBeInstanceOf(QuestionnaireAssessment);
    });

    it('should create ScenarioAssessment', () => {
      const scenarioSession = { ...session, assessmentType: 'scenario-based' as const };
      const assessment = AssessmentFactory.createAssessment('scenario-based', userContext, scenarioSession);
      expect(assessment).toBeInstanceOf(ScenarioAssessment);
    });

    it('should create ConversationalAssessment', () => {
      const conversationalSession = { ...session, assessmentType: 'conversational' as const };
      const assessment = AssessmentFactory.createAssessment('conversational', userContext, conversationalSession);
      expect(assessment).toBeInstanceOf(ConversationalAssessment);
    });

    it('should create VisualAssessment', () => {
      const visualSession = { ...session, assessmentType: 'visual-pattern' as const };
      const assessment = AssessmentFactory.createAssessment('visual-pattern', userContext, visualSession);
      expect(assessment).toBeInstanceOf(VisualAssessment);
    });

    it('should create BehavioralAssessment', () => {
      const behavioralSession = { ...session, assessmentType: 'behavioral-observation' as const };
      const assessment = AssessmentFactory.createAssessment('behavioral-observation', userContext, behavioralSession);
      expect(assessment).toBeInstanceOf(BehavioralAssessment);
    });

    it('should throw error for unsupported assessment type', () => {
      expect(() => {
        AssessmentFactory.createAssessment('unsupported' as any, userContext, session);
      }).toThrow('Unsupported assessment type: unsupported');
    });
  });

  describe('getAvailableTypes', () => {
    it('should return all available assessment types', () => {
      const types = AssessmentFactory.getAvailableTypes();
      expect(types).toEqual([
        'questionnaire',
        'scenario-based',
        'conversational',
        'visual-pattern',
        'behavioral-observation'
      ]);
    });
  });

  describe('recommendAssessmentType', () => {
    it('should recommend questionnaire for empty assessment history', () => {
      const context = { ...userContext, assessmentHistory: [] };
      const recommendation = AssessmentFactory.recommendAssessmentType(context);
      expect(recommendation).toBe('questionnaire');
    });

    it('should recommend scenario-based for Kenyan context', () => {
      const recommendation = AssessmentFactory.recommendAssessmentType(userContext);
      expect(recommendation).toBe('scenario-based');
    });

    it('should recommend visual-pattern for technology industry', () => {
      const techContext = { 
        ...userContext, 
        culturalContext: ['western'],
        industry: 'technology' 
      };
      const recommendation = AssessmentFactory.recommendAssessmentType(techContext);
      expect(recommendation).toBe('visual-pattern');
    });
  });
});