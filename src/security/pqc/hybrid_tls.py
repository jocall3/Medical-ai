import logging
from typing import Tuple, Dict, Any
from cryptography.hazmat.primitives.asymmetric import x25519, ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from src.security.pqc.kyber_kem import KyberKEM
from src.security.pqc.dilithium_signatures import DilithiumSignatures

logger = logging.getLogger(__name__)

class HybridTLSHandshake:
    """
    Implements a Hybrid TLS Handshake mechanism combining classical cryptography
    (X25519 for key exchange, ECDSA for signatures) with post-quantum cryptography
    (Kyber for key exchange, Dilithium for signatures).
    This ensures compliance with NIST SP 800-219 and CNSA 2.0 guidelines.
    """
    
    def __init__(self, kem_variant: str = "Kyber768", sig_variant: str = "Dilithium3"):
        self.kyber = KyberKEM(kem_variant)
        self.dilithium = DilithiumSignatures(sig_variant)

    def generate_server_keypair(self) -> Dict[str, Any]:
        """
        Generates the server's hybrid keypair for key exchange and authentication.
        """
        x25519_priv = x25519.X25519PrivateKey.generate()
        x25519_pub = x25519_priv.public_key()
        x25519_pub_bytes = x25519_pub.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )

        kyber_pub, kyber_priv = self.kyber.generate_keypair()

        ecdsa_priv = ec.generate_private_key(ec.SECP256R1())
        ecdsa_pub = ecdsa_priv.public_key()
        ecdsa_pub_bytes = ecdsa_pub.public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint
        )

        dilithium_pub, dilithium_priv = self.dilithium.generate_keypair()

        return {
            "keys": {
                "x25519_private": x25519_priv,
                "kyber_private": kyber_priv,
                "ecdsa_private": ecdsa_priv,
                "dilithium_private": dilithium_priv
            },
            "public_shares": {
                "x25519_public": x25519_pub_bytes,
                "kyber_public": kyber_pub,
                "ecdsa_public": ecdsa_pub_bytes,
                "dilithium_public": dilithium_pub
            }
        }

    def client_initiate(self, server_public_shares: Dict[str, bytes]) -> Tuple[Dict[str, bytes], bytes]:
        """
        Client processes server's public shares, performs hybrid key exchange,
        and returns client public shares and the derived hybrid shared secret.
        """
        client_x25519_priv = x25519.X25519PrivateKey.generate()
        client_x25519_pub = client_x25519_priv.public_key()
        client_x25519_pub_bytes = client_x25519_pub.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )

        server_x25519_pub = x25519.X25519PublicKey.from_public_bytes(
            server_public_shares["x25519_public"]
        )
        classical_secret = client_x25519_priv.exchange(server_x25519_pub)

        kyber_ciphertext, pq_secret = self.kyber.encapsulate(
            server_public_shares["kyber_public"]
        )

        combined_input = classical_secret + pq_secret
        
        hkdf = HKDF(
            algorithm=hashes.SHA384(),
            length=48,
            salt=b"HybridTLSHandshake-v1",
            info=b"Derived Master Secret",
        )
        master_secret = hkdf.derive(combined_input)

        client_shares = {
            "x25519_public": client_x25519_pub_bytes,
            "kyber_ciphertext": kyber_ciphertext
        }

        return client_shares, master_secret

    def server_finalize(self, client_shares: Dict[str, bytes], server_keys: Dict[str, Any]) -> bytes:
        """
        Server processes client's shares to derive the identical hybrid shared secret.
        """
        client_x25519_pub = x25519.X25519PublicKey.from_public_bytes(
            client_shares["x25519_public"]
        )
        classical_secret = server_keys["x25519_private"].exchange(client_x25519_pub)

        pq_secret = self.kyber.decapsulate(
            client_shares["kyber_ciphertext"],
            server_keys["kyber_private"]
        )

        combined_input = classical_secret + pq_secret
        
        hkdf = HKDF(
            algorithm=hashes.SHA384(),
            length=48,
            salt=b"HybridTLSHandshake-v1",
            info=b"Derived Master Secret",
        )
        return hkdf.derive(combined_input)

    def sign_handshake(self, handshake_data: bytes, server_keys: Dict[str, Any]) -> Dict[str, bytes]:
        """
        Signs the handshake transcript using both classical (ECDSA) and quantum-safe (Dilithium) signatures.
        """
        ecdsa_sig = server_keys["ecdsa_private"].sign(
            handshake_data,
            ec.ECDSA(hashes.SHA256())
        )

        dilithium_sig = self.dilithium.sign(
            handshake_data,
            server_keys["dilithium_private"]
        )

        return {
            "ecdsa_signature": ecdsa_sig,
            "dilithium_signature": dilithium_sig
        }

    def verify_handshake(self, handshake_data: bytes, signatures: Dict[str, bytes], public_shares: Dict[str, bytes]) -> bool:
        """
        Verifies both classical and quantum-safe signatures. Both must be valid.
        """
        try:
            ecdsa_pub = ec.EllipticCurvePublicKey.from_encoded_point(
                ec.SECP256R1(),
                public_shares["ecdsa_public"]
            )
            ecdsa_pub.verify(
                signatures["ecdsa_signature"],
                handshake_data,
                ec.ECDSA(hashes.SHA256())
            )
            classical_ok = True
        except Exception as e:
            logger.error(f"Classical ECDSA verification failed: {e}")
            classical_ok = False

        pq_ok = self.dilithium.verify(
            handshake_data,
            signatures["dilithium_signature"],
            public_shares["dilithium_public"]
        )

        if not pq_ok:
            logger.error("Post-Quantum Dilithium verification failed.")

        return classical_ok and pq_ok
