# Homomorphic Encryption Middleware

## Overview
This module provides secure computation capabilities for medical AI, allowing inference on encrypted patient data.

## Schemes
- **CKKS**: Used for real-valued data (e.g., medical imaging).
- **BFV**: Used for integer-based categorical data.

## Security
All operations are performed on ciphertexts, ensuring zero-knowledge access to raw medical records.