# SMART on FHIR Authentication & Authorization Module

This module provides a production-grade, HIPAA-compliant implementation of the SMART on FHIR App Launch framework (v1 and v2) for securing clinical AI workflows.

## Architecture Overview

```
+------------------+          +-------------------------+          +----------------------+
|  EHR Launch /    |  ----->  |   SmartFhirAuthClient   |  ----->  |  MockIdentityProvider|
|  OAuth2 Flow     |          |   (PKCE & Token Exch)   |          |  (Local Dev / Test)  |
+------------------+          +-------------------------+          +----------------------+
                                           |
                                           v
+------------------+          +-------------------------+          +----------------------+
|  AuthMiddleware  |  <-----  |     TokenValidator      |  <-----  |     SessionStore     |
|  (Express / RBAC)|          |     (JWKS Validation)   |          |  (Redis + AES-256)   |
+------------------+          +-------------------------+          +----------------------+
         |
         v
+------------------+          +-------------------------+
|   AuditLogger    |  ----->  |   Immutable HIPAA Logs  |
|  (HIPAA Audits)  |          |   (JSON Stream)         |
+------------------+          +-------------------------+
```

## Key Components

1. **SMART on FHIR Client (`smart-fhir-auth.ts`)**: Handles authorization code flow with PKCE (Proof Key for Code Exchange) and extracts EHR launch context (e.g., `patient`, `encounter`).
2. **Secure Session Store (`session-store.ts`)**: Encrypts access and refresh tokens at rest using AES-256-GCM before storing them in Redis.
3. **Token Validator (`token-validator.ts`)**: High-performance JWT validation using remote JWKS caching.
4. **Scope Parser (`fhir-scopes.ts`)**: Translates SMART on FHIR scopes (e.g., `patient/*.read`) into granular application-level permissions.
5. **HIPAA Audit Logger (`audit-logger.ts`)**: Records all authentication events, token refreshes, and access control failures to an immutable log stream.
6. **Token Refresher (`token-refresher.ts`)**: Background service that silently refreshes tokens to prevent clinical session disruption.
7. **Mock Identity Provider (`mock-identity-provider.ts`)**: Facilitates local development and end-to-end integration testing by simulating a SMART on FHIR authorization server.
8. **Auth Middleware (`auth-middleware.ts`)**: Express middleware that intercepts incoming API requests, validates FHIR tokens, and injects the clinical context into the request.

## Setup Guide

### 1. Initialize the Auth Client
```typescript
import { SmartFhirAuthClient } from './smart-fhir-auth';

const authClient = new SmartFhirAuthClient({
  clientId: 'medical-ai-app',
  redirectUri: 'https://app.medical-ai.local/callback',
  authEndpoint: 'https://ehr.hospital.org/oauth2/authorize',
  tokenEndpoint: 'https://ehr.hospital.org/oauth2/token',
});
```

### 2. Protect Express Routes
```typescript
import express from 'express';
import { AuthMiddleware } from './auth-middleware';
import { TokenValidator } from './token-validator';
import { AuditLogger } from './audit-logger';

const app = express();
const validator = new TokenValidator({
  jwksUri: 'https://ehr.hospital.org/oauth2/keys',
  issuer: 'https://ehr.hospital.org/oauth2',
  audience: 'https://api.medical-ai.local',
});
const auditLogger = new AuditLogger();
const authMiddleware = new AuthMiddleware(validator, auditLogger);

app.use('/api/v1', authMiddleware.getHandler());

// Protect specific resource with SMART scopes
app.get(
  '/api/v1/Patient/:id',
  authMiddleware.requireResourcePermission('Patient', 'read'),
  (req, res) => {
    res.json({ status: 'Access Granted', context: req.fhirContext });
  }
);
```

## Security Considerations
- **Token Encryption**: All tokens stored in Redis are encrypted using AES-256-GCM. Never store raw access tokens in plaintext.
- **PKCE**: Always use PKCE for public and confidential clients to prevent authorization code interception attacks.
- **HIPAA Compliance**: Every authentication failure, access denial, and token refresh is logged with structured metadata to `hipaa-audit.log`.