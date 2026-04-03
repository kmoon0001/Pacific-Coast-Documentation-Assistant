# TheraDoc Testing Guide

## Overview

This guide provides comprehensive information about testing TheraDoc, including unit tests, integration tests, and E2E tests. Our goal is to maintain >95% code coverage with high-quality, maintainable tests.

## Testing Standards

### Test Structure (AAA Pattern)

All tests should follow the Arrange-Act-Assert pattern:

```typescript
it('should do something', () => {
  // Arrange: Set up test data and mocks
  const state = createMockTherapyState({ discipline: 'PT' });

  // Act: Execute the code being tested
  const result = ClinicalKnowledgeBase.auditNote(state);

  // Assert: Verify the results
  expect(result.complianceScore).toBeGreaterThan(0);
});
```

### Test Naming

Test names should be descriptive and follow this pattern:

```typescript
// Good
it('should return compliance score between 0-100 for valid therapy state', () => {});

// Bad
it('tests audit', () => {});
```

### Test Organization

```typescript
describe('ModuleName', () => {
  describe('FeatureName', () => {
    it('should do something', () => {});
    it('should handle edge case', () => {});
  });
});
```

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run e2e

# Run E2E tests with UI
npm run e2e:ui

# Run E2E tests in debug mode
npm run e2e:debug

# Run specific test file
npx playwright test e2e/note-generation.spec.ts
```

## Test Coverage

### Coverage Targets

- **Lines**: 95%
- **Functions**: 95%
- **Branches**: 95%
- **Statements**: 95%

### Viewing Coverage

```bash
# Generate HTML coverage report
npm run test:coverage

# Open coverage report
open coverage/index.html
```

### Coverage by Module

| Module | Target | Current |
|--------|--------|---------|
| services/ | 95% | - |
| lib/ | 95% | - |
| hooks/ | 95% | - |
| components/ | 90% | - |
| contexts/ | 95% | - |

## Unit Tests

### Services

Services contain business logic and should have comprehensive unit tests.

#### Example: ClinicalKnowledgeBase Tests

```typescript
describe('ClinicalKnowledgeBase', () => {
  describe('Validation Rules', () => {
    it('should validate skilled intervention requirement', () => {
      const state = createMockTherapyState({
        documentType: 'Progress',
        skilledInterventionJustification: undefined,
      });

      const result = ClinicalKnowledgeBase.rules[0].validate(state);
      expect(result.isValid).toBe(false);
    });
  });

  describe('auditNote', () => {
    it('should return compliance score', () => {
      const state = createMockTherapyState();
      const result = ClinicalKnowledgeBase.auditNote(state);
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);
    });
  });
});
```

### Utilities

Utility functions should have tests for normal cases and edge cases.

#### Example: Security Tests

```typescript
describe('Security Module', () => {
  describe('scrubPII', () => {
    it('should scrub SSN patterns', () => {
      const text = 'Patient SSN: 123-45-6789';
      const { scrubbed, hasPII } = scrubPII(text);
      expect(scrubbed).toBe('Patient SSN: [REDACTED]');
      expect(hasPII).toBe(true);
    });

    it('should handle text without PII', () => {
      const text = 'Patient participated in therapy';
      const { scrubbed, hasPII } = scrubPII(text);
      expect(scrubbed).toBe(text);
      expect(hasPII).toBe(false);
    });
  });
});
```

## Integration Tests

### Service Integration

Test how services work together.

```typescript
describe('Note Generation Workflow', () => {
  it('should generate and audit note', async () => {
    const state = createMockTherapyState({
      discipline: 'PT',
      documentType: 'Daily',
    });

    // Generate note
    const note = await generateTherapyNote(state);
    expect(note).toBeDefined();

    // Audit note
    const auditResult = await auditNoteWithAI(note, 'Daily');
    expect(auditResult.complianceScore).toBeGreaterThan(0);
  });
});
```

### Hook Integration

Test hooks with context providers.

```typescript
describe('useTherapySession Hook', () => {
  it('should manage therapy session state', () => {
    render(
      <TherapySessionProvider>
        <TestComponent />
      </TherapySessionProvider>
    );

    // Test hook functionality
    expect(screen.getByTestId('step')).toHaveTextContent('0');
  });
});
```

## E2E Tests

### Test Structure

E2E tests verify complete user workflows.

```typescript
test('should complete full note generation workflow', async ({ page }) => {
  // Navigate to app
  await page.goto('/');

  // Select discipline
  await page.locator('button:has-text("PT")').click();

  // Select document type
  await page.locator('button:has-text("Daily")').click();

  // Navigate through steps
  const nextButton = page.locator('button:has-text("Next")');
  for (let i = 0; i < 6; i++) {
    await nextButton.click();
    await page.waitForTimeout(300);
  }

  // Generate note
  await page.locator('button:has-text("Generate")').click();
  await page.waitForTimeout(2000);

  // Verify note was generated
  const noteContent = page.locator('[data-testid="generated-note"]');
  await expect(noteContent).toBeVisible();
});
```

### E2E Test Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Wait for network requests** to complete
3. **Test user workflows** not implementation details
4. **Use page objects** for complex interactions
5. **Handle async operations** properly

## Mocking

### Mock Service Worker (MSW)

MSW is used to mock API calls in tests.

```typescript
import { server } from '../setupTests';
import { http, HttpResponse } from 'msw';

