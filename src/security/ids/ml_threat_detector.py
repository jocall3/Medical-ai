import torch
import torch.nn as nn

class ZeroDayDetector(nn.Module):
    def __init__(self):
        super().__init__()
        self.layer = nn.Linear(10, 1)

    def forward(self, x):
        return torch.sigmoid(self.layer(x))