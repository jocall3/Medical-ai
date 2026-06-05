# Medical-AI SDK Design Principles

## Vision
The SDK must be accessible to two distinct personas: the **Clinical Researcher** (who knows medicine but not necessarily PyTorch) and the **Software Engineer** (who knows systems but not necessarily pathology).

## Core Principles

### 1. Type-Safe Clinical Entities
Avoid generic strings or floats. Use strongly typed clinical units.
- **Bad**: `setDosage(50)`
- **Good**: `setDosage(new Dosage(50, Unit.MG))`

### 2. Declarative Model Configuration
Researchers should define *what* the model should achieve, not *how* to implement the tensor operations.
- **Pattern**: Use a high-level DSL (Domain Specific Language) for defining clinical constraints (e.g., `Constraint.mustNotExceed(HeartRate, 200)`).

### 3. Fail-Safe Defaults
In a medical context, a crash is better than a wrong answer. The SDK must implement "Safe-Fail" patterns.
- **Pattern**: If a model's confidence is low, the SDK must return a `ClinicalUncertainty` object rather than a best-guess prediction.

### 4. Transparent Provenance
Every output from the SDK must carry its "Lineage".
- **Metadata**: Every prediction includes the model version, the training dataset hash, and the specific clinical guidelines used for validation.