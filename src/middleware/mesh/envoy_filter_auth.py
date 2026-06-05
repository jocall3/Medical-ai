class EnvoyFilterAuth:
    def create_auth_filter(self, service_name: str):
        # Generates an EnvoyFilter to delegate auth to an external service
        return {
            "apiVersion": "networking.istio.io/v1alpha3",
            "kind": "EnvoyFilter",
            "metadata": {"name": f"{service_name}-auth-filter"},
            "spec": {
                "configPatches": [{
                    "applyTo": "HTTP_FILTER",
                    "patch": {"operation": "INSERT_BEFORE", "value": {"name": "envoy.filters.http.ext_authz"}}
                }]
            }
        }