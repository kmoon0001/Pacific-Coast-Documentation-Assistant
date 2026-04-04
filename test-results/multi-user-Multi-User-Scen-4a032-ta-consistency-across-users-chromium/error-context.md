# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: multi-user.spec.ts >> Multi-User Scenarios >> should maintain data consistency across users
- Location: e2e\multi-user.spec.ts:263:3

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
  174 |       // This test verifies the structure is ready for that
  175 |       const user2Clipboard = await page2.evaluate(() => {
  176 |         return JSON.parse(localStorage.getItem('clipboardItems') || '[]');
  177 |       });
  178 | 
  179 |       // In production, this would be shared via backend
  180 |       expect(user2Clipboard).toBeDefined();
  181 | 
  182 |       await page2.close();
  183 |       await context2?.close();
  184 |     }
  185 |   });
  186 | 
  187 |   test('should handle concurrent clipboard operations', async ({ page }) => {
  188 |     const page2 = await page.context().newPage();
  189 | 
  190 |     try {
  191 |       await page.goto('http://localhost:3000');
  192 |       await page2.goto('http://localhost:3000');
  193 | 
  194 |       await Promise.all([
  195 |         page.waitForLoadState('networkidle'),
  196 |         page2.waitForLoadState('networkidle'),
  197 |       ]);
  198 | 
  199 |       // Both users save to clipboard simultaneously
  200 |       await Promise.all([
  201 |         (async () => {
  202 |           await TestHelpers.selectDiscipline(page, 'PT');
  203 |           await TestHelpers.selectDocumentType(page, 'Daily');
  204 |           await TestHelpers.navigateToStep(page, 6);
  205 |           await TestHelpers.generateNote(page);
  206 |           await TestHelpers.saveToClipboard(page);
  207 |         })(),
  208 |         (async () => {
  209 |           await TestHelpers.selectDiscipline(page2, 'OT');
  210 |           await TestHelpers.selectDocumentType(page2, 'Progress');
  211 |           await TestHelpers.navigateToStep(page2, 6);
  212 |           await TestHelpers.generateNote(page2);
  213 |           await TestHelpers.saveToClipboard(page2);
  214 |         })(),
  215 |       ]);
  216 | 
  217 |       // Both should have clipboard items
  218 |       const items1 = await page.evaluate(() => {
  219 |         return JSON.parse(localStorage.getItem('clipboardItems') || '[]');
  220 |       });
  221 | 
  222 |       const items2 = await page2.evaluate(() => {
  223 |         return JSON.parse(localStorage.getItem('clipboardItems') || '[]');
  224 |       });
  225 | 
  226 |       expect(items1.length).toBeGreaterThan(0);
  227 |       expect(items2.length).toBeGreaterThan(0);
  228 |     } finally {
  229 |       await page2.close();
  230 |     }
  231 |   });
  232 | 
  233 |   test('should handle user session timeout', async ({ page }) => {
  234 |     await page.goto('http://localhost:3000');
  235 |     await page.waitForLoadState('networkidle');
  236 | 
  237 |     // Simulate inactivity
  238 |     await page.waitForTimeout(5000);
  239 | 
  240 |     // Page should still be functional
  241 |     const hasError = await TestHelpers.hasErrorMessage(page);
  242 |     expect(hasError).toBeFalsy();
  243 |   });
  244 | 
  245 |   test('should handle rapid user interactions', async ({ page }) => {
  246 |     await page.goto('http://localhost:3000');
  247 |     await page.waitForLoadState('networkidle');
  248 | 
  249 |     const startTime = Date.now();
  250 | 
  251 |     // Rapid interactions
  252 |     for (let i = 0; i < 20; i++) {
  253 |       await TestHelpers.selectDiscipline(page, i % 2 === 0 ? 'PT' : 'OT');
  254 |       await page.waitForTimeout(50);
  255 |     }
  256 | 
  257 |     const endTime = Date.now();
  258 | 
  259 |     // Should handle rapid interactions
  260 |     expect(endTime - startTime).toBeLessThan(5000);
  261 |   });
  262 | 
  263 |   test('should maintain data consistency across users', async () => {
> 264 |     const browser = await chromium.launch();
      |                                    ^ Error: browserType.launch: Executable doesn't exist at C:\Users\kevin\AppData\Local\ms-playwright\chromium_headless_shell-1217\chrome-headless-shell-win64\chrome-headless-shell.exe
  265 |     const contexts = await Promise.all([browser.newContext(), browser.newContext()]);
  266 |     const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));
  267 | 
  268 |     try {
  269 |       await Promise.all(pages.map((page) => page.goto('http://localhost:3000')));
  270 |       await Promise.all(pages.map((page) => page.waitForLoadState('networkidle')));
  271 | 
  272 |       // Both users perform same workflow
  273 |       for (const page of pages) {
  274 |         await TestHelpers.selectDiscipline(page, 'PT');
  275 |         await TestHelpers.selectDocumentType(page, 'Daily');
  276 |       }
  277 | 
  278 |       // Verify both have same discipline selected
  279 |       const discipline1 = await pages[0].evaluate(() => {
  280 |         const state = JSON.parse(localStorage.getItem('therapyState') || '{}');
  281 |         return state.discipline;
  282 |       });
  283 | 
  284 |       const discipline2 = await pages[1].evaluate(() => {
  285 |         const state = JSON.parse(localStorage.getItem('therapyState') || '{}');
  286 |         return state.discipline;
  287 |       });
  288 | 
  289 |       expect(discipline1).toBe('PT');
  290 |       expect(discipline2).toBe('PT');
  291 |     } finally {
  292 |       await Promise.all(pages.map((page) => page.close()));
  293 |       await Promise.all(contexts.map((ctx) => ctx.close()));
  294 |       await browser.close();
  295 |     }
  296 |   });
  297 | });
  298 | 
```