# Technical Specification: Explainability in Psychiatric AI (X-Psych)

## The 'Black Box' Problem
In psychiatry, a 'prediction' is not enough. A clinician cannot commit a patient to a ward or change a medication based on a 'black box' output. We require **Explainable AI (XAI)** to ensure clinical safety and legal accountability.

## 1. The X-Psych Framework

### 1.1 Feature Attribution (SHAP/LIME Integration)
For every risk assessment, the system must generate a **Feature Attribution Map**:
- **Example:** If the AI predicts a 'High Suicide Risk,' it must explicitly state: *'Risk driven by 30% increase in speech latency, 20% decrease in lexical diversity, and 40% increase in negative valence keywords.'*

### 1.2 Counterfactual Explanations
The system must provide 'What-If' scenarios to the clinician:
- *'If the patient's sleep patterns had remained stable over the last 48 hours, the risk score would have dropped from 0.85 to 0.40.'*

### 1.3 Visual Evidence Mapping
- **Acoustic Spectrograms:** Highlighting the exact segments of audio that triggered the 'manic' classification.
- **Connectivity Maps:** Showing the specific neural circuits in an fMRI scan that the AI identified as dysfunctional.

## 2. Clinical Validation Loop

- **Clinician-in-the-Loop (CITL):** The clinician can 'correct' the AI's reasoning. If the AI misidentifies a regional accent as a biomarker for depression, the clinician flags it, and the model updates its local weights via **Online Learning**.

## 3. Conclusion
Explainability is the bridge between raw data and clinical action. Without it, AI is a tool; with it, AI is a partner.