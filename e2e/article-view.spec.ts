import { test, expect } from '@playwright/test';

test.describe('article pages', () => {
  test('articles page loads and shows heading', async ({ page }) => {
    await page.goto('/articles');
    await expect(page.locator('h1')).toContainText('ערכים');
  });

  test('articles page shows search input', async ({ page }) => {
    await page.goto('/articles');
    await expect(page.locator('input[placeholder*="חיפוש"]')).toBeVisible();
  });
});
