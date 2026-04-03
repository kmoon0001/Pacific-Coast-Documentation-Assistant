import { test, expect } from '@playwright/test';

const disableAnimations = async (page: any) => {
  await page.addStyleTag({
    content: '* { transition-duration: 0s !important; animation-duration: 0s !important; }',
  });
};

test.describe('Visual regression @visual', () => {
  test('Primary workflow shell', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await disableAnimations(page);

    const main = page.locator('main');
    await expect(main).toBeVisible();
    await expect(main).toHaveScreenshot('therapy-main-shell.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('Knowledge base gallery', async ({ page }) => {
    await page.goto('/knowledge-base');
    await page.waitForLoadState('networkidle');
    await disableAnimations(page);
    const grid = page.locator('[data-testid="knowledge-base-grid"], main');
    await expect(grid.first()).toBeVisible();
    await expect(grid.first()).toHaveScreenshot('knowledge-base-grid.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
