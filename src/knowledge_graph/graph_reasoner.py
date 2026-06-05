import networkx as nx
from typing import List, Dict, Any, Set, Tuple
from src.knowledge_graph.graph_config import GraphConfig

class ClinicalGraphReasoner:
    def __init__(self, graph: nx.MultiDiGraph, config: GraphConfig):
        self.graph = graph
        self.config = config

    def find_differential_diagnosis(self, symptoms: List[str]) -> List[Dict[str, Any]]:
        candidate_diseases: Dict[str, Dict[str, Any]] = {}
        
        for symptom in symptoms:
            symptom_node = self._find_node_by_name_and_type(symptom, "symptom")
            if not symptom_node:
                continue
                
            for target in self.graph.successors(symptom_node):
                edge_data = self.graph.get_edge_data(symptom_node, target)
                for rel_type in edge_data:
                    if rel_type == "ASSOCIATED_WITH" or rel_type == "CAUSES":
                        node_data = self.graph.nodes[target]
                        if node_data.get("type") == "disease":
                            self._update_candidate(candidate_diseases, target, node_data, symptom, 0.8)
                            
            for patient in self.graph.predecessors(symptom_node):
                if self.graph.nodes[patient].get("type") == "patient":
                    for disease in self.graph.successors(patient):
                        if self.graph.nodes[disease].get("type") == "disease":
                            self._update_candidate(candidate_diseases, disease, self.graph.nodes[disease], symptom, 0.4)

        sorted_candidates = sorted(candidate_diseases.values(), key=lambda x: x["score"], reverse=True)
        return sorted_candidates

    def explain_diagnosis_path(self, symptom_name: str, disease_name: str) -> List[List[Dict[str, Any]]]:
        s_node = self._find_node_by_name_and_type(symptom_name, "symptom")
        d_node = self._find_node_by_name_and_type(disease_name, "disease")
        
        if not s_node or not d_node:
            return []
            
        paths = []
        simple_g = nx.DiGraph(self.graph)
        try:
            raw_paths = list(nx.all_simple_paths(simple_g, source=s_node, target=d_node, cutoff=self.config.reasoning.max_path_length))
            for path in raw_paths:
                path_explanation = []
                for i in range(len(path) - 1):
                    u, v = path[i], path[i+1]
                    edge_data = self.graph.get_edge_data(u, v)
                    relations = list(edge_data.keys()) if edge_data else ["CONNECTED_TO"]
                    path_explanation.append({
                        "source": self.graph.nodes[u],
                        "relation": relations[0],
                        "target": self.graph.nodes[v]
                    })
                paths.append(path_explanation)
        except nx.NetworkXNoPath:
            pass
            
        return paths

    def _find_node_by_name_and_type(self, name: str, node_type: str) -> str:
        for node, data in self.graph.nodes(data=True):
            if data.get("type") == node_type and data.get("name", "").lower() == name.lower():
                return node
        return ""

    def _update_candidate(self, candidates: Dict[str, Dict[str, Any]], node_id: str, node_data: Dict[str, Any], symptom: str, weight: float):
        if node_id not in candidates:
            candidates[node_id] = {
                "disease_id": node_id,
                "name": node_data.get("name"),
                "code": node_data.get("code"),
                "system": node_data.get("system"),
                "score": 0.0,
                "supporting_symptoms": []
            }
        candidates[node_id]["score"] += weight
        candidates[node_id]["supporting_symptoms"].append(symptom)
