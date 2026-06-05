# Distributed Rate Limiting: Protecting the Neural Network of Health

## The Problem: Systemic Fragility
Legacy Electronic Health Record (EHR) systems are notoriously unstable. A single misconfigured loop in a hospital's legacy software can trigger a DDoS-like event, potentially crashing the AI inference nodes that thousands of other hospitals rely on. To prevent this, we implement a Redis-backed distributed rate limiter.

## Technical Implementation

### 1. The Sliding Window Algorithm
We utilize a Redis-based sliding window counter to ensure precision. Unlike fixed windows, sliding windows prevent 'bursting' at the edge of time boundaries.

**Logic Flow:**
1. **Key Generation:** `rate_limit:{hospital_id}:{api_endpoint}`
2. **ZSET Storage:** Each request is stored as a member in a Redis Sorted Set (ZSET) with the timestamp as the score.
3. **Pruning:** `ZREMRANGEBYSCORE key -inf (current_timestamp - window_size)`
4. **Counting:** `ZCARD key` to determine current request volume.
5. **Decision:** If `ZCARD > limit`, return `HTTP 429 Too Many Requests`.

### 2. Tiered Quotas
Rate limits are not uniform; they are based on clinical throughput requirements:
- **Emergency Departments:** High burst capacity to handle mass-casualty events.
- **Rural Clinics:** Guaranteed minimum bandwidth to prevent 'urban-bias' in AI access.
- **Research Institutions:** Throttled during peak clinical hours to prioritize patient care over data mining.

## Empirical Justification
This mechanism ensures that no single failing institution can jeopardize the global health grid. It replaces the 'pay-to-play' model of private healthcare with a 'need-to-serve' model, where resources are allocated based on patient volume and acuity, not profit margins.