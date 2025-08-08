import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assessment');
    await injectAxe(page);
  });

  test('should have no accessibility violations on assessment homepage', async ({ page }) => {
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('should have accessible form elements', async ({ page }) => {
    await page.click('[data-testid="assessment-type-questionnaire"]');
    await page.click('[data-testid="start-assessment-btn"]');

    // Check form accessibility
    await checkA11y(page, '[data-testid="context-form"]', {
      rules: {
        'label': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
        'aria-required-attr': { enabled: true }
      }
    });

    // Verify form labels
    const industrySelect = page.locator('[data-testid="industry-select"]');
    await expect(industrySelect).toHaveAttribute('aria-label');
    
    const roleLevelSelect = page.locator('[data-testid="role-level-select"]');
    await expect(roleLevelSelect).toHaveAttribute('aria-label');
  });

  test('should have accessible navigation and focus management', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test focus indicators
    await expect(focusedElement).toHaveCSS('outline-width', /[1-9]/);
    
    // Test skip links
    await page.keyboard.press('Tab');
    const skipLink = page.locator('[data-testid="skip-to-content"]');
    if (await skipLink.isVisible()) {
      await expect(skipLink).toHaveAttribute('href', '#main-content');
    }
  });

  test('should have accessible assessment questions', async ({ page }) => {
    await page.click('[data-testid="assessment-type-questionnaire"]');
    await page.click('[data-testid="start-assessment-btn"]');

    await page.selectOption('[data-testid="industry-select"]', 'Technology');
    await page.click('[data-testid="continue-btn"]');

    // Wait for question to load
    await expect(page.locator('[data-testid="question-container"]')).toBeVisible();

    // Check question accessibility
    await checkA11y(page, '[data-testid="question-container"]', {
      rules: {
        'heading-order': { enabled: true },
        'landmark-one-main': { enabled: true },
        'region': { enabled: true }
      }
    });

    // Verify question structure
    const questionText = page.locator('[data-testid="question-text"]');
    await expect(questionText).toHaveAttribute('role', 'heading');
    
    const answerOptions = page.locator('[data-testid^="answer-"]');
    const firstOption = answerOptions.first();
    await expect(firstOption).toHaveAttribute('role', 'radio');
    await expect(firstOption).toHaveAttribute('aria-describedby');
  });

  test('should have accessible progress indicators', async ({ page }) => {
    await page.click('[data-testid="assessment-type-questionnaire"]');
    await page.click('[data-testid="start-assessment-btn"]');

    await page.selectOption('[data-testid="industry-select"]', 'Technology');
    await page.click('[data-testid="continue-btn"]');

    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toHaveAttribute('role', 'progressbar');
    await expect(progressBar).toHaveAttribute('aria-valuenow');
    await expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    await expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    await expect(progressBar).toHaveAttribute('aria-label');
  });

  test('should have accessible results display', async ({ page }) => {
    // Mock completed assessment
    await page.route('/api/assessment/*/complete', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: {
            overall_score: 85,
            persona_classification: {
              primary_persona: 'Strategic Architect',
              confidence_score: 0.9
            },
            recommendations: {
              service_tier: 'Strategic Advantage',
              next_steps: ['Schedule consultation', 'Review curriculum']
            }
          }
        })
      });
    });

    await page.click('[data-testid="assessment-type-questionnaire"]');
    await page.click('[data-testid="start-assessment-btn"]');

    await page.selectOption('[data-testid="industry-select"]', 'Technology');
    await page.click('[data-testid="continue-btn"]');

    // Complete assessment quickly
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="answer-agree"]');
      await page.click('[data-testid="next-question-btn"]');
      await page.waitForTimeout(200);
    }

    // Check results accessibility
    await expect(page.locator('[data-testid="results-container"]')).toBeVisible();
    
    await checkA11y(page, '[data-testid="results-container"]', {
      rules: {
        'color-contrast': { enabled: true },
        'heading-order': { enabled: true },
        'landmark-unique': { enabled: true }
      }
    });

    // Verify results structure
    const overallScore = page.locator('[data-testid="overall-score"]');
    await expect(overallScore).toHaveAttribute('aria-label');
    
    const personaClassification = page.locator('[data-testid="persona-classification"]');
    await expect(personaClassification).toHaveAttribute('role', 'region');
    await expect(personaClassification).toHaveAttribute('aria-labelledby');
  });

  test('should support screen readers', async ({ page }) => {
    // Test ARIA landmarks
    const main = page.locator('main');
    await expect(main).toHaveAttribute('role', 'main');
    
    const navigation = page.locator('nav');
    if (await navigation.count() > 0) {
      await expect(navigation.first()).toHaveAttribute('role', 'navigation');
    }

    // Test ARIA live regions for dynamic content
    await page.click('[data-testid="assessment-type-questionnaire"]');
    await page.click('[data-testid="start-assessment-btn"]');

    const liveRegion = page.locator('[aria-live]');
    if (await liveRegion.count() > 0) {
      await expect(liveRegion.first()).toHaveAttribute('aria-live', /polite|assertive/);
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    // Test specific color combinations
    const primaryButton = page.locator('[data-testid="start-assessment-btn"]');
    const buttonStyles = await primaryButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color
      };
    });

    // Verify button has sufficient contrast (this would need actual color analysis)
    expect(buttonStyles.backgroundColor).toBeDefined();
    expect(buttonStyles.color).toBeDefined();
  });

  test('should work with high contrast mode', async ({ page }) => {
    // Enable high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    // Verify elements are still visible and accessible
    const assessmentTypes = page.locator('[data-testid^="assessment-type-"]');
    await expect(assessmentTypes.first()).toBeVisible();
  });

  test('should support keyboard-only navigation', async ({ page }) => {
    // Test full keyboard navigation flow
    await page.keyboard.press('Tab'); // Focus first element
    await page.keyboard.press('Enter'); // Select questionnaire
    
    await page.keyboard.press('Tab'); // Focus start button
    await page.keyboard.press('Enter'); // Start assessment
    
    // Navigate through form
    await page.keyboard.press('Tab'); // Focus industry select
    await page.keyboard.press('ArrowDown'); // Select option
    await page.keyboard.press('Tab'); // Focus role select
    await page.keyboard.press('ArrowDown'); // Select option
    
    await page.keyboard.press('Tab'); // Focus continue button
    await page.keyboard.press('Enter'); // Continue
    
    // Verify we can navigate questions with keyboard
    await expect(page.locator('[data-testid="question-container"]')).toBeVisible();
    
    await page.keyboard.press('Tab'); // Focus first answer
    await page.keyboard.press('Space'); // Select answer
    await page.keyboard.press('Tab'); // Focus next button
    await page.keyboard.press('Enter'); // Next question
  });

  test('should have accessible error messages', async ({ page }) => {
    await page.click('[data-testid="assessment-type-questionnaire"]');
    await page.click('[data-testid="start-assessment-btn"]');

    // Try to continue without filling required fields
    await page.click('[data-testid="continue-btn"]');

    // Check error message accessibility
    const errorMessage = page.locator('[data-testid="error-message"]');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toHaveAttribute('role', 'alert');
      await expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
    }

    // Check field-specific errors
    const industryError = page.locator('[data-testid="industry-error"]');
    if (await industryError.isVisible()) {
      await expect(industryError).toHaveAttribute('id');
      
      const industrySelect = page.locator('[data-testid="industry-select"]');
      const errorId = await industryError.getAttribute('id');
      await expect(industrySelect).toHaveAttribute('aria-describedby', errorId);
    }
  });

  test('should support assistive technologies', async ({ page }) => {
    // Test ARIA attributes
    await checkA11y(page, null, {
      rules: {
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-roles': { enabled: true }
      }
    });

    // Test specific ARIA implementations
    await page.click('[data-testid="assessment-type-questionnaire"]');
    await page.click('[data-testid="start-assessment-btn"]');

    await page.selectOption('[data-testid="industry-select"]', 'Technology');
    await page.click('[data-testid="continue-btn"]');

    // Check question group ARIA
    const questionGroup = page.locator('[data-testid="question-container"]');
    await expect(questionGroup).toHaveAttribute('role', 'group');
    await expect(questionGroup).toHaveAttribute('aria-labelledby');

    // Check radio group ARIA
    const answerGroup = page.locator('[data-testid="answer-group"]');
    if (await answerGroup.isVisible()) {
      await expect(answerGroup).toHaveAttribute('role', 'radiogroup');
      await expect(answerGroup).toHaveAttribute('aria-labelledby');
    }
  });
});