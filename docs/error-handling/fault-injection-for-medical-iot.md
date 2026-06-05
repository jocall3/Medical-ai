# Fault Injection for Medical IoT Streams

## Technical Specification: Resilience Testing for Predictive AI
Predictive monitoring AI is only as good as the data it receives. If a medical IoT stream becomes corrupted or delayed, the AI may hallucinate a patient crisis or miss a real one. This document outlines the tools used to inject faults into IoT streams to harden the predictive engine.

## 1. The Fault Injection Layer
We implement a 'Chaos Proxy' between the IoT Gateway and the AI Inference Engine. This proxy allows us to manipulate the telemetry stream in real-time.

## 2. Injection Profiles

### 2.1 Latency Injection (The 'Lag' Profile)
- **Mechanism:** Buffers incoming packets and releases them with a Gaussian distribution of delay (mean=100ms, std=50ms).
- **Goal:** Test if the AI's time-series analysis can handle asynchronous data arrival without triggering false 'Asystole' (flatline) alerts.

### 2.2 HTTP 500/Timeout Injection (The 'Outage' Profile)
- **Mechanism:** Randomly returns `HTTP 500 Internal Server Error` or drops the connection entirely for 5-30 seconds.
- **Goal:** Validate the AI's ability to enter 'Degraded Mode,' where it relies on the last known good state and increases the uncertainty interval of its predictions.

### 2.3 Data Corruption (The 'Noise' Profile)
- **Mechanism:** Flips bits in the payload or injects random outliers (e.g., changing a heart rate of 70 to 700).
- **Goal:** Ensure the AI's input validation layer (Z-score filtering) catches the outlier before it enters the neural network, preventing a 'Garbage In, Garbage Out' failure.

## 3. Success Metrics
- **Recovery Time Objective (RTO):** The AI must resume normal operation within 2 seconds of the fault being removed.
- **False Positive Rate (FPR):** The FPR during fault injection must not increase by more than 0.1% compared to the baseline.