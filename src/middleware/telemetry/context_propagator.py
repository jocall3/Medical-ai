import logging
from typing import Dict, Any, Optional
from opentelemetry import propagate
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
from opentelemetry.context import Context, attach, detach, get_current

logger = logging.getLogger(__name__)

class MedicalContextPropagator:
    """
    Handles distributed trace context propagation across microservices,
    ensuring that clinical context (e.g., patient_id, clinical_trial_id)
    is propagated alongside standard W3C traceparent headers.
    """
    
    def __init__(self):
        self.propagator = TraceContextTextMapPropagator()

    def inject_context(self, carrier: Dict[str, str], context: Optional[Context] = None) -> Dict[str, str]:
        """
        Injects the current trace context and custom medical headers into the carrier (e.g., HTTP headers).
        """
        if context is None:
            context = get_current()
            
        # Inject standard W3C traceparent/tracestate
        self.propagator.inject(carrier, context=context)
        
        # Inject custom medical context keys if they exist in the context
        for key in ["clinical_trial_id", "hospital_id", "physician_id", "patient_consent_level"]:
            val = context.get(key)
            if val:
                carrier[f"X-Medical-{key.replace('_', '-').title()}"] = str(val)
                
        return carrier

    def extract_context(self, carrier: Dict[str, str]) -> Context:
        """
        Extracts trace context and custom medical headers from the carrier,
        returning a new Context object.
        """
        # Extract standard W3C traceparent/tracestate
        context = self.propagator.extract(carrier)
        
        # Extract custom medical context keys and inject them into the context
        for key in ["clinical_trial_id", "hospital_id", "physician_id", "patient_consent_level"]:
            header_name = f"X-Medical-{key.replace('_', '-').title()}"
            if header_name in carrier:
                context = context.set(key, carrier[header_name])
                
        return context

    def attach_context(self, context: Context) -> Any:
        """
        Attaches the context to the current thread/execution context.
        Returns a token that must be used to detach the context later.
        """
        return attach(context)

    def detach_context(self, token: Any) -> None:
        """
        Detaches the context using the token returned by attach_context.
        """
        detach(token)
