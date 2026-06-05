import re
import logging
from opentelemetry.sdk.trace import SpanProcessor, ReadableSpan
from opentelemetry.trace import Span
from opentelemetry.context import Context
from typing import Optional

logger = logging.getLogger(__name__)

# Common PHI/PII patterns to redact
SSN_PATTERN = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')
EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
PHONE_PATTERN = re.compile(r'\b(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})\b')
MRN_PATTERN = re.compile(r'\bMRN-\d{6,10}\b', re.IGNORECASE)  # Medical Record Number

class MedicalContextSpanProcessor(SpanProcessor):
    """
    A custom OpenTelemetry SpanProcessor designed for medical AI environments.
    It enforces HIPAA compliance by automatically redacting PHI/PII from span attributes
    and enriches spans with active clinical context.
    """
    
    def on_start(self, span: Span, parent_context: Optional[Context] = None) -> None:
        """
        Called when a span starts. Enriches the span with global clinical context if available.
        """
        if parent_context:
            # Extract custom context keys
            for key in ["clinical_trial_id", "hospital_id", "physician_id", "patient_consent_level"]:
                val = parent_context.get(key)
                if val:
                    span.set_attribute(f"medical.context.{key}", val)

    def on_end(self, span: ReadableSpan) -> None:
        """
        Called when a span ends. Scans and redacts any sensitive PHI/PII from attributes
        before the span is exported to external observability backends.
        """
        if not span.is_recording():
            return

        try:
            attributes = getattr(span, "_attributes", None)
            if attributes is None:
                return

            keys_to_sanitize = list(attributes.keys())
            for key in keys_to_sanitize:
                val = attributes[key]
                if isinstance(val, str):
                    sanitized_val = self._sanitize_string(val)
                    if sanitized_val != val:
                        attributes[key] = sanitized_val
                
                # Also redact specific keys entirely or mask them
                if any(phi_key in key.lower() for phi_key in ["patient_name", "ssn", "mrn", "patient_dob", "phone", "email", "address"]):
                    attributes[key] = "[REDACTED_PHI_COMPLIANT]"
        except Exception as e:
            logger.error(f"Error sanitizing span attributes for HIPAA compliance: {e}")

    def _sanitize_string(self, text: str) -> str:
        """
        Applies regex patterns to redact sensitive medical and personal identifiers.
        """
        text = SSN_PATTERN.sub("[REDACTED_SSN]", text)
        text = EMAIL_PATTERN.sub("[REDACTED_EMAIL]", text)
        text = PHONE_PATTERN.sub("[REDACTED_PHONE]", text)
        text = MRN_PATTERN.sub("[REDACTED_MRN]", text)
        return text

    def force_flush(self, timeout_millis: int = 30000) -> bool:
        return True

    def shutdown(self) -> None:
        pass
