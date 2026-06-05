import logging
from typing import Dict, Any, Optional
from src.security.siem.threat_feed_ingestor import ThreatFeedIngestor

logger = logging.getLogger("SIEM.IoCMatcher")

class IoCMatcher:
    """
    Matches incoming logs, network requests, or user activities
    against Indicators of Compromise (IoCs) loaded from threat feeds.
    """
    def __init__(self, ingestor: ThreatFeedIngestor):
        self.ingestor = ingestor

    def match_ip(self, ip: str) -> Optional[Dict[str, Any]]:
        """Checks if an IP address is a known malicious indicator."""
        if ip in self.ingestor.malicious_ips:
            return {
                "ioc_type": "ip",
                "value": ip,
                "severity": "high",
                "description": "IP address matched known malicious threat intelligence feed."
            }
        return None

    def match_domain(self, domain: str) -> Optional[Dict[str, Any]]:
        """Checks if a domain is a known malicious indicator."""
        if domain in self.ingestor.malicious_domains:
            return {
                "ioc_type": "domain",
                "value": domain,
                "severity": "high",
                "description": "Domain matched known malicious threat intelligence feed."
            }
        return None

    def match_hash(self, file_hash: str) -> Optional[Dict[str, Any]]:
        """Checks if a file hash (MD5/SHA256) is a known malicious indicator."""
        normalized = file_hash.strip().lower()
        if normalized in self.ingestor.malicious_hashes:
            return {
                "ioc_type": "hash",
                "value": file_hash,
                "severity": "critical",
                "description": "File hash matched known malware signature."
            }
        return None

    def inspect_event(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Inspects a generic event dictionary for any matching IoCs.
        Looks for keys like 'source_ip', 'dest_ip', 'domain', 'file_hash'.
        """
        for ip_key in ["source_ip", "dest_ip", "ip_address", "client_ip"]:
            if ip_key in event:
                match = self.match_ip(event[ip_key])
                if match:
                    return match

        for domain_key in ["domain", "host", "request_domain"]:
            if domain_key in event:
                match = self.match_domain(event[domain_key])
                if match:
                    return match

        for hash_key in ["file_hash", "sha256", "md5", "payload_hash"]:
            if hash_key in event:
                match = self.match_hash(event[hash_key])
                if match:
                    return match

        return None
