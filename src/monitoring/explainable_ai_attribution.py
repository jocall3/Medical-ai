import torch
import numpy as np
from typing import List, Dict
from src.monitoring.deterioration_predictor import DeteriorationLSTM
from src.monitoring.monitoring_config import MonitoringConfig

class IntegratedGradientsAttribution:
    def __init__(self, model: DeteriorationLSTM, config: MonitoringConfig):
        self.model = model
        self.config = config
        self.model.eval()

    def compute_attributions(self, input_sequence: np.ndarray, steps: int = 50) -> np.ndarray:
        """
        Computes Integrated Gradients for the input sequence relative to a zero baseline.
        input_sequence shape: (sequence_length, input_dim)
        Returns attribution scores of the same shape.
        """
        # Convert to torch tensor and add batch dimension
        input_tensor = torch.tensor(input_sequence, dtype=torch.float32).unsqueeze(0).requires_grad_(True)
        baseline = torch.zeros_like(input_tensor)
        
        # Generate scaled inputs along the path from baseline to input
        scaled_inputs = [baseline + (float(i) / steps) * (input_tensor - baseline) for i in range(steps + 1)]
        
        grads = []
        for scaled_input in scaled_inputs:
            scaled_input_grad = scaled_input.clone().detach().requires_grad_(True)
            output = self.model(scaled_input_grad)
            
            # Backward pass to get gradients
            self.model.zero_grad()
            output.backward()
            grads.append(scaled_input_grad.grad.data.cpu().numpy())
            
        # Average the gradients
        avg_grads = np.mean(np.concatenate(grads, axis=0), axis=0) # Shape: (sequence_length, input_dim)
        
        # Integrated Gradients = (input - baseline) * avg_gradients
        delta = (input_tensor - baseline).detach().cpu().numpy()[0]
        attributions = delta * avg_grads
        
        return attributions

    def get_clinical_explanations(self, input_sequence: np.ndarray, attributions: np.ndarray) -> List[Dict[str, any]]:
        """
        Formats attribution scores into human-readable clinical explanations.
        """
        explanations = []
        for t in range(self.config.SEQUENCE_LENGTH):
            step_explanation = {}
            for idx, key in enumerate(self.config.VITAL_SIGNS_KEYS):
                step_explanation[key] = {
                    "value": float(input_sequence[t, idx]),
                    "attribution": float(attributions[t, idx])
                }
            explanations.append(step_explanation)
        return explanations
