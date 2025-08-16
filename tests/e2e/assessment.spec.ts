import { test, expect } from '@playwright/test';
import { AssessmentResults } from '../../website/assessment/src/models/types';

test.describe('Assessment Platform', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assessment');
  });

  test('should load assessment form', async ({ page }) => {
    await expect(page.getByRole('form')).toBeVisible();
  });

  test('should handle assessment submission', async ({ page }) => {
    // Fill assessment form
    await page.getByLabel('Industry').selectOption('financial_services');
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify results are displayed
    await expect(page.getByText(/Assessment Results/)).toBeVisible();
  });

  test('should display correct persona classification', async ({ page }) => {
    // Fill strategic questions
    await page.getByLabel(/Strategic Authority/).fill('5');
    await page.getByLabel(/Organizational Influence/).fill('4');
    await page.getByLabel(/Resource Availability/).fill('4');
    await page.getByLabel(/Implementation Readiness/).fill('5');
    await page.getByLabel(/Cultural Alignment/).fill('4');

    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify persona classification is shown
    await expect(
      page.getByText(
        /Strategic Architect|Strategic Catalyst|Strategic Contributor|Strategic Explorer|Strategic Observer/
      )
    ).toBeVisible();
  });

  test('should generate strategic recommendations', async ({ page }) => {
    // Complete assessment
    await page.getByLabel('Industry').selectOption('technology');
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify recommendations are displayed
    await expect(page.getByText(/Strategic Recommendations/)).toBeVisible();
    await expect(page.getByText(/Next Steps/)).toBeVisible();
  });
});
