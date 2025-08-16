import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display main heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Check if navigation menu exists
    await expect(page.getByRole('navigation')).toBeVisible();

    // Verify navigation links are present
    const navLinks = page.getByRole('navigation').getByRole('link');
    await expect(navLinks).not.toHaveCount(0);
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('navigation')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});
