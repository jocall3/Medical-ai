import re
from typing import Dict, Any, Optional, List
from src.knowledge_graph.graph_config import GraphConfig

class OntologyMapper:
    def __init__(self, config: GraphConfig):
        self.config = config
        self.snomed_db = {
            "hypertension": {"code": "38341003", "name": "Hypertensive disorder", "system": "SNOMED-CT"},
            "diabetes": {"code": "44054006", "name": "Diabetes mellitus type 2", "system": "SNOMED-CT"},
            "fever": {"code": "386661006", "name": "Fever", "system": "SNOMED-CT"},
            "cough": {"code": "49727002", "name": "Cough", "system": "SNOMED-CT"},
            "dyspnea": {"code": "267036007", "name": "Dyspnea", "system": "SNOMED-CT"},
            "chest pain": {"code": "29857009", "name": "Chest pain", "system": "SNOMED-CT"},
            "myocardial infarction": {"code": "22298006", "name": "Myocardial infarction", "system": "SNOMED-CT"},
            "pneumonia": {"code": "233604007", "name": "Pneumonia", "system": "SNOMED-CT"}
        }
        self.rxnorm_db = {
            "lisinopril": {"code": "29046", "name": "Lisinopril", "system": "RxNorm"},
            "metformin": {"code": "6809", "name": "Metformin", "system": "RxNorm"},
            "aspirin": {"code": "1191", "name": "Aspirin", "system": "RxNorm"},
            "albuterol": {"code": "435", "name": "Albuterol", "system": "RxNorm"},
            "amoxicillin": {"code": "723", "name": "Amoxicillin", "system": "RxNorm"}
        }
        self.icd10_db = {
            "hypertension": {"code": "I10", "name": "Essential (primary) hypertension", "system": "ICD-10"},
            "diabetes": {"code": "E11", "name": "Type 2 diabetes mellitus", "system": "ICD-10"},
            "myocardial infarction": {"code": "I21", "name": "Acute myocardial infarction", "system": "ICD-10"},
            "pneumonia": {"code": "J18", "name": "Pneumonia, unspecified organism", "system": "ICD-10"}
        }
        self.loinc_db = {
            "hba1c": {"code": "4548-4", "name": "Hemoglobin A1c/Hemoglobin.total in Blood", "system": "LOINC"},
            "troponin": {"code": "10839-9", "name": "Troponin I in Serum or Plasma", "system": "LOINC"},
            "wbc": {"code": "6690-2", "name": "Leukocytes [#/volume] in Blood by Automated count", "system": "LOINC"},
            "crp": {"code": "1988-5", "name": "C reactive protein [Mass/volume] in Serum or Plasma", "system": "LOINC"}
        }

    def map_concept(self, concept_name: str, concept_type: str) -> Dict[str, Any]:
        normalized_name = concept_name.lower().strip()
        
        if concept_type in ["disease", "symptom"]:
            match = self._search_db(normalized_name, self.snomed_db)
            if match:
                icd_match = self._search_db(normalized_name, self.icd10_db)
                if icd_match:
                    match["cross_references"] = {"ICD-10": icd_match["code"]}
                return match
        elif concept_type == "drug":
            match = self._search_db(normalized_name, self.rxnorm_db)
            if match:
                return match
        elif concept_type == "lab_test":
            match = self._search_db(normalized_name, self.loinc_db)
            if match:
                return match

        if self.config.ontology.use_mock_fallback:
            return {
                "code": f"MOCK-{concept_type.upper()}-{abs(hash(normalized_name)) % 100000}",
                "name": concept_name,
                "system": "MOCK-ONTOLOGY",
                "confidence": 0.3
            }
        
        raise ValueError(f"Concept '{concept_name}' of type '{concept_type}' could not be mapped.")

    def _search_db(self, query: str, db: Dict[str, Dict[str, str]]) -> Optional[Dict[str, Any]]:
        if query in db:
            res = db[query].copy()
            res["confidence"] = 1.0
            return res
        
        for key, val in db.items():
            if query in key or key in query:
                res = val.copy()
                res["confidence"] = 0.75
                return res
        return None
