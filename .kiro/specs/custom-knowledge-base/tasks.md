# Implementation Plan: Custom Knowledge Base Management

## Overview

This implementation plan breaks down the Custom Knowledge Base Management feature into four phases, each building on the previous one. The feature enables users to upload, manage, and customize organizational policies that the AI uses to generate more tailored therapy notes.

**Total Estimated Effort**: 105-140 hours  
**Tech Stack**: TypeScript, React, Express, Vitest, Playwright  
**Testing Target**: >95% code coverage

---

## Phase 1: Core Document Management (40-50 hours)

Core infrastructure for uploading, storing, searching, and managing documents.

### 1.1 Set up database schema and storage infrastructure

- [ ] 1.1.1 Create database tables for documents, tags, and audit logs
  - Create `documents` table with encryption support
  - Create `document_tags` table for tagging system
  - Create `document_audit_log` table for audit trail
  - Add appropriate indexes for performance
  - _Requirements: BR1, BR2, BR6_

- [ ]* 1.1.2 Write unit tests for database schema
  - Test table creation and constraints
  - Test index performance
  - _Requirements: BR1_

- [ ] 1.1.3 Set up file storage system
  - Configure encrypted file storage (local or S3)
  - Implement encryption/decryption utilities
  - Set up file cleanup and retention policies
  - _Requirements: BR1, BR6_

- [ ]* 1.1.4 Write unit tests for file storage
  - Test file upload and retrieval
  - Test encryption/decryption
  - Test file cleanup
  - _Requirements: BR1_

### 1.2 Implement Knowledge Base Service core

- [ ] 1.2.1 Create KnowledgeBaseService with document CRUD operations
  - Implement `uploadDocument()` with file validation
  - Implement `deleteDocument()` with audit logging
  - Implement `getDocument()` with access control
  - Implement `updateDocumentMetadata()`
  - Implement `listDocuments()` with pagination
  - _Requirements: BR1, FR1, FR2, FR3_

- [ ]* 1.2.2 Write unit tests for KnowledgeBaseService CRUD
  - Test upload with various file types (PDF, DOCX, TXT)
  - Test delete with audit trail
  - Test metadata updates
  - Test pagination and filtering
  - _Requirements: BR1, FR1_

- [ ] 1.2.3 Implement document text extraction
  - Add PDF text extraction (using pdf-parse or similar)
  - Add DOCX text extraction (using docx or similar)
  - Add TXT/MD passthrough
  - Handle extraction errors gracefully
  - _Requirements: BR2, FR1_

- [ ]* 1.2.4 Write unit tests for text extraction
  - Test extraction from each file type
  - Test error handling for corrupted files
  - Test large file handling
  - _Requirements: BR2_

### 1.3 Implement document search and filtering

- [ ] 1.3.1 Create search indexing system
  - Implement full-text search index on document content
  - Create indexes on category, tags, effective date
  - Implement search query parsing
  - _Requirements: BR3, FR3_

- [ ]* 1.3.2 Write unit tests for search indexing
  - Test index creation and updates
  - Test search query performance
  - _Requirements: BR3_

- [ ] 1.3.2 Implement searchDocuments() method
  - Support keyword search across content and metadata
  - Support filtering by category, date range, tags
  - Support sorting by name, date, relevance, usage
  - Implement pagination
  - _Requirements: BR1, FR3_

- [ ]* 1.3.3 Write unit tests for search functionality
  - Test keyword search accuracy
  - Test filter combinations
  - Test sort options
  - Test pagination
  - _Requirements: BR1, FR3_

### 1.4 Create API endpoints for document management

- [ ] 1.4.1 Implement REST API endpoints
  - POST `/api/knowledge-base/documents/upload` - Upload document
  - GET `/api/knowledge-base/documents` - List documents
  - GET `/api/knowledge-base/documents/:id` - Get document
  - PATCH `/api/knowledge-base/documents/:id` - Update metadata
  - DELETE `/api/knowledge-base/documents/:id` - Delete document
  - GET `/api/knowledge-base/documents/search` - Search documents
  - _Requirements: FR1, FR2, FR3_

