# Custom Knowledge Base - AI Integration Guide

## Overview

The Custom Knowledge Base feature leverages TheraDoc's existing AI/LLM infrastructure to provide intelligent policy management and AI-enhanced note generation. This document explains how the feature integrates with existing systems.

## Existing AI Architecture

### Dual AI System

TheraDoc uses a **dual AI system** for maximum reliability:

```
┌─────────────────────────────────────────────────────────┐
│                  Note Generation Request                 │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ┌─────────────┐          ┌──────────────┐
   │ Gemini API  │          │ Local LLM    │
   │ (Primary)   │          │ (Fallback)   │
   └─────────────┘          └──────────────┘
        │                         │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   Generated Note with   │
        │   Policy Integration    │
        └────────────────────────┘
```

### 1. Gemini API (Primary)
- **Model**: Gemini-3-Flash-Preview
- **Strengths**: 
  - Advanced reasoning and compliance checking
  - Google Search grounding for real-time compliance verification
  - JSON-structured responses
  - Superior policy interpretation
- **Capabilities**:
  - Generate compliant therapy notes
  - Audit notes for policy compliance
  - Analyze gaps in documentation
  - Parse unstructured clinical input
  - Refine and improve notes
  - Summarize patient progress

### 2. Local LLM (Fallback)
- **Model**: TinyLlama-1.1B-Chat-v1.0
- **Strengths**:
  - Works offline without API key
  - No quota limitations
  - Instant response times
  - Privacy-first (no external API calls)
- **Capabilities**:
  - Generate basic therapy notes
  - Support policy-based generation
  - Maintain functionality when Gemini unavailable

## How Custom Knowledge Base Integrates

### 1. Document Upload & Processing

```
User Uploads Policy Document
        │
        ▼
┌─────────────────────────────────┐
│ Extract Text from Document      │
│ (PDF/DOCX/TXT parsing)          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Use Gemini to Interpret Policy  │
│ - Extract key requirements      │
│ - Identify compliance rules     │
│ - Generate policy summary       │
│ - Create policy embeddings      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Store in Knowledge Base         │
│ - Index for search              │
│ - Link to note generation       │
│ - Track usage metrics           │
└─────────────────────────────────┘
```

### 2. Enhanced Note Generation

**Before Custom Knowledge Base:**
```
Therapy Data → Gemini Prompt → Generated Note
```

**After Custom Knowledge Base:**
```
Therapy Data + Custom Policies → Enhanced Gemini Prompt → Policy-Compliant Note
                                                          + Policy References
                                                          + Compliance Score
```

### 3. Prompt Enhancement

The system injects custom policies into existing prompts:

#### Example: `getGenerateNotePrompt()`

**Before:**
```javascript
const prompt = `Generate a ${discipline} ${documentType} note...
AUTHORITATIVE KNOWLEDGE CONTEXT:
${JSON.stringify(ClinicalKnowledgeBase.knowledge)}
...`;
```

**After:**
```javascript
const prompt = `Generate a ${discipline} ${documentType} note...
AUTHORITATIVE KNOWLEDGE CONTEXT:
${JSON.stringify(ClinicalKnowledgeBase.knowledge)}

CUSTOM ORGANIZATIONAL POLICIES:
${JSON.stringify(customPolicies)}

POLICY COMPLIANCE REQUIREMENTS:
${policyRequirements.join('\n')}
...`;
```

### 4. Policy-Based Compliance Auditing

```
Generated Note
        │
        ▼
┌─────────────────────────────────┐
│ Audit with Gemini               │
│ - Check Medicare compliance     │
│ - Check custom policies         │
│ - Validate against regulations  │
│ - Generate compliance score     │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Audit Results                   │
│ - Compliance Score (0-100)      │
│ - Policy Violations             │
│ - Recommendations               │
│ - Which Policies Applied        │
└─────────────────────────────────┘
```

### 5. Style Adaptation

The system leverages existing `userStyleSamples` mechanism:

```
Custom Style Guide Document
        │
        ▼
┌─────────────────────────────────┐
│ Extract Writing Samples         │
│ - Tone and language patterns    │
│ - Formatting preferences        │
│ - Terminology choices           │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Add to userStyleSamples         │
│ (Existing mechanism)            │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Gemini Uses Samples             │
│ - Learns organizational style   │
│ - Generates notes in that style │
│ - Maintains consistency         │
└─────────────────────────────────┘
```

## Integration Points

### 1. Note Generation Service (`src/services/gemini.ts`)

**Function**: `generateTherapyNote(state, userStyle)`

**Enhancement**:
```typescript
export async function generateTherapyNote(
  state: TherapyState, 
  userStyle?: string,
  customPolicies?: CustomPolicy[]  // NEW
) {
  // Inject custom policies into prompt
  const policyContext = customPolicies
    ? formatPoliciesForPrompt(customPolicies)
    : '';
  
  const prompt = getGenerateNotePrompt(
    state, 
    userStyle,
    policyContext  // NEW
  );
  
  // Rest of function remains the same
  // Gemini will use policies in generation
}
```

### 2. Audit Service (`src/services/gemini.ts`)

