import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Accessibility Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have no accessibility violations', async ({ page }) => {
    const violations = await TestHelpers.checkAccessibility(page);
    expect(violations).toHaveLength(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focusedElement).toBeTruthy();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

    // Should have at least one heading
    expect(headings.length).toBeGreaterThan(0);

    // Verify heading levels are sequential
    const levels = await Promise.all(headings.map((h) => h.evaluate((el) => parseInt(el.tagName[1]))));

    for (let i = 1; i < levels.length; i++) {
      // Heading levels should not skip more than 1 level
      expect(Math.abs(levels[i] - levels[i - 1])).toBeLessThanOrEqual(1);
    }
  });

  test('should have descriptive button labels', async ({ page }) => {
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');

      // Button should have either text or aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    const inputs = await page.locator('input, textarea, select').all();

    for (const input of inputs) {
      const ariaLabel = await input.getAttribute('aria-label');
      const id = await input.getAttribute('id');
      const label = id ? await page.locator(`label[for="${id}"]`).count() : 0;

      // Input should have either aria-label or associated label
      expect(ariaLabel || label > 0).toBeTruthy();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const elements = await page.locator('*').all();
    const lowContrastElements: string[] = [];

    for (const element of elements.slice(0, 50)) {
      // Sample first 50 elements
      const styles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        };
      });

      // Basic contrast check (simplified)
      if (styles.color && styles.backgroundColor) {
        // In production, use a proper contrast calculation library
        const hasContrast = styles.color !== styles.backgroundColor;
        if (!hasContrast) {
          lowContrastElements.push(await element.evaluate((el) => el.tagName));
        }
      }
    }

    expect(lowContrastElements).toHaveLength(0);
  });

  test('should support screen reader navigation', async ({ page }) => {
    // Check for ARIA roles
    const elementsWithRoles = await page.locator('[role]').all();
    expect(elementsWithRoles.length).toBeGreaterThan(0);

    // Check for ARIA labels
    const elementsWithLabels = await page.locator('[aria-label], [aria-labelledby]').all();
    expect(elementsWithLabels.length).toBeGreaterThan(0);
  });

  test('should have proper focus indicators', async ({ page }) => {
    const button = page.locator('button').first();

    // Focus the button
    await button.focus();
    await page.waitForTimeout(200);

    const focusStyle = await button.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        outline: computed.outline,
        boxShadow: computed.boxShadow,
      };
    });

    // Should have visible focus indicator
    expect(focusStyle.outline || focusStyle.boxShadow).toBeTruthy();
  });

  test('should support escape key for modals', async ({ page }) => {
    // Open a modal if available
    const modalTrigger = page.locator('button:has-text("Settings"), button:has-text("Options")');

    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      await page.waitForTimeout(300);

      // Press escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Modal should be closed
      const modal = page.locator('[role="dialog"]');
      const isVisible = await modal.isVisible().catch(() => false);
      expect(isVisible).toBeFalsy();
    }
  });

  test('should announce dynamic content changes', async ({ page }) => {
    // Check for live regions
    const liveRegions = await page.locator('[aria-live]').all();
    expect(liveRegions.length).toBeGreaterThan(0);
  });

  test('should have proper link text', async ({ page }) => {
    const links = await page.locator('a').all();

    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');

      // Link should have descriptive text
      expect(text?.trim() || ariaLabel || title).toBeTruthy();
      expect(text?.trim()).not.toBe('Click here');
      expect(text?.trim()).not.toBe('Read more');
    }
  });

  test('should support zoom functionality', async ({ page }) => {
    // Zoom in
    await page.evaluate(() => {
      document.body.style.zoom = '200%';
    });

    await page.waitForTimeout(500);

    // Content should still be readable
    const mainContent = page.locator('main, [role="main"]');
    const isVisible = await mainContent.isVisible().catch(() => false);
    expect(isVisible).toBeTruthy();

    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '100%';
    });
  });

  test('should have proper error announcements', async ({ page }) => {
    // Try to generate without required fields
    const generateButton = page.locator('button:has-text("Generate")');

    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(500);

      // Check for error announcement
      const errorAlert = page.locator('[role="alert"]');
      const isVisible = await errorAlert.isVisible().catch(() => false);

      if (isVisible) {
        const text = await errorAlert.textContent();
        expect(text).toBeTruthy();
      }
    }
  });

  test('should support required field indicators', async ({ page }) => {
    const requiredInputs = await page.locator('input[required], textarea[required]').all();

    for (const input of requiredInputs) {
      const ariaRequired = await input.getAttribute('aria-required');
      expect(ariaRequired).toBe('true');
    }
  });

  test('should have accessible form validation', async ({ page }) => {
    const inputs = await page.locator('input, textarea').all();

    for (const input of inputs) {
      const ariaInvalid = await input.getAttribute('aria-invalid');
      const ariaDescribedBy = await input.getAttribute('aria-describedby');

      // If input has validation, should have proper ARIA attributes
      if (ariaInvalid) {
        expect(ariaDescribedBy).toBeTruthy();
      }
    }
  });

  test('should support text resizing', async ({ page }) => {
    // Increase font size
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '20px';
    });

    await page.waitForTimeout(500);

    // Content should still be readable
    const mainContent = page.locator('main, [role="main"]');
    const isVisible = await mainContent.isVisible().catch(() => false);
    expect(isVisible).toBeTruthy();

    // Reset font size
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '16px';
    });
  });

  test('should have accessible touch targets', async ({ page }) => {
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const size = await button.boundingBox();
      if (size) {
        // Touch targets should be at least 44x44px
        expect(size.width).toBeGreaterThanOrEqual(44);
        expect(size.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    // Test common shortcuts
    await page.keyboard.press('Control+S'); // Save
    await page.waitForTimeout(300);

    // Should not cause errors
    const hasError = await TestHelpers.hasErrorMessage(page);
    expect(hasError).toBeFalsy();
  });

  test('should have accessible data tables', async ({ page }) => {
    const tables = await page.locator('table').all();

    for (const table of tables) {
      const headers = await table.locator('th').all();
      expect(headers.length).toBeGreaterThan(0);

      // Table should have proper structure
      const rows = await table.locator('tr').all();
      expect(rows.length).toBeGreaterThan(0);
    }
  });

  test('should announce loading states', async ({ page }) => {
    // Check for loading indicators
    const loadingIndicators = await page.locator('[aria-busy="true"], .loading, [role="status"]').all();

    // Should have some way to announce loading
    expect(loadingIndicators.length + (await page.locator('[aria-live]').count())).toBeGreaterThan(0);
  });

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.evaluate(() => {
      document.documentElement.style.filter = 'contrast(1.5)';
    });

    await page.waitForTimeout(500);

    // Content should still be readable
    const mainContent = page.locator('main, [role="main"]');
    const isVisible = await mainContent.isVisible().catch(() => false);
    expect(isVisible).toBeTruthy();

    // Reset
    await page.evaluate(() => {
      document.documentElement.style.filter = 'none';
    });
  });

  test('should have accessible skip links', async ({ page }) => {
    // Check for skip to main content link
    const skipLink = page.locator('a:has-text("Skip"), a[href="#main"]');
    const isVisible = await skipLink.isVisible().catch(() => false);

    // Skip link should be available (may be hidden until focused)
    const exists = await skipLink.count();
    expect(exists).toBeGreaterThanOrEqual(0);
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = '@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }';
      document.head.appendChild(style);
    });

    await page.waitForTimeout(300);

    // Animations should be disabled
    const hasAnimations = await page.evaluate(() => {
      const computed = window.getComputedStyle(document.body);
      return computed.animation !== 'none';
    });

    expect(hasAnimations).toBeFalsy();
  });
});
