import { Page, expect } from '@playwright/test';

/**
 * E2E Test Utilities and Helpers
 * Provides reusable functions for common E2E test operations
 */

export class TestHelpers {
  /**
   * Navigate through therapy steps
   */
  static async navigateToStep(page: Page, stepNumber: number): Promise<void> {
    const nextButton = page.locator('button:has-text("Next")');
    for (let i = 0; i < stepNumber; i++) {
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(300);
      }
    }
  }

  /**
   * Select discipline (PT, OT, ST)
   */
  static async selectDiscipline(page: Page, discipline: 'PT' | 'OT' | 'ST'): Promise<void> {
    const button = page.locator(`button:has-text("${discipline}")`).first();
    await expect(button).toBeVisible();
    await button.click();
    await page.waitForTimeout(300);
  }

  /**
   * Select document type
   */
  static async selectDocumentType(
    page: Page,
    type: 'Daily' | 'Progress' | 'Assessment' | 'Discharge'
  ): Promise<void> {
    const button = page.locator(`button:has-text("${type}")`).first();
    await expect(button).toBeVisible();
    await button.click();
    await page.waitForTimeout(300);
  }

  /**
   * Fill brain dump input
   */
  static async fillBrainDump(page: Page, text: string): Promise<void> {
    const input = page.locator('textarea[placeholder*="brain"], textarea[placeholder*="Brain"]');
    if (await input.isVisible()) {
      await input.fill(text);
      await page.waitForTimeout(300);
    }
  }

  /**
   * Generate note
   */
  static async generateNote(page: Page): Promise<void> {
    const generateButton = page.locator('button:has-text("Generate")');
    await expect(generateButton).toBeVisible();
    await generateButton.click();
    await page.waitForTimeout(2000);
  }

  /**
   * Verify note was generated
   */
  static async verifyNoteGenerated(page: Page): Promise<void> {
    const noteContent = page.locator('[data-testid="generated-note"]');
    await expect(noteContent).toBeVisible();
  }

  /**
   * Get compliance score
   */
  static async getComplianceScore(page: Page): Promise<number | null> {
    const scoreElement = page.locator('[data-testid="compliance-score"]');
    if (await scoreElement.isVisible()) {
      const text = await scoreElement.textContent();
      const match = text?.match(/\d+/);
      return match ? parseInt(match[0]) : null;
    }
    return null;
  }

  /**
   * Save to clipboard
   */
  static async saveToClipboard(page: Page): Promise<void> {
    const clipboardButton = page.locator('button:has-text("Clipboard"), button:has-text("Save")');
    if (await clipboardButton.isVisible()) {
      await clipboardButton.click();
      await page.waitForTimeout(500);
    }
  }

  /**
   * Toggle local mode
   */
  static async toggleLocalMode(page: Page): Promise<boolean> {
    const toggle = page.locator('button:has-text("Local Mode"), [role="switch"]');
    if (await toggle.isVisible()) {
      const initialState = await toggle.getAttribute('aria-pressed');
      await toggle.click();
      await page.waitForTimeout(500);
      return initialState !== 'true';
    }
    return false;
  }

  /**
   * Navigate back
   */
  static async navigateBack(page: Page): Promise<void> {
    const backButton = page.locator('button:has-text("Back")');
    if (await backButton.isVisible()) {
      await backButton.click();
      await page.waitForTimeout(300);
    }
  }

  /**
   * Get current step number
   */
  static async getCurrentStep(page: Page): Promise<number | null> {
    const stepIndicator = page.locator('[data-testid="step-indicator"]');
    if (await stepIndicator.isVisible()) {
      const text = await stepIndicator.textContent();
      const match = text?.match(/\d+/);
      return match ? parseInt(match[0]) : null;
    }
    return null;
  }

  /**
   * Wait for element to be stable (not animating)
   */
  static async waitForStable(page: Page, selector: string, timeout = 5000): Promise<void> {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    await page.waitForTimeout(300); // Wait for animations
  }

  /**
   * Measure performance metric
   */
  static async measureMetric(page: Page, metricName: string): Promise<number> {
    const metric = await page.evaluate((name) => {
      const entries = performance.getEntriesByName(name);
      return entries.length > 0 ? entries[0].duration : 0;
    }, metricName);
    return metric;
  }

  /**
   * Get all performance metrics
   */
  static async getPerformanceMetrics(page: Page): Promise<Record<string, number>> {
    return await page.evaluate(() => {
      const metrics: Record<string, number> = {};
      const entries = performance.getEntries();
      entries.forEach((entry) => {
        if ('duration' in entry) {
          metrics[entry.name] = (entry as PerformanceEntry & { duration: number }).duration;
        }
      });
      return metrics;
    });
  }

  /**
   * Check accessibility violations
   */
  static async checkAccessibility(page: Page): Promise<string[]> {
    const violations: string[] = [];
    try {
      await page.addScriptTag({
        url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js',
      });

      const results = await page.evaluate(async () => {
        return await (window as any).axe.run();
      });

      results.violations.forEach((violation: any) => {
        violations.push(`${violation.id}: ${violation.description}`);
      });
    } catch (error) {
      console.error('Accessibility check failed:', error);
    }
    return violations;
  }

  /**
   * Simulate network latency
   */
  static async simulateNetworkLatency(page: Page, latencyMs: number): Promise<void> {
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: latencyMs,
    });
  }

  /**
   * Simulate slow network
   */
  static async simulateSlowNetwork(page: Page): Promise<void> {
    await this.simulateNetworkLatency(page, 500);
  }

  /**
   * Simulate offline mode
   */
  static async simulateOffline(page: Page): Promise<void> {
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: true,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });
  }

  /**
   * Restore network
   */
  static async restoreNetwork(page: Page): Promise<void> {
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });
  }

  /**
   * Get memory usage
   */
  static async getMemoryUsage(page: Page): Promise<number> {
    return await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
  }

  /**
   * Wait for network idle
   */
  static async waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Take performance snapshot
   */
  static async takePerformanceSnapshot(page: Page): Promise<PerformanceSnapshot> {
    const metrics = await this.getPerformanceMetrics(page);
    const memory = await this.getMemoryUsage(page);

    return {
      timestamp: Date.now(),
      metrics,
      memory,
    };
  }

  /**
   * Compare performance snapshots
   */
  static compareSnapshots(
    before: PerformanceSnapshot,
    after: PerformanceSnapshot
  ): PerformanceComparison {
    const metricDifferences: Record<string, number> = {};
    const memoryDifference = after.memory - before.memory;

    Object.keys(after.metrics).forEach((key) => {
      const beforeValue = before.metrics[key] || 0;
      const afterValue = after.metrics[key] || 0;
      metricDifferences[key] = afterValue - beforeValue;
    });

    return {
      metricDifferences,
      memoryDifference,
      duration: after.timestamp - before.timestamp,
    };
  }

  /**
   * Fill form field
   */
  static async fillFormField(page: Page, label: string, value: string): Promise<void> {
    const input = page.locator(`input[aria-label*="${label}"], textarea[aria-label*="${label}"]`);
    if (await input.isVisible()) {
      await input.fill(value);
      await page.waitForTimeout(200);
    }
  }

  /**
   * Select dropdown option
   */
  static async selectDropdownOption(page: Page, label: string, option: string): Promise<void> {
    const select = page.locator(`select[aria-label*="${label}"]`);
    if (await select.isVisible()) {
      await select.selectOption(option);
      await page.waitForTimeout(200);
    }
  }

  /**
   * Check for error message
   */
  static async hasErrorMessage(page: Page): Promise<boolean> {
    const errorElement = page.locator('[role="alert"], .error, .error-message');
    return await errorElement.isVisible();
  }

  /**
   * Get error message text
   */
  static async getErrorMessage(page: Page): Promise<string | null> {
    const errorElement = page.locator('[role="alert"], .error, .error-message');
    if (await errorElement.isVisible()) {
      return await errorElement.textContent();
    }
    return null;
  }

  /**
   * Wait for success message
   */
  static async waitForSuccessMessage(page: Page, timeout = 5000): Promise<boolean> {
    try {
      await page.locator('text=Success, text=Saved, text=Complete').first().waitFor({ timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scroll to element
   */
  static async scrollToElement(page: Page, selector: string): Promise<void> {
    const element = page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
  }

  /**
   * Get element text
   */
  static async getElementText(page: Page, selector: string): Promise<string | null> {
    const element = page.locator(selector);
    if (await element.isVisible()) {
      return await element.textContent();
    }
    return null;
  }

  /**
   * Click element if visible
   */
  static async clickIfVisible(page: Page, selector: string): Promise<boolean> {
    const element = page.locator(selector);
    if (await element.isVisible()) {
      await element.click();
      return true;
    }
    return false;
  }

  /**
   * Wait for element count
   */
  static async waitForElementCount(
    page: Page,
    selector: string,
    count: number,
    timeout = 5000
  ): Promise<void> {
    await page.locator(selector).nth(count - 1).waitFor({ timeout });
  }
}

export interface PerformanceSnapshot {
  timestamp: number;
  metrics: Record<string, number>;
  memory: number;
}

export interface PerformanceComparison {
  metricDifferences: Record<string, number>;
  memoryDifference: number;
  duration: number;
}
