class FaultInjection:
    def inject_delay(self, service: str, delay_ms: int):
        # Injects latency for resilience testing
        return {"service": service, "delay": f"{delay_ms}ms"}