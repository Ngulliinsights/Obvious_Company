import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { createMockUser, createMockAssessment, mockDb, mockRedis } from '../setup';

describe('Assessment Flow Integration', () => {
  let mockUser: any;
  let sessionId: string;

  beforeEach(() => {
    mockUser = createMockUser();
    sessionId = 'test-session-id';
    
    // Mock database responses
    mockDb.query.mockImplementation((query: string) => {
      if (query.includes('INSERT INTO assessment_sessions')) {
        return Promise.resolve({ rows: [{ id: sessionId }] });
      }
      if (query.includes('SELECT * FROM assessment_sessions')) {
        return Promise.resolve({ rows: [createMockAssessment()] });
      }
      if (query.includes('INSERT INTO assessment_responses')) {
        return Promise.resolve({ rows: [{ id: 'response-id' }] });
      }
      return Promise.resolve({ rows: [] });
    });

    // Mock Redis responses
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue('OK');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Assessment Journey', () => {
    it('should handle full assessment flow from start to completion', async () => {
      // Step 1: Start assessment
      const startResponse = await request(app)
        .post('/api/assessment/start')
        .send({
          assessment_type: 'questionnaire',
          user_context: {
            industry: mockUser.professional.industry,
            role_level: mockUser.professional.role_level,
            cultural_context: mockUser.demographics.cultural_context
          }
        })
        .expect(201);

      expect(startResponse.body.session_id).toBeDefined();
      const sessionId = startResponse.body.session_id;

      // Step 2: Get first question
      const questionResponse = await request(app)
        .get(`/api/assessment/${sessionId}/next-question`)
        .expect(200);

      expect(questionResponse.body.question).toBeDefined();
      expect(questionResponse.body.question.id).toBeDefined();
      expect(questionResponse.body.progress).toBeDefined();

      // Step 3: Submit responses
      const responses = [
        { question_id: 'authority_1', answer: 'Strongly Agree', response_time: 3000 },
        { question_id: 'influence_1', answer: 'Agree', response_time: 2500 },
        { question_id: 'resources_1', answer: 'Neutral', response_time: 4000 },
        { question_id: 'readiness_1', answer: 'Agree', response_time: 3500 }
      ];

      for (const response of responses) {
        await request(app)
          .post(`/api/assessment/${sessionId}/respond`)
          .send(response)
          .expect(200);
      }

      // Step 4: Complete assessment and get results
      const resultsResponse = await request(app)
        .post(`/api/assessment/${sessionId}/complete`)
        .expect(200);

      expect(resultsResponse.body.results).toBeDefined();
      expect(resultsResponse.body.results.overall_score).toBeGreaterThan(0);
      expect(resultsResponse.body.results.persona_classification).toBeDefined();
      expect(resultsResponse.body.results.recommendations).toBeDefined();
    });

    it('should handle multi-modal assessment switching', async () => {
      // Start with questionnaire
      const startResponse = await request(app)
        .post('/api/assessment/start')
        .send({
          assessment_type: 'questionnaire',
          user_context: { industry: 'Technology' }
        })
        .expect(201);

      const sessionId = startResponse.body.session_id;

      // Submit some responses
      await request(app)
        .post(`/api/assessment/${sessionId}/respond`)
        .send({ question_id: 'q1', answer: 'Yes', response_time: 2000 })
        .expect(200);

      // Switch to scenario-based assessment
      const switchResponse = await request(app)
        .post(`/api/assessment/${sessionId}/switch-modality`)
        .send({ new_modality: 'scenario' })
        .expect(200);

      expect(switchResponse.body.success).toBe(true);
      expect(switchResponse.body.new_question_type).toBe('scenario');

      // Continue with scenario questions
      await request(app)
        .post(`/api/assessment/${sessionId}/respond`)
        .send({ 
          question_id: 'scenario_1', 
          answer: 'Option A', 
          response_time: 8000,
          reasoning: 'This approach aligns with strategic goals'
        })
        .expect(200);
    });

    it('should preserve session state across requests', async () => {
      const startResponse = await request(app)
        .post('/api/assessment/start')
        .send({
          assessment_type: 'questionnaire',
          user_context: { industry: 'Healthcare' }
        })
        .expect(201);

      const sessionId = startResponse.body.session_id;

      // Submit response
      await request(app)
        .post(`/api/assessment/${sessionId}/respond`)
        .send({ question_id: 'q1', answer: 'Agree', response_time: 3000 })
        .expect(200);

      // Get session status
      const statusResponse = await request(app)
        .get(`/api/assessment/${sessionId}/status`)
        .expect(200);

      expect(statusResponse.body.responses_count).toBe(1);
      expect(statusResponse.body.progress_percentage).toBeGreaterThan(0);
      expect(statusResponse.body.estimated_remaining_time).toBeDefined();
    });
  });

  describe('Industry-Specific Assessment Flows', () => {
    it('should adapt questions for financial services industry', async () => {
      const startResponse = await request(app)
        .post('/api/assessment/start')
        .send({
          assessment_type: 'questionnaire',
          user_context: { 
            industry: 'Financial Services',
            regulatory_context: ['KBA', 'CBK']
          }
        })
        .expect(201);

      const sessionId = startResponse.body.session_id;

      const questionResponse = await request(app)
        .get(`/api/assessment/${sessionId}/next-question`)
        .expect(200);

      expect(questionResponse.body.question.industry_context).toBe('Financial Services');
      expect(questionResponse.body.question.text).toContain('regulatory');
    });

    it('should provide healthcare-specific scenarios', async () => {
      const startResponse = await request(app)
        .post('/api/assessment/start')
        .send({
          assessment_type: 'scenario',
          user_context: { industry: 'Healthcare' }
        })
        .expect(201);

      const sessionId = startResponse.body.session_id;

      const questionResponse = await request(app)
        .get(`/api/assessment/${sessionId}/next-question`)
        .expect(200);

      expect(questionResponse.body.question.scenario).toContain('patient');
      expect(questionResponse.body.question.options.some((opt: any) => 
        opt.text.includes('privacy') || opt.text.includes('ethical')
      )).toBe(true);
    });

    it('should handle government sector compliance requirements', async () => {
      const startResponse = await request(app)
        .post('/api/assessment/start')
        .send({
          assessment_type: 'questionnaire',
          user_context: { 
            industry: 'Government',
            sector: 'Public Service'
          }
        })
        .expect(201);

      const sessionId = startResponse.body.session_id;

      const questionResponse = await request(app)
        .get(`/api/assessment/${sessionId}/next-question`)
        .expect(200);

      expect(questionResponse.body.question.compliance_considerations).toBeDefined();
      expect(questionResponse.body.question.text).toContain('transparency');
    });
  });

  describe('Cultural Adaptation Integration', () => {
    it('should adapt content for East African context', async () => {
      const startResponse = await request(app)
        .post('/api/assessment/start')
        .send({
          assessment_type: 'questionnaire',
          user_context: { 
            cultural_context: ['East African', 'Swahili'],
            geographic_region: 'Kenya'
          }
        })
        .expect(201);

      const sessionId = startResponse.body.session_id;

      const questionResponse = await request(app)
        .get(`/api/assessment/${sessionId}/next-question`)
        .expect(200);

      expect(questionResponse.body.question.cultural_adaptations).toContain('East African');
      expect(questionResponse.body.question.examples.some((ex: any) => 
        ex.includes('Kenya') || ex.includes('East Africa')
      )).toBe(true);
    });

    it('should provide culturally appropriate investment ranges', async () => {
      const responses = [
        { question_id: 'authority_1', answer: 'Strongly Agree', response_time: 3000 },
        { question_id: 'resources_1', answer: 'Agree', response_time: 2500 }
      ];

      const startResponse = await request(app)
        .post('/api/assessment/start')
        .send({
          assessment_type: 'questionnaire',
          user_context: { 
            cultural_context: ['East African'],
            geographic_region: 'Kenya'
          }
        })
        .expect(201);

      const sessionId = startResponse.body.session_id;

      for (const response of responses) {
        await request(app)
          .post(`/api/assessment/${sessionId}/respond`)
          .send(response)
          .expect(200);
      }

      const resultsResponse = await request(app)
        .post(`/api/assessment/${sessionId}/complete`)
        .expect(200);

      expect(resultsResponse.body.results.recommendations.investment_range).toContain('KSH');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle session timeout gracefully', async () => {
      // Mock expired session
      mockRedis.get.mockResolvedValue(null);
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/assessment/expired-session-id/next-question')
        .expect(404);

      expect(response.body.error).toBe('Session not found or expired');
      expect(response.body.recovery_options).toBeDefined();
    });

    it('should recover from database connection failures', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/assessment/start')
        .send({
          assessment_type: 'questionnaire',
          user_context: { industry: 'Technology' }
        })
        .expect(503);

      expect(response.body.error).toContain('service temporarily unavailable');
      expect(response.body.retry_after).toBeDefined();
    });

    it('should validate input data and provide helpful errors', async () => {
      const response = await request(app)
        .post('/api/assessment/start')
        .send({
          assessment_type: 'invalid_type',
          user_context: {}
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.assessment_type).toContain('must be one of');
    });

    it('should handle incomplete responses gracefully', async () => {
      const startResponse = await request(app)
        .post('/api/assessment/start')
        .send({
          assessment_type: 'questionnaire',
          user_context: { industry: 'Technology' }
        })
        .expect(201);

      const sessionId = startResponse.body.session_id;

      // Submit incomplete response
      const response = await request(app)
        .post(`/api/assessment/${sessionId}/respond`)
        .send({
          question_id: 'q1'
          // Missing answer and response_time
        })
        .expect(400);

      expect(response.body.errors.answer).toBeDefined();
      expect(response.body.errors.response_time).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent assessment sessions', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/assessment/start')
          .send({
            assessment_type: 'questionnaire',
            user_context: { industry: 'Technology', user_id: `user-${i}` }
          })
      );

      const responses = await Promise.all(concurrentRequests);

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.session_id).toBeDefined();
      });

      // Verify all sessions are unique
      const sessionIds = responses.map(r => r.body.session_id);
      const uniqueSessionIds = new Set(sessionIds);
      expect(uniqueSessionIds.size).toBe(sessionIds.length);
    });

    it('should cache frequently accessed data', async () => {
      // First request should hit database
      mockRedis.get.mockResolvedValueOnce(null);
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ id: 'q1', text: 'Test question', type: 'multiple_choice' }] 
      });

      const startResponse = await request(app)
        .post('/api/assessment/start')
        .send({
          assessment_type: 'questionnaire',
          user_context: { industry: 'Technology' }
        })
        .expect(201);

      const sessionId = startResponse.body.session_id;

      await request(app)
        .get(`/api/assessment/${sessionId}/next-question`)
        .expect(200);

      // Second request should use cache
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({
        id: 'q1', text: 'Test question', type: 'multiple_choice'
      }));

      await request(app)
        .get(`/api/assessment/${sessionId}/next-question`)
        .expect(200);

      expect(mockRedis.get).toHaveBeenCalledTimes(2);
      expect(mockDb.query).toHaveBeenCalledTimes(1); // Only called once due to caching
    });
  });
});