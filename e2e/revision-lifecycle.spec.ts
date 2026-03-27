import { test, expect } from '@playwright/test';

test.describe('revision lifecycle', () => {
  test('unauthenticated user is redirected from revision edit', async ({ page }) => {
    await page.goto('/revisions/fake-id/edit');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user is redirected from propose edit', async ({ page }) => {
    await page.goto('/articles/test-slug/propose/fake-id/edit');
    await expect(page).toHaveURL(/\/login/);
  });
});
