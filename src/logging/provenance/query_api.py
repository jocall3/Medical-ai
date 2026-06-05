from typing import Dict, Any, List, Optional
from src.logging.provenance.graph_database import ProvenanceGraphDatabase

class ProvenanceQueryAPI:
    """
    API interface for querying data lineage and verifying provenance integrity.
    """
    def __init__(self, db: ProvenanceGraphDatabase):
        self.db = db

    def query_upstream_lineage(self, artifact_id: str) -> Dict[str, Any]:
        """
        Returns the complete history of how an artifact was generated.
        """
        node = self.db.get_node(artifact_id)
        if not node:
            return {"status": "error", "message": f"Artifact '{artifact_id}' not found in database."}

        ancestors = self.db.get_upstream_lineage(artifact_id)
        return {
            "artifact_id": artifact_id,
            "type": node["type"],
            "attributes": node["attributes"],
            "upstream_lineage_count": len(ancestors),
            "ancestors": ancestors
        }

    def query_downstream_lineage(self, artifact_id: str) -> Dict[str, Any]:
        """
        Returns all downstream artifacts and models derived from this artifact.
        """
        node = self.db.get_node(artifact_id)
        if not node:
            return {"status": "error", "message": f"Artifact '{artifact_id}' not found in database."}

        descendants = self.db.get_downstream_lineage(artifact_id)
        return {
            "artifact_id": artifact_id,
            "type": node["type"],
            "attributes": node["attributes"],
            "downstream_lineage_count": len(descendants),
            "descendants": descendants
        }

    def verify_path_integrity(self, start_id: str, end_id: str) -> Dict[str, Any]:
        """
        Verifies if a valid lineage path exists between two artifacts.
        """
        ancestors = self.db.get_upstream_lineage(end_id)
        path_exists = any(ancestor["node_id"] == start_id for ancestor in ancestors)
        
        return {
            "start_artifact": start_id,
            "end_artifact": end_id,
            "path_exists": path_exists,
            "verification_status": "verified" if path_exists else "unverified"
        }
