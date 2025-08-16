import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  const baseApiUrl = process.env.API_URL || 'http://localhost:3000/api';

  test('should fetch assessment results', async ({ request }) => {
    const response = await request.post(`${baseApiUrl}/assessment`, {
      data: {
        industry: 'technology',
        dimensionScores: {
          strategicAuthority: 85,
          organizationalInfluence: 80,
          resourceAvailability: 85,
          implementationReadiness: 75,
          culturalAlignment: 80,
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('personaClassification');
    expect(data).toHaveProperty('recommendations');
  });

  test('should generate strategic insights', async ({ request }) => {
    const response = await request.post(`${baseApiUrl}/strategic-insights`, {
      data: {
        industry: 'financial_services',
        culturalContext: ['global'],
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('strategic_positioning');
    expect(data.strategic_positioning).toBeInstanceOf(Array);
  });

  test('should handle invalid assessment data', async ({ request }) => {
    const response = await request.post(`${baseApiUrl}/assessment`, {
      data: {
        industry: 'invalid_industry',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});
