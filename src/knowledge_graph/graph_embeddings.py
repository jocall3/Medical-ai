import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Any, Tuple
from src.knowledge_graph.graph_dataset import ClinicalGraphDataset

class RGCNLayer(nn.Module):
    def __init__(self, in_features: int, out_features: int, num_relations: int):
        super(RGCNLayer, self).__init__()
        self.num_relations = num_relations
        self.in_features = in_features
        self.out_features = out_features
        
        self.weight = nn.Parameter(torch.Tensor(num_relations, in_features, out_features))
        self.root_relation_weight = nn.Parameter(torch.Tensor(in_features, out_features))
        self.bias = nn.Parameter(torch.Tensor(out_features))
        
        self.reset_parameters()

    def reset_parameters(self):
        nn.init.xavier_uniform_(self.weight)
        nn.init.xavier_uniform_(self.root_relation_weight)
        nn.init.zeros_(self.bias)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor, edge_type: torch.Tensor) -> torch.Tensor:
        num_nodes = x.size(0)
        out = torch.zeros(num_nodes, self.out_features, device=x.device)
        
        for r in range(self.num_relations):
            mask = edge_type == r
            if not mask.any():
                continue
            
            edges_r = edge_index[:, mask]
            src, dst = edges_r[0], edges_r[1]
            
            h = torch.matmul(x[src], self.weight[r])
            out.index_add_(0, dst, h)
            
        out += torch.matmul(x, self.root_relation_weight)
        out += self.bias
        return out

class ClinicalGNN(nn.Module):
    def __init__(self, in_features: int, hidden_features: int, out_features: int, num_relations: int):
        super(ClinicalGNN, self).__init__()
        self.conv1 = RGCNLayer(in_features, hidden_features, num_relations)
        self.conv2 = RGCNLayer(hidden_features, out_features, num_relations)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor, edge_type: torch.Tensor) -> torch.Tensor:
        x = self.conv1(x, edge_index, edge_type)
        x = F.relu(x)
        x = F.dropout(x, p=0.2, training=self.training)
        x = self.conv2(x, edge_index, edge_type)
        return x

class ClinicalEmbeddingGenerator:
    def __init__(self, dataset: ClinicalGraphDataset, embedding_dim: int = 128):
        self.dataset = dataset
        self.embedding_dim = embedding_dim
        self.metadata = dataset.get_metadata()
        
        self.model = ClinicalGNN(
            in_features=embedding_dim,
            hidden_features=embedding_dim,
            out_features=embedding_dim,
            num_relations=max(1, self.metadata["num_relations"])
        )
        
    def train_embeddings(self, epochs: int = 20, lr: float = 0.01) -> torch.Tensor:
        x = self.dataset.get_node_features(self.embedding_dim)
        edge_index, edge_type = self.dataset.get_edge_tensors()
        
        if edge_index.size(1) == 0:
            return x
            
        optimizer = torch.optim.Adam(self.model.parameters(), lr=lr)
        self.model.train()
        
        for epoch in range(epochs):
            optimizer.zero_grad()
            embeddings = self.model(x, edge_index, edge_type)
            
            src, dst = edge_index[0], edge_index[1]
            pos_score = torch.sum(embeddings[src] * embeddings[dst], dim=-1)
            
            neg_dst = torch.randint(0, x.size(0), (src.size(0),))
            neg_score = torch.sum(embeddings[src] * embeddings[neg_dst], dim=-1)
            
            loss = -torch.mean(torch.log(torch.sigmoid(pos_score) + 1e-15) + torch.log(1.0 - torch.sigmoid(neg_score) + 1e-15))
            loss.backward()
            optimizer.step()
            
        self.model.eval()
        with torch.no_grad():
            final_embeddings = self.model(x, edge_index, edge_type)
        return final_embeddings
