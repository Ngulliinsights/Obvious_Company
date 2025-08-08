import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performance } from 'perf_hooks';
import request from 'supertest';
import { app } from '../../app';
import { createMockUser, mockDb, mockRedis } from '../setup';

describe('Performance and Load Testing', () => {
  let mockUser: any;

  beforeEach(() => {
    mockUser = createMockUser();
    
    // Mock fast database responses
    mockDb.query.mockImplementation(() => 
      Promise.resolve({ rows: [{ id: 'test-id', data: 'test-data' }] })
    );
    
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue('OK');
  });

  describe('Response Time Performance', () => {
    it('should start assessment within 2 seconds', async () => {
      const startTime = performance.now();

      const response = await request(app)
        .post('/api/assessment/start')
        .send({
          assessment_type: 'questionnaire',
          user_context: {
            industry: mockUser.professional.industry,
            role_level: mockUser.professional.role_level
          }
        })
        .expect(201);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000);
      expect(response.body.session_id).toBeDefined();
    });

    it('should process responses within 1 second', async () => {
      const sessionId = 'test-session-id';
      
      const startTime = performance.now();

      await request(app)
        .post(`/api/assessment/${sessionId}/respond`)
        .send({
          question_id: 'q1',
          answer: 'Agree',
          response_time: 3000
        })
        .expect(200);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000);
    });

    it('should calculate results within 3 seconds', async () => {
      const sessionId = 'test-session-id';
      
      // Mock completed assessment
      mockDb.query.mockImplementationOnce(() => Promise.resolve({
        rows: [{
          id: sessionId,
          status: 'completed',
          responses: Array.from({ length: 20 }, (_, i) => ({
            question_id: `q${i + 1}`,
            answer: 'Agree',
            score: 4
          }))
        }]
      }));

      const startTime = performance.now();

      const response = await request(app)
        .post(`/api/assessment/${sessionId}/complete`)
        .expect(200);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(3000);
      expect(response.body.results).toBeDefined();
    });

    it('should generate curriculum within 2 seconds', async () => {
      const startTime = performance.now();

      const response = await request(app)
        .post('/api/curriculum/generate')
        .send({
          assessment_id: 'test-assessment-id',
          user_context: mockUser
        })
        .expect(200);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000);
      expect(response.body.curriculum).toBeDefined();
    });
  });

  describe('Concurrent User Load Testing', () => {
    it('should handle 50 concurrent assessment starts', async () => {
      const concurrentRequests = Array.from({ length: 50 }, (_, i) =>
        request(app)
          .post('/api/assessment/start')
          .send({
            assessment_type: 'questionnaire',
            user_context: {
              industry: 'Technology',
              user_id: `user-${i}`
            }
          })
      );

      const startTime = performance.now();
      const responses = await Promise.all(concurrentRequests);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const averageResponseTime = totalTime / responses.length;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.session_id).toBeDefined();
      });

      // Average response time should be reasonable
      expect(averageResponseTime).toBeLessThan(5000);

      // All session IDs should be unique
      const sessionIds = responses.map(r => r.body.session_id);
      const uniqueSessionIds = new Set(sessionIds);
      expect(uniqueSessionIds.size).toBe(sessionIds.length);
    });

    it('should handle concurrent response submissions', async () => {
      const sessionId = 'test-session-id';
      
      const concurrentResponses = Array.from({ length: 20 }, (_, i) =>
        request(app)
          .post(`/api/assessment/${sessionId}/respond`)
          .send({
            question_id: `q${i + 1}`,
            answer: 'Agree',
            response_time: 2000 + Math.random() * 1000
          })
      );

      const startTime = performance.now();
      const responses = await Promise.all(concurrentResponses);
      const endTime = performance.now();

      const totalTime = endTime - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should maintain performance under sustained load', async () => {
      const iterations = 10;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        await request(app)
          .post('/api/assessment/start')
          .send({
            assessment_type: 'questionnaire',
            user_context: {
              industry: 'Technology',
              iteration: i
            }
          })
          .expect(201);

        const endTime = performance.now();
        responseTimes.push(endTime - startTime);

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Calculate performance metrics
      const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxTime = Math.max(...responseTimes);
      const minTime = Math.min(...responseTimes);

      expect(averageTime).toBeLessThan(2000);
      expect(maxTime).toBeLessThan(5000);
      
      // Performance should be consistent (max shouldn't be more than 3x min)
      expect(maxTime / minTime).toBeLessThan(3);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory during assessment processing', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Process multiple assessments
      for (let i = 0; i < 100; i++) {
        await request(app)
          .post('/api/assessment/start')
          .send({
            assessment_type: 'questionnaire',
            user_context: { industry: 'Technology', iteration: i }
          })
          .expect(201);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle large assessment datasets efficiently', async () => {
      // Mock large dataset
      const largeResponseSet = Array.from({ length: 1000 }, (_, i) => ({
        question_id: `q${i + 1}`,
        answer: 'Agree',
        score: Math.floor(Math.random() * 5) + 1,
        response_time: Math.floor(Math.random() * 5000) + 1000
      }));

      mockDb.query.mockImplementationOnce(() => Promise.resolve({
        rows: [{
          id: 'large-assessment-id',
          status: 'completed',
          responses: largeResponseSet
        }]
      }));

      const startTime = performance.now();

      const response = await request(app)
        .post('/api/assessment/large-assessment-id/complete')
        .expect(200);

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(5000); // Should process within 5 seconds
      expect(response.body.results).toBeDefined();
    });
  });

  describe('Database Performance', () => {
    it('should optimize database queries for assessment retrieval', async () => {
      let queryCount = 0;
      
      mockDb.query.mockImplementation((query: string) => {
        queryCount++;
        return Promise.resolve({ rows: [{ id: 'test-id' }] });
      });

      await request(app)
        .get('/api/assessment/test-session-id/status')
        .expect(200);

      // Should use minimal database queries (ideally 1-2)
      expect(queryCount).toBeLessThanOrEqual(2);
    });

    it('should use connection pooling efficiently', async () => {
      const concurrentQueries = Array.from({ length: 20 }, () =>
        request(app)
          .get('/api/assessment/test-session-id/status')
          .expect(200)
      );

      const startTime = performance.now();
      await Promise.all(concurrentQueries);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      
      // With proper connection pooling, this should complete quickly
      expect(totalTime).toBeLessThan(3000);
    });
  });

  describe('Caching Performance', () => {
    it('should cache frequently accessed questions', async () => {
      // First request - should hit database
      mockRedis.get.mockResolvedValueOnce(null);
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ id: 'q1', text: 'Test question', type: 'multiple_choice' }] 
      });

      const firstResponse = await request(app)
        .get('/api/assessment/test-session-id/next-question')
        .expect(200);

      // Second request - should use cache
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({
        id: 'q1', text: 'Test question', type: 'multiple_choice'
      }));

      const startTime = performance.now();
      
      const secondResponse = await request(app)
        .get('/api/assessment/test-session-id/next-question')
        .expect(200);

      const endTime = performance.now();
      const cachedResponseTime = endTime - startTime;

      expect(cachedResponseTime).toBeLessThan(100); // Cached response should be very fast
      expect(secondResponse.body.question).toEqual(firstResponse.body.question);
    });

    it('should cache assessment results for quick retrieval', async () => {
      const assessmentResults = {
        overall_score: 85,
        persona_classification: { primary_persona: 'Strategic Architect' }
      };

      // Cache the results
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(assessmentResults));

      const startTime = performance.now();

      const response = await request(app)
        .get('/api/assessment/test-session-id/results')
        .expect(200);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(50); // Cached results should be extremely fast
      expect(response.body.results.overall_score).toBe(85);
    });
  });

  describe('Scalability Testing', () => {
    it('should scale assessment processing linearly', async () => {
      const testSizes = [10, 20, 50];
      const processingTimes: number[] = [];

      for (const size of testSizes) {
        const requests = Array.from({ length: size }, (_, i) =>
          request(app)
            .post('/api/assessment/start')
            .send({
              assessment_type: 'questionnaire',
              user_context: { industry: 'Technology', batch: size, index: i }
            })
        );

        const startTime = performance.now();
        await Promise.all(requests);
        const endTime = performance.now();

        processingTimes.push(endTime - startTime);
      }

      // Processing time should scale roughly linearly
      const ratio1 = processingTimes[1] / processingTimes[0]; // 20/10
      const ratio2 = processingTimes[2] / processingTimes[1]; // 50/20

      // Ratios should be reasonable (not exponential growth)
      expect(ratio1).toBeLessThan(3);
      expect(ratio2).toBeLessThan(3);
    });

    it('should handle assessment completion spikes', async () => {
      // Simulate many users completing assessments simultaneously
      const completionRequests = Array.from({ length: 30 }, (_, i) => {
        mockDb.query.mockImplementationOnce(() => Promise.resolve({
          rows: [{
            id: `session-${i}`,
            status: 'completed',
            responses: [
              { question_id: 'q1', answer: 'Agree', score: 4 },
              { question_id: 'q2', answer: 'Strongly Agree', score: 5 }
            ]
          }]
        }));

        return request(app)
          .post(`/api/assessment/session-${i}/complete`)
          .expect(200);
      });

      const startTime = performance.now();
      const responses = await Promise.all(completionRequests);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const averageTime = totalTime / responses.length;

      expect(averageTime).toBeLessThan(3000);
      
      responses.forEach(response => {
        expect(response.body.results).toBeDefined();
      });
    });
  });
});