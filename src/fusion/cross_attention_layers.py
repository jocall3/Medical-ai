import torch
import torch.nn as nn
import torch.nn.functional as F

class MultiHeadCrossAttention(nn.Module):
    def __init__(self, query_dim: int, key_value_dim: int, embed_dim: int, num_heads: int, dropout: float = 0.1):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        assert self.head_dim * num_heads == embed_dim, "embed_dim must be divisible by num_heads"

        self.q_proj = nn.Linear(query_dim, embed_dim)
        self.k_proj = nn.Linear(key_value_dim, embed_dim)
        self.v_proj = nn.Linear(key_value_dim, embed_dim)
        self.out_proj = nn.Linear(embed_dim, embed_dim)

        self.dropout = nn.Dropout(dropout)
        self.scale = 1.0 / (self.head_dim ** 0.5)

    def forward(self, query: torch.Tensor, key_value: torch.Tensor, key_padding_mask: torch.Tensor = None):
        # query: [batch_size, seq_len_q, query_dim]
        # key_value: [batch_size, seq_len_kv, key_value_dim]
        B, Sq, _ = query.shape
        _, Skv, _ = key_value.shape

        q = self.q_proj(query).view(B, Sq, self.num_heads, self.head_dim).transpose(1, 2) # [B, num_heads, Sq, head_dim]
        k = self.k_proj(key_value).view(B, Skv, self.num_heads, self.head_dim).transpose(1, 2) # [B, num_heads, Skv, head_dim]
        v = self.v_proj(key_value).view(B, Skv, self.num_heads, self.head_dim).transpose(1, 2) # [B, num_heads, Skv, head_dim]

        attn_scores = torch.matmul(q, k.transpose(-2, -1)) * self.scale # [B, num_heads, Sq, Skv]

        if key_padding_mask is not None:
            # key_padding_mask: [B, Skv] -> expand to [B, 1, 1, Skv]
            mask = key_padding_mask.unsqueeze(1).unsqueeze(2)
            attn_scores = attn_scores.masked_fill(mask == 0, -1e9)

        attn_probs = F.softmax(attn_scores, dim=-1)
        attn_probs = self.dropout(attn_probs)

        context = torch.matmul(attn_probs, v) # [B, num_heads, Sq, head_dim]
        context = context.transpose(1, 2).contiguous().view(B, Sq, self.embed_dim)
        return self.out_proj(context), attn_probs

class CoAttentionTransformerBlock(nn.Module):
    def __init__(self, dim_a: int, dim_b: int, embed_dim: int, num_heads: int, ff_dim: int, dropout: float = 0.1):
        super().__init__()
        self.cross_attn_a_to_b = MultiHeadCrossAttention(dim_a, dim_b, embed_dim, num_heads, dropout)
        self.cross_attn_b_to_a = MultiHeadCrossAttention(dim_b, dim_a, embed_dim, num_heads, dropout)

        self.norm_a1 = nn.LayerNorm(embed_dim)
        self.norm_b1 = nn.LayerNorm(embed_dim)

        self.proj_a = nn.Linear(dim_a, embed_dim) if dim_a != embed_dim else nn.Identity()
        self.proj_b = nn.Linear(dim_b, embed_dim) if dim_b != embed_dim else nn.Identity()

        self.ff_a = nn.Sequential( 
            nn.Linear(embed_dim, ff_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(ff_dim, embed_dim),
            nn.Dropout(dropout)
        )
        self.ff_b = nn.Sequential(
            nn.Linear(embed_dim, ff_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(ff_dim, embed_dim),
            nn.Dropout(dropout)
        )

        self.norm_a2 = nn.LayerNorm(embed_dim)
        self.norm_b2 = nn.LayerNorm(embed_dim)

    def forward(self, x_a: torch.Tensor, x_b: torch.Tensor, mask_a: torch.Tensor = None, mask_b: torch.Tensor = None):
        # x_a: [B, S_a, dim_a], x_b: [B, S_b, dim_b]
        proj_xa = self.proj_a(x_a)
        proj_xb = self.proj_b(x_b)

        # Cross attention: A attends to B
        attn_a, weights_a = self.cross_attn_a_to_b(proj_xa, x_b, key_padding_mask=mask_b)
        x_a_out = self.norm_a1(proj_xa + attn_a)

        # Cross attention: B attends to A
        attn_b, weights_b = self.cross_attn_b_to_a(proj_xb, x_a, key_padding_mask=mask_a)
        x_b_out = self.norm_b1(proj_xb + attn_b)

        # Feed Forward
        x_a_out = self.norm_a2(x_a_out + self.ff_a(x_a_out))
        x_b_out = self.norm_b2(x_b_out + self.ff_b(x_b_out))

        return x_a_out, x_b_out, weights_a, weights_b
