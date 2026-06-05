import pytest
import networkx as nx
import torch
from src.knowledge_graph.graph_config import GraphConfig
from src.knowledge_graph.ontology_mapper import OntologyMapper
from src.knowledge_graph.graph_builder import ClinicalGraphBuilder
from src.knowledge_graph.graph_reasoner import ClinicalGraphReasoner
from src.knowledge_graph.graph_dataset import ClinicalGraphDataset
from src.knowledge_graph.graph_embeddings import ClinicalEmbeddingGenerator

@pytest.fixture
def graph_config():
    return GraphConfig()

def test_ontology_mapping(graph_config):
    mapper = OntologyMapper(graph_config)
    
    mapped_disease = mapper.map_concept("Hypertension", "disease")
    assert mapped_disease["code"] == "38341003"
    assert mapped_disease["system"] == "SNOMED-CT"
    
    mapped_drug = mapper.map_concept("Lisinopril", "drug")
    assert mapped_drug["code"] == "29046"
    assert mapped_drug["system"] == "RxNorm"

def test_graph_construction(graph_config):
    builder = ClinicalGraphBuilder(graph_config)
    record = {
        "patient_id": "P999",
        "diagnoses": [{"name": "Pneumonia", "type": "disease"}],
        "symptoms": [{"name": "Fever", "type": "symptom"}],
        "medications": [{"name": "Amoxicillin", "type": "drug"}],
        "labs": [{"name": "WBC", "type": "lab_test", "value": "high"}]
    }
    builder.parse_ehr_record(record)
    
    assert builder.graph.number_of_nodes() > 0
    assert builder.graph.number_of_edges() > 0
    
    summary = builder.get_graph_summary()
    assert "num_nodes" in summary
    assert summary["num_nodes"] > 0

def test_reasoning_engine(graph_config):
    builder = ClinicalGraphBuilder(graph_config)
    record = {
        "patient_id": "P111",
        "diagnoses": [{"name": "Myocardial infarction", "type": "disease"}],
        "symptoms": [{"name": "Chest pain", "type": "symptom"}],
        "medications": [{"name": "Aspirin", "type": "drug"}],
        "labs": []
    }
    builder.parse_ehr_record(record)
    
    reasoner = ClinicalGraphReasoner(builder.graph, graph_config)
    candidates = reasoner.find_differential_diagnosis(["Chest pain"])
    
    assert len(candidates) > 0
    assert candidates[0]["name"] == "Myocardial infarction"
    
    paths = reasoner.explain_diagnosis_path("Chest pain", "Myocardial infarction")
    assert len(paths) > 0

def test_dataset_and_embeddings(graph_config):
    builder = ClinicalGraphBuilder(graph_config)
    record = {
        "patient_id": "P222",
        "diagnoses": [{"name": "Diabetes", "type": "disease"}],
        "symptoms": [{"name": "Fever", "type": "symptom"}],
        "medications": [{"name": "Metformin", "type": "drug"}],
        "labs": []
    }
    builder.parse_ehr_record(record)
    
    dataset = ClinicalGraphDataset(builder.graph)
    edge_index, edge_type = dataset.get_edge_tensors()
    
    assert edge_index.shape[0] == 2
    assert edge_type.shape[0] == edge_index.shape[1]
    
    generator = ClinicalEmbeddingGenerator(dataset, embedding_dim=16)
    embeddings = generator.train_embeddings(epochs=5, lr=0.05)
    
    assert embeddings.shape == (len(builder.graph), 16)
