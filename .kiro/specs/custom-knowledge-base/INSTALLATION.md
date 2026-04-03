# Installation Guide

**Version**: 1.0.0  
**Last Updated**: April 1, 2026

---

## System Requirements

### Minimum Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **TypeScript**: 5.0.0 or higher
- **React**: 18.0.0 or higher
- **RAM**: 4GB minimum
- **Disk Space**: 2GB minimum

### Recommended Requirements
- **Node.js**: 20.0.0 or higher
- **npm**: 10.0.0 or higher
- **RAM**: 8GB or higher
- **Disk Space**: 5GB or higher
- **CPU**: Multi-core processor

### Supported Operating Systems
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu 18.04+, CentOS 7+)

---

## Pre-Installation Checklist

Before installing, ensure:
- [ ] Node.js is installed and accessible
- [ ] npm is installed and accessible
- [ ] Git is installed (for version control)
- [ ] Sufficient disk space available
- [ ] Internet connection available
- [ ] Firewall allows npm package downloads

---

## Installation Steps

### Step 1: Verify Prerequisites

```bash
# Check Node.js version
node --version
# Expected: v18.0.0 or higher

# Check npm version
npm --version
# Expected: v9.0.0 or higher

# Check TypeScript version (if installed globally)
tsc --version
# Expected: v5.0.0 or higher
```

### Step 2: Extract Package

```bash
# Extract the distribution package
tar -xzf custom-knowledge-base-1.0.0.tar.gz

# Navigate to package directory
cd custom-knowledge-base

# Verify package contents
ls -la
```

### Step 3: Install Dependencies

```bash
# Install npm dependencies
npm install

# Verify installation
npm list

# Check for vulnerabilities
npm audit
```

### Step 4: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
# or
code .env
```

**Environment Variables**:
```
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=30000

# Gemini Configuration
GEMINI_API_KEY=your_api_key_here

# Cache Configuration
CACHE_TTL=300000
CACHE_MAX_SIZE=104857600

# Performance Configuration
PERFORMANCE_THRESHOLD=2000
PERFORMANCE_SAMPLE_RATE=0.1

# Security Configuration
RATE_LIMIT=100
RATE_LIMIT_WINDOW=60000
```

### Step 5: Verify Installation

```bash
# Run tests
npm test -- --run

# Expected output: 307/307 tests passing

# Build for production
npm run build

# Expected output: Build successful
```

---

## Installation Verification

### Verify All Tests Pass

```bash
npm test -- --run
```

Expected output:
```
Test Files: 12 passed (12)
Tests: 307 passed (307)
Pass Rate: 100%
```

### Verify Build Succeeds

```bash
npm run build
```

Expected output:
```
✓ built in 5.23s
```

### Verify Services Load

```bash
npm run dev
```

Expected output:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

## Troubleshooting Installation

### Issue: Node.js Not Found

**Solution**:
```bash
# Install Node.js from https://nodejs.org/
# Or use a version manager:

# Using nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Using Chocolatey (Windows)
choco install nodejs
```

### Issue: npm Install Fails

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

### Issue: Port Already in Use

**Solution**:
```bash
# Find process using port 5173
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Issue: Permission Denied

**Solution**:
```bash
# Fix npm permissions (macOS/Linux)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Or use sudo (not recommended)
sudo npm install -g
```

### Issue: Tests Fail

**Solution**:
```bash
# Clear test cache
npm test -- --clearCache

# Run tests with verbose output
npm test -- --run --reporter=verbose

# Run specific test file
npm test -- --run src/services/knowledgeBaseService.test.ts
```

---

## Post-Installation Configuration

### Configure API Endpoints

Edit `src/services/backend.ts`:
```typescript
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000';
```

### Configure Gemini API

Edit `.env`:
```
GEMINI_API_KEY=your_actual_api_key
```

### Configure Database

Edit `src/services/knowledgeBaseService.ts`:
```typescript
// Configure database connection
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
};
```

### Configure Caching

Edit `.env`:
```
CACHE_TTL=300000
CACHE_MAX_SIZE=104857600
```

---

## Development Setup

### Install Development Dependencies

```bash
# Already included in npm install, but verify:
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

### Setup IDE

**VS Code**:
```bash
# Install recommended extensions
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-vue
```

**WebStorm**:
- Built-in TypeScript support
- Built-in ESLint support
- Built-in Prettier support

### Configure Git Hooks

```bash
# Install husky
npm install husky --save-dev

# Setup pre-commit hook
npx husky install
npx husky add .husky/pre-commit "npm run lint"
```

---

## Production Setup

### Build for Production

```bash
# Build optimized bundle
npm run build

# Verify build output
ls -la dist/
```

### Environment Configuration

Create `.env.production`:
```
VITE_API_URL=https://api.production.com
VITE_API_TIMEOUT=30000
GEMINI_API_KEY=production_key
```

### Deploy to Server

```bash
# Copy build artifacts
scp -r dist/ user@server:/var/www/app/

# Or use deployment tool
npm run deploy
```

---

## Verification Checklist

After installation, verify:
- [ ] Node.js version is 18+
- [ ] npm version is 9+
- [ ] All dependencies installed
- [ ] Environment configured
- [ ] All 307 tests passing
- [ ] Build succeeds
- [ ] Development server starts
- [ ] No console errors

---

## Next Steps

1. **Read Quick Start**: [QUICK_START.md](./QUICK_START.md)
2. **Review API Documentation**: [docs/API.md](./docs/API.md)
3. **Check Examples**: [examples/](./examples/)
4. **Start Development**: `npm run dev`

---

## Support

For installation issues:
1. Check [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
2. Review [FAQ](./docs/FAQ.md)
3. Contact support team

---

**Installation Guide Version**: 1.0.0  
**Last Updated**: April 1, 2026

