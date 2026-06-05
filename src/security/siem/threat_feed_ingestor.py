import logging
import urllib3
import json
from typing import Dict, Any, List, Set

logger = logging.getLogger("SIEM.ThreatFeedIngestor")

class ThreatFeedIngestor:
    """
    Ingests threat intelligence feeds (IPs, domains, file hashes)
    from open-source and commercial threat intelligence providers.
    """
    def __init__(self, cache_file: str = "threat_feed_cache.json"):
        self.cache_file = cache_file
        self.http = urllib3.PoolManager()
        self.malicious_ips: Set[str] = set()
        self.malicious_domains: Set[str] = set()
        self.malicious_hashes: Set[str] = set()

    def ingest_from_url(self, url: str, feed_type: str) -> int:
        """
        Fetches a threat feed from a URL and parses it.
        Supported feed_types: 'ip', 'domain', 'hash'
        """
        try:
            response = self.http.request("GET", url, timeout=10.0)
            if response.status != 200:
                logger.error(f"Failed to fetch threat feed from {url}. Status: {response.status}")
                return 0
            
            content = response.data.decode('utf-8')
            lines = [line.strip() for line in content.splitlines() if line.strip() and not line.startswith("#")]
            
            count = 0
            if feed_type == "ip":
                self.malicious_ips.update(lines)
                count = len(lines)
            elif feed_type == "domain":
                self.malicious_domains.update(lines)
                count = len(lines)
            elif feed_type == "hash":
                self.malicious_hashes.update(lines)
                count = len(lines)
                
            logger.info(f"Successfully ingested {count} indicators of type '{feed_type}' from {url}")
            return count
        except Exception as e:
            logger.error(f"Error ingesting threat feed from {url}: {str(e)}")
            return 0

    def save_cache(self) -> None:
        """Saves the current threat intelligence cache to disk."""
        data = {
            "ips": list(self.malicious_ips),
            "domains": list(self.malicious_domains),
            "hashes": list(self.malicious_hashes)
        }
        try:
            with open(self.cache_file, "w") as f:
                json.dump(data, f, indent=4)
            logger.info(f"Threat feed cache saved to {self.cache_file}")
        except Exception as e:
            logger.error(f"Failed to save threat feed cache: {str(e)}")

    def load_cache(self) -> None:
        """Loads the threat intelligence cache from disk."""
        try:
            with open(self.cache_file, "r") as f:
                data = json.load(f)
                self.malicious_ips = set(data.get("ips", []))
                self.malicious_domains = set(data.get("domains", []))
                self.malicious_hashes = set(data.get("hashes", []))
            logger.info(f"Loaded {len(self.malicious_ips)} IPs, {len(self.malicious_domains)} domains, and {len(self.malicious_hashes)} hashes from cache.")
        except FileNotFoundError:
            logger.warning("No threat feed cache file found. Starting fresh.")
        except Exception as e:
            logger.error(f"Failed to load threat feed cache: {str(e)}")
