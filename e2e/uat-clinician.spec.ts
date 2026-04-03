import { test, expect } from '@playwright/test';

const openApp = async (page: any) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
};

const selectStepCard = async (page: any, text: string) => {
  const card = page.getByRole('button', { name: new RegExp(text, 'i') });
  await expect(card).toBeVisible();
  await card.click();
  return card;
};

test.describe('UAT - clinician daily workflow @uat', () => {
  test('Physical therapist completes a daily note', async ({ page }) => {
    await openApp(page);

    // Step 1: choose discipline
    await selectStepCard(page, 'Physical Therapy');
    await page.getByRole('button', { name: /Next Step/i }).click();

    // Step 2: choose CPT code
    await selectStepCard(page, '97110');
    await page.getByRole('button', { name: /Next Step/i }).click();

    // Step 3: choose mode
    await selectStepCard(page, 'Lower Extremity');
    await page.getByRole('button', { name: /Next Step/i }).click();

    // Step 4: choose activity
    await selectStepCard(page, 'Closed Kinetic Chain');
    await page.getByRole('button', { name: /Next Step/i }).click();

    // Step 5: document type + brain dump
    await selectStepCard(page, 'Daily Note');
    await expect(page.getByText(/Clinical Brain Dump/i)).toBeVisible();
    await page.getByRole('button', { name: /Next Step/i }).click();

    // Step 6: details + generate
    await expect(page.getByRole('heading', { name: /Clinical Details/i })).toBeVisible();
    await page.getByRole('button', { name: /Generate Note/i }).click();

    await expect(page.getByRole('heading', { name: /Clinical Note/i })).toBeVisible();
    await expect(page.getByText(/Ready for Synthesis/i).first()).not.toBeVisible();
  });
});
