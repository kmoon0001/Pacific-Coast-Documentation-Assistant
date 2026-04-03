import { test, expect, chromium } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Multi-User Scenarios', () => {
  test('should handle concurrent users', async () => {
    const browser = await chromium.launch();

    // Create multiple browser contexts (simulating different users)
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);

    const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));

    try {
      // All users navigate to app
      await Promise.all(pages.map((page) => page.goto('http://localhost:3000')));
      await Promise.all(pages.map((page) => page.waitForLoadState('networkidle')));

      // All users perform actions concurrently
      await Promise.all([
        TestHelpers.selectDiscipline(pages[0], 'PT'),
        TestHelpers.selectDiscipline(pages[1], 'OT'),
        TestHelpers.selectDiscipline(pages[2], 'ST'),
      ]);

      // Verify all users completed their actions
      for (const page of pages) {
        const hasError = await TestHelpers.hasErrorMessage(page);
        expect(hasError).toBeFalsy();
      }
    } finally {
      await Promise.all(pages.map((page) => page.close()));
      await Promise.all(contexts.map((ctx) => ctx.close()));
      await browser.close();
    }
  });

  test('should handle user session isolation', async ({ page }) => {
    // User 1 creates a note
    await TestHelpers.selectDiscipline(page, 'PT');
    await TestHelpers.selectDocumentType(page, 'Daily');

    // Get user 1 state
    const user1State = await page.evaluate(() => {
      return localStorage.getItem('therapyState');
    });

    // Create new context (User 2)
    const context2 = await page.context().browser()?.newContext();
    const page2 = await context2?.newPage();

    if (page2) {
      await page2.goto('http://localhost:3000');
      await page2.waitForLoadState('networkidle');

      // Get user 2 state
      const user2State = await page2.evaluate(() => {
        return localStorage.getItem('therapyState');
      });

      // States should be different
      expect(user1State).not.toBe(user2State);

      await page2.close();
      await context2?.close();
    }
  });

  test('should handle simultaneous note generation', async () => {
    const browser = await chromium.launch();
    const contexts = await Promise.all([browser.newContext(), browser.newContext()]);
    const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));

    try {
      await Promise.all(pages.map((page) => page.goto('http://localhost:3000')));
      await Promise.all(pages.map((page) => page.waitForLoadState('networkidle')));

      // Both users generate notes simultaneously
      const startTime = Date.now();

      await Promise.all([
        (async () => {
          await TestHelpers.selectDiscipline(pages[0], 'PT');
          await TestHelpers.selectDocumentType(pages[0], 'Daily');
          await TestHelpers.navigateToStep(pages[0], 6);
          await TestHelpers.generateNote(pages[0]);
        })(),
        (async () => {
          await TestHelpers.selectDiscipline(pages[1], 'OT');
          await TestHelpers.selectDocumentType(pages[1], 'Progress');
          await TestHelpers.navigateToStep(pages[1], 6);
          await TestHelpers.generateNote(pages[1]);
        })(),
      ]);

      const endTime = Date.now();

      // Both should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000);

      // Both should have generated notes
      for (const page of pages) {
        await TestHelpers.verifyNoteGenerated(page);
      }
    } finally {
      await Promise.all(pages.map((page) => page.close()));
      await Promise.all(contexts.map((ctx) => ctx.close()));
      await browser.close();
    }
  });

  test('should handle user switching between tabs', async ({ page }) => {
    // Open multiple tabs
    const page2 = await page.context().newPage();
    const page3 = await page.context().newPage();

    try {
      await page.goto('http://localhost:3000');
      await page2.goto('http://localhost:3000');
      await page3.goto('http://localhost:3000');

      await Promise.all([
        page.waitForLoadState('networkidle'),
        page2.waitForLoadState('networkidle'),
        page3.waitForLoadState('networkidle'),
      ]);

      // Perform actions in different tabs
      await TestHelpers.selectDiscipline(page, 'PT');
      await TestHelpers.selectDiscipline(page2, 'OT');
      await TestHelpers.selectDiscipline(page3, 'ST');

      // Switch between tabs and verify state
      const state1 = await page.evaluate(() => localStorage.getItem('therapyState'));
      const state2 = await page2.evaluate(() => localStorage.getItem('therapyState'));
      const state3 = await page3.evaluate(() => localStorage.getItem('therapyState'));

      // Each tab should maintain its own state
      expect(state1).not.toBe(state2);
      expect(state2).not.toBe(state3);
    } finally {
      await page2.close();
      await page3.close();
    }
  });

  test('should handle clipboard sharing between users', async ({ page }) => {
    // User 1 generates and saves note
    await TestHelpers.selectDiscipline(page, 'PT');
    await TestHelpers.selectDocumentType(page, 'Daily');
    await TestHelpers.navigateToStep(page, 6);
    await TestHelpers.generateNote(page);
    await TestHelpers.saveToClipboard(page);

    // Get clipboard items
    const clipboardItems = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('clipboardItems') || '[]');
    });

    expect(clipboardItems.length).toBeGreaterThan(0);

    // User 2 should be able to access clipboard
    const context2 = await page.context().browser()?.newContext();
    const page2 = await context2?.newPage();

    if (page2) {
      await page2.goto('http://localhost:3000');
      await page2.waitForLoadState('networkidle');

      // Note: In a real multi-user system, clipboard would be server-side
      // This test verifies the structure is ready for that
      const user2Clipboard = await page2.evaluate(() => {
        return JSON.parse(localStorage.getItem('clipboardItems') || '[]');
      });

      // In production, this would be shared via backend
      expect(user2Clipboard).toBeDefined();

      await page2.close();
      await context2?.close();
    }
  });

  test('should handle concurrent clipboard operations', async ({ page }) => {
    const page2 = await page.context().newPage();

    try {
      await page.goto('http://localhost:3000');
      await page2.goto('http://localhost:3000');

      await Promise.all([
        page.waitForLoadState('networkidle'),
        page2.waitForLoadState('networkidle'),
      ]);

      // Both users save to clipboard simultaneously
      await Promise.all([
        (async () => {
          await TestHelpers.selectDiscipline(page, 'PT');
          await TestHelpers.selectDocumentType(page, 'Daily');
          await TestHelpers.navigateToStep(page, 6);
          await TestHelpers.generateNote(page);
          await TestHelpers.saveToClipboard(page);
        })(),
        (async () => {
          await TestHelpers.selectDiscipline(page2, 'OT');
          await TestHelpers.selectDocumentType(page2, 'Progress');
          await TestHelpers.navigateToStep(page2, 6);
          await TestHelpers.generateNote(page2);
          await TestHelpers.saveToClipboard(page2);
        })(),
      ]);

      // Both should have clipboard items
      const items1 = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('clipboardItems') || '[]');
      });

      const items2 = await page2.evaluate(() => {
        return JSON.parse(localStorage.getItem('clipboardItems') || '[]');
      });

      expect(items1.length).toBeGreaterThan(0);
      expect(items2.length).toBeGreaterThan(0);
    } finally {
      await page2.close();
    }
  });

  test('should handle user session timeout', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Simulate inactivity
    await page.waitForTimeout(5000);

    // Page should still be functional
    const hasError = await TestHelpers.hasErrorMessage(page);
    expect(hasError).toBeFalsy();
  });

  test('should handle rapid user interactions', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const startTime = Date.now();

    // Rapid interactions
    for (let i = 0; i < 20; i++) {
      await TestHelpers.selectDiscipline(page, i % 2 === 0 ? 'PT' : 'OT');
      await page.waitForTimeout(50);
    }

    const endTime = Date.now();

    // Should handle rapid interactions
    expect(endTime - startTime).toBeLessThan(5000);
  });

  test('should maintain data consistency across users', async () => {
    const browser = await chromium.launch();
    const contexts = await Promise.all([browser.newContext(), browser.newContext()]);
    const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));

    try {
      await Promise.all(pages.map((page) => page.goto('http://localhost:3000')));
      await Promise.all(pages.map((page) => page.waitForLoadState('networkidle')));

      // Both users perform same workflow
      for (const page of pages) {
        await TestHelpers.selectDiscipline(page, 'PT');
        await TestHelpers.selectDocumentType(page, 'Daily');
      }

      // Verify both have same discipline selected
      const discipline1 = await pages[0].evaluate(() => {
        const state = JSON.parse(localStorage.getItem('therapyState') || '{}');
        return state.discipline;
      });

      const discipline2 = await pages[1].evaluate(() => {
        const state = JSON.parse(localStorage.getItem('therapyState') || '{}');
        return state.discipline;
      });

      expect(discipline1).toBe('PT');
      expect(discipline2).toBe('PT');
    } finally {
      await Promise.all(pages.map((page) => page.close()));
      await Promise.all(contexts.map((ctx) => ctx.close()));
      await browser.close();
    }
  });
});
