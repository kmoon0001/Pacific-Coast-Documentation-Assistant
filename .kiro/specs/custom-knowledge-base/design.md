# Custom Knowledge Base - Design Document

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Document Upload  │  │ Document Manager │  │ Policy Panel │  │
│  │ Component        │  │ Component        │  │ Component    │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
└───────────┼──────────────────────┼──────────────────┼───────────┘
            │                      │                  │
            ▼                      ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Knowledge Base Service                           │  │
│  │  - uploadDocument()                                      │  │
│  │  - deleteDocument()                                      │  │
│  │  - searchDocuments()                                     │  │
│  │  - getDocument()                                         │  │
│  │  - updateDocumentMetadata()                              │  │
│  │  - listDocuments()                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Policy Integration Service                       │  │
│  │  - interpretPolicy()                                     │  │
│  │  - extractPolicyRequirements()                           │  │
│  │  - generatePolicySummary()                               │  │
│  │  - injectPoliciesIntoPrompt()                            │  │
│  │  - validatePolicyCompliance()                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Document Processing Service                      │  │
│  │  - extractTextFromDocument()                             │  │
│  │  - parseDocumentStructure()                              │  │
│  │  - createDocumentEmbeddings()                            │  │
│  │  - indexDocument()                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
            │                      │                  │
            ▼                      ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Documents Table  │  │ Policies Table   │  │ Search Index │  │
│  │ (Encrypted)      │  │ (Metadata)       │  │ (Embeddings) │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
            │                      │                  │
            ▼                      ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Gemini API       │  │ Local LLM        │  │ File Storage │  │
│  │ (Policy Interp)  │  │ (Fallback)       │  │ (S3/Local)   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Knowledge Base Service

**File**: `src/services/knowledgeBaseService.ts`

```typescript
interface Document {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'Policy' | 'Procedure' | 'Guidance' | 'Regulation';
  content: string;
  contentHash: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'md';
  fileSize: number;
  uploadedAt: Date;
  updatedAt: Date;
  effectiveDate?: Date;
  expiryDate?: Date;
  version: number;
  tags: string[];
  isActive: boolean;
  metadata: Record<string, any>;
  encryptionKey?: string;
}

interface DocumentSearchResult {
  documents: Document[];
  total: number;
  page: number;
  pageSize: number;
}

interface PolicyRequirement {
  id: string;
  requirement: string;
  priority: 'high' | 'medium' | 'low';
  applicableTo: string[];
  complianceChecks: string[];
}

class KnowledgeBaseService {
  // Document Management
  async uploadDocument(file: File, metadata: DocumentMetadata): Promise<Document>;
  async deleteDocument(documentId: string): Promise<void>;
  async getDocument(documentId: string): Promise<Document>;
  async updateDocumentMetadata(documentId: string, updates: Partial<Document>): Promise<Document>;
  async listDocuments(filters?: DocumentFilters): Promise<DocumentSearchResult>;
  async searchDocuments(query: string, filters?: DocumentFilters): Promise<DocumentSearchResult>;
  
  // Document Processing
  async extractTextFromDocument(file: File): Promise<string>;
  async parseDocumentStructure(content: string): Promise<DocumentStructure>;
  async createDocumentEmbeddings(content: string): Promise<number[]>;
  async indexDocument(document: Document): Promise<void>;
  
  // Policy Management
  async interpretPolicy(content: string): Promise<PolicyInterpretation>;
  async extractPolicyRequirements(document: Document): Promise<PolicyRequirement[]>;
  async generatePolicySummary(document: Document): Promise<string>;
  async validatePolicyCompliance(note: string, policies: Document[]): Promise<ComplianceResult>;
  
  // Audit & Analytics
  async trackDocumentUsage(documentId: string, noteId: string): Promise<void>;
  async getDocumentUsageStats(documentId: string): Promise<UsageStats>;
  async getAuditLog(documentId: string): Promise<AuditLogEntry[]>;
}
```

### 2. Policy Integration Service

**File**: `src/services/policyIntegrationService.ts`

