# TheraDoc API Documentation

**Version**: 2.5 Pro  
**Last Updated**: April 7, 2026

---

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Client-Side Services](#client-side-services)
- [Backend API Endpoints](#backend-api-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Security](#security)

---

## Overview

TheraDoc provides both client-side services and an optional backend API for persistence and multi-user support.

**Base URL**: `http://localhost:3001/api` (development)

**Supported AI Providers**:
- Google Gemini Pro (primary)
- AWS Bedrock (fallback)
- TinyLlama (local fallback)

---

## Authentication

### Register User

**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com"
  }
}
```

### Login

**POST** `/api/auth/login`

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com"
  }
}
```

**Rate Limit**: 5 requests per 15 minutes

---

## Client-Side Services

### Note Generation Service

#### `generateTherapyNote(state, userStyle, customPolicies)`

Generates a therapy note using AI.

**Parameters:**
- `state: TherapyState` - Current therapy session state
- `userStyle?: string` - User's writing style preferences
- `customPolicies?: Document[]` - Custom policy documents

**Returns:**
```typescript
Promise<{
  text: string;
  appliedPolicies: string[];
  factCheck?: FactCheckResult;
  modelProvider: string;
  modelId: string;
  groundingMetadata?: any;
}>
```

**Example:**
```typescript
const result = await generateTherapyNote({
  discipline: 'PT',
  documentType: 'Daily',
  cptCode: '97110',
  mode: 'Individual',
  activity: 'Gait Training',
  details: {
    'Distance': '50 feet',
    'Assistance Level': 'Minimal'
  }
}, 'Professional'
);
```

**AI Provider Priority**:
1. Gemini Pro (if API key configured)
2. AWS Bedrock (if credentials configured)
3. TinyLlama (local fallback)

---

## Backend API Endpoints

All backend endpoints require authentication via JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

### Notes

#### Create Note

**POST** `/api/notes`

Save a new therapy note.

**Request Body:**
```json
{
  "discipline": "PT",
  "documentType": "Daily",
  "cptCode": "97110",
  "content": "Patient performed gait training...",
  "metadata": {
    "patientId": "patient-123",
    "sessionDate": "2026-04-07"
  }
}
```

**Response:**
```json
{
  "id": "note-456",
  "userId": "user-123",
  "discipline": "PT",
  "documentType": "Daily",
  "cptCode": "97110",
  "content": "Patient performed gait training...",
  "metadata": {
    "patientId": "patient-123",
    "sessionDate": "2026-04-07"
  },
  "createdAt": "2026-04-07T10:30:00Z",
  "updatedAt": "2026-04-07T10:30:00Z"
}
```

**Rate Limit**: 60 requests per minute

#### Get Note

**GET** `/api/notes/:id`

Retrieve a specific note.

**Response:**
```json
{
  "id": "note-456",
  "userId": "user-123",
  "discipline": "PT",
  "content": "Patient performed gait training...",
  "createdAt": "2026-04-07T10:30:00Z"
}
```

#### Update Note

**PUT** `/api/notes/:id`

Update an existing note.

**Request Body:**
```json
{
  "content": "Updated content...",
  "metadata": {
    "revised": true
  }
}
```

**Response:**
```json
{
  "id": "note-456",
  "content": "Updated content...",
  "updatedAt": "2026-04-07T11:00:00Z"
}
```

#### Delete Note

**DELETE** `/api/notes/:id`

Delete a note.

**Response:**
```json
{
  "success": true,
  "message": "Note deleted successfully"
}
```

#### List Notes

**GET** `/api/notes`

Get all notes for the authenticated user.

**Query Parameters:**
- `discipline` - Filter by discipline (PT, OT, ST)
- `documentType` - Filter by document type
- `limit` - Number of results (default: 50, max: 100)
- `offset` - Pagination offset

