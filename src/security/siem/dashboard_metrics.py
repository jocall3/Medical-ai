import time
from collections import Counter
from typing import Dict, Any

class DashboardMetrics:
    """
    Provides real-time metrics for SIEM dashboards.
    Tracks event rates, alert volumes, and IoC match counts.
    """
    def __init__(self):
        self.start_time = time.time()
        self.total_events_processed = 0
        self.total_alerts_triggered = 0
        self.event_type_counts = Counter()
        self.severity_counts = Counter()
        self.ioc_match_counts = Counter()

    def record_event(self, event: Dict[str, Any]) -> None:
        """Records an incoming event for metric tracking."""
        self.total_events_processed += 1
        event_type = event.get("type", "unknown")
        self.event_type_counts[event_type] += 1

    def record_alert(self, alert: Dict[str, Any]) -> None:
        """Records a triggered alert for metric tracking."""
        self.total_alerts_triggered += 1
        severity = alert.get("severity", "medium")
        self.severity_counts[severity] += 1
        
        rule_id = alert.get("rule_id", "unknown")
        self.ioc_match_counts[rule_id] += 1

    def get_metrics(self) -> Dict[str, Any]:
        """Returns a structured dictionary of all tracked metrics."""
        uptime = time.time() - self.start_time
        eps = self.total_events_processed / uptime if uptime > 0 else 0.0
        
        return {
            "uptime_seconds": round(uptime, 2),
            "total_events_processed": self.total_events_processed,
            "total_alerts_triggered": self.total_alerts_triggered,
            "events_per_second": round(eps, 2),
            "event_types": dict(self.event_type_counts),
            "alert_severities": dict(self.severity_counts),
            "ioc_matches": dict(self.ioc_match_counts)
        }

    def to_prometheus_format(self) -> str:
        """Formats the metrics in Prometheus exposition format."""
        metrics = self.get_metrics()
        lines = [
            "# HELP siem_uptime_seconds Uptime of the SIEM integration in seconds.",
            "# TYPE siem_uptime_seconds gauge",
            f"siem_uptime_seconds {metrics['uptime_seconds']}",
            
            "# HELP siem_events_processed_total Total number of security events processed.",
            "# TYPE siem_events_processed_total counter",
            f"siem_events_processed_total {metrics['total_events_processed']}",
            
            "# HELP siem_alerts_triggered_total Total number of security alerts triggered.",
            "# TYPE siem_alerts_triggered_total counter",
            f"siem_alerts_triggered_total {metrics['total_alerts_triggered']}",
            
            "# HELP siem_events_per_second Current event processing rate.",
            "# TYPE siem_events_per_second gauge",
            f"siem_events_per_second {metrics['events_per_second']}"
        ]
        
        for event_type, count in metrics["event_types"].items():
            lines.append(f'siem_event_type_total{{type="{event_type}"}} {count}')
            
        for severity, count in metrics["alert_severities"].items():
            lines.append(f'siem_alert_severity_total{{severity="{severity}"}} {count}')
            
        for rule_id, count in metrics["ioc_matches"].items():
            lines.append(f'siem_ioc_match_total{{rule_id="{rule_id}"}} {count}')
            
        return "\n".join(lines)
