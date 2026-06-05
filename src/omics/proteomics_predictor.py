import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, Dict

class ProteomicsPredictor(nn.Module):
    def __init__(
        self,
        vocab_size: int = 21,
        embedding_dim: int = 128,
        hidden_dim: int = 256,
        num_ptm_classes: int = 5,
        max_seq_len: int = 1000
    ):
        super(ProteomicsPredictor, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        self.conv1 = nn.Conv1d(embedding_dim, hidden_dim, kernel_size=7, padding=3)
        self.conv2 = nn.Conv1d(hidden_dim, hidden_dim, kernel_size=5, padding=2)
        self.pool = nn.AdaptiveMaxPool1d(1)
        self.ptm_head = nn.Linear(hidden_dim, num_ptm_classes)
        self.abundance_head = nn.Linear(hidden_dim, 1)
        self.ppi_fc = nn.Linear(hidden_dim * 2, 1)

    def forward_sequence(self, seq: torch.Tensor) -> torch.Tensor:
        embedded = self.embedding(seq).transpose(1, 2)
        x = F.relu(self.conv1(embedded))
        x = F.relu(self.conv2(x))
        pooled = self.pool(x).squeeze(-1)
        return pooled

    def predict_abundance_and_ptm(self, seq: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        features = self.forward_sequence(seq)
        abundance = self.abundance_head(features)
        ptm_logits = self.ptm_head(features)
        return abundance, ptm_logits

    def predict_ppi(self, seq_a: torch.Tensor, seq_b: torch.Tensor) -> torch.Tensor:
        feat_a = self.forward_sequence(seq_a)
        feat_b = self.forward_sequence(seq_b)
        combined = torch.cat([feat_a, feat_b], dim=-1)
        ppi_probability = torch.sigmoid(self.ppi_fc(combined))
        return ppi_probability
