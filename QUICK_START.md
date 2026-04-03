# TheraDoc Quick Start Guide

## Installation

```bash
# Clone and install
git clone https://github.com/your-org/theradoc.git
cd theradoc
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local and add GEMINI_API_KEY
```

## Development

```bash
# Start dev server (http://localhost:3000)
npm run dev

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## Testing

```bash
# Run all tests once
npm run test:run

# Run E2E tests
npm run e2e

# Run E2E tests with UI
npm run e2e:ui

# Debug E2E tests
npm run e2e:debug

# View coverage report
npm run test:coverage
open coverage/index.html
```

## Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Clean build artifacts
npm run clean
```

## Common Tasks

### Add a New Test

```typescript
// Create test file: src/services/myService.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './myService';

describe('MyService', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBeDefined();
  });
});
```

### Add a New Component

```typescript
// Create component: src/components/MyComponent.tsx
import React from 'react';

export function MyComponent() {
  return <div>My Component</div>;
}

// Create test: src/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />);
    expect(screen.getByText('My Component')).toBeInTheDocument();
  });
});
```

### Add a New Service

```typescript
// Create service: src/services/myService.ts
export async function myFunction() {
  // Implementation
}

// Create test: src/services/myService.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './myService';

describe('MyService', () => {
  it('should work', async () => {
    const result = await myFunction();
    expect(result).toBeDefined();
  });
});
```

## Project Structure

```
src/
├── components/          # React components
│   └── TherapyApp/     # Main app components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── services/           # Business logic
├── lib/                # Utilities
├── data/               # Static data
├── types/              # TypeScript types
└── __tests__/          # Tests

e2e/                    # E2E tests
.github/workflows/      # CI/CD pipelines
```

## Key Files

- `src/types/index.ts` - Type definitions
- `src/services/gemini.ts` - Gemini API integration
- `src/services/clinicalKnowledgeBase.ts` - Compliance rules
- `src/lib/validation.ts` - Zod schemas
- `src/lib/security.ts` - PII scrubbing
- `src/lib/logger.ts` - Structured logging

## Environment Variables

```env
# Required
GEMINI_API_KEY=your-api-key

# Optional
APP_URL=http://localhost:3000
LOG_LEVEL=debug
ENABLE_LOCAL_MODE=true
```

## Debugging

### Browser DevTools
- Open DevTools: F12 or Cmd+Option+I
- Check Console for errors
- Use React DevTools extension

### VS Code Debugging
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### Test Debugging
```bash
# Debug tests
npm run test -- --inspect-brk

# Debug E2E tests
PWDEBUG=1 npm run e2e
```

## Common Issues

### Tests Failing
```bash
# Clear cache and reinstall
npm run clean
rm -rf node_modules
npm install
npm run test:run
```

### Build Errors
```bash
# Check TypeScript errors
npm run type-check

# Check ESLint errors
npm run lint

# Fix formatting
npm run format
```

### API Key Issues
```bash
# Verify API key is set
echo $GEMINI_API_KEY

# Check .env.local file
cat .env.local

# Verify API is enabled in Google Cloud Console
```

## Performance Tips

- Use React DevTools Profiler to identify slow components
- Check Network tab for slow API calls
- Use `npm run test:coverage` to find untested code
- Monitor bundle size with `npm run build`

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add feature"

# Push and create PR
git push origin feature/my-feature

# After review, merge to main
git checkout main
git pull
git merge feature/my-feature
git push
```

## Pre-commit Hooks

Husky automatically runs:
- ESLint on staged files
- Prettier formatting
- Tests (if configured)

To bypass: `git commit --no-verify`

## Useful Commands

```bash
# View test coverage
npm run test:coverage

# Run specific test file
npm run test -- src/lib/security.test.ts

# Run tests matching pattern
npm run test -- --grep "should scrub"

# Update snapshots
npm run test -- -u

# Run E2E test in headed mode
npm run e2e -- --headed

# Run single E2E test
npx playwright test e2e/note-generation.spec.ts
```

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [TESTING.md](./TESTING.md) - Testing guide
- [README.md](./README.md) - Project overview
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Checklist

## Support

- **Issues**: Create GitHub issue
- **Questions**: Ask in team Slack
- **Security**: Email security@example.com
- **Docs**: See README.md and guides

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

---

**Happy coding!** 🚀
