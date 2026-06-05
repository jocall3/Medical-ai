import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, Dict

class TranscriptomicsVAE(nn.Module):
    def __init__(self, input_dim: int, latent_dim: int = 50, hidden_dims: list = [512, 256], dropout: float = 0.1):
        super(TranscriptomicsVAE, self).__init__()
        
        encoder_layers = []
        curr_dim = input_dim
        for h_dim in hidden_dims:
            encoder_layers.append(nn.Linear(curr_dim, h_dim))
            encoder_layers.append(nn.BatchNorm1d(h_dim))
            encoder_layers.append(nn.ReLU())
            encoder_layers.append(nn.Dropout(dropout))
            curr_dim = h_dim
        
        self.encoder = nn.Sequential(*encoder_layers)
        self.fc_mu = nn.Linear(curr_dim, latent_dim)
        self.fc_var = nn.Linear(curr_dim, latent_dim)
        
        decoder_layers = []
        curr_dim = latent_dim
        for h_dim in reversed(hidden_dims):
            decoder_layers.append(nn.Linear(curr_dim, h_dim))
            decoder_layers.append(nn.BatchNorm1d(h_dim))
            decoder_layers.append(nn.ReLU())
            decoder_layers.append(nn.Dropout(dropout))
            curr_dim = h_dim
            
        self.decoder = nn.Sequential(*decoder_layers)
        self.reconstruct_mean = nn.Linear(curr_dim, input_dim)
        self.reconstruct_dropout = nn.Linear(curr_dim, input_dim)

    def encode(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        hidden = self.encoder(x)
        mu = self.fc_mu(hidden)
        log_var = self.fc_var(hidden)
        return mu, log_var

    def reparameterize(self, mu: torch.Tensor, log_var: torch.Tensor) -> torch.Tensor:
        std = torch.exp(0.5 * log_var)
        eps = torch.randn_like(std)
        return mu + eps * std

    def decode(self, z: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        hidden = self.decoder(z)
        recon_mean = torch.exp(self.reconstruct_mean(hidden))
        dropout_logits = self.reconstruct_dropout(hidden)
        return recon_mean, dropout_logits

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
        mu, log_var = self.encode(x)
        z = self.reparameterize(mu, log_var)
        recon_mean, dropout_logits = self.decode(z)
        return recon_mean, dropout_logits, mu, log_var

    def loss_function(self, x: torch.Tensor, recon_mean: torch.Tensor, dropout_logits: torch.Tensor, mu: torch.Tensor, log_var: torch.Tensor, kl_weight: float = 0.01) -> Dict[str, torch.Tensor]:
        recon_loss = F.mse_loss(recon_mean, x, reduction='none')
        zero_mask = (x == 0).float()
        dropout_prob = torch.sigmoid(dropout_logits)
        
        zi_loss = zero_mask * torch.log(dropout_prob + (1 - dropout_prob) * torch.exp(-recon_mean) + 1e-8) + \
                  (1 - zero_mask) * (torch.log(1 - dropout_prob + 1e-8) - recon_loss)
        
        total_recon_loss = -zi_loss.mean()
        kl_loss = -0.5 * torch.sum(1 + log_var - mu.pow(2) - log_var.exp(), dim=1).mean()
        total_loss = total_recon_loss + kl_weight * kl_loss
        
        return {
            "loss": total_loss,
            "recon_loss": total_recon_loss,
            "kl_loss": kl_loss
        }

    @torch.no_grad()
    def get_embeddings(self, x: torch.Tensor) -> torch.Tensor:
        self.eval()
        mu, _ = self.encode(x)
        return mu
