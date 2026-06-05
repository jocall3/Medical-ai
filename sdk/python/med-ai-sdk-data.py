import datetime
import random
import importlib
import sys
import os
from typing import Dict, Any, List

# Dynamic import for hyphenated files
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    base_module = importlib.import_module("med-ai-sdk-base")
    exceptions_module = importlib.import_module("med-ai-sdk-exceptions")
    types_module = importlib.import_module("med-ai-sdk-types")
    utils_module = importlib.import_module("med-ai-sdk-utils")
except ImportError:
    base_module = importlib.import_module("med_ai_sdk_base")
    exceptions_module = importlib.import_module("med_ai_sdk_exceptions")
    types_module = importlib.import_module("med_ai_sdk_types")
    utils_module = importlib.import_module("med_ai_sdk_utils")

MedicalAISDKComponent = base_module.MedicalAISDKComponent
HIPAAComplianceError = exceptions_module.HIPAAComplianceError
ValidationError = exceptions_module.ValidationError
AnonymizationConfig = types_module.AnonymizationConfig
FHIRResource = types_module.FHIRResource
MedicalAIUtils = utils_module.MedicalAIUtils

class MedicalDataManager(MedicalAISDKComponent):
    """
    Handles medical data ingestion, validation, and automatic anonymization
    to ensure strict HIPAA and GDPR compliance before sending data to models.
    """
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.anonymization_config = config.get("anonymization_config", AnonymizationConfig())

    def validate_configuration(self) -> bool:
        return True

    def process_and_anonymize_fhir(self, fhir_resource: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates and anonymizes a FHIR resource based on the configured rules.
        """
        MedicalAIUtils.validate_fhir_resource(fhir_resource)
        
        import copy
        clean_resource = copy.deepcopy(fhir_resource)
        
        if self.anonymization_config.remove_direct_identifiers:
            self._strip_identifiers(clean_resource)
            
        if self.anonymization_config.shift_dates:
            self._shift_resource_dates(clean_resource)
            
        return clean_resource

    def _strip_identifiers(self, resource: Dict[str, Any]):
        """Removes direct identifiers like names, addresses, and contact info."""
        if "name" in resource:
            resource["name"] = [{"use": "anonymous", "text": "ANONYMOUS"}]
        if "telecom" in resource:
            resource["telecom"] = []
        if "address" in resource:
            resource["address"] = []
        if "identifier" in resource:
            resource["identifier"] = [{"system": "http://medical-ai.org/sid", "value": "ANON_ID"}]

    def _shift_resource_dates(self, resource: Dict[str, Any]):
        """Shifts dates to preserve intervals while protecting patient privacy."""
        shift_days = self.anonymization_config.date_shift_days or random.randint(10, 365)
        
        def shift_recursive(data: Any):
            if isinstance(data, dict):
                for k, v in list(data.items()):
                    if "date" in k.lower() or k == "birthDate":
                        if isinstance(v, str):
                            try:
                                dt = datetime.datetime.fromisoformat(v.replace("Z", "+00:00"))
                                shifted_dt = dt - datetime.timedelta(days=shift_days)
                                data[k] = shifted_dt.isoformat()
                            except ValueError:
                                pass
                    else:
                        shift_recursive(v)
            elif isinstance(data, list):
                for item in data:
                    shift_recursive(item)

        shift_recursive(resource)
