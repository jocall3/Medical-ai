import json
import hashlib
import hmac
from typing import Dict, Any, Tuple, Optional

try:
    from cryptography.hazmat.primitives.asymmetric import rsa, padding
    from cryptography.hazmat.primitives import hashes, serialization
    HAS_CRYPTOGRAPHY = True
except ImportError:
    HAS_CRYPTOGRAPHY = False

class MetadataSigner:
    """
    Cryptographically signs and verifies provenance metadata to ensure non-repudiation and integrity.
    """
    def __init__(self, private_key_pem: Optional[bytes] = None, public_key_pem: Optional[bytes] = None, secret_key: Optional[bytes] = None):
        self.private_key = None
        self.public_key = None
        self.secret_key = secret_key or b"default_fallback_secret_key_for_hmac"

        if HAS_CRYPTOGRAPHY:
            if private_key_pem:
                self.private_key = serialization.load_pem_private_key(private_key_pem, password=None)
            else:
                self.private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
            
            if public_key_pem:
                self.public_key = serialization.load_pem_public_key(public_key_pem)
            else:
                self.public_key = self.private_key.public_key()

    def sign_metadata(self, metadata: Dict[str, Any]) -> Tuple[str, str]:
        """
        Signs the metadata dictionary and returns the signature and the algorithm used.
        """
        serialized = json.dumps(metadata, sort_keys=True).encode('utf-8')
        
        if HAS_CRYPTOGRAPHY and self.private_key:
            signature = self.private_key.sign(
                serialized,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return signature.hex(), "RSASSA-PSS-SHA256"
        else:
            # Fallback to HMAC-SHA256 if cryptography library is not available
            signature = hmac.new(self.secret_key, serialized, hashlib.sha256).digest()
            return signature.hex(), "HMAC-SHA256"

    def verify_metadata(self, metadata: Dict[str, Any], signature_hex: str, algorithm: str) -> bool:
        """
        Verifies the signature of the metadata dictionary.
        """
        serialized = json.dumps(metadata, sort_keys=True).encode('utf-8')
        try:
            if algorithm == "RSASSA-PSS-SHA256" and HAS_CRYPTOGRAPHY and self.public_key:
                signature = bytes.fromhex(signature_hex)
                self.public_key.verify(
                    signature,
                    serialized,
                    padding.PSS(
                        mgf=padding.MGF1(hashes.SHA256()),
                        salt_length=padding.PSS.MAX_LENGTH
                    ),
                    hashes.SHA256()
                )
                return True
            elif algorithm == "HMAC-SHA256":
                expected = hmac.new(self.secret_key, serialized, hashlib.sha256).digest()
                return hmac.compare_digest(expected, bytes.fromhex(signature_hex))
            return False
        except Exception:
            return False
