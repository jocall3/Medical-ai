import torch
from typing import Dict, Tuple, List, Any
import networkx as nx

class ClinicalGraphDataset:
    def __init__(self, graph: nx.MultiDiGraph):
        self.graph = graph
        self.node_to_idx = {node: idx for idx, node in enumerate(graph.nodes())}
        self.idx_to_node = {idx: node for node, idx in self.node_to_idx.items()}
        
        self.relations = list(set(
            rel for _, _, rel in graph.edges(keys=True)
        ))
        self.rel_to_idx = {rel: idx for idx, rel in enumerate(self.relations)}
        
    def get_edge_tensors(self) -> Tuple[torch.Tensor, torch.Tensor]:
        edge_index_list = []
        edge_type_list = []
        
        for u, v, rel in self.graph.edges(keys=True):
            u_idx = self.node_to_idx[u]
            v_idx = self.node_to_idx[v]
            rel_idx = self.rel_to_idx[rel]
            
            edge_index_list.append([u_idx, v_idx])
            edge_type_list.append(rel_idx)
            
        if not edge_index_list:
            return torch.empty((2, 0), dtype=torch.long), torch.empty((0,), dtype=torch.long)
            
        edge_index = torch.tensor(edge_index_list, dtype=torch.long).t().contiguous()
        edge_type = torch.tensor(edge_type_list, dtype=torch.long)
        
        return edge_index, edge_type

    def get_node_features(self, embedding_dim: int = 128) -> torch.Tensor:
        num_nodes = len(self.graph)
        features = torch.zeros((num_nodes, embedding_dim))
        
        for node, idx in self.node_to_idx.items():
            node_data = self.graph.nodes[node]
            seed = abs(hash(node_data.get("name", ""))) % (2**32)
            torch.manual_seed(seed)
            features[idx] = torch.randn(embedding_dim)
            
        return features

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "num_nodes": len(self.graph),
            "num_relations": len(self.relations),
            "node_to_idx": self.node_to_idx,
            "rel_to_idx": self.rel_to_idx
        }
