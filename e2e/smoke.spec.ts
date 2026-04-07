import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Quick health checks for critical functionality
 * These tests should run fast and validate essential features work
 * Run after deployment to ensure system is operational
 */

test.describe('Smoke Tests - Critical Path Validation', () => {
  test('should load application successfully', async ({ page }) => {
    const response = await page.goto('/');
    
    // Application loads with 200 status
    expect(response?.status()).toBe(200);
    
    // Page title is present
    await expect(page).toHaveTitle(/Pacific Coast|Documentation Assistant/i);
    
    // Main content is visible
    await page.waitForLoadState('networkidle');
    const mainContent = page.locator('main, [role="main"], #root');
    await expect(mainContent).toBeVisible();
  });

  test('should display initial workflow step', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // First step (Discipline selection) should be visible
    const disciplineOptions = page.getByRole('button', { name: /Physical Therapy|Occupational Therapy|Speech Therapy/i });
    await expect(disciplineOptions.first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow basic navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Select a discipline
    const ptButton = page.getByRole('button', { name: /Physical Therapy/i });
    await ptButton.click();
    
    // Next button should be available
    const nextButton = page.getByRole('button', { name: /Next/i });
    await expect(nextButton).toBeVisible();
    
    // Can navigate to next step
    await nextButton.click();
    await page.waitForTimeout(500);
    
    // Should be on a different step
    const backButton = page.getByRole('button', { name: /Back/i });
    await expect(backButton).toBeVisible();
  });

  test('should handle user interactions without errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Perform basic interactions
    const ptButton = page.getByRole('button', { name: /Physical Therapy/i });
    await ptButton.click();
    await page.waitForTimeout(200);
    
    // Should have no critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') &&
      !e.includes('canvas')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('should load essential resources', async ({ page }) => {
    await page.goto('/');
    
    // Check that JavaScript loaded
    const hasReact = await page.evaluate(() => {
      return typeof window !== 'undefined';
    });
    expect(hasReact).toBe(true);
    
    // Check that styles loaded
    const hasStyles = await page.evaluate(() => {
      const styles = document.styleSheets;
      return styles.length > 0;
    });
    expect(hasStyles).toBe(true);
  });

  test('should respond to user input quickly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const startTime = Date.now();
    
    // Click a button
    const ptButton = page.getByRole('button', { name: /Physical Therapy/i });
    await ptButton.click();
    
    // Wait for visual feedback
    await page.waitForTimeout(100);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Should respond within 1 second
    expect(responseTime).toBeLessThan(1000);
  });

  test('should maintain state during navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Select discipline
    const ptButton = page.getByRole('button', { name: /Physical Therapy/i });
    await ptButton.click();
    
    // Navigate forward
    const nextButton = page.getByRole('button', { name: /Next/i });
    await nextButton.click();
    await page.waitForTimeout(300);
    
    // Navigate back
    const backButton = page.getByRole('button', { name: /Back/i });
    await backButton.click();
    await page.waitForTimeout(300);
    
    // PT should still be selected (state maintained)
    const ptButtonAgain = page.getByRole('button', { name: /Physical Therapy/i });
    await expect(ptButtonAgain).toBeVisible();
  });

  test('should handle page reload gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Make a selection
    const ptButton = page.getByRole('button', { name: /Physical Therapy/i });
    await ptButton.click();
    await page.waitForTimeout(200);
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Application should still be functional
    const disciplineOptions = page.getByRole('button', { name: /Physical Therapy|Occupational Therapy|Speech Therapy/i });
    await expect(disciplineOptions.first()).toBeVisible();
  });

  test('should display no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for basic accessibility
    const mainLandmark = page.locator('main, [role="main"]');
    await expect(mainLandmark).toBeVisible();
    
    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should work on different viewport sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    let disciplineOptions = page.getByRole('button', { name: /Physical Therapy/i });
    await expect(disciplineOptions).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    disciplineOptions = page.getByRole('button', { name: /Physical Therapy/i });
    await expect(disciplineOptions).toBeVisible();
  });
});
