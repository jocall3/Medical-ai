class FHIRSubscriptionManager:
    def __init__(self, fhir_server_url):
        self.fhir_server_url = fhir_server_url

    def create_subscription(self, topic, criteria, endpoint):
        # Logic to register a webhook subscription on the FHIR server
        return {"status": "created", "topic": topic, "endpoint": endpoint}