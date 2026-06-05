import importlib
import sys
import os
from typing import Dict, Any, Optional

# Dynamic import for hyphenated files
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    base_module = importlib.import_module("med-ai-sdk-base")
    auth_module = importlib.import_module("med-ai-sdk-auth")
    data_module = importlib.import_module("med-ai-sdk-data")
    models_module = importlib.import_module("med-ai-sdk-models")
    testing_module = importlib.import_module("med-ai-sdk-testing")
    docs_module = importlib.import_module("med-ai-sdk-docs")
    utils_module = importlib.import_module("med-ai-sdk-utils")
except ImportError:
    base_module = importlib.import_module("med_ai_sdk_base")
    auth_module = importlib.import_module("med_ai_sdk_auth")
    data_module = importlib.import_module("med_ai_sdk_data")
    models_module = importlib.import_module("med_ai_sdk_models")
    testing_module = importlib.import_module("med_ai_sdk_testing")
    docs_module = importlib.import_module("med_ai_sdk_docs")
    utils_module = importlib.import_module("med_ai_sdk_utils")

MedicalAISDKComponent = base_module.MedicalAISDKComponent
MedicalAIAuth = auth_module.MedicalAIAuth
MedicalDataManager = data_module.MedicalDataManager
MedicalModelClient = models_module.MedicalModelClient
ClinicalSimulator = testing_module.ClinicalSimulator
MedicalAIDocGenerator = docs_module.MedicalAIDocGenerator
MedicalAIUtils = utils_module.MedicalAIUtils

class MedicalAISDK(MedicalAISDKComponent):
    """
    The primary orchestrator and entry point for the Medical-AI Python SDK.
    Integrates authentication, data management, model inference, clinical testing,
    and utility modules into a unified, medical-grade interface.
    """
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        
        self.auth = MedicalAIAuth(config)
        self.data = MedicalDataManager(config)
        self.models = MedicalModelClient(config, self.auth)
        self.testing = ClinicalSimulator(config, self.models)
        self.docs = MedicalAIDocGenerator(config)
        self.utils = MedicalAIUtils()
        
        self.logger.info("Medical-AI SDK successfully initialized.")

    def validate_configuration(self) -> bool:
        """Validates all sub-components configurations."""
        self.auth.validate_configuration()
        self.data.validate_configuration()
        self.models.validate_configuration()
        self.testing.validate_configuration()
        self.docs.validate_configuration()
        return True
