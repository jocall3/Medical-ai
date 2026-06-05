import logging
import time
import json
import hashlib
from typing import Dict, Any, Optional
from src.security.pqc.dilithium_signatures import DilithiumSignatures

logger = logging.getLogger(__name__)

class QuantumSafeCA:
    """
    A Quantum-Safe Certificate Authority (CA) capable of issuing, signing,
    and verifying hybrid and post-quantum digital certificates.
    Uses CRYSTALS-Dilithium for quantum-safe signatures.
    """
    
    def __init__(self, ca_name: str = "MedicalAI Root CA", sig_variant: str = "Dilithium3"):
        self.ca_name = ca_name
        self.dilithium = DilithiumSignatures(sig_variant)
        self.ca_pub, self.ca_priv = self.dilithium.generate_keypair()
        self.issued_certificates: Dict[str, Dict[str, Any]] = {}

    def issue_certificate(self, subject_name: str, subject_public_key: bytes, validity_days: int = 365) -> Dict[str, Any]:
        """
        Issues a quantum-safe certificate for a subject.
        """
        serial_number = hashlib.sha256(f"{subject_name}-{time.time()}".encode()).hexdigest()[:16]
        not_before = int(time.time())
        not_after = not_before + (validity_days * 24 * 60 * 60)
        
        tbscert = {
            "serial_number": serial_number,
            "issuer": self.ca_name,
            "subject": subject_name,
            "subject_public_key": subject_public_key.hex(),
            "not_before": not_before,
            "not_after": not_after,
            "signature_algorithm": self.dilithium.algorithm_name
        }
        
        tbs_bytes = json.dumps(tbscert, sort_keys=True).encode()
        signature = self.dilithium.sign(tbs_bytes, self.ca_priv)
        
        certificate = {
            "tbs_certificate": tbscert,
            "signature": signature.hex()
        }
        
        self.issued_certificates[serial_number] = certificate
        logger.info(f"Issued quantum-safe certificate {serial_number} to {subject_name}")
        return certificate

    def verify_certificate(self, certificate: Dict[str, Any]) -> bool:
        """
        Verifies the validity and signature of a quantum-safe certificate.
        """
        try:
            tbscert = certificate["tbs_certificate"]
            signature = bytes.fromhex(certificate["signature"])
            
            current_time = int(time.time())
            if current_time < tbscert["not_before"] or current_time > tbscert["not_after"]:
                logger.error("Certificate is expired or not yet valid.")
                return False
                
            tbs_bytes = json.dumps(tbscert, sort_keys=True).encode()
            is_valid = self.dilithium.verify(tbs_bytes, signature, self.ca_pub)
            
            if not is_valid:
                logger.error("Certificate signature verification failed.")
                return False
                
            return True
        except Exception as e:
            logger.error(f"Error verifying certificate: {e}")
            return False

    def revoke_certificate(self, serial_number: str) -> bool:
        """Revokes an issued certificate."""
        if serial_number in self.issued_certificates:
            del self.issued_certificates[serial_number]
            logger.info(f"Revoked certificate {serial_number}")
            return True
        return False
