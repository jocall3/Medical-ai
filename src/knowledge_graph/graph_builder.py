import networkx as nx
from typing import List, Dict, Any, Tuple
from src.knowledge_graph.ontology_mapper import OntologyMapper
from src.knowledge_graph.graph_config import GraphConfig

class ClinicalGraphBuilder:
    def __init__(self, config: GraphConfig):
        self.config = config
        self.mapper = OntologyMapper(config)
        self.graph = nx.MultiDiGraph()

    def add_clinical_entity(self, name: str, entity_type: str, properties: Dict[str, Any] = None) -> str:
        mapped = self.mapper.map_concept(name, entity_type)
        node_id = f"{mapped['system']}:{mapped['code']}"
        
        node_props = {
            "name": mapped["name"],
            "type": entity_type,
            "system": mapped["system"],
            "code": mapped["code"],
            "confidence": mapped.get("confidence", 1.0)
        }
        if properties:
            node_props.update(properties)
            
        if self.graph.has_node(node_id):
            self.graph.nodes[node_id].update(node_props)
        else:
            self.graph.add_node(node_id, **node_props)
            
        return node_id

    def add_clinical_relation(self, source_id: str, target_id: str, relation_type: str, properties: Dict[str, Any] = None):
        edge_props = {"relation": relation_type}
        if properties:
            edge_props.update(properties)
            
        self.graph.add_edge(source_id, target_id, key=relation_type, **edge_props)

    def parse_ehr_record(self, record: Dict[str, Any]):
        patient_id = f"Patient:{record['patient_id']}"
        self.graph.add_node(patient_id, type="patient", name=record['patient_id'])

        disease_ids = []
        for diag in record.get("diagnoses", []):
            d_id = self.add_clinical_entity(diag["name"], "disease")
            self.add_clinical_relation(patient_id, d_id, "DIAGNOSED_WITH")
            disease_ids.append(d_id)

        symptom_ids = []
        for sym in record.get("symptoms", []):
            s_id = self.add_clinical_entity(sym["name"], "symptom")
            self.add_clinical_relation(patient_id, s_id, "EXHIBITS")
            symptom_ids.append(s_id)
            for d_id in disease_ids:
                self.add_clinical_relation(s_id, d_id, "ASSOCIATED_WITH")

        for med in record.get("medications", []):
            m_id = self.add_clinical_entity(med["name"], "drug")
            self.add_clinical_relation(patient_id, m_id, "PRESCRIBED")
            for d_id in disease_ids:
                self.add_clinical_relation(m_id, d_id, "TREATS")

        for lab in record.get("labs", []):
            l_id = self.add_clinical_entity(lab["name"], "lab_test")
            self.add_clinical_relation(patient_id, l_id, "HAS_LAB_RESULT", {"value": lab.get("value")})

    def get_graph_summary(self) -> Dict[str, Any]:
        return {
            "num_nodes": self.graph.number_of_nodes(),
            "num_edges": self.graph.number_of_edges(),
            "nodes": list(self.graph.nodes(data=True))[:10],
            "edges": list(self.graph.edges(data=True))[:10]
        }
