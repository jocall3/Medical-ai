import inspect
import sys
import os
import importlib
from typing import Dict, Any, List

# Dynamic import for hyphenated files
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    base_module = importlib.import_module("med-ai-sdk-base")
except ImportError:
    base_module = importlib.import_module("med_ai_sdk_base")

MedicalAISDKComponent = base_module.MedicalAISDKComponent

class MedicalAIDocGenerator(MedicalAISDKComponent):
    """
    Generates clinical-grade documentation and API references directly
    from SDK code comments, docstrings, and type annotations.
    """
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.output_format = config.get("doc_format", "markdown")

    def validate_configuration(self) -> bool:
        return True

    def generate_module_docs(self, module_obj: Any) -> str:
        """
        Parses a Python module and extracts classes, methods, and docstrings
        to generate clean, readable documentation.
        """
        self.logger.info(f"Generating documentation for module: {module_obj.__name__}")
        
        docs = []
        docs.append(f"# Module: {module_obj.__name__}\n")
        if module_obj.__doc__:
            docs.append(f"{module_obj.__doc__.strip()}\n")
            
        for name, obj in inspect.getmembers(module_obj, inspect.isclass):
            if obj.__module__ == module_obj.__name__:
                docs.append(f"## Class: {name}")
                if obj.__doc__:
                    docs.append(f"{obj.__doc__.strip()}\n")
                    
                for method_name, method_obj in inspect.getmembers(obj, inspect.isfunction):
                    if not method_name.startswith("_"):
                        sig = inspect.signature(method_obj)
                        docs.append(f"### Method: `{method_name}{sig}`")
                        if method_obj.__doc__:
                            docs.append(f"{method_obj.__doc__.strip()}\n")
                            
        return "\n".join(docs)
