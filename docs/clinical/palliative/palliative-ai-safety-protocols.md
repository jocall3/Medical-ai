# Dissertation: Safety-Critical Guardrails for AI-Driven Palliative Care

## Introduction
In the context of end-of-life care, the margin for error is zero. An AI that over-sedates a patient or misses a sign of acute distress is a failure of the highest order. This document outlines the safety-critical guardrails required to ensure the AI remains a tool for comfort, not a source of harm.

## 1. The 'Human-in-the-Loop' (HITL) Requirement

### 1.1 Critical Intervention Thresholds
While the AI can suggest medication adjustments, any change exceeding a **$\pm 15\%$ variance** from the current dose must be approved by a licensed clinician. This prevents 'algorithmic runaway' where the AI might aggressively titrate medication in a feedback loop.

### 1.2 The Override Protocol
Clinicians possess a physical 'Hard Override' switch. Activating this switch immediately reverts the AI to a passive monitoring state, returning all control to the human provider.

## 2. Real-Time Monitoring of Symptom Clusters

### 2.1 The Distress Divergence Alert
The AI monitors the divergence between **Objective Biometrics** (HRV, Respiratory Rate) and **Subjective Reports** (Patient's reported pain scale).
- **Divergence Alert:** If the patient reports 'No Pain' but biometrics indicate high distress (tachycardia, tachypnea), the AI flags this as 'Masked Distress' and triggers an immediate clinical review.

### 2.2 Fail-Safe Medication Delivery
- All AI-driven medication pumps must have hardware-level limits (Hard Caps) that cannot be bypassed by software, preventing lethal overdoses regardless of AI logic.

## 3. Algorithmic Bias and Equity Guardrails

### 3.1 Demographic Parity Checks
To prevent the AI from under-treating pain in minority populations (a documented failure of the current healthcare system), the AI performs real-time **Demographic Parity Audits**. If the AI's recommendations for a specific demographic are consistently lower than the average, the system triggers a bias alert and requires a manual audit of the training data.

## 4. Conclusion
Safety in AI palliative care is not about the absence of errors, but the presence of robust, redundant systems that catch errors before they reach the patient. We are building a system where the AI's primary goal is the preservation of dignity through the absolute prevention of suffering.