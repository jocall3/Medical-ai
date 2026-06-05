class MeshTelemetry:
    def collect_security_metrics(self):
        # Collects mTLS handshake failures and authz denials
        return {"metrics": ["istio_tcp_connections_closed_total", "istio_requests_total"]}