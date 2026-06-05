import torch
import torch.nn as nn
import torch.nn.functional as F

class SpatialTransformer(nn.Module):
    def __init__(self, size):
        super().__init__()
        self.grid = F.affine_grid(torch.eye(3, 4).unsqueeze(0), (1, 1, *size), align_corners=True)

    def forward(self, x, flow):
        grid = self.grid.repeat(x.shape[0], 1, 1, 1, 1) + flow
        return F.grid_sample(x, grid, mode='bilinear', align_corners=True)

class VoxelMorph(nn.Module):
    def __init__(self, input_shape):
        super().__init__()
        self.encoder = nn.Sequential(nn.Conv3d(2, 16, 3, padding=1), nn.ReLU(), nn.Conv3d(16, 32, 3, stride=2, padding=1), nn.ReLU())
        self.decoder = nn.Sequential(nn.ConvTranspose3d(32, 16, 3, stride=2, padding=1, output_padding=1), nn.ReLU(), nn.Conv3d(16, 3, 3, padding=1))

    def forward(self, moving, fixed):
        x = torch.cat([moving, fixed], dim=1)
        flow = self.decoder(self.encoder(x))
        return flow