**Function**: `auditNoteWithAI(note, documentType)`

**Enhancement**:
```typescript
export async function auditNoteWithAI(
  note: string, 
  documentType: string,
  customPolicies?: CustomPolicy[]  // NEW
) {
  // Extend audit checklist with policy items
  const policyChecklist = customPolicies
    ? generatePolicyChecklist(customPolicies)
    : {};
  
  const prompt = getAuditNotePrompt(
    note, 
    documentType,
    policyChecklist  // NEW
  );
  
  // Gemini audits against both standard and custom policies
}
```

### 3. Gap Analysis (`src/services/gemini.ts`)

**Function**: `analyzeGaps(state)`

**Enhancement**:
```typescript
export async function analyzeGaps(
  state: TherapyState,
  customPolicies?: CustomPolicy[]  // NEW
) {
  // Include policy-specific gaps
  const policyGaps = customPolicies
    ? identifyPolicyGaps(customPolicies, state)
    : [];
  
  const prompt = getAnalyzeGapsPrompt(
    state,
    policyGaps  // NEW
  );
  
  // Gemini identifies gaps specific to policies
}
```

### 4. Prompt System (`src/services/prompts.ts`)

**Enhancement**: Add policy context to all prompts

```typescript
export const getGenerateNotePrompt = (
  state: TherapyState, 
  userStyle?: string,
  policyContext?: string  // NEW
) => `
  ...existing prompt...
  
  ${policyContext ? `
  CUSTOM ORGANIZATIONAL POLICIES:
  ${policyContext}
  
  POLICY COMPLIANCE REQUIREMENTS:
  Ensure the generated note complies with all uploaded policies.
  Reference applicable policies in the note.
  ` : ''}
  
  ...rest of prompt...
`;
```

## Data Flow

### Upload & Processing Flow

```
1. User uploads policy document
   ↓
2. Extract text (PDF/DOCX/TXT parser)
   ↓
3. Gemini interprets policy
   - Extracts key requirements
   - Identifies compliance rules
   - Generates summary
   ↓
4. Store in Knowledge Base
   - Index for search
   - Create embeddings
   - Link to note generation
   ↓
5. Track usage
   - Monitor policy adoption
   - Track policy references
   - Generate analytics
```

### Note Generation Flow

```
1. User initiates note generation
   ↓
2. Retrieve relevant policies
   - Search knowledge base
   - Filter by discipline/document type
   - Rank by relevance
   ↓
3. Inject into prompt
   - Add policy context
   - Add compliance requirements
   - Add style guides
   ↓
4. Call Gemini API
   - Generate note with policies
   - Get grounding metadata
   - Track policy usage
   ↓
5. Return note with metadata
   - Generated note
   - Applied policies
   - Compliance score
   - Policy references
```

## Benefits of This Integration

### 1. Intelligent Policy Interpretation
- Gemini understands policy intent, not just keywords
- Automatically identifies compliance requirements
- Generates policy summaries for quick reference

### 2. Seamless AI Integration
- No changes to existing note generation pipeline
- Policies enhance existing prompts
- Backward compatible with existing functionality

### 3. Dual AI Reliability
- Gemini for advanced policy reasoning
- Local LLM for offline fallback
- Graceful degradation when Gemini unavailable

### 4. Enhanced Compliance
- Notes automatically comply with custom policies
- Audit system validates policy compliance
- Track which policies influenced each note

### 5. Style Consistency
- Leverage existing style adaptation mechanism
- Policies can include style guides
- AI learns organizational writing patterns

### 6. Performance
- Minimal overhead (policies injected into existing prompts)
- No additional API calls required
- Leverages existing caching and optimization

## Implementation Phases

### Phase 1: Core Document Management
- Upload, delete, search documents
- Basic indexing and storage
- No AI integration yet

### Phase 2: AI Integration
- Inject policies into note generation
- Enhance audit system with policy validation
- Track policy usage

### Phase 3: Advanced Features
- Policy versioning and relationships
- Bulk operations
- Advanced analytics

### Phase 4: Optimization
- Semantic search with embeddings
- Policy recommendations
- Predictive policy application

## Security & Compliance

### Data Protection
- Policies encrypted at rest
- PII scrubbing for all documents
- Audit logging for all operations

### HIPAA Compliance
- Secure document storage
- Access control via RBAC
- Audit trails for compliance

### AI Safety
- Gemini safety filtering
- Local LLM for sensitive data
- Error handling and fallback

## Testing Strategy

### Unit Tests
- Document upload/delete/search
- Policy parsing and interpretation
- Prompt injection logic

### Integration Tests
- End-to-end note generation with policies
- Audit system with policy validation
- Fallback to local LLM

### E2E Tests
- User uploads policy
- Generates note using policy
- Verifies policy compliance
- Removes policy

## Conclusion

The Custom Knowledge Base feature seamlessly integrates with TheraDoc's existing AI infrastructure, enhancing note generation and compliance without disrupting existing functionality. By leveraging Gemini's advanced reasoning and the local LLM fallback, the system provides intelligent, reliable policy management that improves clinical documentation quality.

