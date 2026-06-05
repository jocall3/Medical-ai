import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class PQCMigrationAuditor:
    """
    Audits the system's cryptographic posture to facilitate migration to
    quantum-safe algorithms. Identifies legacy algorithms (RSA, ECC, DH)
    and provides actionable recommendations for upgrading to ML-KEM and ML-DSA.
    """
    
    def __init__(self, agility_manager: Any):
        self.agility_manager = agility_manager

    def audit_key_store(self, key_inventory: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Audits an inventory of cryptographic keys.
        """
        vulnerable_keys = []
        compliant_keys = []
        total_keys = len(key_inventory)
        
        for key in key_inventory:
            algo = key.get("algorithm", "").upper()
            key_id = key.get("id", "unknown")
            
            if algo in ["RSA", "ECDSA", "ECDH", "ED25519", "X25519"]:
                vulnerable_keys.append({
                    "id": key_id,
                    "algorithm": algo,
                    "risk": "CRITICAL - Vulnerable to Shor's Algorithm",
                    "recommendation": self._get_upgrade_recommendation(algo, key.get("use"))
                })
            elif algo in ["KYBER", "DILITHIUM", "SPHINCS", "ML-KEM", "ML-DSA", "SLH-DSA"]:
                compliant_keys.append({
                    "id": key_id,
                    "algorithm": algo
                })
            else:
                compliant_keys.append({
                    "id": key_id,
                    "algorithm": algo,
                    "note": "Symmetric/Hash algorithm. Safe with adequate key/digest size."
                })

        vulnerability_ratio = len(vulnerable_keys) / total_keys if total_keys > 0 else 0.0
        
        report = {
            "audit_status": "COMPLETED",
            "total_keys_audited": total_keys,
            "vulnerable_keys_count": len(vulnerable_keys),
            "compliant_keys_count": len(compliant_keys),
            "vulnerability_score": f"{vulnerability_ratio * 100:.1f}%",
            "vulnerable_keys": vulnerable_keys,
            "compliant_keys": compliant_keys,
            "compliance_status": "NON-COMPLIANT" if vulnerable_keys else "COMPLIANT"
        }
        
        return report

    def audit_network_endpoints(self, endpoints: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Audits network endpoints to ensure they support hybrid or quantum-safe TLS.
        """
        vulnerable_endpoints = []
        for ep in endpoints:
            tls_version = ep.get("tls_version", "")
            cipher_suite = ep.get("cipher_suite", "")
            supports_pqc = ep.get("supports_pqc", False)
            
            if not supports_pqc:
                vulnerable_endpoints.append({
                    "endpoint": ep.get("url"),
                    "tls_version": tls_version,
                    "cipher_suite": cipher_suite,
                    "risk": "HIGH - Lacks Quantum-Safe Key Exchange",
                    "recommendation": "Enable Hybrid TLS (X25519 + Kyber768)"
                })
                
        return {
            "endpoints_audited": len(endpoints),
            "vulnerable_endpoints_count": len(vulnerable_endpoints),
            "vulnerable_endpoints": vulnerable_endpoints,
            "status": "ACTION_REQUIRED" if vulnerable_endpoints else "SECURE"
        }

    def _get_upgrade_recommendation(self, classical_algo: str, use: Optional[str]) -> str:
        if use == "encryption" or classical_algo in ["RSA", "ECDH", "X25519"]:
            return "Upgrade to ML-KEM (Kyber768) or implement Hybrid Key Exchange (X25519 + Kyber768)."
        elif use == "signing" or classical_algo in ["ECDSA", "ED25519"]:
            return "Upgrade to ML-DSA (Dilithium3) or implement Hybrid Signatures."
        return "Upgrade to NIST-approved Post-Quantum Cryptography standards."
