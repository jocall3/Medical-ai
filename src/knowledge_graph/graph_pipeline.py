import os
import json
import networkx as nx
from typing import List, Dict, Any
from src.knowledge_graph.graph_config import GraphConfig
from src.knowledge_graph.graph_builder import ClinicalGraphBuilder
from src.knowledge_graph.graph_reasoner import ClinicalGraphReasoner
from src.knowledge_graph.graph_dataset import ClinicalGraphDataset
from src.knowledge_graph.graph_embeddings import ClinicalEmbeddingGenerator

class ClinicalGraphPipeline:
    def __init__(self, config: GraphConfig):
        self.config = config
        self.builder = ClinicalGraphBuilder(config)
        self.embeddings = None
        self.dataset = None

    def ingest_ehr_records(self, records: List[Dict[str, Any]]):
        for record in records:
            self.builder.parse_ehr_record(record)

    def run_embedding_pipeline(self) -> Dict[str, Any]:
        if len(self.builder.graph) == 0:
            raise ValueError("Cannot run embedding pipeline on an empty graph.")
            
        self.dataset = ClinicalGraphDataset(self.builder.graph)
        generator = ClinicalEmbeddingGenerator(self.dataset, self.config.embedding.dimension)
        
        self.embeddings = generator.train_embeddings(
            epochs=self.config.embedding.epochs,
            lr=self.config.embedding.learning_rate
        )
        
        return {
            "status": "success",
            "embedding_shape": list(self.embeddings.shape)
        }

    def get_reasoner(self) -> ClinicalGraphReasoner:
        return ClinicalGraphReasoner(self.builder.graph, self.config)

    def save_graph(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        data = nx.node_link_data(self.builder.graph)
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

    def load_graph(self, filepath: str):
        with open(filepath, 'r') as f:
            data = json.load(f)
        self.builder.graph = nx.node_link_graph(data)
