# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: multi-user.spec.ts >> Multi-User Scenarios >> should handle simultaneous note generation
- Location: e2e\multi-user.spec.ts:72:3

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
  6   |     const browser = await chromium.launch();
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
> 73  |     const browser = await chromium.launch();
      |                                    ^ Error: browserType.launch: Executable doesn't exist at C:\Users\kevin\AppData\Local\ms-playwright\chromium_headless_shell-1217\chrome-headless-shell-win64\chrome-headless-shell.exe
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
  107 |       }
  108 |     } finally {
  109 |       await Promise.all(pages.map((page) => page.close()));
  110 |       await Promise.all(contexts.map((ctx) => ctx.close()));
  111 |       await browser.close();
  112 |     }
  113 |   });
  114 | 
  115 |   test('should handle user switching between tabs', async ({ page }) => {
  116 |     // Open multiple tabs
  117 |     const page2 = await page.context().newPage();
  118 |     const page3 = await page.context().newPage();
  119 | 
  120 |     try {
  121 |       await page.goto('http://localhost:3000');
  122 |       await page2.goto('http://localhost:3000');
  123 |       await page3.goto('http://localhost:3000');
  124 | 
  125 |       await Promise.all([
  126 |         page.waitForLoadState('networkidle'),
  127 |         page2.waitForLoadState('networkidle'),
  128 |         page3.waitForLoadState('networkidle'),
  129 |       ]);
  130 | 
  131 |       // Perform actions in different tabs
  132 |       await TestHelpers.selectDiscipline(page, 'PT');
  133 |       await TestHelpers.selectDiscipline(page2, 'OT');
  134 |       await TestHelpers.selectDiscipline(page3, 'ST');
  135 | 
  136 |       // Switch between tabs and verify state
  137 |       const state1 = await page.evaluate(() => localStorage.getItem('therapyState'));
  138 |       const state2 = await page2.evaluate(() => localStorage.getItem('therapyState'));
  139 |       const state3 = await page3.evaluate(() => localStorage.getItem('therapyState'));
  140 | 
  141 |       // Each tab should maintain its own state
  142 |       expect(state1).not.toBe(state2);
  143 |       expect(state2).not.toBe(state3);
  144 |     } finally {
  145 |       await page2.close();
  146 |       await page3.close();
  147 |     }
  148 |   });
  149 | 
  150 |   test('should handle clipboard sharing between users', async ({ page }) => {
  151 |     // User 1 generates and saves note
  152 |     await TestHelpers.selectDiscipline(page, 'PT');
  153 |     await TestHelpers.selectDocumentType(page, 'Daily');
  154 |     await TestHelpers.navigateToStep(page, 6);
  155 |     await TestHelpers.generateNote(page);
  156 |     await TestHelpers.saveToClipboard(page);
  157 | 
  158 |     // Get clipboard items
  159 |     const clipboardItems = await page.evaluate(() => {
  160 |       return JSON.parse(localStorage.getItem('clipboardItems') || '[]');
  161 |     });
  162 | 
  163 |     expect(clipboardItems.length).toBeGreaterThan(0);
  164 | 
  165 |     // User 2 should be able to access clipboard
  166 |     const context2 = await page.context().browser()?.newContext();
  167 |     const page2 = await context2?.newPage();
  168 | 
  169 |     if (page2) {
  170 |       await page2.goto('http://localhost:3000');
  171 |       await page2.waitForLoadState('networkidle');
  172 | 
  173 |       // Note: In a real multi-user system, clipboard would be server-side
```