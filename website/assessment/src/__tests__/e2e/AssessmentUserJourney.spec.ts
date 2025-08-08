import { test, expect } from '@playwright/test';

test.describe('Assessment User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assessment');
  });

  test('should complete full questionnaire assessment journey', async ({ page }) => {
    // Step 1: Assessment selection
    await expect(page.locator('h1')).toContainText('AI Integration Assessment');
    
    await page.click('[data-testid="assessment-type-questionnaire"]');
    await page.click('[data-testid="start-assessment-btn"]');

    // Step 2: User context collection
    await expect(page.locator('[data-testid="context-form"]')).toBeVisible();
    
    await page.selectOption('[data-testid="industry-select"]', 'Technology');
    await page.selectOption('[data-testid="role-level-select"]', 'Senior Manager');
    await page.selectOption('[data-testid="organization-size-select"]', '100-500');
    await page.fill('[data-testid="years-experience-input"]', '8');
    
    await page.click('[data-testid="continue-btn"]');

    // Step 3: Assessment questions
    await expect(page.locator('[data-testid="question-container"]')).toBeVisible();
    
    // Answer multiple questions
    for (let i = 0; i < 10; i++) {
      await expect(page.locator('[data-testid="question-text"]')).toBeVisible();
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
      
      // Select an answer (assuming Likert scale)
      await page.click('[data-testid="answer-agree"]');
      await page.click('[data-testid="next-question-btn"]');
      
      // Wait for next question to load
      await page.waitForTimeout(500);
    }

    // Step 4: Assessment completion and results
    await expect(page.locator('[data-testid="results-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="overall-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="persona-classification"]')).toBeVisible();
    
    // Verify persona-specific content
    const personaText = await page.locator('[data-testid="persona-description"]').textContent();
    expect(personaText).toMatch(/(Strategic Architect|Strategic Catalyst|Strategic Contributor|Strategic Explorer|Strategic Observer)/);

    // Step 5: Curriculum recommendations
    await page.click('[data-testid="view-curriculum-btn"]');
    await expect(page.locator('[data-testid="curriculum-container"]')).toBeVisible();
    
    const curriculumModules = page.locator('[data-testid="curriculum-module"]');
    await expect(curriculumModules).toHaveCountGreaterThan(3);

    // Step 6: Service recommendations
    await page.click('[data-testid="view-services-btn"]');
    await expect(page.locator('[data-testid="service-recommendations"]')).toBeVisible();
    
    const serviceRecommendation = page.locator('[data-testid="recommended-service-tier"]');
    await expect(serviceRecommendation).toBeVisible();
  });

  test('should handle scenario-based assessment', async ({ page }) => {
    await page.click('[data-testid="assessment-type-scenario"]');
    await page.click('[data-testid="start-assessment-btn"]');

    // Fill context
    await page.selectOption('[data-testid="industry-select"]', 'Healthcare');
    await page.click('[data-testid="continue-btn"]');

    // Scenario questions
    await expect(page.locator('[data-testid="scenario-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="scenario-description"]')).toBeVisible();
    
    // Select scenario option
    await page.click('[data-testid="scenario-option-a"]');
    
    // Provide reasoning
    await page.fill('[data-testid="reasoning-textarea"]', 'This approach balances efficiency with patient safety considerations.');
    
    await page.click('[data-testid="submit-scenario-response"]');
    
    // Verify scenario-specific feedback
    await expect(page.locator('[data-testid="scenario-feedback"]')).toBeVisible();
  });

  test('should support assessment modality switching', async ({ page }) => {
    // Start with questionnaire
    await page.click('[data-testid="assessment-type-questionnaire"]');
    await page.click('[data-testid="start-assessment-btn"]');

    await page.selectOption('[data-testid="industry-select"]', 'Financial Services');
    await page.click('[data-testid="continue-btn"]');

    // Answer a few questions
    await page.click('[data-testid="answer-strongly-agree"]');
    await page.click('[data-testid="next-question-btn"]');
    
    await page.click('[data-testid="answer-agree"]');
    await page.click('[data-testid="next-question-btn"]');

    // Switch to scenario-based
    await page.click('[data-testid="switch-modality-btn"]');
    await page.click('[data-testid="modality-scenario"]');
    await page.click('[data-testid="confirm-switch-btn"]');

    // Verify switch
    await expect(page.locator('[data-testid="scenario-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-preserved-notice"]')).toBeVisible();
  });

  test('should handle cultural adaptation', async ({ page }) => {
    await page.click('[data-testid="assessment-type-questionnaire"]');
    await page.click('[data-testid="start-assessment-btn"]');

    // Set cultural context
    await page.selectOption('[data-testid="geographic-region-select"]', 'Kenya');
    await page.check('[data-testid="cultural-context-east-african"]');
    await page.check('[data-testid="language-swahili"]');
    await page.selectOption('[data-testid="industry-select"]', 'Financial Services');
    
    await page.click('[data-testid="continue-btn"]');

    // Verify cultural adaptations
    const questionText = await page.locator('[data-testid="question-text"]').textContent();
    expect(questionText).toMatch(/(Kenya|East Africa|Nairobi|KSH)/i);

    // Complete assessment
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="answer-agree"]');
      await page.click('[data-testid="next-question-btn"]');
      await page.waitForTimeout(300);
    }

    // Verify culturally adapted results
    await expect(page.locator('[data-testid="results-container"]')).toBeVisible();
    
    const investmentRange = await page.locator('[data-testid="investment-range"]').textContent();
    expect(investmentRange).toContain('KSH');
    
    const examples = await page.locator('[data-testid="local-examples"]').textContent();
    expect(examples).toMatch(/(Kenya|East Africa)/i);
  });

  test('should provide accessibility features', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="assessment-type-questionnaire"]:focus')).toBeVisible();
    
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="start-assessment-btn"]:focus')).toBeVisible();

    // Test screen reader support
    const assessmentTitle = page.locator('h1');
    await expect(assessmentTitle).toHaveAttribute('role', 'heading');
    await expect(assessmentTitle).toHaveAttribute('aria-level', '1');

    // Test high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('body')).toHaveCSS('background-color', /rgb\(0, 0, 0\)|rgb\(33, 33, 33\)/);
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Simulate network error
    await page.route('/api/assessment/start', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.click('[data-testid="assessment-type-questionnaire"]');
    await page.click('[data-testid="start-assessment-btn"]');

    await page.selectOption('[data-testid="industry-select"]', 'Technology');
    await page.click('[data-testid="continue-btn"]');

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();
    
    // Test retry functionality
    await page.route('/api/assessment/start', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session_id: 'test-session-id', success: true })
      });
    });

    await page.click('[data-testid="retry-btn"]');
    await expect(page.locator('[data-testid="question-container"]')).toBeVisible();
  });

  test('should save progress and allow resumption', async ({ page }) => {
    await page.click('[data-testid="assessment-type-questionnaire"]');
    await page.click('[data-testid="start-assessment-btn"]');

    await page.selectOption('[data-testid="industry-select"]', 'Manufacturing');
    await page.click('[data-testid="continue-btn"]');

    // Answer some questions
    await page.click('[data-testid="answer-agree"]');
    await page.click('[data-testid="next-question-btn"]');
    
    await page.click('[data-testid="answer-neutral"]');
    await page.click('[data-testid="next-question-btn"]');

    // Save progress
    await page.click('[data-testid="save-progress-btn"]');
    await expect(page.locator('[data-testid="progress-saved-message"]')).toBeVisible();

    // Simulate page refresh
    await page.reload();

    // Verify resume option
    await expect(page.locator('[data-testid="resume-assessment-banner"]')).toBeVisible();
    await page.click('[data-testid="resume-assessment-btn"]');

    // Verify progress restored
    const progressBar = page.locator('[data-testid="progress-bar"]');
    const progressValue = await progressBar.getAttribute('aria-valuenow');
    expect(parseInt(progressValue || '0')).toBeGreaterThan(0);
  });

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.locator('[data-testid="mobile-assessment-header"]')).toBeVisible();
    
    // Test mobile-specific interactions
    await page.tap('[data-testid="assessment-type-questionnaire"]');
    await page.tap('[data-testid="start-assessment-btn"]');

    // Test mobile form interactions
    await page.selectOption('[data-testid="industry-select"]', 'Technology');
    await page.tap('[data-testid="continue-btn"]');

    // Test swipe gestures for question navigation
    await expect(page.locator('[data-testid="question-container"]')).toBeVisible();
    
    // Simulate swipe left for next question (if implemented)
    const questionContainer = page.locator('[data-testid="question-container"]');
    await questionContainer.hover();
    await page.mouse.down();
    await page.mouse.move(-100, 0);
    await page.mouse.up();

    // Verify mobile-optimized results display
    await page.tap('[data-testid="answer-agree"]');
    await page.tap('[data-testid="next-question-btn"]');
    
    // Complete assessment quickly for mobile test
    for (let i = 0; i < 8; i++) {
      await page.tap('[data-testid="answer-agree"]');
      await page.tap('[data-testid="next-question-btn"]');
      await page.waitForTimeout(200);
    }

    await expect(page.locator('[data-testid="mobile-results-container"]')).toBeVisible();
    
    // Test mobile-specific result interactions
    await page.tap('[data-testid="expand-persona-details"]');
    await expect(page.locator('[data-testid="persona-details-expanded"]')).toBeVisible();
  });
});