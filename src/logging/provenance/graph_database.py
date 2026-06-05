from typing import Dict, Any, List, Set, Optional

class ProvenanceGraphDatabase:
    """
    An in-memory directed graph database optimized for storing and querying W3C PROV lineage data.
    """
    def __init__(self):
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.adjacency_list: Dict[str, List[Dict[str, Any]]] = {}
        self.reverse_adjacency_list: Dict[str, List[Dict[str, Any]]] = {}

    def add_node(self, node_id: str, node_type: str, attributes: Dict[str, Any]) -> None:
        self.nodes[node_id] = {
            "type": node_type,
            "attributes": attributes
        }
        if node_id not in self.adjacency_list:
            self.adjacency_list[node_id] = []
        if node_id not in self.reverse_adjacency_list:
            self.reverse_adjacency_list[node_id] = []

    def add_edge(self, from_node: str, to_node: str, relation: str, attributes: Dict[str, Any]) -> None:
        if from_node not in self.nodes or to_node not in self.nodes:
            raise ValueError("Both source and target nodes must exist in the graph database.")
        
        edge = {
            "target": to_node,
            "relation": relation,
            "attributes": attributes
        }
        self.adjacency_list[from_node].append(edge)
        
        reverse_edge = {
            "source": from_node,
            "relation": relation,
            "attributes": attributes
        }
        self.reverse_adjacency_list[to_node].append(reverse_edge)

    def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        return self.nodes.get(node_id)

    def get_upstream_lineage(self, node_id: str) -> List[Dict[str, Any]]:
        """
        Traverses the graph backwards (upstream) to find all ancestors of a node.
        """
        visited: Set[str] = set()
        lineage: List[Dict[str, Any]] = []
        queue = [node_id]

        while queue:
            current = queue.pop(0)
            if current not in visited:
                visited.add(current)
                if current != node_id:
                    lineage.append({"node_id": current, "details": self.nodes[current]})
                for edge in self.adjacency_list.get(current, []):
                    target = edge["target"]
                    if target not in visited:
                        queue.append(target)
        return lineage

    def get_downstream_lineage(self, node_id: str) -> List[Dict[str, Any]]:
        """
        Traverses the graph forwards (downstream) to find all descendants of a node.
        """
        visited: Set[str] = set()
        lineage: List[Dict[str, Any]] = []
        queue = [node_id]

        while queue:
            current = queue.pop(0)
            if current not in visited:
                visited.add(current)
                if current != node_id:
                    lineage.append({"node_id": current, "details": self.nodes[current]})
                for edge in self.reverse_adjacency_list.get(current, []):
                    source = edge["source"]
                    if source not in visited:
                        queue.append(source)
        return lineage

    def clear(self) -> None:
        self.nodes.clear()
        self.adjacency_list.clear()
        self.reverse_adjacency_list.clear()
