from pydantic import BaseModel, Field
from typing import Dict, Optional

class Neo4jConfig(BaseModel):
    uri: str = "bolt://localhost:7687"
    username: str = "neo4j"
    password: str = "password"
    database: str = "neo4j"

class OntologyConfig(BaseModel):
    snomed_path: Optional[str] = None
    rxnorm_path: Optional[str] = None
    icd10_path: Optional[str] = None
    loinc_path: Optional[str] = None
    use_mock_fallback: bool = True

class ReasoningConfig(BaseModel):
    max_path_length: int = 4
    confidence_threshold: float = 0.5
    enable_probabilistic_reasoning: bool = True

class EmbeddingConfig(BaseModel):
    dimension: int = 128
    epochs: int = 50
    learning_rate: float = 0.01
    model_type: str = "RGCN"

class GraphConfig(BaseModel):
    neo4j: Neo4jConfig = Field(default_factory=Neo4jConfig)
    ontology: OntologyConfig = Field(default_factory=OntologyConfig)
    reasoning: ReasoningConfig = Field(default_factory=ReasoningConfig)
    embedding: EmbeddingConfig = Field(default_factory=EmbeddingConfig)
    cache_dir: str = "./.cache/knowledge_graph"