- [ ]* 1.4.2 Write integration tests for API endpoints
  - Test upload endpoint with various file types
  - Test list/search endpoints with filters
  - Test update and delete endpoints
  - Test error responses
  - _Requirements: FR1, FR2, FR3_

- [ ] 1.4.3 Add request validation and error handling
  - Validate file size, type, and content
  - Implement proper HTTP status codes
  - Return user-friendly error messages
  - _Requirements: FR1_

### 1.5 Build frontend components for document management

- [ ] 1.5.1 Create DocumentUpload component
  - Implement drag-and-drop upload interface
  - Add file type validation UI
  - Create metadata form (title, description, category, effective date)
  - Implement upload progress indication
  - Add success/error notifications
  - _Requirements: BR5, FR1_

- [ ]* 1.5.2 Write component tests for DocumentUpload
  - Test drag-and-drop functionality
  - Test form validation
  - Test error handling
  - Test accessibility (WCAG 2.1 AA)
  - _Requirements: BR5_

- [ ] 1.5.3 Create DocumentManager component
  - Display document list with pagination
  - Implement search and filter UI
  - Add sort options
  - Create document preview modal
  - Implement delete confirmation dialog
  - _Requirements: BR5, FR3_

- [ ]* 1.5.4 Write component tests for DocumentManager
  - Test list rendering and pagination
  - Test search/filter interactions
  - Test delete confirmation flow
  - Test preview modal
  - Test accessibility
  - _Requirements: BR5_

- [ ] 1.5.5 Create DocumentPreview component
  - Display document content with formatting
  - Show document metadata
  - Display key points and summary
  - Show usage statistics
  - _Requirements: BR5_

- [ ]* 1.5.6 Write component tests for DocumentPreview
  - Test content rendering
  - Test metadata display
  - Test accessibility
  - _Requirements: BR5_

### 1.6 Implement audit logging for document operations

- [ ] 1.6.1 Create audit logging for document operations
  - Log all document uploads with user and timestamp
  - Log all document deletions with reason
  - Log all document updates with change details
  - Log all document views and searches
  - _Requirements: BR1, BR6, FR7_

- [ ]* 1.6.2 Write unit tests for audit logging
  - Test audit log creation
  - Test audit log retrieval
  - Test audit log filtering
  - _Requirements: BR6_

### 1.7 Phase 1 Checkpoint

- [ ] 1.7 Checkpoint - Ensure all Phase 1 tests pass
  - Run full test suite: `npm run test:run`
  - Verify >95% code coverage for Phase 1 code
  - Verify all E2E tests pass for document management
  - Ask the user if questions arise

---

## Phase 2: AI Integration (30-40 hours)

Integrate uploaded policies into note generation, audit, and compliance validation.

### 2.1 Implement document processing and interpretation

- [ ] 2.1.1 Create DocumentProcessingService
  - Implement `parseDocumentStructure()` to extract sections and headings
  - Implement `identifyKeyPoints()` to extract key requirements
  - Implement `generateSummary()` using Gemini API
  - Implement `validateDocument()` for completeness checks
  - _Requirements: BR2, FR4_

- [ ]* 2.1.2 Write unit tests for document processing
  - Test structure parsing for various document formats
  - Test key point extraction
  - Test summary generation
  - Test validation logic
  - _Requirements: BR2_

- [ ] 2.1.2 Implement policy requirement extraction
  - Create `extractPolicyRequirements()` method
  - Parse requirements from document content
  - Assign priority levels (high/medium/low)
  - Identify applicable disciplines and document types
  - _Requirements: BR2, FR4_

- [ ]* 2.1.3 Write unit tests for requirement extraction
  - Test requirement parsing accuracy
  - Test priority assignment
  - Test applicability detection
  - _Requirements: BR2_

### 2.2 Create Policy Integration Service

- [ ] 2.2.1 Implement PolicyIntegrationService
  - Create `buildPolicyContext()` to gather relevant policies
  - Implement `getRelevantPolicies()` for discipline/document type filtering
  - Create `enhanceGenerateNotePrompt()` to inject policies
  - Create `enhanceAuditPrompt()` for compliance checking
  - Create `enhanceGapAnalysisPrompt()` for gap analysis
  - _Requirements: BR4, FR4, FR5_

