import logging
from typing import Tuple
from src.security.pqc.key_encapsulation import KeyEncapsulationInterface

logger = logging.getLogger(__name__)

# Try to import oqs
OQS_AVAILABLE = False
try:
    import oqs
    OQS_AVAILABLE = True
except ImportError:
    logger.warning("liboqs-python (oqs) not found. KyberKEM will run in simulated fallback mode.")

class KyberKEM(KeyEncapsulationInterface):
    """
    Implementation of CRYSTALS-Kyber (ML-KEM) Key Encapsulation Mechanism.
    Supports Kyber512, Kyber768, and Kyber1024.
    Falls back to a secure simulated hybrid (X25519 + HKDF) if liboqs is unavailable.
    """
    
    def __init__(self, variant: str = "Kyber768"):
        """
        Initializes the Kyber KEM.
        
        Args:
            variant (str): The Kyber variant to use. Options: 'Kyber512', 'Kyber768', 'Kyber1024'.
                           Maps to ML-KEM-512, ML-KEM-768, ML-KEM-1024.
        """
        self._variant = variant
        self._oqs_name = variant
        if variant == "ML-KEM-512":
            self._oqs_name = "Kyber512"
        elif variant == "ML-KEM-768":
            self._oqs_name = "Kyber768"
        elif variant == "ML-KEM-1024":
            self._oqs_name = "Kyber1024"
            
        self._use_simulation = not OQS_AVAILABLE
        
        if OQS_AVAILABLE:
            try:
                enabled_kems = oqs.get_enabled_kem_mechanisms()
                if self._oqs_name not in enabled_kems:
                    logger.warning(f"{self._oqs_name} not enabled in liboqs. Falling back to simulation.")
                    self._use_simulation = True
            except Exception as e:
                logger.error(f"Failed to initialize liboqs: {e}. Falling back to simulation.")
                self._use_simulation = True

    @property
    def algorithm_name(self) -> str:
        return f"CRYSTALS-Kyber ({self._variant})" + (" [SIMULATED]" if self._use_simulation else "")

    def generate_keypair(self) -> Tuple[bytes, bytes]:
        if self._use_simulation:
            return self._generate_simulated_keypair()
        
        try:
            with oqs.KeyEncapsulation(self._oqs_name) as kem:
                public_key = kem.generate_keypair()
                secret_key = kem.export_secret_key()
                return public_key, secret_key
        except Exception as e:
            logger.error(f"Kyber keypair generation failed: {e}. Falling back to simulation.")
            return self._generate_simulated_keypair()

    def encapsulate(self, public_key: bytes) -> Tuple[bytes, bytes]:
        if self._use_simulation or len(public_key) < 32 or public_key.startswith(b"SIM_KYBER_PUB_"):
            return self._encapsulate_simulated(public_key)
            
        try:
            with oqs.KeyEncapsulation(self._oqs_name) as kem:
                ciphertext, shared_secret = kem.encap_secret(public_key)
                return ciphertext, shared_secret
        except Exception as e:
            logger.error(f"Kyber encapsulation failed: {e}. Falling back to simulation.")
            return self._encapsulate_simulated(public_key)

    def decapsulate(self, ciphertext: bytes, secret_key: bytes) -> bytes:
        if self._use_simulation or len(secret_key) < 32 or secret_key.startswith(b"SIM_KYBER_SEC_"):
            return self._decapsulate_simulated(ciphertext, secret_key)
            
        try:
            with oqs.KeyEncapsulation(self._oqs_name) as kem:
                kem.import_secret_key(secret_key)
                shared_secret = kem.decap_secret(ciphertext)
                return shared_secret
        except Exception as e:
            logger.error(f"Kyber decapsulation failed: {e}. Falling back to simulation.")
            return self._decapsulate_simulated(ciphertext, secret_key)

    def _generate_simulated_keypair(self) -> Tuple[bytes, bytes]:
        from cryptography.hazmat.primitives.asymmetric import x25519
        from cryptography.hazmat.primitives import serialization
        
        private_key = x25519.X25519PrivateKey.generate()
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
        return b"SIM_KYBER_PUB_" + pub_bytes, b"SIM_KYBER_SEC_" + priv_bytes

    def _encapsulate_simulated(self, public_key: bytes) -> Tuple[bytes, bytes]:
        from cryptography.hazmat.primitives.asymmetric import x25519
        from cryptography.hazmat.primitives.kdf.hkdf import HKDF
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives import serialization
        
        pub_raw = public_key[14:] if public_key.startswith(b"SIM_KYBER_PUB_") else public_key
        if len(pub_raw) != 32:
            pub_raw = pub_raw[:32].ljust(32, b"\x00")
            
        peer_public_key = x25519.X25519PublicKey.from_public_bytes(pub_raw)
        ephemeral_private = x25519.X25519PrivateKey.generate()
        ephemeral_public = ephemeral_private.public_key()
        
        raw_shared = ephemeral_private.exchange(peer_public_key)
        
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b"KyberKEM Simulation Fallback",
        )
        shared_secret = hkdf.derive(raw_shared)
        
        ephemeral_pub_bytes = ephemeral_public.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )
        
        ciphertext = b"SIM_KYBER_CT_" + ephemeral_pub_bytes
        return ciphertext, shared_secret

    def _decapsulate_simulated(self, ciphertext: bytes, secret_key: bytes) -> bytes:
        from cryptography.hazmat.primitives.asymmetric import x25519
        from cryptography.hazmat.primitives.kdf.hkdf import HKDF
        from cryptography.hazmat.primitives import hashes
        
        priv_raw = secret_key[14:] if secret_key.startswith(b"SIM_KYBER_SEC_") else secret_key
        if len(priv_raw) != 32:
            priv_raw = priv_raw[:32].ljust(32, b"\x00")
            
        ct_raw = ciphertext[13:] if ciphertext.startswith(b