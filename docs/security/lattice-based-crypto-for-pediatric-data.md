# Lattice-Based Crypto for Pediatric Data

Pediatric genomic data is a prime target for 'Store Now, Decrypt Later' attacks. 

## Protocols
- All pediatric genomic sequences are encrypted using lattice-based primitives at the moment of sequencing.
- Keys are rotated every 5 years using a quantum-safe key derivation function (KDF).
- This ensures that even if data is intercepted today, it remains undecipherable by future quantum computers.