- [ ]* 2.2.2 Write unit tests for policy integration
  - Test policy context building
  - Test policy filtering by discipline
  - Test prompt enhancement logic
  - _Requirements: BR4_

- [ ] 2.2.3 Implement policy injection into prompts
  - Modify `getGenerateNotePrompt()` to accept policy context
  - Inject policy requirements into prompt
  - Add policy compliance instructions
  - Add style guide integration
  - _Requirements: BR4, FR5_

- [ ]* 2.2.4 Write unit tests for prompt injection
  - Test prompt enhancement with policies
  - Test style guide application
  - Test compliance instruction injection
  - _Requirements: BR4_

### 2.3 Integrate policies into note generation

- [ ] 2.3.1 Modify generateTherapyNote() to use policies
  - Get user's active policies
  - Filter policies by discipline and document type
  - Build policy context
  - Enhance prompt with policies
  - Track which policies were used
  - _Requirements: BR4, FR5_

- [ ]* 2.3.2 Write integration tests for policy-based note generation
  - Test note generation with policies
  - Test policy tracking
  - Test fallback when no policies exist
  - _Requirements: BR4_

- [ ] 2.3.3 Add policy references to generated notes
  - Include policy IDs in note metadata
  - Add policy compliance indicators
  - Show which policies influenced the note
  - _Requirements: BR4, US6_

- [ ]* 2.3.4 Write unit tests for policy references
  - Test policy metadata in notes
  - Test policy indicator generation
  - _Requirements: BR4_

### 2.4 Integrate policies into audit system

- [ ] 2.4.1 Modify auditNoteWithAI() to validate against policies
  - Get applicable policies for document type
  - Enhance audit prompt with policies
  - Validate note compliance with policies
  - Return policy-specific violations
  - _Requirements: BR4, FR5_

- [ ]* 2.4.2 Write integration tests for policy-based auditing
  - Test audit with policies
  - Test violation detection
  - Test compliance scoring
  - _Requirements: BR4_

- [ ] 2.4.3 Create compliance validation endpoint
  - POST `/api/knowledge-base/validate-compliance`
  - Accept note and policy IDs
  - Return compliance score and violations
  - _Requirements: BR4, FR5_

- [ ]* 2.4.4 Write integration tests for compliance endpoint
  - Test compliance validation
  - Test error handling
  - _Requirements: BR4_

### 2.5 Implement policy usage tracking

- [ ] 2.5.1 Create document usage tracking
  - Implement `trackDocumentUsage()` method
  - Log which policies were used in each note
  - Store usage context (discipline, document type, etc.)
  - _Requirements: BR3, US5_

- [ ]* 2.5.2 Write unit tests for usage tracking
  - Test usage log creation
  - Test usage retrieval
  - _Requirements: BR3_

- [ ] 2.5.3 Create usage statistics endpoints
  - GET `/api/knowledge-base/documents/:id/usage` - Get usage stats
  - GET `/api/knowledge-base/documents/:id/usage/notes` - Get notes using policy
  - _Requirements: BR3, US5_

- [ ]* 2.5.4 Write integration tests for usage endpoints
  - Test usage statistics retrieval
  - Test note filtering by policy
  - _Requirements: BR3_

### 2.6 Add policy context to UI

- [ ] 2.6.1 Create PolicyPanel component
  - Display relevant policies for current discipline/document type
  - Show policy requirements
  - Display compliance status
  - Show policy impact on notes
  - _Requirements: BR5, US6_

- [ ]* 2.6.2 Write component tests for PolicyPanel
  - Test policy display
  - Test requirement rendering
  - Test accessibility
  - _Requirements: BR5_

- [ ] 2.6.3 Integrate PolicyPanel into note generation workflow
  - Show policies during note generation
  - Display policy references in generated notes
  - Show compliance indicators
  - _Requirements: BR5, US6_

- [ ]* 2.6.4 Write E2E tests for policy integration in UI
  - Test policy display during note generation
  - Test policy references in notes
  - _Requirements: BR5_

