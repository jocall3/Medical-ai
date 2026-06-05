class MedicalAIException(Exception):
    """Base exception class for all Medical-AI SDK errors."""
    def __init__(self, message: str, error_code: str = "GENERIC_ERROR"):
        super().__init__(message)
        self.message = message
        self.error_code = error_code

class AuthenticationError(MedicalAIException):
    """Raised when authentication fails or credentials are invalid."""
    def __init__(self, message: str):
        super().__init__(message, "AUTH_ERROR")

class ValidationError(MedicalAIException):
    """Raised when medical data validation fails (e.g., FHIR or HL7 validation)."""
    def __init__(self, message: str, validation_details: dict = None):
        super().__init__(message, "VALIDATION_ERROR")
        self.validation_details = validation_details or {}

class AnonymizationError(MedicalAIException):
    """Raised when PHI anonymization fails, preventing data transmission."""
    def __init__(self, message: str):
        super().__init__(message, "ANONYMIZATION_ERROR")

class InferenceError(MedicalAIException):
    """Raised when a medical model fails to perform inference."""
    def __init__(self, message: str):
        super().__init__(message, "INFERENCE_ERROR")

class ClinicalSimulationError(MedicalAIException):
    """Raised during clinical simulation or safety testing failures."""
    def __init__(self, message: str):
        super().__init__(message, "CLINICAL_SIMULATION_ERROR")

class HIPAAComplianceError(MedicalAIException):
    """Raised when a potential HIPAA or GDPR compliance violation is detected."""
    def __init__(self, message: str):
        super().__init__(message, "HIPAA_COMPLIANCE_ERROR")
