# Observability & Telemetry Design

## Overview
In medical AI, "it works" is not enough. We need to know *why* it works and *when* it stops working.

## The Observability Stack

### 1. Software Telemetry (The Vitals)
- **Latency & Throughput**: Monitoring the time from patient data input to AI diagnosis.
- **Error Rates**: Tracking 4xx/5xx errors in the API layer.
- **Resource Utilization**: Monitoring GPU memory and CPU spikes during large-scale inference.

### 2. Model Telemetry (The Cognition)
- **Prediction Confidence**: Tracking the distribution of confidence scores. A sudden drop in average confidence indicates a shift in patient population.
- **Feature Attribution**: Using SHAP or Integrated Gradients to log *which* features led to a specific diagnosis.
- **Logits Distribution**: Monitoring the raw output of the model to detect "over-confidence" or "collapse."

### 3. Clinical Drift Monitoring
- **Data Drift**: Comparing the distribution of incoming patient data (e.g., age, blood pressure) against the training baseline using the Kolmogorov-Smirnov test.
- **Concept Drift**: Monitoring the accuracy of the AI against ground-truth outcomes (e.g., did the AI predict a heart attack that actually happened?).

## Alerting Logic
- **Critical Alert**: Triggered if the model's sensitivity for a life-threatening ailment drops by >0.1%.
- **Warning Alert**: Triggered if data drift is detected in a non-critical feature (e.g., a change in the brand of MRI machine used at a clinic).