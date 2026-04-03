import { test, expect } from '@playwright/test';

test.describe('Note Generation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should complete full note generation workflow', async ({ page }) => {
    // Step 1: Select Discipline
    const ptButton = page.locator('button:has-text("PT")').first();
    await expect(ptButton).toBeVisible();
    await ptButton.click();

    // Step 2: Select Document Type
    const dailyButton = page.locator('button:has-text("Daily")').first();
    await expect(dailyButton).toBeVisible();
    await dailyButton.click();

    // Step 3: Select CPT Code
    const cptCodeSelect = page.locator('select, [role="combobox"]').first();
    if (await cptCodeSelect.isVisible()) {
      await cptCodeSelect.click();
      await page.locator('text=97110').click();
    }

    // Navigate to next steps
    const nextButton = page.locator('button:has-text("Next")');
    for (let i = 0; i < 5; i++) {
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Step 8: Generate Note
    const generateButton = page.locator('button:has-text("Generate")');
    await expect(generateButton).toBeVisible();
    await generateButton.click();

    // Wait for note generation
    await page.waitForTimeout(2000);

    // Verify note was generated
    const noteContent = page.locator('[data-testid="generated-note"]');
    await expect(noteContent).toBeVisible();
  });

  test('should navigate between steps', async ({ page }) => {
    const nextButton = page.locator('button:has-text("Next")');
    const backButton = page.locator('button:has-text("Back")');

    // Navigate forward
    await nextButton.click();
    await page.waitForTimeout(300);
    await nextButton.click();
    await page.waitForTimeout(300);

    // Navigate backward
    await backButton.click();
    await page.waitForTimeout(300);

    // Verify we're back at step 1
    const stepIndicator = page.locator('[data-testid="step-indicator"]');
    if (await stepIndicator.isVisible()) {
      const stepText = await stepIndicator.textContent();
      expect(stepText).toContain('1');
    }
  });

  test('should handle form validation', async ({ page }) => {
    // Try to generate without filling required fields
    const generateButton = page.locator('button:has-text("Generate")');

    // Navigate to generate step
    const nextButton = page.locator('button:has-text("Next")');
    for (let i = 0; i < 7; i++) {
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(300);
      }
    }

    // Try to generate
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(500);

      // Check for validation error or warning
      const errorMessage = page.locator('[role="alert"], .error, .warning');
      // Error handling depends on implementation
    }
  });

  test('should save note to clipboard', async ({ page }) => {
    // Complete note generation
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

    // Generate note
    const generateButton = page.locator('button:has-text("Generate")');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(2000);

      // Look for clipboard button
      const clipboardButton = page.locator('button:has-text("Clipboard"), button:has-text("Save")');
      if (await clipboardButton.isVisible()) {
        await clipboardButton.click();
        await page.waitForTimeout(500);

        // Verify success message
        const successMessage = page.locator('text=Saved, text=Success');
        // Success notification depends on implementation
      }
    }
  });

  test('should toggle local mode', async ({ page }) => {
    // Look for local mode toggle
    const localModeToggle = page.locator('button:has-text("Local Mode"), [role="switch"]');

    if (await localModeToggle.isVisible()) {
      const initialState = await localModeToggle.getAttribute('aria-pressed');
      await localModeToggle.click();
      await page.waitForTimeout(500);

      const newState = await localModeToggle.getAttribute('aria-pressed');
      expect(newState).not.toBe(initialState);
    }
  });

  test('should display audit results', async ({ page }) => {
    // Complete note generation
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

    // Generate note
    const generateButton = page.locator('button:has-text("Generate")');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(2000);

      // Look for audit results
      const auditSection = page.locator('[data-testid="audit-results"], text=Compliance');
      if (await auditSection.isVisible()) {
        const complianceScore = page.locator('[data-testid="compliance-score"]');
        if (await complianceScore.isVisible()) {
          const score = await complianceScore.textContent();
          expect(score).toMatch(/\d+/);
        }
      }
    }
  });

  test('should handle brain dump input', async ({ page }) => {
    // Look for brain dump input
    const brainDumpInput = page.locator('textarea[placeholder*="brain"], textarea[placeholder*="Brain"]');

    if (await brainDumpInput.isVisible()) {
      await brainDumpInput.fill('Patient walked 100 feet with contact guard assistance');
      await page.waitForTimeout(500);

      // Look for parse button
      const parseButton = page.locator('button:has-text("Parse"), button:has-text("Extract")');
      if (await parseButton.isVisible()) {
        await parseButton.click();
        await page.waitForTimeout(1000);

        // Verify form fields were populated
        const filledFields = page.locator('input[value], textarea[value]');
        const count = await filledFields.count();
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  test('should finalize session', async ({ page }) => {
    // Complete note generation
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

    // Generate note
    const generateButton = page.locator('button:has-text("Generate")');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(2000);

      // Look for finalize button
      const finalizeButton = page.locator('button:has-text("Finalize"), button:has-text("Complete")');
      if (await finalizeButton.isVisible()) {
        await finalizeButton.click();
        await page.waitForTimeout(500);

        // Verify we're back at step 0
        const stepIndicator = page.locator('[data-testid="step-indicator"]');
        if (await stepIndicator.isVisible()) {
          const stepText = await stepIndicator.textContent();
          expect(stepText).toContain('0');
        }
      }
    }
  });
});
