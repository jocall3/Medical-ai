import logging
import time
from collections import defaultdict, deque
from typing import Dict, Any, List, Callable

logger = logging.getLogger("SIEM.CorrelationEngine")

class CorrelationEngine:
    """
    Correlates security events across different sources in real-time
    using sliding windows and stateful rules to detect complex attacks.
    """
    def __init__(self, window_size_sec: int = 300):
        self.window_size_sec = window_size_sec
        self.ip_history = defaultdict(deque)
        self.user_history = defaultdict(deque)
        self.alert_callbacks: List[Callable[[Dict[str, Any]], None]] = []

    def register_alert_callback(self, callback: Callable[[Dict[str, Any]], None]) -> None:
        """Registers a callback function to handle generated correlation alerts."""
        self.alert_callbacks.append(callback)

    def _clean_old_events(self, history_deque: deque, current_time: float) -> None:
        """Removes events older than the sliding window size."""
        while history_deque and (current_time - history_deque[0]["timestamp"]) > self.window_size_sec:
            history_deque.popleft()

    def process_event(self, event: Dict[str, Any]) -> None:
        """Processes an incoming event and runs correlation rules."""
        current_time = event.get("timestamp", time.time())
        event["timestamp"] = current_time
        
        source_ip = event.get("source_ip")
        user_id = event.get("user_id")

        if source_ip:
            self._clean_old_events(self.ip_history[source_ip], current_time)
            self.ip_history[source_ip].append(event)
            self._evaluate_ip_rules(source_ip)

        if user_id:
            self._clean_old_events(self.user_history[user_id], current_time)
            self.user_history[user_id].append(event)
            self._evaluate_user_rules(user_id)

    def _trigger_alert(self, alert: Dict[str, Any]) -> None:
        """Triggers registered alert callbacks."""
        logger.warning(f"Correlation Alert Triggered: {alert['title']} - Severity: {alert['severity']}")
        for callback in self.alert_callbacks:
            try:
                callback(alert)
            except Exception as e:
                logger.error(f"Error in alert callback: {str(e)}")

    def _evaluate_ip_rules(self, ip: str) -> None:
        """Evaluates correlation rules grouped by source IP."""
        events = list(self.ip_history[ip])
        
        failed_logins = [e for e in events if e.get("action") == "user-login" and e.get("outcome") == "failure"]
        successful_logins = [e for e in events if e.get("action") == "user-login" and e.get("outcome") == "success"]
        
        if len(failed_logins) >= 5 and successful_logins:
            last_failure_time = max(e["timestamp"] for e in failed_logins)
            first_success_after_failure = [s for s in successful_logins if s["timestamp"] > last_failure_time]
            
            if first_success_after_failure:
                self._trigger_alert({
                    "title": "Brute Force Attack Successful",
                    "description": f"IP {ip} had {len(failed_logins)} failed login attempts followed by a successful login.",
                    "severity": "critical",
                    "source_ip": ip,
                    "timestamp": time.time(),
                    "rule_id": "RULE_BRUTE_FORCE_SUCCESS"
                })

        error_events = [e for e in events if e.get("outcome") in ["403", "404", "forbidden", "unauthorized"]]
        if len(error_events) >= 50:
            self._trigger_alert({
                "title": "Potential API Scanning / Abuse",
                "description": f"IP {ip} generated {len(error_events)} authorization/not-found errors within {self.window_size_sec} seconds.",
                "severity": "high",
                "source_ip": ip,
                "timestamp": time.time(),
                "rule_id": "RULE_API_SCANNING"
                })

    def _evaluate_user_rules(self, user_id: str) -> None:
        """Evaluates correlation rules grouped by user ID."""
        events = list(self.user_history[user_id])
        
        logins = [e for e in events if e.get("action") == "user-login" and e.get("outcome") == "success"]
        ips = {e.get("source_ip") for e in logins if e.get("source_ip")}
        
        if len(ips) >= 3:
            self._trigger_alert({
                "title": "Impossible Travel / Multi-IP Session",
                "description": f"User {user_id} logged in from {len(ips)} distinct IP addresses within {self.window_size_sec} seconds.",
                "severity": "high",
                "user_id": user_id,
                "timestamp": time.time(),
                "rule_id": "RULE_IMPOSSIBLE_TRAVEL"
            })
