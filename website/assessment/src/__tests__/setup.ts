// Test setup and configuration
import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock environment variables for testing
process.env['NODE_ENV'] = 'test';
process.env['DB_HOST'] = 'localhost';
process.env['DB_PORT'] = '5432';
process.env['DB_NAME'] = 'ai_assessment_test';
process.env['DB_USER'] = 'postgres';
process.env['DB_PASSWORD'] = 'test';
process.env['REDIS_HOST'] = 'localhost';
process.env['REDIS_PORT'] = '6379';
process.env['JWT_SECRET'] = 'test-secret';

// Mock server for API testing
export const server = setupServer(
  // Mock external API calls
  rest.post('/api/assessment/submit', (req, res, ctx) => {
    return res(ctx.json({ success: true, id: 'test-assessment-id' }));
  }),
  rest.get('/api/assessment/:id', (req, res, ctx) => {
    return res(ctx.json({ 
      id: req.params.id,
      status: 'completed',
      results: { score: 85, persona: 'Strategic Architect' }
    }));
  })
);

// Global test setup
beforeAll(async () => {
  console.log('Setting up test environment...');
  server.listen({ onUnhandledRequest: 'error' });
});

afterAll(async () => {
  console.log('Cleaning up test environment...');
  server.close();
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  server.resetHandlers();
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});

// Global test utilities
export const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  demographics: {
    age_range: '30-40',
    geographic_region: 'Kenya',
    cultural_context: ['East African'],
    languages: ['English', 'Swahili']
  },
  professional: {
    industry: 'Technology',
    role_level: 'Senior Manager',
    organization_size: '100-500',
    decision_authority: 7,
    years_experience: 8
  }
});

export const createMockAssessment = () => ({
  id: 'test-assessment-id',
  user_id: 'test-user-id',
  assessment_type: 'questionnaire',
  status: 'in_progress',
  responses: [],
  metadata: {
    start_time: new Date(),
    modality_used: 'questionnaire',
    cultural_adaptations: ['East African']
  }
});

// Mock database connection
export const mockDb = {
  query: vi.fn(),
  connect: vi.fn(),
  end: vi.fn()
};

// Mock Redis connection
export const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  expire: vi.fn()
};