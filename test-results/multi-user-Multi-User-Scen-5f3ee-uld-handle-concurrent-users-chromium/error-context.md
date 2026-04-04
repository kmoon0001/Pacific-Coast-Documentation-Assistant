# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: multi-user.spec.ts >> Multi-User Scenarios >> should handle concurrent users
- Location: e2e\multi-user.spec.ts:5:3

# Error details

```
Error: browserType.launch: Executable doesn't exist at C:\Users\kevin\AppData\Local\ms-playwright\chromium_headless_shell-1217\chrome-headless-shell-win64\chrome-headless-shell.exe
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```

# Test source

```ts
  1   | import { test, expect, chromium } from '@playwright/test';
  2   | import { TestHelpers } from './utils/test-helpers';
  3   | 
  4   | test.describe('Multi-User Scenarios', () => {
  5   |   test('should handle concurrent users', async () => {
> 6   |     const browser = await chromium.launch();
      |                                    ^ Error: browserType.launch: Executable doesn't exist at C:\Users\kevin\AppData\Local\ms-playwright\chromium_headless_shell-1217\chrome-headless-shell-win64\chrome-headless-shell.exe
  7   | 
  8   |     // Create multiple browser contexts (simulating different users)
  9   |     const contexts = await Promise.all([
  10  |       browser.newContext(),
  11  |       browser.newContext(),
  12  |       browser.newContext(),
  13  |     ]);
  14  | 
  15  |     const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));
  16  | 
  17  |     try {
  18  |       // All users navigate to app
  19  |       await Promise.all(pages.map((page) => page.goto('http://localhost:3000')));
  20  |       await Promise.all(pages.map((page) => page.waitForLoadState('networkidle')));
  21  | 
  22  |       // All users perform actions concurrently
  23  |       await Promise.all([
  24  |         TestHelpers.selectDiscipline(pages[0], 'PT'),
  25  |         TestHelpers.selectDiscipline(pages[1], 'OT'),
  26  |         TestHelpers.selectDiscipline(pages[2], 'ST'),
  27  |       ]);
  28  | 
  29  |       // Verify all users completed their actions
  30  |       for (const page of pages) {
  31  |         const hasError = await TestHelpers.hasErrorMessage(page);
  32  |         expect(hasError).toBeFalsy();
  33  |       }
  34  |     } finally {
  35  |       await Promise.all(pages.map((page) => page.close()));
  36  |       await Promise.all(contexts.map((ctx) => ctx.close()));
  37  |       await browser.close();
  38  |     }
  39  |   });
  40  | 
  41  |   test('should handle user session isolation', async ({ page }) => {
  42  |     // User 1 creates a note
  43  |     await TestHelpers.selectDiscipline(page, 'PT');
  44  |     await TestHelpers.selectDocumentType(page, 'Daily');
  45  | 
  46  |     // Get user 1 state
  47  |     const user1State = await page.evaluate(() => {
  48  |       return localStorage.getItem('therapyState');
  49  |     });
  50  | 
  51  |     // Create new context (User 2)
  52  |     const context2 = await page.context().browser()?.newContext();
  53  |     const page2 = await context2?.newPage();
  54  | 
  55  |     if (page2) {
  56  |       await page2.goto('http://localhost:3000');
  57  |       await page2.waitForLoadState('networkidle');
  58  | 
  59  |       // Get user 2 state
  60  |       const user2State = await page2.evaluate(() => {
  61  |         return localStorage.getItem('therapyState');
  62  |       });
  63  | 
  64  |       // States should be different
  65  |       expect(user1State).not.toBe(user2State);
  66  | 
  67  |       await page2.close();
  68  |       await context2?.close();
  69  |     }
  70  |   });
  71  | 
  72  |   test('should handle simultaneous note generation', async () => {
  73  |     const browser = await chromium.launch();
  74  |     const contexts = await Promise.all([browser.newContext(), browser.newContext()]);
  75  |     const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));
  76  | 
  77  |     try {
  78  |       await Promise.all(pages.map((page) => page.goto('http://localhost:3000')));
  79  |       await Promise.all(pages.map((page) => page.waitForLoadState('networkidle')));
  80  | 
  81  |       // Both users generate notes simultaneously
  82  |       const startTime = Date.now();
  83  | 
  84  |       await Promise.all([
  85  |         (async () => {
  86  |           await TestHelpers.selectDiscipline(pages[0], 'PT');
  87  |           await TestHelpers.selectDocumentType(pages[0], 'Daily');
  88  |           await TestHelpers.navigateToStep(pages[0], 6);
  89  |           await TestHelpers.generateNote(pages[0]);
  90  |         })(),
  91  |         (async () => {
  92  |           await TestHelpers.selectDiscipline(pages[1], 'OT');
  93  |           await TestHelpers.selectDocumentType(pages[1], 'Progress');
  94  |           await TestHelpers.navigateToStep(pages[1], 6);
  95  |           await TestHelpers.generateNote(pages[1]);
  96  |         })(),
  97  |       ]);
  98  | 
  99  |       const endTime = Date.now();
  100 | 
  101 |       // Both should complete within reasonable time
  102 |       expect(endTime - startTime).toBeLessThan(10000);
  103 | 
  104 |       // Both should have generated notes
  105 |       for (const page of pages) {
  106 |         await TestHelpers.verifyNoteGenerated(page);
```