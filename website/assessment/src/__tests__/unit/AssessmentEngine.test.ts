import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssessmentEngine } from '../../services/AssessmentEngine';
import { createMockUser, createMockAssessment } from '../setup';

describe('AssessmentEngine', () => {
  let assessmentEngine: AssessmentEngine;
  let mockUser: any;
  let mockAssessment: any;

  beforeEach(() => {
    assessmentEngine = new AssessmentEngine();
    mockUser = createMockUser();
    mockAssessment = createMockAssessment();
  });

  describe('startAssessment', () => {
    it('should create a new assessment session', async () => {
      const userContext = {
        userId: mockUser.id,
        industry: mockUser.professional.industry,
        culturalContext: mockUser.demographics.cultural_context
      };

      const session = await assessmentEngine.startAssessment('questionnaire', userContext);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.assessment_type).toBe('questionnaire');
      expect(session.status).toBe('in_progress');
      expect(session.user_id).toBe(mockUser.id);
    });

    it('should adapt questions based on cultural context', async () => {
      const userContext = {
        userId: mockUser.id,
        industry: 'Financial Services',
        culturalContext: ['East African', 'Swahili']
      };

      const session = await assessmentEngine.startAssessment('questionnaire', userContext);

      expect(session.metadata.cultural_adaptations).toContain('East African');
      expect(session.metadata.cultural_adaptations).toContain('Swahili');
    });

    it('should handle different assessment types', async () => {
      const userContext = {
        userId: mockUser.id,
        industry: mockUser.professional.industry,
        culturalContext: mockUser.demographics.cultural_context
      };

      const types = ['questionnaire', 'scenario', 'conversational', 'visual', 'behavioral'];
      
      for (const type of types) {
        const session = await assessmentEngine.startAssessment(type as any, userContext);
        expect(session.assessment_type).toBe(type);
      }
    });
  });

  describe('processResponse', () => {
    it('should process valid responses and return next question', async () => {
      const response = {
        question_id: 'q1',
        answer: 'Strongly Agree',
        response_time: 5000,
        metadata: {}
      };

      const result = await assessmentEngine.processResponse(mockAssessment.id, response);

      expect(result).toBeDefined();
      expect(result.type).toBeOneOf(['next_question', 'results']);
    });

    it('should validate response format', async () => {
      const invalidResponse = {
        question_id: '',
        answer: null,
        response_time: -1
      };

      await expect(
        assessmentEngine.processResponse(mockAssessment.id, invalidResponse as any)
      ).rejects.toThrow('Invalid response format');
    });

    it('should track response patterns for behavioral analysis', async () => {
      const responses = [
        { question_id: 'q1', answer: 'Yes', response_time: 2000 },
        { question_id: 'q2', answer: 'No', response_time: 1500 },
        { question_id: 'q3', answer: 'Maybe', response_time: 8000 }
      ];

      for (const response of responses) {
        await assessmentEngine.processResponse(mockAssessment.id, response);
      }

      const session = await assessmentEngine.getSession(mockAssessment.id);
      expect(session.responses).toHaveLength(3);
      expect(session.metadata.average_response_time).toBeDefined();
    });
  });

  describe('calculateResults', () => {
    it('should calculate comprehensive assessment results', async () => {
      // Mock completed assessment with responses
      const completedAssessment = {
        ...mockAssessment,
        status: 'completed',
        responses: [
          { question_id: 'authority_1', answer: 'Strongly Agree', score: 5 },
          { question_id: 'influence_1', answer: 'Agree', score: 4 },
          { question_id: 'resources_1', answer: 'Neutral', score: 3 },
          { question_id: 'readiness_1', answer: 'Agree', score: 4 }
        ]
      };

      vi.spyOn(assessmentEngine, 'getSession').mockResolvedValue(completedAssessment);

      const results = await assessmentEngine.calculateResults(mockAssessment.id);

      expect(results).toBeDefined();
      expect(results.overall_score).toBeGreaterThan(0);
      expect(results.dimension_scores).toBeDefined();
      expect(results.persona_classification).toBeDefined();
      expect(results.recommendations).toBeDefined();
    });

    it('should classify persona based on responses', async () => {
      const highAuthorityResponses = [
        { question_id: 'authority_1', answer: 'Strongly Agree', score: 5 },
        { question_id: 'authority_2', answer: 'Strongly Agree', score: 5 },
        { question_id: 'resources_1', answer: 'Strongly Agree', score: 5 },
        { question_id: 'readiness_1', answer: 'Strongly Agree', score: 5 }
      ];

      const completedAssessment = {
        ...mockAssessment,
        status: 'completed',
        responses: highAuthorityResponses
      };

      vi.spyOn(assessmentEngine, 'getSession').mockResolvedValue(completedAssessment);

      const results = await assessmentEngine.calculateResults(mockAssessment.id);

      expect(results.persona_classification.primary_persona).toBe('Strategic Architect');
      expect(results.persona_classification.confidence_score).toBeGreaterThan(0.8);
    });

    it('should provide industry-specific recommendations', async () => {
      const financialServicesAssessment = {
        ...mockAssessment,
        status: 'completed',
        metadata: {
          ...mockAssessment.metadata,
          industry: 'Financial Services'
        },
        responses: [
          { question_id: 'compliance_1', answer: 'Very Important', score: 5 },
          { question_id: 'risk_1', answer: 'High Priority', score: 4 }
        ]
      };

      vi.spyOn(assessmentEngine, 'getSession').mockResolvedValue(financialServicesAssessment);

      const results = await assessmentEngine.calculateResults(mockAssessment.id);

      expect(results.industry_insights).toBeDefined();
      expect(results.industry_insights.regulatory_considerations).toContain('compliance');
      expect(results.recommendations.next_steps).toContain('regulatory');
    });
  });

  describe('adaptQuestions', () => {
    it('should adapt questions based on response patterns', async () => {
      const responsePattern = {
        average_time: 3000,
        consistency_score: 0.8,
        engagement_level: 'high',
        difficulty_preference: 'moderate'
      };

      const adaptedQuestions = await assessmentEngine.adaptQuestions(
        mockAssessment.id, 
        responsePattern
      );

      expect(adaptedQuestions).toBeDefined();
      expect(adaptedQuestions.length).toBeGreaterThan(0);
      expect(adaptedQuestions[0]).toHaveProperty('id');
      expect(adaptedQuestions[0]).toHaveProperty('text');
      expect(adaptedQuestions[0]).toHaveProperty('type');
    });

    it('should adjust difficulty based on user performance', async () => {
      const highPerformancePattern = {
        average_time: 2000,
        consistency_score: 0.95,
        engagement_level: 'high',
        difficulty_preference: 'advanced'
      };

      const adaptedQuestions = await assessmentEngine.adaptQuestions(
        mockAssessment.id, 
        highPerformancePattern
      );

      expect(adaptedQuestions.some(q => q.difficulty === 'advanced')).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle invalid session IDs gracefully', async () => {
      await expect(
        assessmentEngine.processResponse('invalid-session-id', {
          question_id: 'q1',
          answer: 'Yes',
          response_time: 1000
        })
      ).rejects.toThrow('Session not found');
    });

    it('should handle database connection errors', async () => {
      vi.spyOn(assessmentEngine, 'getSession').mockRejectedValue(new Error('Database connection failed'));

      await expect(
        assessmentEngine.calculateResults(mockAssessment.id)
      ).rejects.toThrow('Database connection failed');
    });

    it('should provide fallback scoring when algorithms fail', async () => {
      const corruptedAssessment = {
        ...mockAssessment,
        responses: [
          { question_id: null, answer: undefined, score: NaN }
        ]
      };

      vi.spyOn(assessmentEngine, 'getSession').mockResolvedValue(corruptedAssessment);

      const results = await assessmentEngine.calculateResults(mockAssessment.id);

      expect(results.overall_score).toBeGreaterThanOrEqual(0);
      expect(results.persona_classification.primary_persona).toBe('Strategic Observer');
    });
  });
});