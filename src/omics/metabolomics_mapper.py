import torch
import torch.nn as nn
import numpy as np
from typing import Dict, Tuple, List

class MetabolomicsMapper(nn.Module):
    def __init__(self, num_metabolites: int, num_reactions: int):
        super(MetabolomicsMapper, self).__init__()
        self.num_metabolites = num_metabolites
        self.num_reactions = num_reactions
        
        self.flux_predictor = nn.Sequential(
            nn.Linear(num_metabolites, 256),
            nn.ReLU(),
            nn.BatchNorm1d(256),
            nn.Dropout(0.1),
            nn.Linear(256, num_reactions),
            nn.Tanh()
        )
        self.register_buffer("S", torch.randn(num_metabolites, num_reactions))

    def forward(self, metabolite_abundances: torch.Tensor) -> torch.Tensor:
        predicted_fluxes = self.flux_predictor(metabolite_abundances)
        return predicted_fluxes

    def compute_steady_state_violation(self, fluxes: torch.Tensor) -> torch.Tensor:
        sv = torch.matmul(self.S, fluxes.t())
        return torch.mean(sv ** 2)

    def loss_function(self, predicted_fluxes: torch.Tensor, target_fluxes: torch.Tensor, metabolite_abundances: torch.Tensor, physics_weight: float = 0.1) -> Dict[str, torch.Tensor]:
        mse_loss = torch.mean((predicted_fluxes - target_fluxes) ** 2)
        steady_state_loss = self.compute_steady_state_violation(predicted_fluxes)
        total_loss = mse_loss + physics_weight * steady_state_loss
        return {
            "loss": total_loss,
            "mse_loss": mse_loss,
            "steady_state_loss": steady_state_loss
        }
