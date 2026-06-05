# Secure Data Provenance and Lineage System

## 1. Executive Summary & Architectural Vision
In clinical AI, transparency, auditability, and non-repudiation are not merely software requirements—they are clinical imperatives. To achieve Nobel-prize-level rigor and cure complex ailments, we must guarantee that every model prediction, every weight update, and every clinical recommendation can be traced back to its raw, verified clinical source (e.g., DICOM images, EHR records, genomic sequences). This document details the design of our **Secure Data Provenance and Lineage System**, which implements the W3C PROV standard combined with state-of-the-art cryptographic verification.

## 2. Core Components

```
+-----------------------------------------------------------------+
|                      Clinical Data Pipeline                     |
+-----------------------------------------------------------------+
                                | (Logs events)
                                v
+-----------------------------------------------------------------+
|                     Transformation Logger                       |
+-----------------------------------------------------------------+
                                |
        +-----------------------+-----------------------+
        | (Registers nodes/edges)                       | (Appends blocks)
        v                                               v
+-------------------------------+               +-----------------+
|        Lineage Tracker        |               | Tamper-Evident  |
+-------------------------------+               |       Log       |
        | (Exports PROV-JSON)                   +-----------------+
        v                                               |
+-------------------------------+                       | (Signs blocks)
|      ProvJsonExporter         |                       v
+-------------------------------+               +-----------------+
        |                                       | Metadata Signer |
        v                                       +-----------------+
+-------------------------------+                       |
|    ProvenanceGraphDatabase    | <---------------------+ (Verifies signatures)
+-------------------------------+ 
        |
        v
+-------------------------------+
|      ProvenanceQueryAPI       |
+-----------------------------++
```

### 2.1 Lineage Tracker (`lineage_tracker.py`)
Implements the W3C PROV standard, defining three primary node types:
- **Entity**: Data artifacts (e.g., raw DICOM, normalized tensor, model weights).
- **Activity**: Processes/computations (e.g., segmentation, training, inference).
- **Agent**: Actors (e.g., clinical researcher, automated pipeline, AI model).

### 2.2 Metadata Signer (`metadata_signer.py`)
Provides asymmetric cryptographic signing (RSASSA-PSS-SHA256) and verification of provenance metadata to ensure non-repudiation. If the `cryptography` library is unavailable, it gracefully falls back to HMAC-SHA256.

### 2.3 Provenance Graph Database (`graph_database.py`)
An in-memory directed graph database optimized for storing and querying W3C PROV lineage data. It supports upstream (ancestor) and downstream (descendant) traversal to trace data lineage.

### 2.4 Transformation Logger (`transformation_logger.py`)
Provides decorators and context managers to automatically log transformations, capturing inputs, outputs, parameters, and system environment details.

### 2.5 Source Verifier (`source_verifier.py`)
Verifies file integrity (SHA-256) and validates metadata schemas of original clinical data sources before they enter the AI pipeline.

### 2.6 Reproducibility Engine (`reproducibility_engine.py`)
Ensures AI model training is reproducible by setting seeds across all standard libraries (Python, NumPy, PyTorch) and capturing the exact execution environment details.

### 2.7 PROV-JSON Exporter (`export_prov_json.py`)
Exports internal lineage tracking data into the official W3C PROV-JSON format, ensuring interoperability with external clinical auditing tools.

### 2.8 Tamper-Evident Log (`tamper_evident_log.py`)
Maintains an append-only, tamper-evident cryptographic ledger (hash chain) of provenance events. Any tampering with past records is immediately detected.

### 2.9 Query API (`query_api.py`)
Provides an API interface for querying data lineage and verifying provenance integrity.

## 3. Integration Guide

To integrate secure provenance tracking into a clinical training pipeline:

```python
from src.logging.provenance.lineage_tracker import LineageTracker
from src.logging.provenance.transformation_logger import TransformationLogger
from src.logging.provenance.reproducibility_engine import ReproducibilityEngine

# 1. Initialize components
tracker = LineageTracker()
logger = TransformationLogger(tracker)
repro_engine = ReproducibilityEngine()

# 2. Set deterministic seeds and capture environment
blueprint = repro_engine.generate_reproducibility_blueprint(
    seed=42, 
    hyperparameters={"learning_rate": 0.001, "epochs": 10}
)

# 3. Track transformations using decorators
@logger.track_transformation(activity_name="Normalize MRI Scan", agent_name="Preprocess Engine")
def normalize_mri(scan_data):
    # Normalization logic here
    return scan_data * 0.5
```
