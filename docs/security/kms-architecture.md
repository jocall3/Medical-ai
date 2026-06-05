# Key Management Service (KMS) Architecture

## 1. Executive Summary
This document outlines the architectural design of the Key Management Service (KMS) for our Medical AI platform. Given the highly sensitive nature of clinical datasets, patient health records (PHI), and proprietary deep learning model weights, cryptographic security is paramount. This KMS implementation ensures compliance with HIPAA, GDPR, and SOC2 Type II standards while maintaining high-throughput performance for real-time clinical inference.

## 2. Threat Model & Security Boundaries
Our threat model assumes a zero-trust environment where database storage, network channels, and application runtimes may be compromised. 

- **Data at Rest**: All clinical databases, model weights, and logs are encrypted using AES-256-GCM.
- **Data in Transit**: TLS 1.3 is enforced across all microservices.
- **Key Isolation**: Cryptographic keys are never stored in plaintext. The Master Key is split using Shamir's Secret Sharing and reconstructed only in secure memory boundaries.

## 3. Cryptographic Primitives
- **Symmetric Encryption**: AES-GCM (256-bit keys) for authenticated encryption.
- **Asymmetric Encryption**: RSA-4096 with OAEP padding for secure key exchange and HSM operations.
- **Key Derivation**: HKDF (SHA-256) and PBKDF2 (SHA-256, 600,000 iterations) for deriving session and storage keys.
- **Secret Sharing**: Shamir's Secret Sharing over a 256-bit finite field prime ($2^{256} - 189$).

## 4. Envelope Encryption Flow
To encrypt large medical datasets (e.g., 3D MRI scans, genomic sequences), we implement **Envelope Encryption**:
1. A unique **Data Encryption Key (DEK)** is generated locally via a cryptographically secure pseudorandom number generator (CSPRNG).
2. The dataset is encrypted using the DEK with AES-GCM.
3. The DEK is encrypted using a **Key Encryption Key (KEK)** managed by the Key Vault.
4. The encrypted dataset and the encrypted DEK are stored together. The plaintext DEK is immediately purged from memory.

## 5. Disaster Recovery & Shamir's Secret Sharing
To prevent single-point-of-failure risks associated with a master key, the master key is split into $N$ shares with a threshold of $T$ ($T \le N$). Reconstructing the master key requires at least $T$ shares, preventing any single administrator from compromising the system while ensuring recovery in disaster scenarios.