# Medical-AI Python Client Library SDK Documentation

Welcome to the official Python SDK documentation for the Medical-AI API ecosystem. This library provides a unified, high-performance, and type-safe interface to interact with our suite of clinical AI microservices.

## Installation

```bash
pip install medical-ai-sdk
```

## Initialization

To begin, import the `MedicalAIClient` and initialize it with your API credentials and gateway URL.

```python
from medical_ai import MedicalAIClient

client = MedicalAIClient(
    api_key="your_api_key_here",
    base_url="https://api.medical-ai.internal/v1"
)
```

## Core Services & Code Examples

### 1. Automated Triage Service

Evaluate patient acuity and calculate Emergency Severity Index (ESI) scores.

```python
triage_data = {
    "vitals": {
        "heart_rate": 110,
        "systolic_bp": 95,
        "diastolic_bp": 60,
        "temperature": 38.5,
        "spo2": 94,
        "respiratory_rate": 24
    },
    "symptoms": ["acute chest pain", "shortness of breath"],
    "age": 45
}

response = client.triage.score(triage_data)
print(f"ESI Score: {response.esi_score}")
print(f"ICU Admission Probability: {response.icu_admission_probability * 100}%")
print(f"Clinical Reasoning: {response.clinical_reasoning}")
```

### 2. Genomic Sequencing & Variant Detection

Annotate genomic variants for pathogenicity and therapeutic implications.

```python
genomic_data = {
    "variants": [
        {
            "chromosome": "17",
            "position": 41197764,
            "reference": "A",
            "alternate": "G"
        }
    ]
}

response = client.genomic.analyze_variants(genomic_data)
for variant in response.annotated_variants:
    print(f"Variant: {variant.variant} | Pathogenicity: {variant.pathogenicity}")
    print(f"Associated Phenotypes: {variant.associated_phenotypes}")
```

### 3. Robotic Surgery Assistance (v1 & v2)

Perform real-time tissue boundary detection and trajectory correction.

```python
# Robotic Surgery v1: Boundary Detection
boundary_response = client.robotic_surgery.detect_boundaries(frame_data="base64_encoded_frame_bytes")
print(f"Safety Margin: {boundary_response.safety_margin_mm} mm")

# Robotic Surgery v2: Advanced Vision-Guided Assistance
surgery_v2_response = client.robotic_surgery_v2.get_guidance(
    stereo_frame_left="left_frame_bytes",
    stereo_frame_right="right_frame_bytes",
    current_coordinates=[12.4, 45.1, -3.2]
)
print(f"Trajectory Correction Vector: {surgery_v2_response.trajectory_correction_vector}")
```

### 4. Radiology Diagnostics

Analyze medical imaging and generate structured clinical reports.

```python
radiology_response = client.radiology.analyze(
    image_metadata={"modality": "CT", "body_part": "CHEST"},
    raw_bytes_base64="base64_dicom_bytes"
)
print(f"Structured Report: {radiology_response.structured_report}")
```

### 5. Psychiatric Biomarker Analysis

Screen for psychiatric conditions using acoustic and linguistic features.

```python
psych_response = client.psychiatric.analyze(
    audio_features={
        "pitch_mean": 120.5,
        "jitter": 0.015,
        "shimmer": 0.035,
        "speech_rate": 2.1
    },
    transcript="I have been feeling extremely exhausted and disconnected lately."
)
print(f"Depression Risk Score: {psych_response.depression_risk_score}")
```

### 6. Personalized Pharmacology Engine

Simulate PK/PD profiles and optimize drug dosing.

```python
pkpd_response = client.pharmacology.simulate_pkpd(
    drug_name="Warfarin",
    dose_mg=5.0,
    patient_weight_kg=70.0,
    egfr=85.0
)
print(f"Drug Half-Life: {pkpd_response.half_life_hours} hours")
```

### 7. Predictive Patient Monitoring

Process real-time telemetry streams to predict clinical deterioration.

```python
monitoring_response = client.monitoring.predict_deterioration(
    telemetry_stream=[
        {
            "timestamp": "2026-06-05T02:00:00Z",
            "heart_rate": 98,
            "spo2": 96,
            "systolic_bp": 110,
            "respiratory_rate": 18
        }
    ]
)
print(f"NEWS2 Score: {monitoring_response.news2_score}")
```

### 8. Administrative Workflow Automation

Extract structured clinical entities from unstructured clinical notes.

```python
extraction_response = client.admin_workflow.extract(
    clinical_note="Patient presents with type 2 diabetes mellitus, prescribed Metformin 500mg BID."
)
for entity in extraction_response.extracted_entities:
    print(f"Entity: {entity.text} | Category: {entity.category} | Code: {entity.standardized_code}")
```

## Error Handling

The SDK raises specific exceptions to help you handle API errors gracefully.

```python
from medical_ai.exceptions import APIError, ValidationError

try:
    client.triage.score(invalid_data)
except ValidationError as e:
    print(f"Validation failed: {e.message}")
except APIError as e:
    print(f"API error occurred: {e.status_code} - {e.message}")
```
