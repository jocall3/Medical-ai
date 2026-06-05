import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class CryptoAgilityManager:
    """
    Manages cryptographic agility across the medical AI platform.
    Allows dynamic switching of active algorithms, configuration of security levels,
    and enforcement of hybrid vs. pure post-quantum policies.
    """
    
    def __init__(self):
        self._policy = {
            "active_kem": "Kyber768",
            "active_sig": "Dilithium3",
            "hybrid_mode_enabled": True,
            "enforce_pqc_only": False,
            "min_security_level": 3,
            "fallback_allowed": True
        }
        
        self._algorithm_registry = {
            "KEM": {
                "Kyber512": {"nist_level": 1, "type": "lattice", "standard": "ML-KEM-512"},
                "Kyber768": {"nist_level": 3, "type": "lattice", "standard": "ML-KEM-768"},
                "Kyber1024": {"nist_level": 5, "type": "lattice", "standard": "ML-KEM-1024"},
                "X25519": {"nist_level": 1, "type": "classical", "standard": "RFC 7748"}
            },
            "Signature": {
                "Dilithium2": {"nist_level": 1, "type": "lattice", "standard": "ML-DSA-44"},
                "Dilithium3": {"nist_level": 3, "type": "lattice", "standard": "ML-DSA-65"},
                "Dilithium5": {"nist_level": 5, "type": "lattice", "standard": "ML-DSA-87"},
                "SPHINCS+-SHA256-128s-simple": {"nist_level": 1, "type": "hash-based", "standard": "SLH-DSA-SHA2-128s"},
                "ECDSA_P256": {"nist_level": 1, "type": "classical", "standard": "FIPS 186-4"}
            }
        }

    def get_policy(self) -> Dict[str, Any]:
        """Returns the current cryptographic policy."""
        return self._policy.copy()

    def update_policy(self, new_policy: Dict[str, Any]) -> bool:
        """
        Updates the cryptographic policy after validating the parameters.
        """
        for key, value in new_policy.items():
            if key not in self._policy:
                logger.error(f"Invalid policy key: {key}")
                return False
                
        if "active_kem" in new_policy:
            kem = new_policy["active_kem"]
            if kem not in self._algorithm_registry["KEM"]:
                logger.error(f"Unsupported KEM algorithm: {kem}")
                return False
                
        if "active_sig" in new_policy:
            sig = new_policy["active_sig"]
            if sig not in self._algorithm_registry["Signature"] and not sig.startswith("SPHINCS"):
                logger.error(f"Unsupported Signature algorithm: {sig}")
                return False

        self._policy.update(new_policy)
        logger.info(f"Cryptographic policy updated successfully: {self._policy}")
        return True

    def get_active_algorithms(self) -> Dict[str, str]:
        """Returns the currently active algorithms based on policy."""
        return {
            "KEM": self._policy["active_kem"],
            "Signature": self._policy["active_sig"]
        }

    def is_algorithm_compliant(self, category: str, algo_name: str) -> bool:
        """
        Checks if an algorithm is compliant with the current security policy.
        """
        if category not in self._algorithm_registry:
            return False
            
        algo_info = self._algorithm_registry[category].get(algo_name)
        if not algo_info:
            if category == "Signature" and "SPHINCS" in algo_name:
                return True
            return False
            
        if algo_info["nist_level"] < self._policy["min_security_level"]:
            return False
            
        if self._policy["enforce_pqc_only"] and algo_info["type"] == "classical":
            return False
            
        return True

    def get_compliant_algorithms(self, category: str) -> List[str]:
        """Returns a list of compliant algorithms for a given category."""
        if category not in self._algorithm_registry:
            return []
            
        compliant = []
        for algo, info in self._algorithm_registry[category].items():
            if self.is_algorithm_compliant(category, algo):
                compliant.append(algo)
        return compliant
