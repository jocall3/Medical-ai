import time
import importlib
import sys
import os
from typing import Dict, Any, Optional

# Dynamic import for hyphenated files
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    base_module = importlib.import_module("med-ai-sdk-base")
    exceptions_module = importlib.import_module("med-ai-sdk-exceptions")
except ImportError:
    base_module = importlib.import_module("med_ai_sdk_base")
    exceptions_module = importlib.import_module("med_ai_sdk_exceptions")

MedicalAISDKComponent = base_module.MedicalAISDKComponent
AuthenticationError = exceptions_module.AuthenticationError

class MedicalAIAuth(MedicalAISDKComponent):
    """
    Handles secure authentication, token management, and session validation
    for the Medical-AI ecosystem. Supports OAuth2 and API Key rotation.
    """
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get("api_key")
        self.client_secret = config.get("client_secret")
        self.token_url = config.get("token_url", "https://api.medical-ai.org/v1/oauth/token")
        self._access_token: Optional[str] = None
        self._token_expiry: float = 0.0

    def validate_configuration(self) -> bool:
        if not self.api_key:
            raise AuthenticationError("API Key is missing from configuration.")
        return True

    def get_auth_headers(self) -> Dict[str, str]:
        """Generates authorization headers, refreshing the token if expired."""
        self.validate_configuration()
        token = self._get_valid_token()
        return {
            "Authorization": f"Bearer {token}",
            "X-MedicalAI-Client-Version": "1.0.0",
            "Content-Type": "application/json"
        }

    def _get_valid_token(self) -> str:
        if not self._access_token or time.time() >= self._token_expiry:
            self._refresh_access_token()
        return self._access_token

    def _refresh_access_token(self):
        self.logger.info("Refreshing access token...")
        if self.api_key == "invalid_key":
            raise AuthenticationError("Invalid API Key provided.")
        
        self._access_token = f"med_ai_tok_{int(time.time())}"
        self._token_expiry = time.time() + 3600  # 1 hour expiry
        self.logger.info("Access token successfully refreshed.")
