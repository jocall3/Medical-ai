import logging
import urllib3
import json
from typing import Dict, Any, Optional

logger = logging.getLogger("SIEM.IncidentCreator")

class IncidentCreator:
    """
    Automatically creates incidents in ticketing systems (e.g., Jira, ServiceNow, PagerDuty)
    when high-severity security events or correlated alerts are triggered.
    """
    def __init__(
        self,
        system_type: str,
        api_url: str,
        api_token: str,
        verify_tls: bool = True
    ):
        self.system_type = system_type.lower()
        self.api_url = api_url.rstrip('/')
        self.api_token = api_token
        self.http = urllib3.PoolManager(
            cert_reqs='CERT_REQUIRED' if verify_tls else 'CERT_NONE'
        )
        self.headers = {
            "Content-Type": "application/json"
        }
        self._setup_auth()

    def _setup_auth(self) -> None:
        if self.system_type == "jira":
            import base64
            encoded = base64.b64encode(self.api_token.encode()).decode()
            self.headers["Authorization"] = f"Basic {encoded}"
        elif self.system_type == "servicenow":
            import base64
            encoded = base64.b64encode(self.api_token.encode()).decode()
            self.headers["Authorization"] = f"Basic {encoded}"
        elif self.system_type == "pagerduty":
            self.headers["Authorization"] = f"Token token={self.api_token}"

    def create_incident(self, alert: Dict[str, Any]) -> Optional[str]:
        """
        Creates an incident ticket based on the alert details.
        Returns the incident ID/Key if successful, else None.
        """
        if self.system_type == "jira":
            return self._create_jira_issue(alert)
        elif self.system_type == "servicenow":
            return self._create_servicenow_incident(alert)
        elif self.system_type == "pagerduty":
            return self._create_pagerduty_incident(alert)
        else:
            logger.error(f"Unsupported ticketing system: {self.system_type}")
            return None

    def _create_jira_issue(self, alert: Dict[str, Any]) -> Optional[str]:
        url = f"{self.api_url}/rest/api/3/issue"
        payload = {
            "fields": {
                "project": {"key": "SEC"},
                "summary": f"[SIEM ALERT] {alert.get('title', 'Security Alert')}",
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": alert.get("description", "No description provided.")
                                }
                            ]
                        }
                    ]
                },
                "issuetype": {"name": "Incident"},
                "priority": {"name": "High" if alert.get("severity") == "high" else "Medium"}
            }
        }
        try:
            response = self.http.request("POST", url, headers=self.headers, body=json.dumps(payload), timeout=10.0)
            if response.status == 201:
                res_data = json.loads(response.data.decode('utf-8'))
                logger.info(f"Successfully created Jira issue: {res_data.get('key')}")
                return res_data.get("key")
            else:
                logger.error(f"Failed to create Jira issue. Status: {response.status}, Response: {response.data.decode('utf-8')}")
                return None
        except Exception as e:
            logger.error(f"Exception creating Jira issue: {str(e)}")
            return None

    def _create_servicenow_incident(self, alert: Dict[str, Any]) -> Optional[str]:
        url = f"{self.api_url}/api/now/table/incident"
        payload = {
            "short_description": f"[SIEM ALERT] {alert.get('title', 'Security Alert')}",
            "description": alert.get("description", "No description provided."),
            "urgency": "1" if alert.get("severity") == "critical" else "2",
            "severity": "1" if alert.get("severity") == "critical" else "2",
            "comments": f"Rule ID: {alert.get('rule_id', 'N/A')}"
        }
        try:
            response = self.http.request("POST", url, headers=self.headers, body=json.dumps(payload), timeout=10.0)
            if response.status == 201:
                res_data = json.loads(response.data.decode('utf-8'))
                sys_id = res_data.get("result", {}).get("sys_id")
                logger.info(f"Successfully created ServiceNow incident: {sys_id}")
                return sys_id
            else:
                logger.error(f"Failed to create ServiceNow incident. Status: {response.status}")
                return None
        except Exception as e:
            logger.error(f"Exception creating ServiceNow incident: {str(e)}")
            return None

    def _create_pagerduty_incident(self, alert: Dict[str, Any]) -> Optional[str]:
        url = f"{self.api_url}/v2/enqueue"
        payload = {
            "payload": {
                "summary": alert.get("title", "Security Alert"),
                "severity": "critical" if alert.get("severity") in ["critical", "high"] else "warning",
                "source": "Medical AI SIEM",
                "custom_details": alert
            },
            "routing_key": self.api_token,
            "event_action": "trigger"
        }
        try:
            response = self.http.request("POST", url, headers=self.headers, body=json.dumps(payload), timeout=10.0)
            if response.status == 202:
                res_data = json.loads(response.data.decode('utf-8'))
                dedup_key = res_data.get("dedup_key")
                logger.info(f"Successfully triggered PagerDuty incident: {dedup_key}")
                return dedup_key
            else:
                logger.error(f"Failed to trigger PagerDuty incident. Status: {response.status}")
                return None
        except Exception as e:
            logger.error(f"Exception triggering PagerDuty incident: {str(e)}")
            return None
