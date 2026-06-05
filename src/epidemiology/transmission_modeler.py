import torch
import torch.nn as nn

class HybridSEIRModel(nn.Module):
    def __init__(self, params):
        super().__init__()
        self.params = params
        self.lstm = nn.LSTM(input_size=4, hidden_size=64, batch_first=True)
        self.fc = nn.Linear(64, 4)

    def forward(self, x, prev_state):
        # Hybrid approach: Mechanistic SEIR ODEs augmented by LSTM residuals
        lstm_out, state = self.lstm(x, prev_state)
        delta = self.fc(lstm_out)
        return delta, state