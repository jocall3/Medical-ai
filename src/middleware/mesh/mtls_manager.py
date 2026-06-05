import os

class MTLSManager:
    def __init__(self, namespace: str):
        self.namespace = namespace

    def enforce_strict_mtls(self):
        # Logic to apply PeerAuthentication policy for strict mTLS
        policy = {
            "apiVersion": "security.istio.io/v1beta1",
            "kind": "PeerAuthentication",
            "metadata": {"name": "default", "namespace": self.namespace},
            "spec": {"mtls": {"mode": "STRICT"}}
        }
        return policy