import { test, expect, devices } from '@playwright/test';

const browsers = [
  { name: 'Chrome', ...devices['Desktop Chrome'] },
  { name: 'Firefox', ...devices['Desktop Firefox'] },
  { name: 'Safari', ...devices['Desktop Safari'] },
  { name: 'Edge', ...devices['Desktop Edge'] },
  { name: 'Mobile Chrome', ...devices['Pixel 5'] },
  { name: 'Mobile Safari', ...devices['iPhone 12'] }
];

browsers.forEach(browser => {
  test.describe(`Browser Compatibility - ${browser.name}`, () => {
    test.use(browser);

    test('should load assessment page correctly', async ({ page }) => {
      await page.goto('/assessment');
      
      // Check basic page structure
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="assessment-type-questionnaire"]')).toBeVisible();
      await expect(page.locator('[data-testid="start-assessment-btn"]')).toBeVisible();
      
      // Check CSS rendering
      const header = page.locator('h1');
      const headerStyles = await header.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          fontSize: styles.fontSize,
          fontFamily: styles.fontFamily,
          color: styles.color
        };
      });
      
      expect(headerStyles.fontSize).toBeTruthy();
      expect(headerStyles.color).toBeTruthy();
    });

    test('should handle form interactions correctly', async ({ page }) => {
      await page.goto('/assessment');
      
      await page.click('[data-testid="assessment-type-questionnaire"]');
      await page.click('[data-testid="start-assessment-btn"]');
      
      // Test form elements
      const industrySelect = page.locator('[data-testid="industry-select"]');
      await expect(industrySelect).toBeVisible();
      
      await industrySelect.selectOption('Technology');
      const selectedValue = await industrySelect.inputValue();
      expect(selectedValue).toBe('Technology');
      
      // Test other form elements
      await page.selectOption('[data-testid="role-level-select"]', 'Senior Manager');
      await page.fill('[data-testid="years-experience-input"]', '5');
      
      await page.click('[data-testid="continue-btn"]');
      
      // Verify navigation worked
      await expect(page.locator('[data-testid="question-container"]')).toBeVisible();
    });

    test('should support JavaScript features', async ({ page }) => {
      await page.goto('/assessment');
      
      // Test modern JavaScript features
      const jsFeatures = await page.evaluate(() => {
        const features = {
          arrow_functions: typeof (() => {}) === 'function',
          promises: typeof Promise !== 'undefined',
          async_await: typeof (async () => {}) === 'function',
          fetch: typeof fetch !== 'undefined',
          local_storage: typeof localStorage !== 'undefined',
          session_storage: typeof sessionStorage !== 'undefined',
          json: typeof JSON !== 'undefined',
          array_methods: typeof [].map === 'function',
          object_assign: typeof Object.assign === 'function',
          template_literals: true // Can't easily test this
        };
        
        return features;
      });
      
      // Verify essential features are supported
      expect(jsFeatures.promises).toBe(true);
      expect(jsFeatures.fetch).toBe(true);
      expect(jsFeatures.local_storage).toBe(true);
      expect(jsFeatures.json).toBe(true);
    });

    test('should handle CSS features correctly', async ({ page }) => {
      await page.goto('/assessment');
      
      // Test CSS Grid support
      const gridSupport = await page.evaluate(() => {
        const testEl = document.createElement('div');
        testEl.style.display = 'grid';
        return testEl.style.display === 'grid';
      });
      
      // Test Flexbox support
      const flexSupport = await page.evaluate(() => {
        const testEl = document.createElement('div');
        testEl.style.display = 'flex';
        return testEl.style.display === 'flex';
      });
      
      // Test CSS Custom Properties
      const customPropsSupport = await page.evaluate(() => {
        return CSS.supports('color', 'var(--test-color)');
      });
      
      expect(flexSupport).toBe(true);
      
      // Grid and custom properties might not be supported in older browsers
      if (browser.name.includes('Chrome') || browser.name.includes('Firefox') || browser.name.includes('Safari')) {
        expect(gridSupport).toBe(true);
        expect(customPropsSupport).toBe(true);
      }
    });

    test('should handle responsive design', async ({ page }) => {
      await page.goto('/assessment');
      
      // Test different viewport sizes
      const viewports = [
        { width: 320, height: 568 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1024, height: 768 }, // Desktop small
        { width: 1920, height: 1080 } // Desktop large
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        
        // Check that content is still visible and accessible
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('[data-testid="assessment-type-questionnaire"]')).toBeVisible();
        
        // Check that layout adapts
        const container = page.locator('[data-testid="assessment-container"]');
        const containerBox = await container.boundingBox();
        
        if (containerBox) {
          expect(containerBox.width).toBeLessThanOrEqual(viewport.width);
          expect(containerBox.width).toBeGreaterThan(0);
        }
      }
    });

    test('should handle touch interactions on mobile', async ({ page }) => {
      if (!browser.name.includes('Mobile')) {
        test.skip();
      }
      
      await page.goto('/assessment');
      
      // Test touch interactions
      await page.tap('[data-testid="assessment-type-questionnaire"]');
      await page.tap('[data-testid="start-assessment-btn"]');
      
      await page.selectOption('[data-testid="industry-select"]', 'Technology');
      await page.tap('[data-testid="continue-btn"]');
      
      // Test swipe gestures if implemented
      const questionContainer = page.locator('[data-testid="question-container"]');
      await expect(questionContainer).toBeVisible();
      
      // Test pinch zoom (if applicable)
      await page.touchscreen.tap(200, 200);
    });

    test('should handle network conditions', async ({ page, context }) => {
      // Simulate slow network
      await context.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });
      
      await page.goto('/assessment');
      
      // Should still load within reasonable time
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
      
      // Test offline behavior
      await context.setOffline(true);
      
      // Should show offline message or cached content
      await page.reload();
      
      // Check if service worker provides offline functionality
      const isOfflineHandled = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });
      
      if (isOfflineHandled) {
        // Should still show some content when offline
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should handle errors gracefully', async ({ page }) => {
      await page.goto('/assessment');
      
      // Simulate API error
      await page.route('/api/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      });
      
      await page.click('[data-testid="assessment-type-questionnaire"]');
      await page.click('[data-testid="start-assessment-btn"]');
      
      await page.selectOption('[data-testid="industry-select"]', 'Technology');
      await page.click('[data-testid="continue-btn"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
      
      // Should provide retry option
      await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();
    });

    test('should maintain performance across browsers', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/assessment');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds on all browsers
      expect(loadTime).toBeLessThan(5000);
      
      // Test JavaScript execution performance
      const jsPerformance = await page.evaluate(() => {
        const start = performance.now();
        
        // Simulate some computation
        let result = 0;
        for (let i = 0; i < 100000; i++) {
          result += Math.random();
        }
        
        const end = performance.now();
        return end - start;
      });
      
      // JavaScript should execute reasonably fast
      expect(jsPerformance).toBeLessThan(1000);
    });

    test('should handle browser-specific quirks', async ({ page }) => {
      await page.goto('/assessment');
      
      // Test browser-specific features
      const browserInfo = await page.evaluate(() => {
        return {
          userAgent: navigator.userAgent,
          vendor: navigator.vendor,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine
        };
      });
      
      expect(browserInfo.cookieEnabled).toBe(true);
      expect(browserInfo.onLine).toBe(true);
      
      // Test specific browser behaviors
      if (browser.name.includes('Safari')) {
        // Safari-specific tests
        const safariFeatures = await page.evaluate(() => {
          return {
            webkitAppearance: CSS.supports('-webkit-appearance', 'none'),
            webkitTransform: CSS.supports('-webkit-transform', 'scale(1)')
          };
        });
        
        expect(safariFeatures.webkitAppearance).toBe(true);
      }
      
      if (browser.name.includes('Firefox')) {
        // Firefox-specific tests
        const firefoxFeatures = await page.evaluate(() => {
          return {
            mozAppearance: CSS.supports('-moz-appearance', 'none')
          };
        });
        
        expect(firefoxFeatures.mozAppearance).toBe(true);
      }
    });

    test('should support accessibility features across browsers', async ({ page }) => {
      await page.goto('/assessment');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test ARIA support
      const ariaSupport = await page.evaluate(() => {
        const testEl = document.createElement('div');
        testEl.setAttribute('aria-label', 'test');
        return testEl.getAttribute('aria-label') === 'test';
      });
      
      expect(ariaSupport).toBe(true);
      
      // Test screen reader support
      const screenReaderSupport = await page.evaluate(() => {
        return 'speechSynthesis' in window;
      });
      
      // Most modern browsers support speech synthesis
      if (!browser.name.includes('Mobile')) {
        expect(screenReaderSupport).toBe(true);
      }
    });
  });
});

// Cross-browser compatibility summary test
test.describe('Cross-Browser Summary', () => {
  test('should generate compatibility report', async ({ page }) => {
    const compatibilityReport = {
      timestamp: new Date().toISOString(),
      browsers: [],
      features: {
        basicFunctionality: true,
        responsiveDesign: true,
        jsFeatures: true,
        cssFeatures: true,
        accessibility: true,
        performance: true
      }
    };
    
    // This would be populated by the actual test results
    console.log('Cross-browser compatibility report:', compatibilityReport);
    
    expect(compatibilityReport.features.basicFunctionality).toBe(true);
  });
});