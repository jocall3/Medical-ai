class SidecarInjector:
    def inject_sidecar(self, pod_spec: dict):
        # Logic to inject Envoy proxy sidecar into pod specifications
        pod_spec.setdefault('annotations', {})['sidecar.istio.io/inject'] = 'true'
        return pod_spec