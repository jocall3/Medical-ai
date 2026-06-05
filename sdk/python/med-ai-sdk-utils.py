import re
import logging
import importlib
import sys
import os
from typing import Dict, Any, List

# Dynamic import for hyphenated files
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    exceptions_module = importlib.import_module("med-ai-sdk-exceptions")
except ImportError:
    exceptions_module = importlib.import_module("med_ai_sdk_exceptions")

ValidationError = exceptions_module.ValidationError

class MedicalAIUtils:
    """
    Utility functions for medical data conversion, secure logging,
    and FHIR/HL7 validation.
    """
    @staticmethod
    def redact_phi(text: str) -> str:
        """Redacts common PHI patterns (SSN, Email, Phone) from text strings."""
        text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[REDACTED SSN]', text)
        text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[REDACTED EMAIL]', text)
        text = re.sub(r'\b\d{3}-\d{3}-\d{4}\b', '[REDACTED PHONE]', text)
        return text

    @staticmethod
    def convert_lab_units(value: float, from_unit: str, to_unit: str) -> float:
        """Converts common clinical lab units (e.g., mg/dL to mmol/L for glucose)."""
        from_unit = from_unit.lower()
        to_unit = to_unit.lower()
        
        if from_unit == "mg/dl" and to_unit == "mmol/l":
            return round(value * 0.0555, 4)
        elif from_unit == "mmol/l" and to_unit == "mg/dl":
            return round(value / 0.0555, 4)
        elif from_unit == to_unit:
            return value
        else:
            raise ValidationError(f"Unsupported unit conversion from {from_unit} to {to_unit}")

    @staticmethod
    def validate_fhir_resource(resource: Dict[str, Any]) -> bool:
        """Performs basic structural validation of a FHIR resource."""
        required_fields = ["resourceType", "id"]
        for field in required_fields:
            if field not in resource:
                raise ValidationError(f"Missing required FHIR field: {field}")
        return True
