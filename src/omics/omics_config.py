from dataclasses import dataclass, field
from typing import List, Dict, Any

@dataclass
class TranscriptomicsConfig:
    input_dim: int = 2000
    latent_dim: int = 50
    hidden_dims: List[int] = field(default_factory=lambda: [512, 256])
    learning_rate: float = 1e-3
    dropout: float = 0.1

@dataclass
class ProteomicsConfig:
    sequence_vocab_size: int = 21
    max_sequence_length: int = 1000
    embedding_dim: int = 128
    hidden_dim: int = 256
    num_ptm_classes: int = 5

@dataclass
class MetabolomicsConfig:
    num_metabolites: int = 500
    num_reactions: int = 300
    flux_bounds_min: float = -1000.0
    flux_bounds_max: float = 1000.0

@dataclass
class GNNConfig:
    in_channels: int = 128
    hidden_channels: int = 64
    out_channels: int = 32
    num_layers: int = 3
    dropout: float = 0.2
    learning_rate: float = 5e-4

@dataclass
class MultiOmicsConfig:
    transcriptomics: TranscriptomicsConfig = field(default_factory=TranscriptomicsConfig)
    proteomics: ProteomicsConfig = field(default_factory=ProteomicsConfig)
    metabolomics: MetabolomicsConfig = field(default_factory=MetabolomicsConfig)
    gnn: GNNConfig = field(default_factory=GNNConfig)
    integration_weights: Dict[str, float] = field(default_factory=lambda: {
        "transcriptomics": 0.4,
        "proteomics": 0.4,
        "metabolomics": 0.2
    })
    pathway_db_path: str = "data/pathways/kegg_reactome.json"
    device: str = "cpu"