beforeEach(() => {
  server.use(
    http.post('*/models/gemini-3-flash-preview:generateContent', () => {
      return HttpResponse.json({
        text: 'Mock generated note',
      });
    })
  );
});
```

### Mocking localStorage/sessionStorage

```typescript
beforeEach(() => {
  (global.localStorage.getItem as any).mockReturnValue('[]');
  (global.localStorage.setItem as any).mockClear();
});
```

### Mocking Vitest

```typescript
import { vi } from 'vitest';

// Mock a function
const mockFn = vi.fn();

// Mock a module
vi.mock('../services/gemini', () => ({
  generateTherapyNote: vi.fn(),
}));
```

## Test Fixtures

Use fixtures for consistent test data.

```typescript
import { createMockTherapyState, mockTherapyStates } from '../__tests__/fixtures';

// Create custom fixture
const state = createMockTherapyState({
  discipline: 'PT',
  documentType: 'Daily',
});

// Use predefined fixture
const ptDaily = mockTherapyStates.ptDaily;
```

## Debugging Tests

### Debug Mode

```bash
# Run tests in debug mode
npm run test -- --inspect-brk

# Run E2E tests in debug mode
npm run e2e:debug
```

### Console Logging

```typescript
it('should debug test', () => {
  const state = createMockTherapyState();
  console.log('State:', state);
  expect(state).toBeDefined();
});
```

### Playwright Inspector

```bash
# Run E2E tests with inspector
PWDEBUG=1 npm run e2e
```

## Performance Testing

### Measuring Performance

```typescript
it('should generate note within 2 seconds', async () => {
  const start = performance.now();
  const note = await generateTherapyNote(mockTherapyStates.ptDaily);
  const duration = performance.now() - start;

  expect(duration).toBeLessThan(2000);
  expect(note).toBeDefined();
});
```

### Load Testing

```bash
# Run load tests (if configured)
npm run test:load
```

## Accessibility Testing

### Axe Testing

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

## Continuous Integration

### GitHub Actions

Tests run automatically on:
- Push to main/develop branches
- Pull requests

### Coverage Requirements

- Minimum 95% coverage required
- Coverage reports uploaded to Codecov
- Failed tests block merge

## Test Maintenance

### Updating Tests

When code changes:
1. Update corresponding tests
2. Ensure coverage remains >95%
3. Run full test suite
4. Update snapshots if needed

### Removing Tests

Only remove tests when:
1. Feature is removed
2. Test is duplicate
3. Test is no longer valid

### Refactoring Tests

Keep tests maintainable:
1. Use descriptive names
2. Follow AAA pattern
3. Extract common setup
4. Use fixtures for data

## Troubleshooting

### Common Issues

#### Tests Timing Out

```typescript
// Increase timeout for slow tests
it('should handle slow operation', async () => {
  // test code
}, 10000); // 10 second timeout
```

#### Flaky Tests

- Avoid hardcoded delays
- Use proper wait conditions
- Mock external dependencies
- Use deterministic test data

#### Memory Leaks

- Clean up after tests
- Clear mocks between tests
- Close connections properly

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Support

For testing questions or issues:
- Check existing test examples
- Review testing documentation
- Ask in team Slack channel
- Create GitHub issue if bug found
