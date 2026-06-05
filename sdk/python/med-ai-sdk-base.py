import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

class MedicalAISDKComponent(ABC):
    """
    Base class for all Medical-AI SDK components.
    Provides shared configuration, logging, and error handling mechanisms.
    """
    def __init__(self, config: Dict[str, Any], logger: Optional[logging.Logger] = None):
        self.config = config or {}
        self.logger = logger or logging.getLogger(self.__class__.__name__)
        self._setup_logging()

    def _setup_logging(self):
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(self.config.get("log_level", logging.INFO))

    @abstractmethod
    def validate_configuration(self) -> bool:
        """Validates that the component has all necessary configurations."""
        pass