```typescript
interface PolicyContext {
  policies: Document[];
  requirements: PolicyRequirement[];
  styleGuides: Document[];
  complianceRules: string[];
}

interface PromptEnhancement {
  originalPrompt: string;
  enhancedPrompt: string;
  injectedPolicies: string[];
  injectedRequirements: string[];
}

class PolicyIntegrationService {
  // Prompt Enhancement
  async enhanceGenerateNotePrompt(
    originalPrompt: string,
    policies: Document[],
    userStyle?: string
  ): Promise<PromptEnhancement>;
  
  async enhanceAuditPrompt(
    originalPrompt: string,
    policies: Document[]
  ): Promise<PromptEnhancement>;
  
  async enhanceGapAnalysisPrompt(
    originalPrompt: string,
    policies: Document[]
  ): Promise<PromptEnhancement>;
  
  // Policy Context Building
  async buildPolicyContext(
    discipline: string,
    documentType: string,
    userId: string
  ): Promise<PolicyContext>;
  
  async getRelevantPolicies(
    query: string,
    discipline?: string,
    documentType?: string
  ): Promise<Document[]>;
  
  // Compliance Validation
  async validateNoteCompliance(
    note: string,
    policies: Document[],
    documentType: string
  ): Promise<ComplianceValidation>;
  
  async generateComplianceReport(
    note: string,
    policies: Document[]
  ): Promise<ComplianceReport>;
  
  // Style Integration
  async extractStyleGuide(document: Document): Promise<StyleGuide>;
  async applyStyleGuide(note: string, styleGuide: StyleGuide): Promise<string>;
}
```

### 3. Document Processing Service

**File**: `src/services/documentProcessingService.ts`

```typescript
interface DocumentStructure {
  title: string;
  sections: Section[];
  keyPoints: string[];
  summary: string;
}

interface Section {
  heading: string;
  content: string;
  subsections: Section[];
  keyPoints: string[];
}

class DocumentProcessingService {
  // Text Extraction
  async extractFromPDF(file: File): Promise<string>;
  async extractFromDOCX(file: File): Promise<string>;
  async extractFromTXT(file: File): Promise<string>;
  
  // Document Parsing
  async parseStructure(content: string): Promise<DocumentStructure>;
  async identifyKeyPoints(content: string): Promise<string[]>;
  async generateSummary(content: string): Promise<string>;
  
  // Embedding & Indexing
  async createEmbeddings(content: string): Promise<number[]>;
  async indexForSearch(document: Document): Promise<void>;
  async updateSearchIndex(documentId: string): Promise<void>;
  
  // Validation
  async validateDocument(content: string): Promise<ValidationResult>;
  async detectDuplicates(content: string): Promise<Document[]>;
  async checkForConflicts(document: Document): Promise<Conflict[]>;
}
```

## Database Schema

### Documents Table

```sql
CREATE TABLE documents (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category ENUM('Policy', 'Procedure', 'Guidance', 'Regulation') NOT NULL,
  content LONGBLOB NOT NULL,  -- Encrypted
  content_hash VARCHAR(255) NOT NULL,
  file_type ENUM('pdf', 'docx', 'txt', 'md') NOT NULL,
  file_size INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  effective_date DATE,
  expiry_date DATE,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSON,
  encryption_key_id VARCHAR(255),
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  INDEX idx_user_org (user_id, organization_id),
  INDEX idx_category (category),
  INDEX idx_active (is_active),
  INDEX idx_effective_date (effective_date)
);
```

### Document Tags Table

```sql
CREATE TABLE document_tags (
  id VARCHAR(255) PRIMARY KEY,
  document_id VARCHAR(255) NOT NULL,
  tag VARCHAR(100) NOT NULL,
  
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  UNIQUE KEY unique_doc_tag (document_id, tag),
  INDEX idx_tag (tag)
);
```

### Policy Requirements Table

```sql
CREATE TABLE policy_requirements (
  id VARCHAR(255) PRIMARY KEY,
  document_id VARCHAR(255) NOT NULL,
  requirement TEXT NOT NULL,
  priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
  applicable_to JSON,  -- Array of disciplines/document types
  compliance_checks JSON,  -- Array of checks
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  INDEX idx_document (document_id),
  INDEX idx_priority (priority)
);
```

### Document Usage Table

```sql
CREATE TABLE document_usage (
  id VARCHAR(255) PRIMARY KEY,
  document_id VARCHAR(255) NOT NULL,
  note_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  context JSON,  -- How it was used
  
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_document (document_id),
  INDEX idx_note (note_id),
  INDEX idx_used_at (used_at)
);
```

### Audit Log Table

