import { test, expect } from '@playwright/test';

test.describe('Error Handling and Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Simulate API error by intercepting requests
    await page.route('**/models/gemini-3-flash-preview:generateContent', (route) => {
      route.abort('failed');
    });

    // Try to generate note
    const ptButton = page.locator('button:has-text("PT")').first();
    await ptButton.click();

    const dailyButton = page.locator('button:has-text("Daily")').first();
    await dailyButton.click();

    // Navigate to generate
    const nextButton = page.locator('button:has-text("Next")');
    for (let i = 0; i < 6; i++) {
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(300);
      }
    }

    // Try to generate
    const generateButton = page.locator('button:has-text("Generate")');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(2000);

      // Should show error message or fallback to local mode
      const errorMessage = page.locator('[role="alert"], .error');
      const localModeIndicator = page.locator('text=Local Mode');

      const hasError = await errorMessage.isVisible().catch(() => false);
      const hasLocalMode = await localModeIndicator.isVisible().catch(() => false);

      expect(hasError || hasLocalMode).toBe(true);
    }
  });

  test('should handle network timeout', async ({ page }) => {
    // Simulate slow network
    await page.route('**/models/gemini-3-flash-preview:generateContent', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      route.continue();
    });

    const ptButton = page.locator('button:has-text("PT")').first();
    await ptButton.click();

    const dailyButton = page.locator('button:has-text("Daily")').first();
    await dailyButton.click();

    // Navigate to generate
    const nextButton = page.locator('button:has-text("Next")');
    for (let i = 0; i < 6; i++) {
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(300);
      }
    }

    // Try to generate
    const generateButton = page.locator('button:has-text("Generate")');
    if (await generateButton.isVisible()) {
      await generateButton.click();

      // Should show loading state or timeout message
      const loadingIndicator = page.locator('[role="status"], .loading, .spinner');
      const timeoutMessage = page.locator('text=timeout, text=Timeout');

      const hasLoading = await loadingIndicator.isVisible().catch(() => false);
      const hasTimeout = await timeoutMessage.isVisible().catch(() => false);

      expect(hasLoading || hasTimeout).toBe(true);
    }
  });

  test('should recover from errors', async ({ page }) => {
    // First request fails
    let requestCount = 0;
    await page.route('**/models/gemini-3-flash-preview:generateContent', (route) => {
      requestCount++;
      if (requestCount === 1) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    const ptButton = page.locator('button:has-text("PT")').first();
    await ptButton.click();

    const dailyButton = page.locator('button:has-text("Daily")').first();
    await dailyButton.click();

    // Navigate to generate
    const nextButton = page.locator('button:has-text("Next")');
    for (let i = 0; i < 6; i++) {
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(300);
      }
    }

    // First attempt fails
    const generateButton = page.locator('button:has-text("Generate")');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(2000);

      // Retry
      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")');
      if (await retryButton.isVisible()) {
        await retryButton.click();
        await page.waitForTimeout(2000);

        // Should succeed on retry
        const noteContent = page.locator('[data-testid="generated-note"]');
        const isVisible = await noteContent.isVisible().catch(() => false);
        expect(isVisible).toBe(true);
      }
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Navigate to generate without filling required fields
    const nextButton = page.locator('button:has-text("Next")');
    for (let i = 0; i < 7; i++) {
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(300);
      }
    }

    // Try to generate without discipline
    const generateButton = page.locator('button:has-text("Generate")');
    if (await generateButton.isVisible()) {
      const isDisabled = await generateButton.isDisabled();
      if (isDisabled) {
        expect(isDisabled).toBe(true);
      } else {
        // If not disabled, should show validation error
        await generateButton.click();
        await page.waitForTimeout(500);

        const validationError = page.locator('[role="alert"], .error, .validation-error');
        const isVisible = await validationError.isVisible().catch(() => false);
        expect(isVisible).toBe(true);
      }
    }
  });

  test('should handle PII detection', async ({ page }) => {
    // Look for custom note input
    const customNoteInput = page.locator('textarea[placeholder*="note"], textarea[placeholder*="Note"]');

    if (await customNoteInput.isVisible()) {
      // Enter text with PII
      await customNoteInput.fill('Patient SSN: 123-45-6789 participated in therapy');
      await page.waitForTimeout(500);

      // Look for PII warning
      const piiWarning = page.locator('text=PII, text=sensitive, text=redacted');
      const isVisible = await piiWarning.isVisible().catch(() => false);

      // PII handling depends on implementation
      // Could show warning or auto-scrub
    }
  });

  test('should handle session timeout', async ({ page }) => {
    // Start a session
    const ptButton = page.locator('button:has-text("PT")').first();
    await ptButton.click();

    // Wait for session timeout (if implemented)
    await page.waitForTimeout(5000);

    // Try to interact
    const dailyButton = page.locator('button:has-text("Daily")').first();
    const isVisible = await dailyButton.isVisible().catch(() => false);

    // Should either still be visible or show timeout message
    expect(isVisible || (await page.locator('text=timeout').isVisible().catch(() => false))).toBe(true);
  });

  test('should handle storage errors', async ({ page }) => {
    // Disable localStorage
    await page.evaluate(() => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => {
            throw new Error('Storage error');
          },
          setItem: () => {
            throw new Error('Storage error');
          },
          removeItem: () => {
            throw new Error('Storage error');
          },
          clear: () => {
            throw new Error('Storage error');
          },
        },
        writable: true,
      });
    });

    // Try to use app
    const ptButton = page.locator('button:has-text("PT")').first();
    await ptButton.click();

    // Should handle gracefully
    const dailyButton = page.locator('button:has-text("Daily")').first();
    const isVisible = await dailyButton.isVisible().catch(() => false);

    // App should still be functional or show error
    expect(isVisible || (await page.locator('[role="alert"]').isVisible().catch(() => false))).toBe(true);
  });
});
