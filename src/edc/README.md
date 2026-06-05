# Clinical Trial Electronic Data Capture (EDC) Module

This module provides a production-grade, 21 CFR Part 11 and CDISC-compliant Electronic Data Capture (EDC) system. It is designed to handle clinical trial protocols, subject visits, dynamic Case Report Forms (CRFs), complex validation rules, immutable audit trails, query workflows, electronic signatures, and double-blind randomization.

## Architecture & Compliance

### 1. 21 CFR Part 11 Compliance
- **Immutable Audit Trail (`audit-trail-service.ts`)**: Every data entry, modification, and query resolution is cryptographically hashed and chained to the previous entry (SHA-256 hash chain). This guarantees data integrity and prevents retroactive tampering.
- **Electronic Signatures (`signature-service.ts`)**: Implements dual-factor authentication (username/password verification) and cryptographic signing of the subject's casebook data using RSA-2048 key pairs.
- **Reason for Change**: Any modification to submitted data requires a mandatory justification, which is permanently recorded in the audit trail.

### 2. CDISC Standards Integration (`export-service.ts`)
- **CDISC ODM (Operational Data Model)**: Supports exporting clinical trial metadata and transactional clinical data into standard-compliant XML format.
- **CDISC SDTM (Study Data Tabulation Model)**: Maps raw CRF data into standard SDTM domains such as Demographics (DM) and Vital Signs (VS) for regulatory submissions (FDA/EMA).

### 3. Dynamic CRF Engine (`crf-definition-service.ts` & `data-entry-validator.ts`)
- **Dynamic Schema Definition**: CRFs are defined using a structured JSON schema specifying field types, constraints, and options.
- **Complex Validation Engine**: Enforces protocol-defined ranges, required fields, and cross-field assertions (e.g., ensuring Systolic BP is greater than Diastolic BP, or validating pregnancy status against gender).
- **Auto-Queries**: Automatically raises data queries when values fall outside physiological or protocol-defined limits.

### 4. Query Management Workflow (`query-management-service.ts`)
- Facilitates communication between clinical monitors and site coordinators.
- Implements a strict state machine: `OPEN` -> `ANSWERED` -> `RESOLVED` -> `CLOSED`.

### 5. Double-Blind Randomization (`randomization-engine.ts`)
- Implements block randomization to maintain balance across treatment arms.
- Manages kit allocation and provides a strictly audited emergency unblinding procedure.

## Database Schema (`edc-schema.sql`)
The PostgreSQL schema defines the relational structure for protocols, sites, subjects, visits, CRFs, audit logs, queries, and signatures, complete with indexes optimized for high-throughput clinical trials.