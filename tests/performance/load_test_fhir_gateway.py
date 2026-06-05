import random
import uuid
from locust import HttpUser, task, between

class FHIRGatewayUser(HttpUser):
    wait_time = between(0.1, 0.5)

    def on_start(self):
        self.patient_id = str(uuid.uuid4())
        self.headers = {
            "Content-Type": "application/fhir+json",
            "Authorization": "Bearer mock-token-for-load-testing-12345"
        }
        self.register_patient()

    def register_patient(self):
        payload = {
            "resourceType": "Patient",
            "id": self.patient_id,
            "active": True,
            "name": [{"use": "official", "family": "Patient", "given": [f"Stream-{self.patient_id[:8]}"]}],
            "gender": random.choice(["male", "female", "other", "unknown"]),
            "birthDate": "1980-01-01"
        }
        self.client.put(f"/fhir/Patient/{self.patient_id}", json=payload, headers=self.headers)

    @task(3)
    def stream_vital_signs(self):
        observation_id = str(uuid.uuid4())
        payload = {
            "resourceType": "Observation",
            "id": observation_id,
            "status": "final",
            "category": [{
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                    "code": "vital-signs",
                    "display": "Vital Signs"
                }]
            }],
            "code": {
                "coding": [{
                    "system": "http://loinc.org",
                    "code": "8867-4",
                    "display": "Heart rate"
                }]
            },
            "subject": {"reference": f"Patient/{self.patient_id}"},
            "effectiveDateTime": "2026-06-05T01:58:00Z",
            "valueQuantity": {
                "value": random.randint(60, 140),
                "unit": "beats/minute",
                "system": "http://unitsofmeasure.org",
                "code": "/min"
            }
        }
        self.client.post("/fhir/Observation", json=payload, headers=self.headers)

    @task(1)
    def stream_device_metric(self):
        payload = {
            "resourceType": "DeviceMetric",
            "id": str(uuid.uuid4()),
            "type": {
                "coding": [{
                    "system": "http://loinc.org",
                    "code": "8310-5",
                    "display": "Body temperature"
                }]
            },
            "unit": {
                "coding": [{
                    "system": "http://unitsofmeasure.org",
                    "code": "Cel",
                    "display": "Cel"
                }]
            },
            "source": {"reference": f"Device/icu-monitor-{self.patient_id[:8]}"},
            "operationalStatus": "on",
            "category": "measurement"
        }
        self.client.post("/fhir/DeviceMetric", json=payload, headers=self.headers)

    @task(2)
    def query_patient_history(self):
        self.client.get(f"/fhir/Observation?subject=Patient/{self.patient_id}&_sort=-date&_count=10", headers=self.headers)
