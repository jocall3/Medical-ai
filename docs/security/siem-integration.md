# SIEM Integration and Threat Intelligence System Design

## 1. Executive Summary & Dissertation Context
In high-stakes medical artificial intelligence environments, safeguarding Protected Health Information (PHI) and maintaining system integrity is not merely a compliance requirement—it is a fundamental pillar of patient safety. A compromised medical AI system could lead to unauthorized access to sensitive genomic data, manipulation of diagnostic models, or denial of service during critical clinical workflows.

This document details the architecture, design, and implementation of our enterprise-grade Security Information and Event Management (SIEM) and Threat Intelligence system. By integrating real-time event forwarding, sliding-window correlation, automated Indicator of Compromise (IoC) matching, and automated incident response, this system establishes a proactive defense-in-depth posture.

## 2. Architectural Overview
The SIEM integration layer acts as a centralized telemetry pipeline, collecting security-relevant events from all microservices and forwarding them to industry-standard analytical platforms.

```
+-----------------------------------------------------------------------+
|                         Medical AI Platform                           |
|  (API Gateways, Model Inference, Database Access, IAM Services)       |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                         Telemetry Pipeline                            |
|  - Splunk Forwarder (HEC)                                             |
|  - Elastic Agent (ECS Mapping)                                        |
|  - Syslog Emitter (RFC 5424 / RFC 3164)                               |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                     Real-Time Security Analysis                       |
|  - Threat Feed Ingestor (STIX/TAXII 2.1 Client)                       |
|  - IoC Matcher (IP, Domain, Hash Lookups)                             |
|  - Correlation Engine (Sliding-Window Stateful Rules)                 |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                     Incident Response & Monitoring                    |
|  - Incident Creator (Jira, ServiceNow, PagerDuty)                     |
|  - Dashboard Metrics (Prometheus Exposition Format)                   |
+-----------------------------------------------------------------------+
```

## 3. Component Deep-Dive

### 3.1. Telemetry Forwarders
*   **Splunk Forwarder (`splunk_forwarder.py`)**: Utilizes the Splunk HTTP Event Collector (HEC) to securely batch and transmit JSON-formatted events. Implements configurable flush intervals and batch sizes to optimize network throughput.
*   **Elastic Agent (`elastic_agent.py`)**: Maps custom application events to the Elastic Common Schema (ECS) version 1.12.0, ensuring standardized field naming conventions for seamless integration with Elastic Security and Kibana dashboards.
*   **Syslog Emitter (`syslog_emitter.py`)**: Provides a fallback, low-overhead logging mechanism conforming to RFC 3164/5424 protocols over UDP or TCP, suitable for legacy infrastructure and network-level logging.

### 3.2. Threat Intelligence & Matching
*   **STIX/TAXII Client (`stix_taxii_client.py`)**: Connects to TAXII 2.1 servers to pull structured STIX 2.1 threat intelligence bundles, extracting indicators such as malicious IPs, domains, and file hashes.
*   **Threat Feed Ingestor (`threat_feed_ingestor.py`)**: Manages the ingestion and local caching of threat intelligence feeds, ensuring high-availability and offline matching capabilities.
*   **IoC Matcher (`ioc_matcher.py`)**: Performs high-performance, O(1) lookups against ingested threat feeds to identify malicious actors interacting with the platform.

### 3.3. Correlation & Automation
*   **Correlation Engine (`correlation_engine.py`)**: Implements stateful, sliding-window correlation rules to detect complex attack patterns, such as successful brute-force attempts (multiple failures followed by a success) and impossible travel anomalies.
*   **Incident Creator (`incident_creator.py`)**: Automatically orchestrates incident creation in Jira, ServiceNow, or PagerDuty upon detection of high-severity alerts, minimizing Mean Time to Respond (MTTR).
*   **Dashboard Metrics (`dashboard_metrics.py`)**: Exposes real-time operational metrics (Events Per Second, alert volumes, IoC matches) in Prometheus-compatible format for continuous monitoring.

## 4. Compliance & Regulatory Alignment
*   **HIPAA Security Rule (§ 164.312(b))**: Audit controls are fully satisfied by logging all access to PHI, configuration changes, and authentication events, with secure forwarding to non-repudiation storage.
*   **GDPR Article 32**: Security of processing is enhanced through real-time threat detection and automated incident response, ensuring rapid containment of potential personal data breaches.
*   **HITECH Act**: Automated incident creation ensures that potential breaches are documented and escalated immediately, facilitating compliance with strict breach notification rules.
