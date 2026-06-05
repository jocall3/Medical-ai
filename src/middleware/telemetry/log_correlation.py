import logging
from opentelemetry import trace

class TraceCorrelationFilter(logging.Filter):
    """
    A logging filter that injects the current OpenTelemetry trace_id, span_id,
    and trace_flags into the log record for distributed log correlation.
    """
    def filter(self, record: logging.LogRecord) -> bool:
        span = trace.get_current_span()
        if span and span.get_span_context().is_valid:
            context = span.get_span_context()
            record.trace_id = format(context.trace_id, "032x")
            record.span_id = format(context.span_id, "016x")
            record.trace_flags = f"0{context.trace_flags:x}"
        else:
            record.trace_id = "0" * 32
            record.span_id = "0" * 16
            record.trace_flags = "00"
        return True

class TraceCorrelationFormatter(logging.Formatter):
    """
    A custom logging formatter that formats logs with trace and span IDs.
    Example format:
    %(asctime)s [%(levelname)s] [trace_id=%(trace_id)s span_id=%(span_id)s] %(name)s: %(message)s
    """
    def __init__(self, fmt: str = None, datefmt: str = None, style: str = "%"):
        if fmt is None:
            fmt = "%(asctime)s [%(levelname)s] [trace_id=%(trace_id)s span_id=%(span_id)s] %(name)s: %(message)s"
        super().__init__(fmt, datefmt, style)

def setup_correlated_logging(level: int = logging.INFO) -> None:
    """
    Configures the root logger to include trace correlation fields.
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Remove existing handlers to avoid duplicate logs
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    handler = logging.StreamHandler()
    handler.addFilter(TraceCorrelationFilter())
    
    formatter = TraceCorrelationFormatter()
    handler.setFormatter(formatter)
    
    root_logger.addHandler(handler)
    logging.info("Correlated logging initialized successfully.")
