import os
import logging
from typing import Optional
from opentelemetry import metrics
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader, ConsoleMetricExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter as GrpcMetricExporter
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter as HttpMetricExporter
from src.middleware.telemetry.resource_detector import MedicalNodeResourceDetector

logger = logging.getLogger(__name__)

_METER_PROVIDER: Optional[MeterProvider] = None

def initialize_metrics(service_name: str, environment: str = "production") -> MeterProvider:
    """
    Initializes the global OpenTelemetry MeterProvider with custom resource detection
    and registers the OTLP or Console metric exporter.
    """
    global _METER_PROVIDER
    if _METER_PROVIDER is not None:
        logger.warning("MeterProvider has already been initialized.")
        return _METER_PROVIDER

    # 1. Detect resources
    detector = MedicalNodeResourceDetector()
    resource = detector.detect()
    resource = resource.merge(
        resource.create({
            "service.name": service_name,
            "deployment.environment": environment,
            "telemetry.sdk.language": "python"
        })
    )

    # 2. Determine Exporter
    otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_METRICS_ENDPOINT") or os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    protocol = os.getenv("OTEL_EXPORTER_OTLP_METRICS_PROTOCOL") or os.getenv("OTEL_EXPORTER_OTLP_PROTOCOL", "grpc")

    if otlp_endpoint:
        logger.info(f"Configuring OTLP Metric Exporter to {otlp_endpoint} via {protocol}")
        if protocol == "http/protobuf":
            exporter = HttpMetricExporter(endpoint=otlp_endpoint)
        else:
            exporter = GrpcMetricExporter(endpoint=otlp_endpoint)
    else:
        logger.info("No OTLP metrics endpoint configured. Falling back to ConsoleMetricExporter.")
        exporter = ConsoleMetricExporter()

    # 3. Create Metric Reader and Provider
    reader = PeriodicExportingMetricReader(exporter, export_interval_millis=15000)
    provider = MeterProvider(resource=resource, metric_readers=[reader])
    
    metrics.set_meter_provider(provider)
    _METER_PROVIDER = provider
    return provider

def get_meter(name: str, version: Optional[str] = None) -> metrics.Meter:
    """
    Retrieves a meter instance from the global provider.
    """
    return metrics.get_meter(name, version)
