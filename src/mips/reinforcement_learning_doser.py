import torch
import torch.nn as nn

class DosingAgent(nn.Module):
    def __init__(self, state_dim, action_dim):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(state_dim, 64), nn.ReLU(), nn.Linear(64, action_dim))

    def forward(self, state):
        return self.net(state)

    def select_action(self, state):
        with torch.no_grad():
            return self.forward(torch.FloatTensor(state)).argmax().item()