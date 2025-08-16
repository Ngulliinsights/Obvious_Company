import { Page } from '@playwright/test';

interface AssessmentOptions {
  industry?: string;
  strategicAuthority?: number;
  organizationalInfluence?: number;
  resourceAvailability?: number;
  implementationReadiness?: number;
  culturalAlignment?: number;
}

export async function completeAssessment(page: Page, options: AssessmentOptions = {}) {
  const {
    industry = 'technology',
    strategicAuthority = 4,
    organizationalInfluence = 4,
    resourceAvailability = 4,
    implementationReadiness = 4,
    culturalAlignment = 4,
  } = options;

  await page.goto('/assessment');
  await page.getByLabel('Industry').selectOption(industry);
  await page.getByLabel(/Strategic Authority/).fill(String(strategicAuthority));
  await page.getByLabel(/Organizational Influence/).fill(String(organizationalInfluence));
  await page.getByLabel(/Resource Availability/).fill(String(resourceAvailability));
  await page.getByLabel(/Implementation Readiness/).fill(String(implementationReadiness));
  await page.getByLabel(/Cultural Alignment/).fill(String(culturalAlignment));

  await page.getByRole('button', { name: 'Submit' }).click();
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/admin');
  await page.getByLabel('Username').fill(process.env.ADMIN_USERNAME || 'admin');
  await page.getByLabel('Password').fill(process.env.ADMIN_PASSWORD || 'admin');
  await page.getByRole('button', { name: 'Login' }).click();
}

export const TEST_ASSESSMENT_DATA = {
  industry: 'technology',
  dimensionScores: {
    strategicAuthority: 85,
    organizationalInfluence: 80,
    resourceAvailability: 85,
    implementationReadiness: 75,
    culturalAlignment: 80,
  },
};
