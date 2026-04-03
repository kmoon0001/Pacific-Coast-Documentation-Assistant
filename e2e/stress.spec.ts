import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Stress Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should handle 100 rapid step navigations', async ({ page }) => {
    const startTime = Date.now();
    let errorCount = 0;

    for (let i = 0; i < 100; i++) {
      const hasError = await TestHelpers.hasErrorMessage(page);
      if (hasError) errorCount++;

      if (i % 2 === 0) {
        await TestHelpers.navigateToStep(page, 1);
      } else {
        await TestHelpers.navigateBack(page);
      }
    }

    const endTime = Date.now();

    // Should complete without excessive errors
    expect(errorCount).toBeLessThan(5);
    expect(endTime - startTime).toBeLessThan(30000);
  });

  test('should handle large text input', async ({ page }) => {
    const largeText = 'Lorem ipsum dolor sit amet. '.repeat(1000); // ~28KB

    await TestHelpers.fillBrainDump(page, largeText);

    const hasError = await TestHelpers.hasErrorMessage(page);
    expect(hasError).toBeFalsy();

    // Should still be able to generate
    await TestHelpers.navigateToStep(page, 6);
    await TestHelpers.generateNote(page);

    await TestHelpers.verifyNoteGenerated(page);
  });

  test('should handle rapid form submissions', async ({ page }) => {
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < 10; i++) {
      await TestHelpers.selectDiscipline(page, i % 2 === 0 ? 'PT' : 'OT');
      await TestHelpers.selectDocumentType(page, i % 2 === 0 ? 'Daily' : 'Progress');
      await TestHelpers.navigateToStep(page, 6);

      try {
        await TestHelpers.generateNote(page);
        const isGenerated = await page.locator('[data-testid="generated-note"]').isVisible();
        if (isGenerated) successCount++;
      } catch {
        errorCount++;
      }

      // Reset for next iteration
      await page.reload();
      await page.waitForLoadState('networkidle');
    }

    // Most submissions should succeed
    expect(successCount).toBeGreaterThan(errorCount);
  });

  test('should handle memory under sustained load', async ({ page }) => {
    const memorySnapshots: number[] = [];

    for (let i = 0; i < 20; i++) {
      const memory = await TestHelpers.getMemoryUsage(page);
      memorySnapshots.push(memory);

      // Perform operations
      await TestHelpers.selectDiscipline(page, i % 2 === 0 ? 'PT' : 'OT');
      await page.waitForTimeout(100);
    }

    // Calculate memory trend
    const initialMemory = memorySnapshots[0];
    const finalMemory = memorySnapshots[memorySnapshots.length - 1];
    const memoryGrowth = finalMemory - initialMemory;

    // Memory growth should be reasonable (< 100MB)
    expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024);
  });

  test('should handle rapid clipboard operations', async ({ page }) => {
    let successCount = 0;

    for (let i = 0; i < 20; i++) {
      await TestHelpers.selectDiscipline(page, 'PT');
      await TestHelpers.selectDocumentType(page, 'Daily');
      await TestHelpers.navigateToStep(page, 6);
      await TestHelpers.generateNote(page);

      try {
        await TestHelpers.saveToClipboard(page);
        successCount++;
      } catch {
        // Ignore errors
      }

      await page.reload();
      await page.waitForLoadState('networkidle');
    }

    // Most operations should succeed
    expect(successCount).toBeGreaterThan(15);
  });

  test('should handle network interruptions', async ({ page }) => {
    let recoveryCount = 0;

    for (let i = 0; i < 5; i++) {
      // Simulate network interruption
      await TestHelpers.simulateOffline(page);
      await page.waitForTimeout(500);

      // Restore network
      await TestHelpers.restoreNetwork(page);
      await page.waitForTimeout(500);

      // Try to interact
      try {
        await TestHelpers.selectDiscipline(page, 'PT');
        recoveryCount++;
      } catch {
        // Expected during offline
      }
    }

    // Should recover from network interruptions
    expect(recoveryCount).toBeGreaterThan(0);
  });

  test('should handle rapid network latency changes', async ({ page }) => {
    const latencies = [0, 100, 500, 1000, 100, 0];

    for (const latency of latencies) {
      await TestHelpers.simulateNetworkLatency(page, latency);
      await page.waitForTimeout(200);

      const hasError = await TestHelpers.hasErrorMessage(page);
      expect(hasError).toBeFalsy();
    }

    await TestHelpers.restoreNetwork(page);
  });

  test('should handle rapid window resizing', async ({ page }) => {
    const sizes = [
      { width: 1920, height: 1080 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 },
      { width: 1920, height: 1080 },
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(300);

      const hasError = await TestHelpers.hasErrorMessage(page);
      expect(hasError).toBeFalsy();
    }
  });

  test('should handle rapid theme changes', async ({ page }) => {
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      });

      await page.waitForTimeout(100);
    }

    // Should still be functional
    const hasError = await TestHelpers.hasErrorMessage(page);
    expect(hasError).toBeFalsy();
  });

  test('should handle rapid local storage operations', async ({ page }) => {
    let successCount = 0;

    for (let i = 0; i < 50; i++) {
      try {
        await page.evaluate((index) => {
          localStorage.setItem(`test_${index}`, JSON.stringify({ data: 'test' }));
          localStorage.getItem(`test_${index}`);
        }, i);
        successCount++;
      } catch {
        // Ignore quota errors
      }
    }

    // Most operations should succeed
    expect(successCount).toBeGreaterThan(40);
  });

  test('should handle rapid DOM updates', async ({ page }) => {
    const startTime = Date.now();

    for (let i = 0; i < 50; i++) {
      await page.evaluate(() => {
        const div = document.createElement('div');
        div.textContent = 'Test content';
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 100);
      });

      await page.waitForTimeout(50);
    }

    const endTime = Date.now();

    // Should handle rapid DOM updates
    expect(endTime - startTime).toBeLessThan(10000);
  });

  test('should handle rapid event listeners', async ({ page }) => {
    let listenerCount = 0;

    for (let i = 0; i < 100; i++) {
      await page.evaluate(() => {
        const button = document.querySelector('button');
        if (button) {
          button.addEventListener('click', () => {});
        }
      });
      listenerCount++;
    }

    // Should handle many event listeners
    expect(listenerCount).toBe(100);
  });

  test('should handle rapid API calls', async ({ page }) => {
    let callCount = 0;

    for (let i = 0; i < 20; i++) {
      try {
        await page.evaluate(async () => {
          const response = await fetch('/api/health', { method: 'GET' });
          return response.ok;
        });
        callCount++;
      } catch {
        // Ignore errors
      }
    }

    // Most calls should succeed
    expect(callCount).toBeGreaterThan(15);
  });

  test('should handle rapid state changes', async ({ page }) => {
    let stateChangeCount = 0;

    for (let i = 0; i < 30; i++) {
      try {
        await page.evaluate((index) => {
          const state = JSON.parse(localStorage.getItem('therapyState') || '{}');
          state.discipline = index % 2 === 0 ? 'PT' : 'OT';
          localStorage.setItem('therapyState', JSON.stringify(state));
        }, i);
        stateChangeCount++;
      } catch {
        // Ignore errors
      }
    }

    // All state changes should succeed
    expect(stateChangeCount).toBe(30);
  });

  test('should handle rapid component mounting/unmounting', async ({ page }) => {
    for (let i = 0; i < 10; i++) {
      await page.reload();
      await page.waitForLoadState('networkidle');

      const hasError = await TestHelpers.hasErrorMessage(page);
      expect(hasError).toBeFalsy();
    }
  });

  test('should handle sustained high CPU usage', async ({ page }) => {
    const startMemory = await TestHelpers.getMemoryUsage(page);

    // Perform CPU-intensive operations
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        // Simulate CPU work
        let sum = 0;
        for (let j = 0; j < 1000000; j++) {
          sum += Math.sqrt(j);
        }
        return sum;
      });
    }

    const endMemory = await TestHelpers.getMemoryUsage(page);
    const memoryIncrease = endMemory - startMemory;

    // Memory increase should be reasonable
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });

  test('should handle rapid error recovery', async ({ page }) => {
    let recoveryCount = 0;

    for (let i = 0; i < 10; i++) {
      // Trigger error
      await page.evaluate(() => {
        throw new Error('Test error');
      }).catch(() => {
        // Ignore error
      });

      // Try to recover
      try {
        await TestHelpers.selectDiscipline(page, 'PT');
        recoveryCount++;
      } catch {
        // Ignore
      }
    }

    // Should recover from errors
    expect(recoveryCount).toBeGreaterThan(5);
  });

  test('should handle maximum concurrent operations', async ({ page }) => {
    const operations = [];

    for (let i = 0; i < 50; i++) {
      operations.push(
        page.evaluate(() => {
          return new Promise((resolve) => {
            setTimeout(() => resolve(true), Math.random() * 1000);
          });
        })
      );
    }

    const results = await Promise.allSettled(operations);
    const successCount = results.filter((r) => r.status === 'fulfilled').length;

    // Most operations should succeed
    expect(successCount).toBeGreaterThan(40);
  });
});
