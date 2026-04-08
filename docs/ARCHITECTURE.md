# TheraDoc Architecture

**Version**: 2.5 Pro  
**Last Updated**: April 7, 2026

---

## System Overview

TheraDoc is a React-based clinical documentation assistant that helps Physical Therapists (PT), Occupational Therapists (OT), and Speech-Language Pathologists (ST) generate Medicare-compliant therapy notes using AI.

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Motion (animations)
- Lucide React (icons)

**AI Services:**
- Google Gemini Pro (primary)
- AWS Bedrock Claude (optional)
- TinyLlama (local fallback)

**Testing:**
- Vitest (unit tests)
- Playwright (E2E tests)
- React Testing Library

**State Management:**
- React Context API
- Session Storage (persistence)
- Local Storage (settings)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Sidebar  │  │ MainContent  │  │ PreviewPanel │          │
│  │          │  │              │  │              │          │
│  │ History  │  │ Step Wizard  │  │ Note Preview │          │
│  │ Settings │  │ Form Inputs  │  │ Audit Score  │          │
│  └──────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   State Management Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐     │
│  │         TherapySessionContext                      │     │
│  │  - Current state (discipline, CPT, details)        │     │
│  │  - History & clipboard                             │     │
│  │  - Generated notes                                 │     │
│  │  - Audit results                                   │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Note         │  │ Audit        │  │ Template     │      │
│  │ Generation   │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Knowledge    │  │ Bulk Ops     │  │ Export       │      │
│  │ Base         │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      AI Services Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Gemini Pro   │  │ AWS Bedrock  │  │ TinyLlama    │      │
│  │ (Primary)    │  │ (Optional)   │  │ (Fallback)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Persistence Layer                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Session      │  │ Local        │  │ Backend      │      │
│  │ Storage      │  │ Storage      │  │ (Optional)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. User Interface Components

#### Sidebar (`src/components/TherapyApp/Sidebar.tsx`)
- Note history display
- Clipboard manager
- Local mode toggle
- Style settings access
- Guided tour launcher

#### MainContent (`src/components/TherapyApp/MainContent.tsx`)
- Step wizard navigation
- Form inputs for each step
- Progress tracking
- Step rail (visual progress)

#### PreviewPanel (`src/components/TherapyApp/PreviewPanel.tsx`)
- Generated note display
- Audit score visualization
- Edit functionality
- Tumble (AI refinement)
- Export options

### 2. State Management

#### TherapySessionContext (`src/contexts/TherapySessionContext.tsx`)
**Purpose**: Centralized state management for the entire therapy session

**State Includes:**
- Current therapy state (discipline, document type, CPT code, etc.)
- Generated notes and audit results
- History and clipboard
- UI state (loading, errors)
- User preferences

**Key Functions:**
- `handleGenerate()` - Generate therapy note
- `handleAudit()` - Audit note for compliance
- `handleTumble()` - Refine note with AI
- `handleBrainDump()` - Parse free-text input
- `finalizeSession()` - Save and reset

### 3. Business Logic Services

#### Note Generation (`src/services/bedrock.ts`)
**Purpose**: Generate therapy notes using AI

**Flow:**
1. Validate required fields
2. Build prompt from therapy state
3. Call AI service (Gemini → Bedrock → TinyLlama)
4. Parse and format response
5. Return generated note

#### Audit Service (`src/services/bedrock.ts`)
**Purpose**: Audit notes for Medicare compliance

**Checks:**
- Medical necessity documentation
- Skilled terminology usage
- Objective measurements
- Functional outcomes
- Safety considerations
- Progress documentation

#### Knowledge Base (`src/services/knowledgeBaseService.ts`)
**Purpose**: Manage custom policies and documents

**Features:**
- Document upload (PDF, DOCX, TXT)
- Policy interpretation
- Compliance checking
- Usage tracking
- Analytics

---

## Data Flow

### Note Generation Flow

```
User fills form
      ↓
Click "Generate Note"
      ↓
useTherapySession.handleGenerate()
      ↓
Validate required fields
      ↓
Build prompt from state
      ↓
Call AI Service:
  1. Try Gemini (if Local Mode + API key)
  2. Try AWS Bedrock (if credentials)
  3. Fallback to TinyLlama
      ↓
Parse AI response
      ↓
Run compliance audit
      ↓
Calculate audit score
      ↓
Update state with note + audit
      ↓
Save to history
      ↓
Display in PreviewPanel
```