### 2.7 Phase 2 Checkpoint

- [ ] 2.7 Checkpoint - Ensure all Phase 2 tests pass
  - Run full test suite: `npm run test:run`
  - Verify >95% code coverage for Phase 2 code
  - Verify all E2E tests pass for policy integration
  - Ask the user if questions arise

---

## Phase 3: Advanced Features (20-30 hours)

Add versioning, relationships, bulk operations, and analytics.

### 3.1 Implement document versioning

- [ ] 3.1.1 Create document versioning system
  - Implement version history tracking
  - Create `getDocumentVersion()` method
  - Create `listDocumentVersions()` method
  - Implement version comparison
  - _Requirements: BR3, FR2_

- [ ]* 3.1.2 Write unit tests for versioning
  - Test version creation
  - Test version retrieval
  - Test version comparison
  - _Requirements: BR3_

- [ ] 3.1.3 Add version management UI
  - Create version history view
  - Implement version comparison UI
  - Add rollback functionality
  - _Requirements: BR5_

- [ ]* 3.1.4 Write component tests for version UI
  - Test version list rendering
  - Test version comparison
  - Test rollback confirmation
  - _Requirements: BR5_

### 3.2 Implement document relationships

- [ ] 3.2.1 Create document relationship system
  - Add relationships table (supersedes, related_to, depends_on)
  - Implement `addRelationship()` method
  - Implement `getRelatedDocuments()` method
  - Implement conflict detection
  - _Requirements: BR3, FR2_

- [ ]* 3.2.2 Write unit tests for relationships
  - Test relationship creation
  - Test relationship retrieval
  - Test conflict detection
  - _Requirements: BR3_

- [ ] 3.2.3 Add relationship visualization UI
  - Create relationship graph view
  - Show document dependencies
  - Highlight conflicts
  - _Requirements: BR5_

- [ ]* 3.2.4 Write component tests for relationship UI
  - Test graph rendering
  - Test conflict highlighting
  - _Requirements: BR5_

### 3.3 Implement bulk operations

- [ ] 3.3.1 Create bulk upload functionality
  - Implement batch file upload
  - Add progress tracking for multiple files
  - Implement error handling per file
  - _Requirements: BR1, FR1_

- [ ]* 3.3.2 Write integration tests for bulk upload
  - Test multiple file upload
  - Test partial failure handling
  - _Requirements: BR1_

- [ ] 3.3.2 Create bulk delete functionality
  - Implement multi-select delete
  - Add confirmation dialog
  - Track bulk deletion in audit log
  - _Requirements: BR1, FR3_

- [ ]* 3.3.3 Write integration tests for bulk delete
  - Test multi-select delete
  - Test audit logging
  - _Requirements: BR1_

- [ ] 3.3.4 Create bulk tag/categorize functionality
  - Implement batch tagging
  - Implement batch category assignment
  - _Requirements: BR1, FR3_

- [ ]* 3.3.5 Write integration tests for bulk operations
  - Test batch tagging
  - Test batch categorization
  - _Requirements: BR1_

### 3.4 Implement analytics and reporting

- [ ] 3.4.1 Create analytics service
  - Implement `getDocumentUsageStats()` method
  - Implement `getPolicyAdoptionMetrics()` method
  - Implement `getComplianceMetrics()` method
  - Implement `getTrendAnalysis()` method
  - _Requirements: BR3, US5_

- [ ]* 3.4.2 Write unit tests for analytics
  - Test usage statistics calculation
  - Test adoption metrics
  - Test compliance metrics
  - Test trend analysis
  - _Requirements: BR3_

- [ ] 3.4.3 Create analytics endpoints
  - GET `/api/knowledge-base/analytics/usage` - Usage statistics
  - GET `/api/knowledge-base/analytics/adoption` - Policy adoption
  - GET `/api/knowledge-base/analytics/compliance` - Compliance metrics
  - GET `/api/knowledge-base/analytics/trends` - Trend analysis
  - _Requirements: BR3, US5_

- [ ]* 3.4.4 Write integration tests for analytics endpoints
  - Test analytics data retrieval
  - Test filtering and date ranges
  - _Requirements: BR3_

