class ServiceIdentity:
    def get_spiffe_id(self, namespace: str, service_account: str):
        # Generates SPIFFE identity for microservices
        return f"spiffe://cluster.local/ns/{namespace}/sa/{service_account}"