import time
import logging
from typing import Dict, Any
from src.security.pqc.kyber_kem import KyberKEM
from src.security.pqc.dilithium_signatures import DilithiumSignatures
from src.security.pqc.sphincs_plus import SPHINCSPlus
from src.security.pqc.hybrid_tls import HybridTLSHandshake

logger = logging.getLogger(__name__)

class PQCPerformanceBenchmark:
    """
    Benchmarks the performance of Post-Quantum Cryptography (PQC) algorithms
    against classical algorithms to assist in capacity planning and optimization.
    """
    
    def __init__(self, iterations: int = 10):
        self.iterations = iterations

    def run_all_benchmarks(self) -> Dict[str, Any]:
        """Runs benchmarks for KEM, Signatures, and Hybrid TLS."""
        logger.info("Starting Post-Quantum Cryptography Performance Benchmarks...")
        
        results = {
            "kem_benchmarks": self.benchmark_kem(),
            "signature_benchmarks": self.benchmark_signatures(),
            "hybrid_tls_benchmarks": self.benchmark_hybrid_tls()
        }
        
        logger.info("Benchmarks completed successfully.")
        return results

    def benchmark_kem(self) -> Dict[str, Any]:
        """Benchmarks Kyber KEM variants."""
        variants = ["Kyber512", "Kyber768", "Kyber1024"]
        kem_results = {}
        
        for var in variants:
            kem = KyberKEM(var)
            
            start = time.perf_counter()
            for _ in range(self.iterations):
                pub, priv = kem.generate_keypair()
            keygen_time = (time.perf_counter() - start) / self.iterations
            
            start = time.perf_counter()
            for _ in range(self.iterations):
                ct, ss = kem.encapsulate(pub)
            encap_time = (time.perf_counter() - start) / self.iterations
            
            start = time.perf_counter()
            for _ in range(self.iterations):
                ss_rec = kem.decapsulate(ct, priv)
            decap_time = (time.perf_counter() - start) / self.iterations
            
            kem_results[var] = {
                "keygen_avg_seconds": keygen_time,
                "encap_avg_seconds": encap_time,
                "decap_avg_seconds": decap_time,
                "public_key_size_bytes": len(pub),
                "ciphertext_size_bytes": len(ct)
            }
            
        return kem_results

    def benchmark_signatures(self) -> Dict[str, Any]:
        """Benchmarks Dilithium and SPHINCS+ variants."""
        sig_results = {}
        
        for var in ["Dilithium2", "Dilithium3"]:
            sig = DilithiumSignatures(var)
            
            start = time.perf_counter()
            for _ in range(self.iterations):
                pub, priv = sig.generate_keypair()
            keygen_time = (time.perf_counter() - start) / self.iterations
            
            msg = b"Benchmark message for digital signatures."
            start = time.perf_counter()
            for _ in range(self.iterations):
                signature = sig.sign(msg, priv)
            sign_time = (time.perf_counter() - start) / self.iterations
            
            start = time.perf_counter()
            for _ in range(self.iterations):
                is_valid = sig.verify(msg, signature, pub)
            verify_time = (time.perf_counter() - start) / self.iterations
            
            sig_results[var] = {
                "keygen_avg_seconds": keygen_time,
                "sign_avg_seconds": sign_time,
                "verify_avg_seconds": verify_time,
                "public_key_size_bytes": len(pub),
                "signature_size_bytes": len(signature)
            }
            
        sphincs = SPHINCSPlus()
        start = time.perf_counter()
        pub, priv = sphincs.generate_keypair()
        keygen_time = (time.perf_counter() - start)
        
        msg = b"Benchmark message for SPHINCS+."
        start = time.perf_counter()
        signature = sphincs.sign(msg, priv)
        sign_time = (time.perf_counter() - start)
        
        start = time.perf_counter()
        is_valid = sphincs.verify(msg, signature, pub)
        verify_time = (time.perf_counter() - start)
        
        sig_results["SPHINCS+"] = {
            "keygen_avg_seconds": keygen_time,
            "sign_avg_seconds": sign_time,
            "verify_avg_seconds": verify_time,
            "public_key_size_bytes": len(pub),
            "signature_size_bytes": len(signature)
        }
        
        return sig_results

    def benchmark_hybrid_tls(self) -> Dict[str, Any]:
        """Benchmarks the Hybrid TLS Handshake."""
        handshake = HybridTLSHandshake()
        
        start = time.perf_counter()
        for _ in range(self.iterations):
            server_data = handshake.generate_server_keypair()
        server_keygen_time = (time.perf_counter() - start) / self.iterations
        
        start = time.perf_counter()
        for _ in range(self.iterations):
            client_shares, client_secret = handshake.client_initiate(server_data["public_shares"])
        client_init_time = (time.perf_counter() - start) / self.iterations
        
        start = time.perf_counter()
        for _ in range(self.iterations):
            server_secret = handshake.server_finalize(client_shares, server_data["keys"])
        server_finalize_time = (time.perf_counter() - start) / self.iterations
        
        return {
            "server_keygen_avg_seconds": server_keygen_time,
            "client_initiate_avg_seconds": client_init_time,
            "server_finalize_avg_seconds": server_finalize_time,
            "handshake_successful": client_secret == server_secret
        }

if __name__ == "__main__":
    benchmark = PQCPerformanceBenchmark(iterations=5)
    results = benchmark.run_all_benchmarks()
    print(results)
