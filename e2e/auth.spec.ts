import { test, expect } from '@playwright/test';

test.describe('authentication', () => {
  test('unauthenticated user is redirected from protected page', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user is redirected from admin page', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user is redirected from drafts page', async ({ page }) => {
    await page.goto('/drafts');
    await expect(page).toHaveURL(/\/login/);
  });

  test('articles page is accessible without login', async ({ page }) => {
    await page.goto('/articles');
    await expect(page.locator('h1')).toContainText('ערכים');
  });
});
