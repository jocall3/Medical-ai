import sys
import platform
import random
from typing import Dict, Any, Optional

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

class ReproducibilityEngine:
    """
    Ensures AI model training and data processing pipelines are fully reproducible.
    """
    @staticmethod
    def set_seed(seed: int) -> Dict[str, Any]:
        """
        Sets seeds across all standard libraries and frameworks to ensure determinism.
        """
        random.seed(seed)
        seeds_set = {"python_random": seed}

        if HAS_NUMPY:
            np.random.seed(seed)
            seeds_set["numpy"] = seed

        if HAS_TORCH:
            torch.manual_seed(seed)
            torch.cuda.manual_seed_all(seed)
            torch.backends.cudnn.deterministic = True
            torch.backends.cudnn.benchmark = False
            seeds_set["pytorch"] = seed
            seeds_set["pytorch_cudnn_deterministic"] = True

        return seeds_set

    @staticmethod
    def capture_environment() -> Dict[str, Any]:
        """
        Captures the exact execution environment details.
        """
        env = {
            "os": platform.system(),
            "os_release": platform.release(),
            "python_version": sys.version,
            "architecture": platform.machine(),
        }
        if HAS_NUMPY:
            env["numpy_version"] = np.__version__
        if HAS_TORCH:
            env["pytorch_version"] = torch.__version__
            env["cuda_available"] = torch.cuda.is_available()
            if torch.cuda.is_available():
                env["cuda_device_name"] = torch.cuda.get_device_name(0)
        return env

    def generate_reproducibility_blueprint(self, seed: int, hyperparameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates a complete blueprint containing seeds, environment, and hyperparameters.
        """
        seeds = self.set_seed(seed)
        env = self.capture_environment()
        return {
            "seeds": seeds,
            "environment": env,
            "hyperparameters": hyperparameters
        }

    def verify_reproducibility(self, original_blueprint: Dict[str, Any], current_blueprint: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compares two blueprints to detect potential sources of non-determinism or drift.
        """
        mismatches = {}
        
        # Check seeds
        for k, v in original_blueprint.get("seeds", {}).items():
            if current_blueprint.get("seeds", {}).get(k) != v:
                mismatches[f"seed_{k}"] = {"expected": v, "got": current_blueprint.get("seeds", {}).get(k)}

        # Check environment
        for k, v in original_blueprint.get("environment", {}).items():
            if current_blueprint.get("environment", {}).get(k) != v:
                mismatches[f"env_{k}"] = {"expected": v, "got": current_blueprint.get("environment", {}).get(k)}

        # Check hyperparameters
        for k, v in original_blueprint.get("hyperparameters", {}).items():
            if current_blueprint.get("hyperparameters", {}).get(k) != v:
                mismatches[f"hyperparam_{k}"] = {"expected": v, "got": current_blueprint.get("hyperparameters", {}).get(k)}

        if mismatches:
            return {"status": "drift_detected", "mismatches": mismatches}
        return {"status": "fully_reproducible"}
