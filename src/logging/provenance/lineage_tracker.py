import datetime
import uuid
from typing import Dict, Any, List, Optional

class ProvNode:
    """
    Represents a node in the W3C PROV model.
    """
    def __init__(self, identifier: str, node_type: str, attributes: Optional[Dict[str, Any]] = None):
        self.identifier = identifier or f"prov:{uuid.uuid4()}"
        self.node_type = node_type  # 'entity', 'activity', or 'agent'
        self.attributes = attributes or {}
        self.timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "identifier": self.identifier,
            "node_type": self.node_type,
            "attributes": self.attributes,
            "timestamp": self.timestamp
        }

class LineageTracker:
    """
    Tracks the lineage of data transformations using the W3C PROV model.
    """
    def __init__(self):
        self.nodes: Dict[str, ProvNode] = {}
        self.edges: List[Dict[str, Any]] = []

    def register_entity(self, identifier: str, attributes: Optional[Dict[str, Any]] = None) -> ProvNode:
        node = ProvNode(identifier, "entity", attributes)
        self.nodes[identifier] = node
        return node

    def register_activity(self, identifier: str, attributes: Optional[Dict[str, Any]] = None) -> ProvNode:
        node = ProvNode(identifier, "activity", attributes)
        self.nodes[identifier] = node
        return node

    def register_agent(self, identifier: str, attributes: Optional[Dict[str, Any]] = None) -> ProvNode:
        node = ProvNode(identifier, "agent", attributes)
        self.nodes[identifier] = node
        return node

    def used(self, activity_id: str, entity_id: str, attributes: Optional[Dict[str, Any]] = None) -> None:
        self.edges.append({
            "relation": "used",
            "from": activity_id,
            "to": entity_id,
            "attributes": attributes or {}
        })

    def was_generated_by(self, entity_id: str, activity_id: str, attributes: Optional[Dict[str, Any]] = None) -> None:
        self.edges.append({
            "relation": "wasGeneratedBy",
            "from": entity_id,
            "to": activity_id,
            "attributes": attributes or {}
        })

    def was_associated_with(self, activity_id: str, agent_id: str, attributes: Optional[Dict[str, Any]] = None) -> None:
        self.edges.append({
            "relation": "wasAssociatedWith",
            "from": activity_id,
            "to": agent_id,
            "attributes": attributes or {}
        })

    def acted_on_behalf_of(self, delegate_id: str, responsible_id: str, attributes: Optional[Dict[str, Any]] = None) -> None:
        self.edges.append({
            "relation": "actedOnBehalfOf",
            "from": delegate_id,
            "to": responsible_id,
            "attributes": attributes or {}
        })

    def get_lineage(self) -> Dict[str, Any]:
        return {
            "nodes": {k: v.to_dict() for k, v in self.nodes.items()},
            "edges": self.edges
        }

    def clear(self) -> None:
        self.nodes.clear()
        self.edges.clear()
