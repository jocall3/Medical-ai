# Envoy Circuit Breakers: Preventing Cascading Clinical Failure

## The Risk of Model Overload
AI models, particularly those handling Genomic Sequencing or High-Res Pathology, are computationally expensive. If a specific inference node becomes overloaded, it can lead to a 'death spiral' where requests queue up, latency spikes, and the entire cluster fails.

## Envoy Configuration Logic
We utilize Envoy's circuit breaking capabilities to enforce hard limits at the network level, preventing the AI models from ever reaching a state of total exhaustion.

### 1. Connection Pool Limits
We define strict limits on the number of concurrent connections to the Genomic Sequencing cluster:
- **max_connections:** Limits the total number of established TCP connections.
- **max_pending_requests:** Limits the number of requests queued while waiting for a connection.
- **max_requests:** Limits the number of concurrent active requests.

### 2. The 'Open' State Logic
When the `upstream_rq_pending_overflow` counter hits a critical threshold, the circuit 'opens.'
- **Immediate Fail-Fast:** Instead of letting the request time out (which wastes resources), Envoy immediately returns a `503 Service Unavailable`.
- **Fallback Routing:** The gateway automatically reroutes the request to a 'Lightweight' version of the model (e.g., a quantized version with lower precision) to provide a baseline diagnosis while the primary node recovers.

## Clinical Significance
In a presidential-grade medical system, 'slow' is as dangerous as 'wrong.' By failing fast and routing to fallback models, we ensure that the system remains responsive. This is the antithesis of the current Medicaid system, where patients wait months for a specialist because the 'system' is overloaded.