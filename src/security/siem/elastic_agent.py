import logging
import time
from typing import Dict, Any, List, Optional
import urllib3
import json

logger = logging.getLogger("SIEM.ElasticAgent")

class ElasticAgent:
    """
    Integrates with Elastic Security (Elasticsearch) to index security events.
    Uses ECS (Elastic Common Schema) formatting and bulk indexing.
    """
    def __init__(
        self,
        hosts: List[str],
        api_key: Optional[str] = None,
        basic_auth: Optional[tuple] = None,
        index_pattern: str = "medical-ai-security-events",
        verify_tls: bool = True
    ):
        self.hosts = hosts
        self.api_key = api_key
        self.basic_auth = basic_auth
        self.index_pattern = index_pattern
        self.http = urllib3.PoolManager(
            cert_reqs='CERT_REQUIRED' if verify_tls else 'CERT_NONE'
        )
        self.headers = {"Content-Type": "application/json"}
        if api_key:
            self.headers["Authorization"] = f"ApiKey {api_key}"
        elif basic_auth:
            import base64
            auth_str = f"{basic_auth[0]}:{basic_auth[1]}"
            encoded = base64.b64encode(auth_str.encode()).decode()
            self.headers["Authorization"] = f"Basic {encoded}"

    def to_ecs(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Maps custom security events to Elastic Common Schema (ECS) format."""
        ecs_event = {
            "@timestamp": event.get("timestamp", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())),
            "ecs": {"version": "1.12.0"},
            "event": {
                "category": [event.get("category", "iam")],
                "type": [event.get("type", "access")],
                "outcome": event.get("outcome", "success"),
                "action": event.get("action", "user-login"),
                "severity": event.get("severity", 1)
            },
            "user": {
                "id": event.get("user_id", "unknown"),
                "name": event.get("username", "anonymous")
            },
            "source": {
                "ip": event.get("source_ip", "0.0.0.0")
            },
            "message": event.get("message", "No message provided"),
            "metadata": event.get("metadata", {})
        }
        return ecs_event

    def bulk_index(self, events: List[Dict[str, Any]]) -> bool:
        """Performs a bulk index operation into Elasticsearch."""
        if not events:
            return True
        
        bulk_data = ""
        for event in events:
            ecs_event = self.to_ecs(event)
            action = {"index": {"_index": self.index_pattern}}
            bulk_data += json.dumps(action) + "\n" + json.dumps(ecs_event) + "\n"
            
        try:
            url = f"{self.hosts[0].rstrip('/')}/_bulk"
            response = self.http.request(
                "POST",
                url,
                headers=self.headers,
                body=bulk_data,
                timeout=15.0
            )
            if response.status == 200:
                res_json = json.loads(response.data.decode('utf-8'))
                if res_json.get("errors"):
                    logger.warning("Bulk indexing completed with some errors.")
                return True
            else:
                logger.error(f"Elastic bulk index failed. Status: {response.status}, Response: {response.data.decode('utf-8')}")
                return False
        except Exception as e:
            logger.error(f"Exception during Elastic bulk index: {str(e)}")
            return False