### Audit Flow

```
Generated note exists
      ↓
Click "Audit" button
      ↓
useTherapySession.handleAudit()
      ↓
Call AI audit service
      ↓
Call local knowledge base audit
      ↓
Merge findings
      ↓
Calculate compliance score
      ↓
Update state with audit result
      ↓
Display score + findings
```

---

## Key Design Patterns

### 1. Context + Hooks Pattern
- `TherapySessionContext` provides state
- `useTherapySession` hook consumes context
- Components use hook for state access

### 2. Service Layer Pattern
- Business logic separated from UI
- Services are pure functions
- Easy to test and mock

### 3. Fallback Pattern
- Primary AI service (Gemini)
- Secondary AI service (Bedrock)
- Tertiary fallback (TinyLlama)
- Graceful degradation

### 4. Wizard Pattern
- Multi-step form
- Progress tracking
- Validation at each step
- Can skip steps

---

## Security Architecture

### Data Protection
- PII scrubbing before AI calls
- Local mode for sensitive data
- Session storage (not persistent)
- No server-side storage by default

### Authentication (Optional Backend)
- JWT tokens
- Password hashing (PBKDF2)
- Session management
- Audit logging

### API Security
- API keys in environment variables
- HTTPS only
- Rate limiting (planned)
- Input validation with Zod

---

## Performance Optimizations

### Code Splitting
- Lazy loading of major components
- Suspense boundaries
- Vendor chunk splitting
- Route-based splitting

### Caching
- Session storage for state
- Local storage for settings
- Memoization of expensive computations

### Bundle Optimization
- Tree shaking
- Minification
- Gzip compression
- Separate vendor bundles

---

## Testing Strategy

### Unit Tests (733 tests)
- Component tests with React Testing Library
- Service tests with Vitest
- Hook tests with renderHook
- 99.55% code coverage

### Integration Tests
- Multi-step workflows
- State management
- API integration
- Error handling

### E2E Tests (Playwright)
- Complete user flows
- Accessibility testing
- Performance testing
- Visual regression

---

## Deployment Architecture

### Development
```
Local Machine
  ↓
Vite Dev Server (port 3001)
  ↓
Hot Module Replacement
  ↓
Browser
```

### Production
```
Build Process (npm run build)
  ↓
Static Assets (dist/)
  ↓
CDN / Static Hosting
  ↓
Browser
```

### Optional Backend
```
Express Server
  ↓
In-Memory Storage
  ↓
REST API
  ↓
Frontend
```

---

## Scalability Considerations

### Current Limitations
- In-memory storage (not persistent)
- Single-user focus
- No real-time collaboration
- Limited to browser capabilities

### Future Enhancements
- Database integration (PostgreSQL)
- Multi-user support
- Real-time collaboration (WebSockets)
- Microservices architecture
- Kubernetes deployment

---

## Technology Decisions

### Why React?
- Component reusability
- Large ecosystem
- TypeScript support
- Performance optimizations

### Why Vite?
- Fast development server
- Excellent TypeScript support
- Modern build tooling
- Plugin ecosystem

### Why Gemini?
- High-quality text generation
- Good medical knowledge
- Reasonable pricing
- Easy API integration

### Why Context API?
- Built into React
- Sufficient for app size
- No external dependencies
- Easy to understand

---

## Monitoring & Observability

### Logging
- Pino logger for structured logs
- Different log levels (debug, info, warn, error)
- Context-aware logging

### Error Tracking
- Error boundaries in React
- Console error logging
- User-friendly error messages

### Performance Monitoring (Planned)
- Web Vitals tracking
- Custom performance marks
- API response times
- User interaction tracking

---

## Conclusion

TheraDoc follows a clean, layered architecture with clear separation of concerns. The system is designed for maintainability, testability, and extensibility while maintaining high performance and user experience.

**Key Strengths:**
- ✅ Clean separation of concerns
- ✅ Comprehensive testing
- ✅ Type-safe with TypeScript
- ✅ Graceful AI fallbacks
- ✅ Performance optimized

**Areas for Improvement:**
- Database integration
- Real-time collaboration
- Advanced caching
- Microservices architecture
