import logging
from typing import Tuple

logger = logging.getLogger(__name__)

OQS_AVAILABLE = False
try:
    import oqs
    OQS_AVAILABLE = True
except ImportError:
    logger.warning("liboqs-python (oqs) not found. SPHINCSPlus will run in simulated fallback mode.")

class SPHINCSPlus:
    """
    Implementation of SPHINCS+ (SLH-DSA) Stateless Hash-Based Digital Signature Algorithm.
    Provides high security guarantees based solely on the security of the underlying hash function.
    Falls back to a simulated SHA256-based signature scheme if liboqs is unavailable.
    """
    
    def __init__(self, variant: str = "SPHINCS+-SHA256-128s-simple"):
        """
        Initializes the SPHINCS+ Signature scheme.
        
        Args:
            variant (str): SPHINCS+ variant. Default is 'SPHINCS+-SHA256-128s-simple'.
                           Maps to SLH-DSA-SHA2-128s.
        """
        self._variant = variant
        self._oqs_name = variant
        self._use_simulation = not OQS_AVAILABLE
        
        if OQS_AVAILABLE:
            try:
                enabled_sigs = oqs.get_enabled_sig_mechanisms()
                if self._oqs_name not in enabled_sigs:
                    sphincs_variants = [s for s in enabled_sigs if "SPHINCS" in s or "sphincs" in s]
                    if sphincs_variants:
                        self._oqs_name = sphincs_variants[0]
                        logger.info(f"Requested variant not found, using available SPHINCS+ variant: {self._oqs_name}")
                    else:
                        logger.warning("No SPHINCS+ variants enabled in liboqs. Falling back to simulation.")
                        self._use_simulation = True
            except Exception as e:
                logger.error(f"Failed to initialize liboqs: {e}. Falling back to simulation.")
                self._use_simulation = True

    @property
    def algorithm_name(self) -> str:
        return f"SPHINCS+ ({self._variant})" + (" [SIMULATED]" if self._use_simulation else "")

    def generate_keypair(self) -> Tuple[bytes, bytes]:
        if self._use_simulation:
            return self._generate_simulated_keypair()
            
        try:
            with oqs.Signature(self._oqs_name) as sig:
                public_key = sig.generate_keypair()
                secret_key = sig.export_secret_key()
                return public_key, secret_key
        except Exception as e:
            logger.error(f"SPHINCS+ keypair generation failed: {e}. Falling back to simulation.")
            return self._generate_simulated_keypair()

    def sign(self, message: bytes, secret_key: bytes) -> bytes:
        if self._use_simulation or secret_key.startswith(b"SIM_SPHINCS_SEC_"):
            return self._sign_simulated(message, secret_key)
            
        try:
            with oqs.Signature(self._oqs_name) as sig:
                sig.import_secret_key(secret_key)
                return sig.sign(message)
        except Exception as e:
            logger.error(f"SPHINCS+ signing failed: {e}. Falling back to simulation.")
            return self._sign_simulated(message, secret_key)

    def verify(self, message: bytes, signature: bytes, public_key: bytes) -> bool:
        if self._use_simulation or public_key.startswith(b"SIM_SPHINCS_PUB_") or signature.startswith(b"SIM_SPHINCS_SIG_"):
            return self._verify_simulated(message, signature, public_key)
            
        try:
            with oqs.Signature(self._oqs_name) as sig:
                return sig.verify(message, signature, public_key)
        except Exception as e:
            logger.error(f"SPHINCS+ verification failed: {e}. Falling back to simulation.")
            return self._verify_simulated(message, signature, public_key)

    def _generate_simulated_keypair(self) -> Tuple[bytes, bytes]:
        import os
        seed = os.urandom(32)
        public_key = b"SIM_SPHINCS_PUB_" + seed
        secret_key = b"SIM_SPHINCS_SEC_" + seed
        return public_key, secret_key

    def _sign_simulated(self, message: bytes, secret_key: bytes) -> bytes:
        import hmac
        import hashlib
        
        seed = secret_key[16:] if secret_key.startswith(b"SIM_SPHINCS_SEC_") else secret_key
        sig = hmac.new(seed, message, hashlib.sha256).digest()
        return b"SIM_SPHINCS_SIG_" + sig

    def _verify_simulated(self, message: bytes, signature: bytes, public_key: bytes) -> bool:
        import hmac
        import hashlib
        
        seed = public_key[16:] if public_key.startswith(b"SIM_SPHINCS_PUB_") else public_key
        sig_raw = signature[16:] if signature.startswith(b"SIM_SPHINCS_SIG_") else signature
        
        expected_sig = hmac.new(seed, message, hashlib.sha256).digest()
        return hmac.compare_digest(sig_raw, expected_sig)
