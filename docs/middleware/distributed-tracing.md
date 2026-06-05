# Distributed Telemetry & Observability Architecture

This document outlines the architecture of the distributed telemetry system designed for our high-performance, HIPAA-compliant Medical AI platform. Observability in clinical AI systems is not merely a debugging tool; it is a fundamental safety, compliance, and performance requirement.

## 1. Architectural Overview

Our telemetry system is built on top of **OpenTelemetry (OTel)**, the industry standard for vendor-neutral observability. The architecture is designed to handle high-volume, low-latency AI inference workloads while ensuring strict data privacy and regulatory compliance.

```
+-------------------------------------------------------------------------+
|                           Medical AI Services                           |
|  (Inference Nodes, Clinical Gateways, Electronic Health Record Sync)    |
+-------------------------------------------------------------------------+
       |                                 |                         |
       v (Traces)                        v (Metrics)               v (Logs)
+--------------------+             +--------------------+    +--------------------+
|  Clinical Priority |             | AI Inference Node  |    | Correlated Logging |
|      Sampler       |             |  Health Collector  |    |     Formatter      |
+--------------------+             +--------------------+    +--------------------+
       |                                 |                         |
       v                                 v                         v
+--------------------+             +--------------------+    +--------------------+
|   Medical Context  |             |    OTLP Metric     |    |   Standard Out /   | 
|   Span Processor   |             |      Exporter      |    |    FluentBit       |
| (HIPAA PHI Masking)|             +--------------------+    +--------------------+
+--------------------+                       |                         |
       |                                     |                         |
       v                                     v                         v
+-------------------------------------------------------------------------+
|                        OpenTelemetry Collector                          |
|             (Aggregates, filters, and routes telemetry)                 |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                     Observability Backends                              |
|             (Grafana Tempo, Prometheus, Grafana Loki)                   |
+-------------------------------------------------------------------------+
```

## 2. Core Components

### 2.1. HIPAA-Compliant Span Processor (`MedicalContextSpanProcessor`)
To comply with HIPAA regulations, Protected Health Information (PHI) and Personally Identifiable Information (PII) must never be exported to external, unencrypted observability backends. 
- **Automatic Redaction**: The custom span processor scans all span attributes at runtime and redacts sensitive fields (e.g., SSNs, emails, phone numbers, Medical Record Numbers (MRNs), and patient names) using high-performance regular expressions.
- **Clinical Context Enrichment**: Automatically injects non-sensitive clinical metadata (e.g., `clinical_trial_id`, `hospital_id`, `physician_id`) into the span context to allow deep, multi-dimensional analysis of system performance across different clinical environments.

### 2.2. Clinical Priority Sampler (`ClinicalPrioritySampler`)
High-volume AI inference generates massive amounts of telemetry, making 100% trace collection cost-prohibitive and network-heavy. 
- **Deterministic Head-Based Sampling**: Uses the lower 64 bits of the trace ID to make deterministic sampling decisions.
- **Priority-Based Rules**: 
  - **100% Sampling**: Critical clinical operations (e.g., `emergency_diagnostic`, `realtime_surgery_assist`, `high_risk_alert`) are always sampled.
  - **1% Sampling**: Routine, high-frequency operations (e.g., `health_check`, `metrics_scrape`) are heavily down-sampled.
  - **10% Sampling**: Standard operations default to a configurable 10% sampling rate.

### 2.3. AI Inference Node Health Collector (`AIInferenceNodeHealthCollector`)
AI workloads are highly dependent on specialized hardware. Our health collector runs as a background thread on each inference node to record:
- **GPU Metrics**: Real-time GPU memory utilization and temperature via `nvidia-smi` integration.
- **Model Load Times**: Histograms tracking the latency of loading deep learning models into GPU memory.
- **Safety Guardrail Violations**: Counters tracking when an AI model's output violates clinical safety guardrails.

### 2.4. Log Correlation (`TraceCorrelationFilter` & `TraceCorrelationFormatter`)
To enable seamless debugging, all application logs are correlated with distributed traces. By injecting `trace_id` and `span_id` into every log line, operators can instantly jump from a slow trace in Grafana Tempo to the exact corresponding logs in Grafana Loki.

## 3. Context Propagation

When a clinical request traverses multiple microservices (e.g., from the API Gateway to the Inference Service, and finally to the EHR Sync Service), the trace context is propagated using the **W3C Trace Context** standard. 

Our `MedicalContextPropagator` ensures that both standard trace headers (`traceparent`, `tracestate`) and custom clinical headers (e.g., `X-Medical-Clinical-Trial-Id`) are seamlessly injected into outbound HTTP/gRPC requests and extracted at inbound boundaries.
