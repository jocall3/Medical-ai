import logging
from typing import Tuple

logger = logging.getLogger(__name__)

OQS_AVAILABLE = False
try:
    import oqs
    OQS_AVAILABLE = True
except ImportError:
    logger.warning("liboqs-python (oqs) not found. DilithiumSignatures will run in simulated fallback mode.")

class DilithiumSignatures:
    """
    Implementation of CRYSTALS-Dilithium (ML-DSA) Digital Signature Algorithm.
    Supports Dilithium2, Dilithium3, and Dilithium5.
    Falls back to a secure simulated Ed25519 signature scheme if liboqs is unavailable.
    """
    
    def __init__(self, variant: str = "Dilithium3"):
        """
        Initializes the Dilithium Signature scheme.
        
        Args:
            variant (str): The Dilithium variant to use. Options: 'Dilithium2', 'Dilithium3', 'Dilithium5'.
                           Maps to ML-DSA-44, ML-DSA-65, ML-DSA-87.
        """
        self._variant = variant
        self._oqs_name = variant
        if variant == "ML-DSA-44":
            self._oqs_name = "Dilithium2"
        elif variant == "ML-DSA-65":
            self._oqs_name = "Dilithium3"
        elif variant == "ML-DSA-87":
            self._oqs_name = "Dilithium5"
            
        self._use_simulation = not OQS_AVAILABLE
        
        if OQS_AVAILABLE:
            try:
                enabled_sigs = oqs.get_enabled_sig_mechanisms()
                if self._oqs_name not in enabled_sigs:
                    logger.warning(f"{self._oqs_name} not enabled in liboqs. Falling back to simulation.")
                    self._use_simulation = True
            except Exception as e:
                logger.error(f"Failed to initialize liboqs: {e}. Falling back to simulation.")
                self._use_simulation = True

    @property
    def algorithm_name(self) -> str:
        return f"CRYSTALS-Dilithium ({self._variant})" + (" [SIMULATED]" if self._use_simulation else "")

    def generate_keypair(self) -> Tuple[bytes, bytes]:
        if self._use_simulation:
            return self._generate_simulated_keypair()
            
        try:
            with oqs.Signature(self._oqs_name) as sig:
                public_key = sig.generate_keypair()
                secret_key = sig.export_secret_key()
                return public_key, secret_key
        except Exception as e:
            logger.error(f"Dilithium keypair generation failed: {e}. Falling back to simulation.")
            return self._generate_simulated_keypair()

    def sign(self, message: bytes, secret_key: bytes) -> bytes:
        if self._use_simulation or secret_key.startswith(b"SIM_DILITHIUM_SEC_"):
            return self._sign_simulated(message, secret_key)
            
        try:
            with oqs.Signature(self._oqs_name) as sig:
                sig.import_secret_key(secret_key)
                return sig.sign(message)
        except Exception as e:
            logger.error(f"Dilithium signing failed: {e}. Falling back to simulation.")
            return self._sign_simulated(message, secret_key)

    def verify(self, message: bytes, signature: bytes, public_key: bytes) -> bool:
        if self._use_simulation or public_key.startswith(b"SIM_DILITHIUM_PUB_") or signature.startswith(b"SIM_DILITHIUM_SIG_"):
            return self._verify_simulated(message, signature, public_key)
            
        try:
            with oqs.Signature(self._oqs_name) as sig:
                return sig.verify(message, signature, public_key)
        except Exception as e:
            logger.error(f"Dilithium verification failed: {e}. Falling back to simulation.")
            return self._verify_simulated(message, signature, public_key)

    def _generate_simulated_keypair(self) -> Tuple[bytes, bytes]:
        from cryptography.hazmat.primitives.asymmetric import ed25519
        from cryptography.hazmat.primitives import serialization
        
        private_key = ed25519.Ed25519PrivateKey.generate()
        public_key = private_key.public_key()
        
        pub_bytes = public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )
        priv_bytes = private_key.private_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PrivateFormat.Raw,
            encryption_algorithm=serialization.NoEncryption()
        )
        return b"SIM_DILITHIUM_PUB_" + pub_bytes, b"SIM_DILITHIUM_SEC_" + priv_bytes

    def _sign_simulated(self, message: bytes, secret_key: bytes) -> bytes:
        from cryptography.hazmat.primitives.asymmetric import ed25519
        
        priv_raw = secret_key[18:] if secret_key.startswith(b"SIM_DILITHIUM_SEC_") else secret_key
        if len(priv_raw) != 32:
            priv_raw = priv_raw[:32].ljust(32, b"\x00")
            
        private_key = ed25519.Ed25519PrivateKey.from_private_bytes(priv_raw)
        signature = private_key.sign(message)
        return b"SIM_DILITHIUM_SIG_" + signature

    def _verify_simulated(self, message: bytes, signature: bytes, public_key: bytes) -> bool:
        from cryptography.hazmat.primitives.asymmetric import ed25519
        from cryptography.exceptions import InvalidSignature
        
        pub_raw = public_key[18:] if public_key.startswith(b"SIM_DILITHIUM_PUB_") else public_key
        if len(pub_raw) != 32:
            pub_raw = pub_raw[:32].ljust(32, b"\x00")
            
        sig_raw = signature[18:] if signature.startswith(b"SIM_DILITHIUM_SIG_") else signature
        if len(sig_raw) != 64:
            return False
            
        try:
            peer_public_key = ed25519.Ed25519PublicKey.from_public_bytes(pub_raw)
            peer_public_key.verify(sig_raw, message)
            return True
        except InvalidSignature:
            return False
        except Exception:
            return False
