# Service Mesh Security Architecture

This document outlines the security layer for our medical AI platform. We utilize a zero-trust model where every service is assigned a unique SPIFFE identity and all traffic is encrypted via mTLS 1.3. Policies are managed as code and synchronized with the Istio control plane to ensure consistent enforcement across all clinical and research workloads.