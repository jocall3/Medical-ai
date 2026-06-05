import torch
import torch.nn as nn

class MolecularVAE(nn.Module):
    def __init__(self, latent_dim=128):
        super(MolecularVAE, self).__init__()
        self.encoder = nn.Sequential(nn.Linear(1024, 512), nn.ReLU(), nn.Linear(512, latent_dim * 2))
        self.decoder = nn.Sequential(nn.Linear(latent_dim, 512), nn.ReLU(), nn.Linear(512, 1024))

    def forward(self, x):
        mu, logvar = torch.chunk(self.encoder(x), 2, dim=-1)
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        z = mu + eps * std
        return self.decoder(z), mu, logvar