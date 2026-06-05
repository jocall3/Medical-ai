import logging
from typing import Optional, Sequence
from opentelemetry.sdk.trace.sampling import Sampler, SamplingResult, Decision
from opentelemetry.trace import SpanKind, Link
from opentelemetry.trace.span import TraceState
from opentelemetry.context import Context

logger = logging.getLogger(__name__)

class ClinicalPrioritySampler(Sampler):
    """
    An intelligent, medical-grade sampler that prioritizes critical clinical operations
    (e.g., emergency diagnostics, real-time surgery assistance, high-risk patient alerts)
    by always sampling them, while down-sampling routine operations (e.g., health checks,
    metrics scraping) and applying a configurable ratio-based sampling for standard traffic.
    """
    
    CRITICAL_OPERATIONS = {
        "emergency_diagnostic",
        "realtime_surgery_assist",
        "high_risk_alert",
        "critical_inference",
        "patient_vitals_monitor"
    }

    ROUTINE_OPERATIONS = {
        "health_check",
        "readiness_probe",
        "liveness_probe",
        "metrics_scrape",
        "sync_logs",
        "heartbeat"
    }

    def __init__(self, default_ratio: float = 0.1, routine_ratio: float = 0.01):
        """
        Args:
            default_ratio: The sampling ratio for standard operations (0.0 to 1.0).
            routine_ratio: The sampling ratio for routine/noisy operations (0.0 to 1.0).
        """
        self._default_ratio = default_ratio
        self._routine_ratio = routine_ratio
        # Convert ratios to integer thresholds for deterministic trace ID comparison
        self._default_threshold = int(default_ratio * (1 << 64))
        self._routine_threshold = int(routine_ratio * (1 << 64))

    def should_sample(
        self,
        parent_context: Optional[Context],
        trace_id: int,
        name: str,
        kind: SpanKind = None,
        attributes: Optional[dict] = None,
        links: Optional[Sequence[Link]] = None,
        trace_state: Optional[TraceState] = None,
    ) -> SamplingResult:
        """
        Determines whether a span should be sampled based on clinical priority and trace ID.
        """
        # 1. Check if parent is sampled (respect parent decision to maintain trace integrity)
        if parent_context:
            from opentelemetry.trace import get_current_span
            parent_span = get_current_span(parent_context)
            if parent_span and parent_span.get_span_context().is_valid:
                if parent_span.get_span_context().trace_flags.sampled:
                    return SamplingResult(Decision.RECORD_AND_SAMPLE, attributes, trace_state)
                else:
                    return SamplingResult(Decision.DROP, attributes, trace_state)

        # 2. Check for critical clinical operations (Always Sample)
        operation_name = name.lower()
        if operation_name in self.CRITICAL_OPERATIONS or (attributes and attributes.get("clinical.priority") == "high"):
            return SamplingResult(Decision.RECORD_AND_SAMPLE, attributes, trace_state)

        # 3. Check for routine/noisy operations (Down-sample heavily)
        # Use the lower 64 bits of the trace ID for deterministic sampling
        trace_id_low = trace_id & 0xFFFFFFFFFFFFFFFF
        if operation_name in self.ROUTINE_OPERATIONS or (attributes and attributes.get("clinical.priority") == "low"):
            if trace_id_low < self._routine_threshold:
                return SamplingResult(Decision.RECORD_AND_SAMPLE, attributes, trace_state)
            return SamplingResult(Decision.DROP, attributes, trace_state)

        # 4. Default probabilistic sampling for standard operations
        if trace_id_low < self._default_threshold:
            return SamplingResult(Decision.RECORD_AND_SAMPLE, attributes, trace_state)

        return SamplingResult(Decision.DROP, attributes, trace_state)

    def get_description(self) -> str:
        return f"ClinicalPrioritySampler{{default_ratio={self._default_ratio}, routine_ratio={self._routine_ratio}}}"
