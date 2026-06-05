import torch
import torch.nn as nn
from src.fusion.cross_attention_layers import CoAttentionTransformerBlock
from src.fusion.fusion_config import FusionConfig

class GenomicEncoder(nn.Module):
    def __init__(self, vocab_size: int, embed_dim: int, max_len: int, num_layers: int = 3, num_heads: int = 4):
        super().__init__()
        self.token_emb = nn.Embedding(vocab_size, embed_dim)
        self.pos_emb = nn.Parameter(torch.zeros(1, max_len, embed_dim))
        encoder_layer = nn.TransformerEncoderLayer(d_model=embed_dim, nhead=num_heads, batch_first=True)
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

    def forward(self, x: torch.Tensor):
        B, S = x.shape
        emb = self.token_emb(x) + self.pos_emb[:, :S, :]
        return self.transformer(emb)

class ClinicalTextEncoder(nn.Module):
    def __init__(self, vocab_size: int, embed_dim: int, max_len: int, num_layers: int = 3, num_heads: int = 8):
        super().__init__()
        self.token_emb = nn.Embedding(vocab_size, embed_dim)
        self.pos_emb = nn.Parameter(torch.zeros(1, max_len, embed_dim))
        encoder_layer = nn.TransformerEncoderLayer(d_model=embed_dim, nhead=num_heads, batch_first=True)
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

    def forward(self, x: torch.Tensor):
        B, S = x.shape
        emb = self.token_emb(x) + self.pos_emb[:, :S, :]
        return self.transformer(emb)

class ImageFeatureExtractor(nn.Module):
    def __init__(self, embed_dim: int):
        super().__init__()
        self.conv_proj = nn.Conv2d(3, embed_dim, kernel_size=16, stride=16)
        self.pos_emb = nn.Parameter(torch.zeros(1, 196, embed_dim))

    def forward(self, x: torch.Tensor):
        patches = self.conv_proj(x)
        patches = patches.flatten(2).transpose(1, 2)
        return patches + self.pos_emb

class MultimodalFusionEngine(nn.Module):
    def __init__(self, config: FusionConfig):
        super().__init__()
        self.config = config

        self.image_encoder = ImageFeatureExtractor(config.image_embed_dim)
        self.genomic_encoder = GenomicEncoder(config.genomic_vocab_size, config.genomic_embed_dim, config.genomic_max_length)
        self.text_encoder = ClinicalTextEncoder(config.text_vocab_size, config.text_embed_dim, config.text_max_length)

        self.proj_img = nn.Linear(config.image_embed_dim, config.unified_latent_dim)
        self.proj_gen = nn.Linear(config.genomic_embed_dim, config.unified_latent_dim)
        self.proj_txt = nn.Linear(config.text_embed_dim, config.unified_latent_dim)

        self.fusion_img_txt = CoAttentionTransformerBlock(
            dim_a=config.unified_latent_dim,
            dim_b=config.unified_latent_dim,
            embed_dim=config.unified_latent_dim,
            num_heads=config.num_attention_heads,
            ff_dim=config.feedforward_dim,
            dropout=config.attention_dropout
        )
        self.fusion_gen_txt = CoAttentionTransformerBlock(
            dim_a=config.unified_latent_dim,
            dim_b=config.unified_latent_dim,
            embed_dim=config.unified_latent_dim,
            num_heads=config.num_attention_heads,
            ff_dim=config.feedforward_dim,
            dropout=config.attention_dropout
        )

        self.classifier = nn.Sequential(
            nn.Linear(config.unified_latent_dim * 3, config.unified_latent_dim),
            nn.GELU(),
            nn.Dropout(config.classifier_dropout),
            nn.Linear(config.unified_latent_dim, config.num_classes)
        )

    def forward(self, images: torch.Tensor, genomics: torch.Tensor, text: torch.Tensor, 
                genomic_mask: torch.Tensor = None, text_mask: torch.Tensor = None):
        img_feats = self.image_encoder(images)
        gen_feats = self.genomic_encoder(genomics)
        txt_feats = self.text_encoder(text)

        img_proj = self.proj_img(img_feats)
        gen_proj = self.proj_gen(gen_feats)
        txt_proj = self.proj_txt(txt_feats)

        img_aligned, txt_aligned_img, w_img_txt, w_txt_img = self.fusion_img_txt(img_proj, txt_proj, mask_b=text_mask)
        gen_aligned, txt_aligned_gen, w_gen_txt, w_txt_gen = self.fusion_gen_txt(gen_proj, txt_proj, mask_a=genomic_mask, mask_b=text_mask)

        img_global = img_aligned.mean(dim=1)
        gen_global = gen_aligned.mean(dim=1)
        txt_global = (txt_aligned_img + txt_aligned_gen).mean(dim=1) / 2.0

        fused_representation = torch.cat([img_global, gen_global, txt_global], dim=-1)
        logits = self.classifier(fused_representation)

        return {
            "logits": logits,
            "img_global": img_global,
            "gen_global": gen_global,
            "txt_global": txt_global,
            "fused_representation": fused_representation,
            "attention_weights": {
                "img_txt": w_img_txt,
                "txt_img": w_txt_img,
                "gen_txt": w_gen_txt,
                "txt_gen": w_txt_gen
            }
        }