- [ ] 3.4.5 Create analytics dashboard UI
  - Display usage statistics
  - Show policy adoption trends
  - Display compliance metrics
  - Show most/least used policies
  - _Requirements: BR5, US5_

- [ ]* 3.4.6 Write component tests for analytics dashboard
  - Test chart rendering
  - Test data filtering
  - Test accessibility
  - _Requirements: BR5_

### 3.5 Implement export functionality

- [ ] 3.5.1 Create document export service
  - Implement export to PDF
  - Implement export to DOCX
  - Implement export to CSV (for analytics)
  - _Requirements: BR3, FR3_

- [ ]* 3.5.2 Write unit tests for export
  - Test PDF export
  - Test DOCX export
  - Test CSV export
  - _Requirements: BR3_

- [ ] 3.5.3 Create export endpoints
  - GET `/api/knowledge-base/documents/:id/export` - Export document
  - GET `/api/knowledge-base/analytics/export` - Export analytics
  - _Requirements: BR3_

- [ ]* 3.5.4 Write integration tests for export endpoints
  - Test document export
  - Test analytics export
  - _Requirements: BR3_

### 3.6 Phase 3 Checkpoint

- [ ] 3.6 Checkpoint - Ensure all Phase 3 tests pass
  - Run full test suite: `npm run test:run`
  - Verify >95% code coverage for Phase 3 code
  - Verify all E2E tests pass for advanced features
  - Ask the user if questions arise

---

## Phase 4: Optimization (15-20 hours)

Performance tuning, semantic search, caching, and production readiness.

### 4.1 Implement semantic search with embeddings

- [ ] 4.1.1 Create embedding generation service
  - Implement `createEmbeddings()` using Gemini API
  - Store embeddings in database
  - Implement embedding updates on document changes
  - _Requirements: FR4_

- [ ]* 4.1.2 Write unit tests for embeddings
  - Test embedding generation
  - Test embedding storage
  - Test embedding updates
  - _Requirements: FR4_

- [ ] 4.1.2 Implement semantic search
  - Create `semanticSearch()` method
  - Compare query embeddings with document embeddings
  - Rank results by similarity
  - Combine with keyword search
  - _Requirements: BR1, FR3_

- [ ]* 4.1.3 Write unit tests for semantic search
  - Test semantic search accuracy
  - Test ranking algorithm
  - Test hybrid search (keyword + semantic)
  - _Requirements: BR1_

- [ ] 4.1.4 Add semantic search to API
  - Modify search endpoint to support semantic search
  - Add search type parameter (keyword/semantic/hybrid)
  - _Requirements: FR3_

- [ ]* 4.1.5 Write integration tests for semantic search API
  - Test semantic search endpoint
  - Test search type parameter
  - _Requirements: FR3_

### 4.2 Implement caching strategy

- [ ] 4.2.1 Create caching layer
  - Implement in-memory cache for frequently accessed policies
  - Implement cache invalidation on document updates
  - Add cache statistics and monitoring
  - _Requirements: NFR1_

- [ ]* 4.2.2 Write unit tests for caching
  - Test cache hit/miss
  - Test cache invalidation
  - Test cache statistics
  - _Requirements: NFR1_

- [ ] 4.2.3 Cache policy context by discipline/document type
  - Pre-compute policy contexts
  - Cache for 1 hour with invalidation on updates
  - _Requirements: NFR1_

- [ ]* 4.2.4 Write unit tests for context caching
  - Test context cache creation
  - Test cache invalidation
  - _Requirements: NFR1_

### 4.3 Implement performance monitoring

- [ ] 4.3.1 Add performance metrics
  - Track document upload time
  - Track search response time
  - Track note generation time with policies
  - Track API response times
  - _Requirements: NFR1_

- [ ]* 4.3.2 Write unit tests for performance monitoring
  - Test metric collection
  - Test metric retrieval
  - _Requirements: NFR1_

- [ ] 4.3.3 Create performance monitoring endpoints
  - GET `/api/knowledge-base/metrics` - Performance metrics
  - GET `/api/knowledge-base/health` - Health check
  - _Requirements: NFR1_

