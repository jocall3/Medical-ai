import json
from typing import Dict, Any
from src.logging.provenance.lineage_tracker import LineageTracker

class ProvJsonExporter:
    """
    Exports internal lineage tracking data into the official W3C PROV-JSON format.
    """
    @staticmethod
    def export(tracker: LineageTracker) -> Dict[str, Any]:
        """
        Converts the LineageTracker data into a valid W3C PROV-JSON structure.
        """
        lineage = tracker.get_lineage()
        prov_json = {
            "prefix": {
                "prov": "http://www.w3.org/ns/prov#",
                "medai": "http://medical.ai/provenance/"
            },
            "entity": {},
            "activity": {},
            "agent": {},
            "used": {},
            "wasGeneratedBy": {},
            "wasAssociatedWith": {},
            "actedOnBehalfOf": {}
        }

        # Map Nodes
        for node_id, node in lineage["nodes"].items():
            node_type = node["node_type"]
            attributes = node["attributes"]
            attributes["prov:generatedAtTime" if node_type == "entity" else "prov:startTime"] = node["timestamp"]
            
            if node_type in prov_json:
                prov_json[node_type][node_id] = attributes

        # Map Edges
        edge_counters = {"used": 0, "wasGeneratedBy": 0, "wasAssociatedWith": 0, "actedOnBehalfOf": 0}
        for edge in lineage["edges"]:
            relation = edge["relation"]
            if relation in prov_json:
                edge_counters[relation] += 1
                edge_id = f"medai:{relation}_{edge_counters[relation]}"
                
                if relation == "used":
                    prov_json[relation][edge_id] = {
                        "prov:activity": edge["from"],
                        "prov:entity": edge["to"],
                        **edge["attributes"]
                    }
                elif relation == "wasGeneratedBy":
                    prov_json[relation][edge_id] = {
                        "prov:entity": edge["from"],
                        "prov:activity": edge["to"],
                        **edge["attributes"]
                    }
                elif relation == "wasAssociatedWith":
                    prov_json[relation][edge_id] = {
                        "prov:activity": edge["from"],
                        "prov:agent": edge["to"],
                        **edge["attributes"]
                    }
                elif relation == "actedOnBehalfOf":
                    prov_json[relation][edge_id] = {
                        "prov:delegate": edge["from"],
                        "prov:responsible": edge["to"],
                        **edge["attributes"]
                    }

        return prov_json

    @classmethod
    def export_to_file(cls, tracker: LineageTracker, file_path: str) -> None:
        """
        Saves the PROV-JSON data to a file.
        """
        prov_data = cls.export(tracker)
        with open(file_path, "w") as f:
            json.dump(prov_data, f, indent=2)