```sql
CREATE TABLE document_audit_log (
  id VARCHAR(255) PRIMARY KEY,
  document_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  action ENUM('upload', 'update', 'delete', 'view', 'search') NOT NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_document (document_id),
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);
```

## API Contracts

### Document Upload

```typescript
POST /api/knowledge-base/documents/upload
Content-Type: multipart/form-data

Request:
{
  file: File,
  title: string,
  description: string,
  category: 'Policy' | 'Procedure' | 'Guidance' | 'Regulation',
  effectiveDate?: Date,
  expiryDate?: Date,
  tags?: string[]
}

Response: 201 Created
{
  id: string,
  title: string,
  category: string,
  uploadedAt: Date,
  status: 'processing' | 'completed' | 'failed'
}
```

### Search Documents

```typescript
GET /api/knowledge-base/documents/search?q=query&category=Policy&page=1&pageSize=20

Response: 200 OK
{
  documents: Document[],
  total: number,
  page: number,
  pageSize: number
}
```

### Get Document

```typescript
GET /api/knowledge-base/documents/:id

Response: 200 OK
{
  id: string,
  title: string,
  description: string,
  category: string,
  content: string,
  summary: string,
  keyPoints: string[],
  requirements: PolicyRequirement[],
  usageStats: UsageStats,
  uploadedAt: Date,
  updatedAt: Date
}
```

### Delete Document

```typescript
DELETE /api/knowledge-base/documents/:id

Response: 204 No Content
```

### Update Document Metadata

```typescript
PATCH /api/knowledge-base/documents/:id
Content-Type: application/json

Request:
{
  title?: string,
  description?: string,
  category?: string,
  effectiveDate?: Date,
  expiryDate?: Date,
  tags?: string[]
}

Response: 200 OK
{
  id: string,
  title: string,
  updatedAt: Date
}
```

### Get Policy Context

```typescript
GET /api/knowledge-base/context?discipline=PT&documentType=Daily

Response: 200 OK
{
  policies: Document[],
  requirements: PolicyRequirement[],
  styleGuides: Document[],
  complianceRules: string[]
}
```

### Validate Note Compliance

```typescript
POST /api/knowledge-base/validate-compliance
Content-Type: application/json

Request:
{
  note: string,
  documentType: string,
  policyIds?: string[]
}

Response: 200 OK
{
  complianceScore: number,
  violations: string[],
  appliedPolicies: string[],
  recommendations: string[]
}
```

## Frontend Components

### 1. Document Upload Component

**File**: `src/components/KnowledgeBase/DocumentUpload.tsx`

```typescript
interface DocumentUploadProps {
  onUploadComplete: (document: Document) => void;
  onError: (error: Error) => void;
  category?: string;
}

export function DocumentUpload(props: DocumentUploadProps) {
  // Drag-and-drop upload
  // File validation
  // Metadata form
  // Progress indication
  // Success/error notifications
}
```

### 2. Document Manager Component

**File**: `src/components/KnowledgeBase/DocumentManager.tsx`

```typescript
interface DocumentManagerProps {
  onDocumentSelect: (document: Document) => void;
  onDocumentDelete: (documentId: string) => void;
}

export function DocumentManager(props: DocumentManagerProps) {
  // Document list with pagination
  // Search and filter
  // Sort options
  // Bulk operations
  // Document preview
}
```

### 3. Policy Panel Component

**File**: `src/components/KnowledgeBase/PolicyPanel.tsx`

```typescript
interface PolicyPanelProps {
  discipline: string;
  documentType: string;
  onPolicySelect: (policy: Document) => void;
}

export function PolicyPanel(props: PolicyPanelProps) {
  // Display relevant policies
  // Show policy requirements
  // Display compliance status
  // Show policy impact on notes
}
```

### 4. Document Preview Component

**File**: `src/components/KnowledgeBase/DocumentPreview.tsx`

```typescript
interface DocumentPreviewProps {
  document: Document;
  onClose: () => void;
}

export function DocumentPreview(props: DocumentPreviewProps) {
  // Display document content
  // Show document structure
  // Display key points
  // Show usage statistics
}
```

## Integration Points

### 1. Note Generation Integration

**File**: `src/services/gemini.ts`

