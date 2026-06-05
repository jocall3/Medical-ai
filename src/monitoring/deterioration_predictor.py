import torch
import torch.nn as nn
import numpy as np
from src.monitoring.monitoring_config import MonitoringConfig

class DeteriorationLSTM(nn.Module):
    def __init__(self, config: MonitoringConfig):
        super(DeteriorationLSTM, self).__init__()
        self.config = config
        self.lstm = nn.LSTM(
            input_size=config.INPUT_DIM,
            hidden_size=config.HIDDEN_DIM,
            num_layers=config.NUM_LAYERS,
            batch_first=True,
            dropout=config.DROPOUT if config.NUM_LAYERS > 1 else 0.0
        )
        self.fc = nn.Sequential(
            nn.Linear(config.HIDDEN_DIM, 32),
            nn.ReLU(),
            nn.Dropout(config.DROPOUT),
            nn.Linear(32, 1)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (batch_size, sequence_length, input_dim)
        lstm_out, (hn, cn) = self.lstm(x)
        # Take the output of the last time step
        last_step_out = lstm_out[:, -1, :]
        logits = self.fc(last_step_out)
        return torch.sigmoid(logits)

class DeteriorationPredictor:
    def __init__(self, config: MonitoringConfig, model_path: str = None):
        self.config = config
        self.model = DeteriorationLSTM(config)
        if model_path:
            self.model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
        self.model.eval()

    def predict_risk(self, preprocessed_sequence: np.ndarray) -> float:
        """
        Predicts the probability of clinical deterioration within the 6-hour window.
        Input shape: (sequence_length, input_dim)
        """
        tensor_input = torch.tensor(preprocessed_sequence, dtype=torch.float32).unsqueeze(0) # Add batch dim
        with torch.no_grad():
            risk_score = self.model(tensor_input).item()
        return risk_score
