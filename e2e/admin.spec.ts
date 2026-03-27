import { test, expect } from '@playwright/test';

test.describe('admin access control', () => {
  test('unauthenticated user is redirected from admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user is redirected from admin/revisions', async ({ page }) => {
    await page.goto('/admin/revisions');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user is redirected from admin/users', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/login/);
  });
});
