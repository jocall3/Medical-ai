import time
from typing import Dict, Any, Set, Optional

class ConsentTracker:
    """
    Tracks and enforces patient consent states for data processing, clinical trials,
    and research usage, ensuring compliance with GDPR Article 7 and HIPAA Authorization rules.
    """
    def __init__(self):
        self._consent_store: Dict[str, Dict[str, Dict[str, Any]]] = {}

    def update_consent(self, patient_id: str, purpose: str, consented: bool, mechanism: str) -> None:
        if patient_id not in self._consent_store:
            self._consent_store[patient_id] = {}
        
        self._consent_store[patient_id][purpose] = {
            "consented": consented,
            "timestamp": time.time(),
            "mechanism": mechanism
        }

    def verify_consent(self, patient_id: str, purpose: str) -> bool:
        patient_consents = self._consent_store.get(patient_id)
        if not patient_consents:
            return False
        
        purpose_consent = patient_consents.get(purpose)
        if not purpose_consent:
            return False
            
        return purpose_consent["consented"]

    def get_patient_consents(self, patient_id: str) -> Dict[str, Dict[str, Any]]:
        return self._consent_store.get(patient_id, {})

    def revoke_all_consent(self, patient_id: str, mechanism: str) -> None:
        if patient_id in self._consent_store:
            for purpose in list(self._consent_store[patient_id].keys()):
                self.update_consent(patient_id, purpose, consented=False, mechanism=mechanism)
