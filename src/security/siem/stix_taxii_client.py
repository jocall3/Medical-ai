import logging
import urllib3
import json
import base64
from typing import Dict, Any, List, Optional

logger = logging.getLogger("SIEM.StixTaxiiClient")

class StixTaxiiClient:
    """
    A lightweight client for fetching STIX 2.1 threat intelligence bundles
    from TAXII 2.1 servers.
    """
    def __init__(
        self,
        discovery_url: str,
        username: Optional[str] = None,
        password: Optional[str] = None,
        verify_tls: bool = True
    ):
        self.discovery_url = discovery_url.rstrip('/')
        self.verify_tls = verify_tls
        self.http = urllib3.PoolManager(
            cert_reqs='CERT_REQUIRED' if verify_tls else 'CERT_NONE'
        )
        self.headers = {
            "Accept": "application/taxii+json;version=2.1",
            "Content-Type": "application/taxii+json;version=2.1"
        }
        if username and password:
            auth_str = f"{username}:{password}"
            encoded = base64.b64encode(auth_str.encode()).decode()
            self.headers["Authorization"] = f"Basic {encoded}"

    def get_collections(self, api_root_url: str) -> List[Dict[str, Any]]:
        """Retrieves collections from a TAXII API Root."""
        url = f"{api_root_url.rstrip('/')}/collections/"
        try:
            response = self.http.request("GET", url, headers=self.headers, timeout=10.0)
            if response.status == 200:
                data = json.loads(response.data.decode('utf-8'))
                return data.get("collections", [])
            else:
                logger.error(f"Failed to fetch TAXII collections. Status: {response.status}")
                return []
        except Exception as e:
            logger.error(f"Error fetching TAXII collections: {str(e)}")
            return []

    def get_objects(self, api_root_url: str, collection_id: str) -> List[Dict[str, Any]]:
        """Retrieves STIX objects from a specific TAXII collection."""
        url = f"{api_root_url.rstrip('/')}/collections/{collection_id}/objects/"
        headers = self.headers.copy()
        headers["Accept"] = "application/stix+json;version=2.1"
        
        try:
            response = self.http.request("GET", url, headers=headers, timeout=15.0)
            if response.status == 200:
                data = json.loads(response.data.decode('utf-8'))
                return data.get("objects", [])
            else:
                logger.error(f"Failed to fetch STIX objects. Status: {response.status}")
                return []
        except Exception as e:
            logger.error(f"Error fetching STIX objects: {str(e)}")
            return []

    def parse_stix_indicators(self, objects: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """
        Parses STIX 2.1 indicator objects and extracts pattern values
        (e.g., IPv4 addresses, domains, file hashes).
        """
        parsed_indicators = {
            "ips": [],
            "domains": [],
            "hashes": []
        }
        
        for obj in objects:
            if obj.get("type") == "indicator" and "pattern" in obj:
                pattern = obj["pattern"]
                if "ipv4-addr:value" in pattern:
                    ip = pattern.split("'")[1]
                    parsed_indicators["ips"].append(ip)
                elif "domain-name:value" in pattern:
                    domain = pattern.split("'")[1]
                    parsed_indicators["domains"].append(domain)
                elif "file:hashes" in pattern:
                    file_hash = pattern.split("'")[1]
                    parsed_indicators["hashes"].append(file_hash)
                    
        return parsed_indicators
