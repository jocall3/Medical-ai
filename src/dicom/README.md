# DICOM/PACS Integration Module

This module provides the core infrastructure for medical imaging data ingestion, processing, and management. 

## Key Components
- **Parser**: High-performance DICOM header and pixel data extraction.
- **PACS Client**: DICOMweb-compliant interface for hospital integration.
- **Anonymizer**: HIPAA-compliant PHI scrubbing engine.
- **Sync Service**: Automated background synchronization with PACS.

## Architecture
We use a PostgreSQL-backed metadata store for rapid querying, ensuring that AI pipelines can efficiently locate and retrieve relevant studies.