**Response:**
```json
{
  "notes": [
    {
      "id": "note-456",
      "discipline": "PT",
      "content": "...",
      "createdAt": "2026-04-07T10:30:00Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

### Documents

#### Upload Document

**POST** `/api/documents/upload`

Upload a policy or reference document.

**Request:**
- Content-Type: `multipart/form-data`
- File field: `file`
- Additional fields: `title`, `category`, `tags`

**Response:**
```json
{
  "id": "doc-789",
  "title": "Facility Policy",
  "filename": "policy.pdf",
  "size": 102400,
  "uploadedAt": "2026-04-07T10:30:00Z"
}
```

**Rate Limit**: 5 uploads per minute

#### List Documents

**GET** `/api/documents`

Get all documents for the authenticated user.

**Query Parameters:**
- `category` - Filter by category
- `tags` - Filter by tags (comma-separated)
- `search` - Search in title and content

**Response:**
```json
{
  "documents": [
    {
      "id": "doc-789",
      "title": "Facility Policy",
      "category": "policy",
      "tags": ["compliance", "hipaa"],
      "uploadedAt": "2026-04-07T10:30:00Z"
    }
  ],
  "total": 15
}
```

#### Delete Document

**DELETE** `/api/documents/:id`

Delete a document.

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### Audit Logs

#### Get Audit Logs

**GET** `/api/audit/logs`

Retrieve audit logs for the authenticated user.

**Query Parameters:**
- `action` - Filter by action type
- `resourceType` - Filter by resource type
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `limit` - Number of results (default: 100)

**Response:**
```json
{
  "logs": [
    {
      "id": "audit-123",
      "userId": "user-123",
      "action": "note_created",
      "resourceType": "note",
      "resourceId": "note-456",
      "timestamp": "2026-04-07T10:30:00Z",
      "metadata": {
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      }
    }
  ],
  "total": 250
}
```

#### Generate Audit Report

**GET** `/api/audit/report`

Generate a comprehensive audit report.

**Query Parameters:**
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `format` - Report format (json, csv, pdf)

**Response:**
```json
{
  "report": {
    "period": {
      "start": "2026-04-01T00:00:00Z",
      "end": "2026-04-07T23:59:59Z"
    },
    "summary": {
      "totalActions": 1250,
      "uniqueUsers": 15,
      "noteCreated": 450,
      "noteUpdated": 320,
      "noteDeleted": 25
    },
    "details": [...]
  }
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Common Error Codes

- `AUTH_REQUIRED` - Authentication token missing
- `AUTH_INVALID` - Invalid or expired token
- `VALIDATION_ERROR` - Request validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `PERMISSION_DENIED` - User lacks required permissions
- `SERVER_ERROR` - Internal server error

---

## Rate Limiting

Rate limits are applied per user (authenticated) or IP address (unauthenticated).

### Limits by Endpoint Type

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| API (general) | 60 requests | 1 minute |
| AI Generation | 10 requests | 1 minute |
| File Uploads | 5 requests | 1 minute |
| Sensitive Operations | 10 requests | 1 hour |

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2026-04-07T10:31:00Z
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests, please try again later.",
  "retryAfter": 45
}
```

---

## Security

### Authentication

- JWT tokens with 24-hour expiration
- Tokens must be included in `Authorization` header
- Refresh tokens not yet implemented (coming soon)

### Security Headers

All responses include security headers:
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`

### Input Sanitization

All user inputs are sanitized to prevent:
- XSS attacks
- SQL injection
- Script injection
- Path traversal

### CORS

CORS is configured to allow requests from:
- `http://localhost:3001` (development)
- Production domains (configured per environment)

### Data Encryption

- Passwords hashed with bcrypt (10 rounds)
- Sensitive data encrypted at rest
- TLS/SSL required in production

---

## Webhooks (Coming Soon)

Future support for webhooks to notify external systems of events:
- Note created
- Note updated
- Document uploaded
- Audit threshold exceeded

---

## SDK Support (Coming Soon)

Official SDKs planned for:
- JavaScript/TypeScript
- Python
- Java

---

## API Versioning

Current version: `v1`

API version is included in the URL path: `/api/v1/...`

Breaking changes will result in a new version number.

---

## Support

For API support:
- Check [DEVELOPMENT.md](./DEVELOPMENT.md) for development guide
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system architecture
- Open an issue on GitHub
- Contact support team

---

## Changelog

### Version 2.5 Pro (April 2026)
- Added Gemini Pro integration
- Improved rate limiting
- Enhanced security headers
- Added audit reporting
- Performance monitoring

### Version 2.0 (March 2026)
- Multi-user support
- Backend API
- Document management
- Audit logging

### Version 1.0 (February 2026)
- Initial release
- Client-side note generation
- PT, OT, ST support
