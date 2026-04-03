import { test, expect } from '@playwright/test';

test.describe('Compliance & Resilience', () => {
  test('HIPAA sanitization clears volatile storage', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('pii', 'ssn:123-45-6789');
      sessionStorage.setItem('pii', 'ssn:123-45-6789');
    });

    const sanitizeButton = page.getByRole('button', { name: /hipaa clean/i });
    await sanitizeButton.click();

    await expect.poll(async () => page.evaluate(() => localStorage.length)).toBe(0);
    await expect.poll(async () => page.evaluate(() => sessionStorage.length)).toBe(0);
    expect(consoleErrors).toEqual([]);
  });

  test('initial navigation stays within the performance budget', async ({ page }) => {
    await page.goto('/');
    const navigationTimings = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
        total: nav.loadEventEnd - nav.startTime,
      };
    });

    expect(navigationTimings.domContentLoaded).toBeLessThan(5000);
    expect(navigationTimings.total).toBeLessThan(7000);
  });
});
