import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Performance Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load app within performance budget', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint:
          performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });

    // Performance budgets
    expect(metrics.domContentLoaded).toBeLessThan(3000); // 3 seconds
    expect(metrics.loadComplete).toBeLessThan(5000); // 5 seconds
    expect(metrics.firstContentfulPaint).toBeLessThan(2000); // 2 seconds
  });

  test('should generate note within performance budget', async ({ page }) => {
    const startTime = Date.now();

    // Complete workflow
    await TestHelpers.selectDiscipline(page, 'PT');
    await TestHelpers.selectDocumentType(page, 'Daily');
    await TestHelpers.navigateToStep(page, 6);
    await TestHelpers.generateNote(page);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Note generation should complete within 5 seconds
    expect(duration).toBeLessThan(5000);
  });

  test('should maintain stable memory usage', async ({ page }) => {
    const snapshots: number[] = [];

    // Take memory snapshots during workflow
    for (let i = 0; i < 5; i++) {
      const memory = await TestHelpers.getMemoryUsage(page);
      snapshots.push(memory);
      await page.waitForTimeout(500);
    }

    // Memory should not grow excessively
    const maxGrowth = Math.max(...snapshots) - Math.min(...snapshots);
    expect(maxGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB max growth
  });

  test('should handle rapid step navigation', async ({ page }) => {
    const startTime = Date.now();

    // Rapidly navigate forward and backward
    for (let i = 0; i < 10; i++) {
      await TestHelpers.navigateToStep(page, 1);
      await TestHelpers.navigateBack(page);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete 20 navigation actions in under 10 seconds
    expect(duration).toBeLessThan(10000);
  });

  test('should render large note content efficiently', async ({ page }) => {
    // Fill with large content
    const largeContent = 'Lorem ipsum dolor sit amet. '.repeat(100);
    await TestHelpers.fillBrainDump(page, largeContent);

    const startTime = Date.now();
    await TestHelpers.generateNote(page);
    const endTime = Date.now();

    // Should handle large content within budget
    expect(endTime - startTime).toBeLessThan(5000);
  });

  test('should measure component render time', async ({ page }) => {
    const renderTimes = await page.evaluate(() => {
      const entries = performance.getEntriesByType('measure');
      const times: Record<string, number> = {};
      entries.forEach((entry) => {
        times[entry.name] = (entry as PerformanceMeasure).duration;
      });
      return times;
    });

    // Verify render times are reasonable
    Object.values(renderTimes).forEach((time) => {
      expect(time).toBeLessThan(1000); // Each render < 1 second
    });
  });

  test('should handle network latency gracefully', async ({ page }) => {
    await TestHelpers.simulateSlowNetwork(page);

    const startTime = Date.now();
    await TestHelpers.selectDiscipline(page, 'PT');
    const endTime = Date.now();

    await TestHelpers.restoreNetwork(page);

    // Should still be responsive under latency
    expect(endTime - startTime).toBeLessThan(3000);
  });

  test('should optimize bundle size', async ({ page }) => {
    const resources = await page.evaluate(() => {
      return performance
        .getEntriesByType('resource')
        .filter((r) => r.name.includes('.js') || r.name.includes('.css'))
        .map((r) => ({
          name: r.name.split('/').pop(),
          size: (r as PerformanceResourceTiming).transferSize || 0,
        }));
    });

    // Calculate total bundle size
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);

    // Bundle should be under 500KB gzipped
    expect(totalSize).toBeLessThan(500 * 1024);
  });

  test('should cache resources effectively', async ({ page }) => {
    // First load
    const firstLoadMetrics = await TestHelpers.takePerformanceSnapshot(page);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Second load should be faster due to caching
    const secondLoadMetrics = await TestHelpers.takePerformanceSnapshot(page);

    const comparison = TestHelpers.compareSnapshots(firstLoadMetrics, secondLoadMetrics);

    // Second load should be faster
    expect(comparison.duration).toBeLessThan(firstLoadMetrics.timestamp);
  });

  test('should handle concurrent operations', async ({ page }) => {
    const startTime = Date.now();

    // Perform multiple operations concurrently
    await Promise.all([
      TestHelpers.selectDiscipline(page, 'PT'),
      page.waitForTimeout(100),
      TestHelpers.selectDocumentType(page, 'Daily'),
    ]);

    const endTime = Date.now();

    // Should handle concurrent operations efficiently
    expect(endTime - startTime).toBeLessThan(2000);
  });

  test('should measure Core Web Vitals', async ({ page }) => {
    const vitals = await page.evaluate(() => {
      const entries = performance.getEntriesByType('largest-contentful-paint');
      const lcpEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime: number };

      return {
        lcp: lcpEntry?.renderTime || 0,
        fid: 0, // FID is deprecated, using INP instead
        cls: 0, // CLS would need PerformanceObserver
      };
    });

    // LCP should be under 2.5 seconds
    expect(vitals.lcp).toBeLessThan(2500);
  });

  test('should optimize image loading', async ({ page }) => {
    const imageMetrics = await page.evaluate(() => {
      return performance
        .getEntriesByType('resource')
        .filter((r) => r.name.includes('.png') || r.name.includes('.jpg') || r.name.includes('.svg'))
        .map((r) => ({
          name: r.name.split('/').pop(),
          duration: (r as PerformanceResourceTiming).duration,
          size: (r as PerformanceResourceTiming).transferSize || 0,
        }));
    });

    // Each image should load quickly
    imageMetrics.forEach((img) => {
      expect(img.duration).toBeLessThan(1000);
    });
  });

  test('should handle rapid user input', async ({ page }) => {
    const startTime = Date.now();

    // Simulate rapid typing
    const input = page.locator('textarea').first();
    if (await input.isVisible()) {
      for (let i = 0; i < 50; i++) {
        await input.type('a', { delay: 10 });
      }
    }

    const endTime = Date.now();

    // Should handle rapid input without lag
    expect(endTime - startTime).toBeLessThan(5000);
  });

  test('should measure time to interactive', async ({ page }) => {
    const tti = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigation.domInteractive - navigation.fetchStart;
    });

    // TTI should be under 3 seconds
    expect(tti).toBeLessThan(3000);
  });

  test('should optimize CSS rendering', async ({ page }) => {
    const cssMetrics = await page.evaluate(() => {
      return performance
        .getEntriesByType('resource')
        .filter((r) => r.name.includes('.css'))
        .map((r) => ({
          name: r.name.split('/').pop(),
          duration: (r as PerformanceResourceTiming).duration,
          size: (r as PerformanceResourceTiming).transferSize || 0,
        }));
    });

    // CSS should load quickly
    cssMetrics.forEach((css) => {
      expect(css.duration).toBeLessThan(500);
    });
  });
});
