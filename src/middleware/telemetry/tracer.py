import os
import logging
from typing import Optional
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter

from src.middleware.telemetry.resource_detector import MedicalNodeResourceDetector
from src.middleware.telemetry.sampler import ClinicalPrioritySampler
from src.middleware.telemetry.span_processor import MedicalContextSpanProcessor
from src.middleware.telemetry.otlp_exporter import get_otlp_span_exporter

logger = logging.getLogger(__name__)

_TRACER_PROVIDER: Optional[TracerProvider] = None

def initialize_tracer(service_name: str, environment: str = "production") -> TracerProvider:
    """
    Initializes the global OpenTelemetry TracerProvider with custom medical resource detection,
    clinical priority sampling, and HIPAA-compliant PHI/PII masking span processors.
    """
    global _TRACER_PROVIDER
    if _TRACER_PROVIDER is not None:
        logger.warning("TracerProvider has already been initialized.")
        return _TRACER_PROVIDER

    # 1. Detect resources (K8s, GPU, Host, Medical Node metadata)
    detector = MedicalNodeResourceDetector()
    resource = detector.detect()
    
    # Merge with default service name and environment
    resource = resource.merge(
        resource.create({
            "service.name": service_name,
            "deployment.environment": environment,
            "telemetry.sdk.language": "python"
        })
    )

    # 2. Configure the Clinical Priority Sampler
    # High-priority clinical operations are always sampled; routine operations are sampled probabilistically.
    sampler = ClinicalPrioritySampler(default_ratio=0.1)

    # 3. Initialize TracerProvider
    provider = TracerProvider(resource=resource, sampler=sampler)
    trace.set_tracer_provider(provider)

    # 4. Add Custom Medical Context Span Processor (for PHI/PII masking and clinical metadata enrichment)
    medical_processor = MedicalContextSpanProcessor()
    provider.add_span_processor(medical_processor)

    # 5. Add OTLP Exporter (or fallback to Console in development)
    try:
        otlp_exporter = get_otlp_span_exporter()
        if otlp_exporter:
            batch_processor = BatchSpanProcessor(otlp_exporter)
            provider.add_span_processor(batch_processor)
            logger.info("OTLP Span Exporter successfully registered.")
        else:
            logger.info("No OTLP endpoint configured. Falling back to ConsoleSpanExporter.")
            console_exporter = ConsoleSpanExporter()
            provider.add_span_processor(BatchSpanProcessor(console_exporter))
    except Exception as e:
        logger.error(f"Failed to initialize OTLP Span Exporter: {e}. Falling back to ConsoleSpanExporter.")
        console_exporter = ConsoleSpanExporter()
        provider.add_span_processor(BatchSpanProcessor(console_exporter))

    _TRACER_PROVIDER = provider
    return provider

def get_tracer(name: str, version: Optional[str] = None) -> trace.Tracer:
    """
    Retrieves a tracer instance from the global provider.
    """
    return trace.get_tracer(name, version)
