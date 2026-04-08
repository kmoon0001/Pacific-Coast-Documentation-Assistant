# TheraDoc - Quick Start Guide

**Version**: 2.5 Pro  
**Last Updated**: April 7, 2026

---

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

### 3. Start Development Server
```bash
npm run dev
```

App runs at: `http://localhost:3001`

---

## 📚 Essential Commands

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing
```bash
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # With coverage
npm run test:e2e     # E2E tests
npm run test:smoke   # Smoke tests
```

### Code Quality
```bash
npm run lint         # Lint code
npm run format       # Format with Prettier
npm run type-check   # TypeScript check
```

---

## 📖 Documentation

- **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Complete development guide
- **[API.md](./docs/API.md)** - API documentation
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture
- **[FINAL_COMPLETION_SUMMARY.md](./FINAL_COMPLETION_SUMMARY.md)** - What's been completed

---

## 🎯 Key Features

### AI-Powered Note Generation
- Google Gemini Pro (primary)
- AWS Bedrock (fallback)
- TinyLlama (local fallback)

### Therapy Disciplines
- Physical Therapy (PT)
- Occupational Therapy (OT)
- Speech-Language Pathology (ST)

### Security
- CSP headers
- Rate limiting
- Input sanitization
- Audit logging

### Performance
- Web Vitals tracking
- Component monitoring
- API performance tracking
- Error tracking

---

## 🧪 Test Coverage

- **Statements**: 99.55%
- **Branches**: 91.7%
- **Functions**: 99.15%
- **Lines**: 99.51%
- **Total Tests**: 732 passing

---

## 🔒 Security Features

- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- XSS Protection
- CSRF Protection
- Rate Limiting
- Input Sanitization
- Audit Logging

---

## 📊 Performance Monitoring

- Web Vitals (LCP, FID, CLS, FCP, TTFB, INP)
- Component render tracking
- API call performance
- Memory usage
- Long task detection
- Resource timing

---

## 🎨 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Testing**: Vitest + Playwright
- **AI**: Gemini Pro, AWS Bedrock
- **State**: React Context API

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
npx kill-port 3001
```

### Module Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
Restart TypeScript server in VS Code:
`Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

---

## 📞 Getting Help

1. Check [DEVELOPMENT.md](./docs/DEVELOPMENT.md)
2. Check [API.md](./docs/API.md)
3. Check [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
4. Open an issue on GitHub
5. Contact the development team

---

## ✅ Production Checklist

Before deploying to production:

- [ ] Run all tests: `npm test`
- [ ] Check TypeScript: `npm run type-check`
- [ ] Lint code: `npm run lint`
- [ ] Build successfully: `npm run build`
- [ ] Test build: `npm run preview`
- [ ] Set production environment variables
- [ ] Configure Sentry DSN (optional)
- [ ] Set up monitoring alerts
- [ ] Review security headers
- [ ] Test with real API keys

---

## 🎉 What's New in v2.5 Pro

- ✅ Gemini Pro integration
- ✅ Security headers & CSP
- ✅ Rate limiting
- ✅ Performance monitoring
- ✅ Web Vitals tracking
- ✅ Comprehensive documentation
- ✅ Guided tour (25 steps)
- ✅ 99.55% test coverage

---

## 📈 Metrics

- **Files**: 128 TypeScript files
- **Lines of Code**: 22,998
- **Test Files**: 54
- **Tests**: 732 passing
- **Coverage**: 99.55%
- **TypeScript Errors**: 0
- **Security Vulnerabilities**: 0

---

## 🚀 Ready to Go!

You're all set! Start the dev server and begin building amazing therapy notes.

```bash
npm run dev
```

Visit `http://localhost:3001` and enjoy! 🎉

---

**Need more details?** Check out the comprehensive guides in the `docs/` folder.
