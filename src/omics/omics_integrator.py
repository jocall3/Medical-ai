import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, Dict

class GraphConvolution(nn.Module):
    def __init__(self, in_features: int, out_features: int):
        super(GraphConvolution, self).__init__()
        self.weight = nn.Parameter(torch.FloatTensor(in_features, out_features))
        nn.init.xavier_uniform_(self.weight)
        self.bias = nn.Parameter(torch.zeros(out_features))

    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        support = torch.mm(x, self.weight)
        output = torch.mm(adj, support)
        return output + self.bias

class MultiOmicsGNNIntegrator(nn.Module):
    def __init__(self, in_channels: int, hidden_channels: int, out_channels: int, num_classes: int, dropout: float = 0.2):
        super(MultiOmicsGNNIntegrator, self).__init__()
        
        self.gcn1 = GraphConvolution(in_channels, hidden_channels)
        self.gcn2 = GraphConvolution(hidden_channels, hidden_channels)
        self.gcn3 = GraphConvolution(hidden_channels, out_channels)
        self.dropout = dropout
        
        self.classifier = nn.Sequential(
            nn.Linear(out_channels, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, num_classes)
        )

    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        h = self.gcn1(x, adj)
        h = F.relu(h)
        h = F.dropout(h, p=self.dropout, training=self.training)
        
        h = self.gcn2(h, adj)
        h = F.relu(h)
        h = F.dropout(h, p=self.dropout, training=self.training)
        
        embeddings = self.gcn3(h, adj)
        logits = self.classifier(embeddings)
        return embeddings, logits

    @staticmethod
    def normalize_adjacency(adj: torch.Tensor) -> torch.Tensor:
        rowsum = adj.sum(1)
        d_inv_sqrt = torch.pow(rowsum, -0.5)
        d_inv_sqrt[torch.isinf(d_inv_sqrt)] = 0.
        d_mat_inv_sqrt = torch.diag(d_inv_sqrt)
        return torch.mm(torch.mm(d_mat_inv_sqrt, adj), d_mat_inv_sqrt)