```typescript
export async function generateTherapyNote(
  state: TherapyState,
  userStyle?: string,
  customPolicies?: Document[]  // NEW
) {
  // Get policy context
  const policyContext = customPolicies
    ? await policyIntegrationService.buildPolicyContext(
        state.discipline,
        state.documentType,
        state.userId
      )
    : null;

  // Enhance prompt with policies
  const enhancedPrompt = policyContext
    ? await policyIntegrationService.enhanceGenerateNotePrompt(
        getGenerateNotePrompt(state, userStyle),
        policyContext.policies,
        userStyle
      )
    : getGenerateNotePrompt(state, userStyle);

  // Generate note with Gemini
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: enhancedPrompt.enhancedPrompt }] }],
    config: { responseMimeType: "application/json" }
  });

  // Track policy usage
  if (policyContext) {
    for (const policy of policyContext.policies) {
      await knowledgeBaseService.trackDocumentUsage(policy.id, state.noteId);
    }
  }

  return response;
}
```

### 2. Audit Integration

**File**: `src/services/gemini.ts`

```typescript
export async function auditNoteWithAI(
  note: string,
  documentType: string,
  customPolicies?: Document[]  // NEW
) {
  // Get policy context
  const policyContext = customPolicies
    ? await policyIntegrationService.buildPolicyContext(
        undefined,
        documentType,
        userId
      )
    : null;

  // Enhance audit prompt with policies
  const enhancedPrompt = policyContext
    ? await policyIntegrationService.enhanceAuditPrompt(
        getAuditNotePrompt(note, documentType),
        policyContext.policies
      )
    : getAuditNotePrompt(note, documentType);

  // Audit with Gemini
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: enhancedPrompt.enhancedPrompt }] }],
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text);
}
```

## Data Flow

### Upload Flow

```
1. User selects file
   ↓
2. Validate file (size, type, format)
   ↓
3. Extract text from document
   ↓
4. Parse document structure
   ↓
5. Call Gemini to interpret policy
   ↓
6. Extract policy requirements
   ↓
7. Generate document summary
   ↓
8. Create embeddings for search
   ↓
9. Encrypt and store document
   ↓
10. Index for search
   ↓
11. Create audit log entry
   ↓
12. Return success to user
```

### Note Generation Flow

```
1. User initiates note generation
   ↓
2. Get user's policies
   ↓
3. Filter policies by discipline/document type
   ↓
4. Build policy context
   ↓
5. Enhance prompt with policies
   ↓
6. Call Gemini with enhanced prompt
   ↓
7. Track policy usage
   ↓
8. Return note with policy references
```

## Security Considerations

### Encryption
- Documents encrypted at rest using AES-256
- Encryption keys stored separately
- Support for key rotation

### Access Control
- Role-based access (Admin/Manager manage, Therapist views)
- Organization-level isolation
- User-level audit logging

### Data Protection
- PII scrubbing for all documents
- Secure deletion (overwrite before delete)
- Audit trail for all operations

### Compliance
- HIPAA compliance for document storage
- Audit logging for all access
- Data retention policies

## Performance Optimization

### Caching
- Cache frequently accessed policies
- Cache policy context by discipline/document type
- Cache search results

### Indexing
- Full-text search index on document content
- Index on category, tags, effective date
- Embedding-based semantic search

### Pagination
- Limit document list to 20 per page
- Lazy load document content
- Stream large documents

## Testing Strategy

### Unit Tests
- Document upload/delete/search
- Policy interpretation
- Prompt injection logic
- Compliance validation

### Integration Tests
- End-to-end document upload
- Note generation with policies
- Audit system with policies
- Search and filtering

### E2E Tests
- User uploads policy
- Generates note using policy
- Verifies policy compliance
- Removes policy

## Implementation Phases

### Phase 1: Core Document Management (40-50 hours)
- Document upload/delete/search
- Basic indexing and storage
- UI components
- API endpoints

### Phase 2: AI Integration (30-40 hours)
- Inject policies into prompts
- Enhance audit system
- Track policy usage
- Policy context building

### Phase 3: Advanced Features (20-30 hours)
- Versioning and relationships
- Bulk operations
- Advanced analytics
- Policy recommendations

### Phase 4: Optimization (15-20 hours)
- Semantic search with embeddings
- Performance tuning
- Caching optimization
- Load testing

---

**Design Status**: ✅ Complete  
**Next Phase**: Implementation Tasks  
**Estimated Effort**: 105-140 hours total