- [ ]* 4.3.4 Write integration tests for monitoring endpoints
  - Test metrics retrieval
  - Test health check
  - _Requirements: NFR1_

### 4.4 Optimize database queries

- [ ] 4.4.1 Analyze and optimize queries
  - Add query indexes for common searches
  - Optimize pagination queries
  - Optimize join queries for relationships
  - _Requirements: NFR1_

- [ ]* 4.4.2 Write performance tests
  - Test query performance with 1000+ documents
  - Test concurrent query handling
  - _Requirements: NFR1_

- [ ] 4.4.3 Implement query result caching
  - Cache search results for 5 minutes
  - Cache policy context for 1 hour
  - _Requirements: NFR1_

- [ ]* 4.4.4 Write integration tests for query caching
  - Test cache effectiveness
  - Test cache invalidation
  - _Requirements: NFR1_

### 4.5 Implement load testing and stress testing

- [ ] 4.5.1 Create load test scenarios
  - Test concurrent document uploads
  - Test concurrent searches
  - Test concurrent note generation with policies
  - _Requirements: NFR2_

- [ ] 4.5.2 Run load tests
  - Test with 100 concurrent users
  - Test with 1000+ documents
  - Verify performance targets met
  - _Requirements: NFR1, NFR2_

- [ ]* 4.5.3 Write E2E stress tests
  - Test high-volume document operations
  - Test high-volume searches
  - _Requirements: NFR2_

### 4.6 Implement security hardening

- [ ] 4.6.1 Add security validations
  - Validate file content for malicious code
  - Implement rate limiting on uploads
  - Implement rate limiting on searches
  - _Requirements: BR6, FR7_

- [ ]* 4.6.2 Write security tests
  - Test file validation
  - Test rate limiting
  - Test access control
  - _Requirements: BR6_

- [ ] 4.6.3 Implement encryption at rest
  - Encrypt document content in database
  - Implement key rotation
  - _Requirements: BR6, FR7_

- [ ]* 4.6.4 Write encryption tests
  - Test encryption/decryption
  - Test key rotation
  - _Requirements: BR6_

### 4.7 Create production deployment checklist

- [ ] 4.7.1 Prepare production deployment
  - Document deployment steps
  - Create database migration scripts
  - Create rollback procedures
  - _Requirements: NFR3_

- [ ] 4.7.2 Verify production readiness
  - Run full test suite: `npm run test:run`
  - Verify >95% code coverage
  - Run E2E tests: `npm run e2e`
  - Run load tests
  - Verify all performance targets met
  - Verify security hardening complete
  - _Requirements: NFR1, NFR2, NFR3_

### 4.8 Phase 4 Checkpoint

- [ ] 4.8 Checkpoint - Ensure all Phase 4 tests pass
  - Run full test suite: `npm run test:run`
  - Verify >95% code coverage for Phase 4 code
  - Verify all E2E tests pass
  - Verify load tests pass
  - Verify performance targets met
  - Ask the user if questions arise

---

## Implementation Notes

### Testing Requirements

- All code must have >95% test coverage
- Use Vitest for unit and integration tests
- Use Playwright for E2E tests
- Follow AAA (Arrange-Act-Assert) pattern
- Use fixtures for consistent test data
- Mock external services (Gemini API, file storage)

### Code Organization

- Services in `src/services/`
- Components in `src/components/KnowledgeBase/`
- Types in `src/types/`
- Tests co-located with source files (`.test.ts` suffix)
- Database migrations in `migrations/`

### Performance Targets

- Document upload: <5 seconds
- Document search: <1 second
- Document preview: <2 seconds
- AI integration: <500ms overhead
- Support 1000+ documents
- Support concurrent operations

### Security & Compliance

- HIPAA compliance for document storage
- Audit logging for all operations
- Role-based access control
- Encryption at rest and in transit
- PII scrubbing for documents

### Integration Points

- Gemini API for policy interpretation
- Local LLM fallback for offline mode
- Existing prompt system for policy injection
- Existing audit logging system
- Existing RBAC system
- Existing user service

---

**Status**: Ready for Implementation  
**Next Step**: Begin Phase 1 tasks
