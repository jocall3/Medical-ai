import json
import logging
import time
import urllib3
from typing import Dict, Any, List, Optional

logger = logging.getLogger("SIEM.SplunkForwarder")

class SplunkForwarder:
    """
    Forwards security events to Splunk HTTP Event Collector (HEC).
    Supports batching, retries, and secure TLS configuration.
    """
    def __init__(
        self,
        hec_url: str,
        token: str,
        index: str = "medical_ai_security",
        source: str = "medical_ai_app",
        sourcetype: str = "_json",
        verify_tls: bool = True,
        batch_size: int = 20,
        flush_interval_sec: float = 5.0
    ):
        self.hec_url = hec_url.rstrip('/') + '/services/collector/event'
        self.token = token
        self.index = index
        self.source = source
        self.sourcetype = sourcetype
        self.verify_tls = verify_tls
        self.batch_size = batch_size
        self.flush_interval_sec = flush_interval_sec
        self.buffer: List[Dict[str, Any]] = []
        self.last_flush_time = time.time()
        
        self.http = urllib3.PoolManager(
            cert_reqs='CERT_REQUIRED' if verify_tls else 'CERT_NONE'
        )
        self.headers = {
            "Authorization": f"Splunk {self.token}",
            "Content-Type": "application/json"
        }

    def format_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Formats the event payload for Splunk HEC."""
        return {
            "time": event.get("timestamp", time.time()),
            "host": event.get("host", "medical-ai-platform"),
            "source": self.source,
            "sourcetype": self.sourcetype,
            "index": self.index,
            "event": event
        }

    def emit(self, event: Dict[str, Any]) -> None:
        """Queues an event and flushes if batch size or interval is reached."""
        formatted = self.format_event(event)
        self.buffer.append(formatted)
        
        if len(self.buffer) >= self.batch_size or (time.time() - self.last_flush_time) >= self.flush_interval_sec:
            self.flush()

    def flush(self) -> bool:
        """Flushes the buffered events to Splunk HEC."""
        if not self.buffer:
            return True
        
        payload = "\n".join(json.dumps(evt) for evt in self.buffer)
        self.buffer.clear()
        self.last_flush_time = time.time()
        
        try:
            response = self.http.request(
                "POST",
                self.hec_url,
                headers=self.headers,
                body=payload,
                timeout=10.0
            )
            if response.status == 200:
                logger.debug("Successfully forwarded events to Splunk HEC.")
                return True
            else:
                logger.error(f"Failed to forward events to Splunk. Status: {response.status}, Response: {response.data.decode('utf-8')}")
                return False
        except Exception as e:
            logger.error(f"Exception occurred while forwarding to Splunk: {str(e)}")
            return False
