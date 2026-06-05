import os
import logging
from typing import Optional
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter as GrpcSpanExporter
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter as HttpSpanExporter

logger = logging.getLogger(__name__)

def get_otlp_span_exporter() -> Optional[object]:
    """
    Configures and returns an OpenTelemetry OTLP Span Exporter based on environment variables.
    Supports both gRPC and HTTP protocols, secure TLS, and custom headers.
    """
    endpoint = os.getenv("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT") or os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    if not endpoint:
        logger.info("OTEL_EXPORTER_OTLP_ENDPOINT is not set. OTLP exporter will not be initialized.")
        return None

    protocol = os.getenv("OTEL_EXPORTER_OTLP_TRACES_PROTOCOL") or os.getenv("OTEL_EXPORTER_OTLP_PROTOCOL", "grpc")
    
    # Parse headers (e.g., API keys, auth tokens)
    headers_str = os.getenv("OTEL_EXPORTER_OTLP_HEADERS", "")
    headers = {}
    if headers_str:
        for item in headers_str.split(","):
            if "=" in item:
                k, v = item.split("=", 1)
                headers[k.strip()] = v.strip()

    # Check for TLS certificates
    certificate_path = os.getenv("OTEL_EXPORTER_OTLP_CERTIFICATE")
    credentials = None
    if certificate_path and os.path.exists(certificate_path):
        try:
            with open(certificate_path, "rb") as f:
                credentials = f.read()
        except Exception as e:
            logger.error(f"Failed to read OTLP certificate from {certificate_path}: {e}")

    logger.info(f"Initializing OTLP Span Exporter pointing to {endpoint} via {protocol}")

    if protocol == "http/protobuf":
        return HttpSpanExporter(
            endpoint=endpoint,
            headers=headers,
            timeout=int(os.getenv("OTEL_EXPORTER_OTLP_TIMEOUT", "10"))
        )
    else:
        # Default to gRPC
        return GrpcSpanExporter(
            endpoint=endpoint,
            headers=headers,
            credentials=credentials,
            timeout=int(os.getenv("OTEL_EXPORTER_OTLP_TIMEOUT", "10"))
        )
