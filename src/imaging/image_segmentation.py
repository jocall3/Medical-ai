import torch
import torch.nn as nn

class UNet3D(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.encoder = nn.Sequential(nn.Conv3d(in_channels, 32, 3, padding=1), nn.ReLU(), nn.MaxPool3d(2))
        self.decoder = nn.Sequential(nn.ConvTranspose3d(32, out_channels, 2, stride=2), nn.Sigmoid())

    def forward(self, x):
        return self.decoder(self.encoder(x))