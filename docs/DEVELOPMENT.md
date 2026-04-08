# Development Guide

## Table of Contents
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Testing Strategy](#testing-strategy)
- [Code Standards](#code-standards)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites
- Node.js 18+ and npm 9+
- Git
- Code editor (VS Code recommended)

### Initial Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd theradoc
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:
- `GEMINI_API_KEY` - Google Gemini API key for AI generation
- `AWS_ACCESS_KEY_ID` - AWS credentials (optional)
- `AWS_SECRET_ACCESS_KEY` - AWS credentials (optional)
- `SENTRY_DSN` - Sentry error tracking (optional)

4. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3001`

### Project Structure

```
theradoc/
├── src/
│   ├── components/        # React components
│   │   ├── TherapyApp/   # Main therapy application
│   │   ├── Tour/         # Guided tour components
│   │   └── ...
│   ├── services/         # Business logic and API calls
│   │   ├── backend.ts    # Express backend server
│   │   ├── gemini.ts     # Gemini AI integration
│   │   ├── bedrock.ts    # AWS Bedrock integration
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   │   ├── monitoring.ts # Performance monitoring
│   │   ├── webVitals.ts  # Web Vitals tracking
│   │   └── ...
│   ├── middleware/       # Express middleware
│   │   ├── security.ts   # Security headers
│   │   └── rateLimiter.ts # Rate limiting
│   ├── data/             # Static data and configurations
│   ├── types/            # TypeScript type definitions
│   └── __tests__/        # Unit and integration tests
├── e2e/                  # End-to-end tests
├── load-tests/           # Performance and load tests
├── docs/                 # Documentation
├── dist/                 # Build output
└── coverage/             # Test coverage reports
```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Emergency production fixes

### Making Changes

1. Create a feature branch:
```bash
git checkout -b feature/my-feature
```

2. Make your changes and commit:
```bash
git add .
git commit -m "feat: add new feature"
```

3. Run tests:
```bash
npm test
```

4. Push and create pull request:
```bash
git push origin feature/my-feature
```

### Commit Message Convention

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Testing Strategy

### Test Types

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test component interactions
3. **E2E Tests** - Test complete user workflows
4. **Smoke Tests** - Test critical paths
5. **UAT Tests** - User acceptance testing
6. **Load Tests** - Performance under load
7. **Stress Tests** - System limits
8. **Spike Tests** - Sudden load increases

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run smoke tests
npm run test:smoke

# Run load tests
npm run test:load

# Run stress tests
npm run test:stress

# Run spike tests
npm run test:spike
```

### Writing Tests

Example unit test:
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFunction';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

Example component test:
```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Test Coverage Goals

- Statements: >90%
- Branches: >90%
- Functions: >90%
- Lines: >90%

## Code Standards

### TypeScript

- Use strict mode
- Avoid `any` types
- Define interfaces for all data structures
- Use type inference where possible

### React

- Use functional components with hooks
- Keep components small and focused
- Use custom hooks for reusable logic
- Implement proper error boundaries

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Ensure accessibility (WCAG 2.1 AA)
- Test with screen readers

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Pre-commit Hooks

Husky runs these checks before each commit:
- Linting
- Type checking
- Unit tests (changed files only)

## Deployment

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Environment Variables

Production environment variables:
- `VITE_API_URL` - Backend API URL
- `VITE_GEMINI_API_KEY` - Gemini API key
- `VITE_SENTRY_DSN` - Sentry DSN
- `NODE_ENV=production`

### Deployment Steps

1. Run tests:
```bash
npm test
```

2. Build application:
```bash
npm run build
```

3. Test build locally:
```bash
npm run preview
```

4. Deploy to hosting platform (Vercel, Netlify, etc.)

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed deployment instructions.

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Kill process on port 3001
npx kill-port 3001
```

#### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors

```bash
# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

#### Test Failures

```bash
# Clear test cache
npm test -- --clearCache
```

### Getting Help

- Check [API.md](./API.md) for API documentation
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Open an issue on GitHub
- Contact the development team

## Performance Optimization

### Bundle Analysis

```bash
npm run build
npm run analyze
```

### Performance Monitoring

The app includes built-in performance monitoring:
- Web Vitals tracking (LCP, FID, CLS, FCP, TTFB, INP)
- Component render tracking
- API call tracking
- Error tracking with Sentry

### Best Practices

1. Use code splitting for large components
2. Implement lazy loading for routes
3. Optimize images and assets
4. Use React.memo for expensive components
5. Implement virtual scrolling for long lists
6. Cache API responses where appropriate

## Security

### Security Headers

The app implements:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy

### Rate Limiting

API endpoints are rate-limited:
- Auth endpoints: 5 requests per 15 minutes
- API endpoints: 60 requests per minute
- AI generation: 10 requests per minute
- File uploads: 5 requests per minute

### Input Validation

All user inputs are:
- Sanitized to prevent XSS
- Validated against schemas
- Checked for SQL injection patterns
- Logged for security auditing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Ensure all tests pass
6. Submit a pull request

### Code Review Process

All pull requests require:
- Passing CI/CD checks
- Code review approval
- Test coverage maintained
- Documentation updated

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Playwright Documentation](https://playwright.dev/)

## License

See LICENSE file for details.
