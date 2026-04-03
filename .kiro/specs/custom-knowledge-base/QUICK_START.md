# Quick Start Guide

**Version**: 1.0.0  
**Last Updated**: April 1, 2026

---

## 5-Minute Setup

### Step 1: Install (2 minutes)
```bash
# Extract package
tar -xzf custom-knowledge-base-1.0.0.tar.gz
cd custom-knowledge-base

# Install dependencies
npm install

# Verify installation
npm test -- --run
```

### Step 2: Configure (1 minute)
```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env
```

### Step 3: Start (1 minute)
```bash
# Start development server
npm run dev

# Open browser
# http://localhost:5173
```

### Step 4: Verify (1 minute)
```bash
# Run tests
npm test -- --run

# Expected: 307/307 tests passing ✅
```

---

## Basic Usage

### Upload a Document

```typescript
import { knowledgeBaseService } from './services/knowledgeBaseService';

// Upload document
const document = await knowledgeBaseService.uploadDocument(
  file,                    // File object
  'Policy',               // Category
  'user-123',             // User ID
  {
    title: 'My Policy',
    description: 'Policy description'
  }
);

console.log('Document uploaded:', document.id);
```

### Search Documents

```typescript
// Search with filters
const results = await knowledgeBaseService.searchDocuments({
  search: 'therapy',
  category: 'Policy',
  page: 1,
  pageSize: 10,
  sortBy: 'relevance'
});

console.log('Found documents:', results.total);
results.documents.forEach(doc => {
  console.log(`- ${doc.title}`);
});
```

### Use Semantic Search

```typescript
import { semanticSearchService } from './services/semanticSearchService';

// Perform semantic search
const results = await semanticSearchService.hybridSearch(
  'physical therapy guidelines',
  documents,
  0.6,  // semantic weight
  0.4   // keyword weight
);

results.results.forEach(result => {
  console.log(`${result.document.title}: ${result.similarityScore}`);
});
```

### Integrate with AI

```typescript
import { policyIntegrationService } from './services/policyIntegrationService';
import { geminiService } from './services/gemini';

// Build policy context
const context = await policyIntegrationService.buildPolicyContext(
  userPolicies,
  userStyle
);

// Generate note with policies
const note = await geminiService.generateTherapyNote(
  therapyState,
  userStyle,
  context.policies  // Pass policies
);

console.log('Generated note:', note.content);
```

---

## Common Tasks

### Task 1: Upload Multiple Documents

```typescript
import { bulkOperationsService } from './services/bulkOperationsService';

// Bulk upload
const result = await bulkOperationsService.bulkUpload(
  files,           // File array
  'Policy',        // Category
  userId,
  { tags: ['important'] }
);

console.log(`Uploaded: ${result.successful}/${result.total}`);
```

### Task 2: Track Document Usage

```typescript
// Track usage
await knowledgeBaseService.trackDocumentUsage(
  documentId,
  'PT',           // Discipline
  'Daily',        // Document type
  noteId
);

// Get usage stats
const stats = await knowledgeBaseService.getDocumentUsageStats(documentId);
console.log('Total usages:', stats.totalUsages);
```

### Task 3: Monitor Performance

```typescript
import { performanceMonitoringService } from './services/performanceMonitoringService';

// Record metric
performanceMonitoringService.recordMetric('document_upload', 1500);

// Get statistics
const stats = performanceMonitoringService.getMetricStats('document_upload');
console.log(`Average: ${stats.average}ms, P95: ${stats.p95}ms`);

// Check health
const health = performanceMonitoringService.getHealthCheck();
console.log('Status:', health.status);
```

### Task 4: Cache Results

```typescript
import { cacheService } from './services/cacheService';

// Cache search results
cacheService.set('search:therapy', results, 300000); // 5 min TTL

// Retrieve from cache
const cached = cacheService.get('search:therapy');

// Invalidate cache
cacheService.invalidatePrefix('search:');
```

### Task 5: Validate Security

```typescript
import { securityHardeningService } from './services/securityHardeningService';

// Validate file
const validation = securityHardeningService.validateFile(file, 'pdf');
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}

// Check rate limit
if (!securityHardeningService.checkRateLimit(userId, 'upload')) {
  console.error('Rate limit exceeded');
}
```

---

## API Examples

### REST API

```bash
# Upload document
curl -X POST http://localhost:3000/api/knowledge-base/documents/upload \
  -F "file=@policy.pdf" \
  -F "category=Policy" \
  -H "Authorization: Bearer token"

# Search documents
curl http://localhost:3000/api/knowledge-base/documents/search?q=therapy

# Get document
curl http://localhost:3000/api/knowledge-base/documents/doc-123

# Get analytics
curl http://localhost:3000/api/knowledge-base/analytics/report
```

### TypeScript API

```typescript
// Import services
import { knowledgeBaseService } from './services/knowledgeBaseService';
import { semanticSearchService } from './services/semanticSearchService';
import { cacheService } from './services/cacheService';
import { performanceMonitoringService } from './services/performanceMonitoringService';
import { securityHardeningService } from './services/securityHardeningService';

// Use services
const doc = await knowledgeBaseService.uploadDocument(...);
const results = await semanticSearchService.hybridSearch(...);
cacheService.set('key', value);
performanceMonitoringService.recordMetric('name', value);
securityHardeningService.validateFile(file, type);
```

---

## Testing

### Run All Tests

```bash
npm test -- --run
```

### Run Specific Tests

```bash
# Knowledge base tests
npm test -- --run src/services/knowledgeBaseService.test.ts

# Semantic search tests
npm test -- --run src/services/semanticSearchService.test.ts

# Cache tests
npm test -- --run src/services/cacheService.test.ts
```

### Run with Coverage

```bash
npm test -- --run --coverage
```

---

## Troubleshooting

### Issue: Tests Fail

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests again
npm test -- --run
```

### Issue: Port Already in Use

```bash
# Find process using port 5173
lsof -i :5173

# Kill process
kill -9 <PID>

# Start again
npm run dev
```

### Issue: API Connection Error

```bash
# Check environment variables
cat .env

# Verify API URL
echo $VITE_API_URL

# Test connection
curl http://localhost:3000/health
```

---

## Next Steps

1. **Read Full Documentation**: [README.md](./README.md)
2. **API Reference**: [docs/API.md](./docs/API.md)
3. **Architecture Guide**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
4. **Deployment Guide**: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
5. **Examples**: [examples/](./examples/)

---

## Support

- **Documentation**: [docs/](./docs/)
- **Troubleshooting**: [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- **FAQ**: [docs/FAQ.md](./docs/FAQ.md)
- **Examples**: [examples/](./examples/)

---

**Quick Start Version**: 1.0.0  
**Last Updated**: April 1, 2026

