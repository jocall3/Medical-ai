import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple

class PatchEmbedding(nn.Module):
    def __init__(self, in_channels: int = 3, patch_size: int = 16, embed_dim: int = 768, img_size: int = 512):
        super().__init__()
        self.patch_size = patch_size
        self.num_patches = (img_size // patch_size) ** 2
        self.proj = nn.Conv2d(in_channels, embed_dim, kernel_size=patch_size, stride=patch_size)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.proj(x)  # [B, embed_dim, H/patch_size, W/patch_size]
        x = x.flatten(2).transpose(1, 2)  # [B, num_patches, embed_dim]
        return x

class TransformerEncoderLayer(nn.Module):
    def __init__(self, embed_dim: int = 768, num_heads: int = 8, mlp_dim: int = 2048, dropout: float = 0.1):
        super().__init__()
        self.norm1 = nn.LayerNorm(embed_dim)
        self.attn = nn.MultiheadAttention(embed_dim, num_heads, dropout=dropout, batch_first=True)
        self.norm2 = nn.LayerNorm(embed_dim)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, mlp_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(mlp_dim, embed_dim),
            nn.Dropout(dropout)
        )
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x_norm = self.norm1(x)
        attn_out, _ = self.attn(x_norm, x_norm, x_norm)
        x = x + attn_out
        x = x + self.mlp(self.norm2(x))
        return x

class DecoderBlock(nn.Module):
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )
        
    def forward(self, x: torch.Tensor, skip: torch.Tensor = None) -> torch.Tensor:
        x = F.interpolate(x, scale_factor=2, mode='bilinear', align_corners=True)
        if skip is not None:
            x = torch.cat([x, skip], dim=1)
        return self.conv(x)

class TissueSegmentationViTUNet(nn.Module):
    """
    Hybrid Vision Transformer (ViT) and U-Net architecture for real-time,
    high-fidelity semantic segmentation of critical anatomical structures.
    """
    def __init__(self, img_size: int = 512, in_channels: int = 3, num_classes: int = 4, embed_dim: int = 768, depth: int = 6, num_heads: int = 8):
        super().__init__()
        self.img_size = img_size
        self.patch_size = 16
        self.patch_embed = PatchEmbedding(in_channels, self.patch_size, embed_dim, img_size)
        
        self.pos_embed = nn.Parameter(torch.zeros(1, self.patch_embed.num_patches, embed_dim))
        self.transformer_layers = nn.ModuleList([
            TransformerEncoderLayer(embed_dim, num_heads) for _ in range(depth)
        ])
        
        self.enc1 = nn.Sequential(
            nn.Conv2d(in_channels, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True)
        )
        self.enc2 = nn.Sequential(
            nn.MaxPool2d(2),
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True)
        )
        self.enc3 = nn.Sequential(
            nn.MaxPool2d(2),
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True)
        )
        
        self.bridge = nn.Sequential(
            nn.Conv2d(embed_dim, 512, kernel_size=3, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(inplace=True)
        )
        
        self.dec1 = DecoderBlock(512 + 256, 256)
        self.dec2 = DecoderBlock(256 + 128, 128)
        self.dec3 = DecoderBlock(128 + 64, 64)
        self.final_upsample = DecoderBlock(64, 32)
        
        self.classifier = nn.Conv2d(32, num_classes, kernel_size=1)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, C, H, W = x.shape
        
        s1 = self.enc1(x)   # [B, 64, H, W]
        s2 = self.enc2(s1)  # [B, 128, H/2, W/2]
        s3 = self.enc3(s2)  # [B, 256, H/4, W/4]
        
        t = self.patch_embed(x)
        t = t + self.pos_embed
        for layer in self.transformer_layers:
            t = layer(t)
            
        grid_size = self.img_size // self.patch_size
        t = t.transpose(1, 2).reshape(B, -1, grid_size, grid_size) # [B, embed_dim, H/16, W/16]
        t = self.bridge(t) # [B, 512, H/16, W/16]
        
        x_dec = F.interpolate(t, scale_factor=2, mode='bilinear', align_corners=True) # [B, 512, H/8, W/8]
        x_dec = F.interpolate(x_dec, scale_factor=2, mode='bilinear', align_corners=True) # [B, 512, H/4, W/4]
        x_dec = torch.cat([x_dec, s3], dim=1) # [B, 512+256, H/4, W/4]
        x_dec = self.dec1.conv(x_dec) # [B, 256, H/4, W/4]
        
        x_dec = F.interpolate(x_dec, scale_factor=2, mode='bilinear', align_corners=True) # [B, 256, H/2, W/2]
        x_dec = torch.cat([x_dec, s2], dim=1) # [B, 256+128, H/2, W/2]
        x_dec = self.dec2.conv(x_dec) # [B, 128, H/2, W/2]
        
        x_dec = F.interpolate(x_dec, scale_factor=2, mode='bilinear', align_corners=True) # [B, 128, H, W]
        x_dec = torch.cat([x_dec, s1], dim=1) # [B, 128+64, H, W]
        x_dec = self.dec3.conv(x_dec) # [B, 64, H, W]
        
        x_dec = self.final_upsample.conv(x_dec) # [B, 32, H, W]
        
        logits = self.classifier(x_dec)
        return logits
