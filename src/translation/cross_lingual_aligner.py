import logging
from typing import List, Dict, Any
import re
from src.translation.translation_config import TranslationConfig

logger = logging.getLogger(__name__)

class CrossLingualAligner:
    """
    Aligns clinical concepts and medical codes (ICD-10, SNOMED) across different
    languages and translation outputs using semantic mapping and dictionary lookups.
    """
    def __init__(self, config: TranslationConfig):
        self.config = config
        logger.info("Initializing CrossLingualAligner")

    def align_entities_to_codes(self, entities: List[Dict[str, Any]], source_text: str, target_text: str) -> List[Dict[str, Any]]:
        """
        Maps extracted entities to standard medical codes (ICD-10/SNOMED)
        and aligns them across source and target texts.
        """
        aligned_entities = []
        for entity in entities:
            entity_text = entity["text"]
            entity_lower = entity_text.lower()
            
            code = self._lookup_code(entity_lower)
            aligned_target_text = self._find_aligned_span(entity_text, target_text)

            aligned_entities.append({
                "source_entity": entity_text,
                "label": entity["label"],
                "confidence": entity["confidence"],
                "medical_code": code,
                "aligned_target_span": aligned_target_text if aligned_target_text else "Not aligned"
            })
            
        return aligned_entities

    def _lookup_code(self, entity_lower: str) -> str:
        """Looks up medical codes in the configuration map or returns a generic code."""
        if entity_lower in self.config.concept_code_map:
            return self.config.concept_code_map[entity_lower]
            
        for concept, code in self.config.concept_code_map.items():
            if concept in entity_lower or entity_lower in concept:
                return code
                
        return "UNMAPPED-CONCEPT"

    def _find_aligned_span(self, source_entity: str, target_text: str) -> str:
        """
        Heuristic-based cross-lingual alignment.
        In production, this would use cross-lingual word embeddings or attention weights.
        """
        alignment_dict = {
            "myocardial infarction": ["infarto de miocardio", "infarctus du myocarde"],
            "hypertension": ["hipertensión", "hypertension"],
            "dyspnea": ["disnea", "dyspnée"],
            "medication": ["medicamento", "médicament"]
        }

        source_lower = source_entity.lower()
        for src, targets in alignment_dict.items():
            if src in source_lower or source_lower in src:
                for target in targets:
                    pattern = re.compile(r'\b' + re.escape(target) + r'\b', re.IGNORECASE)
                    match = pattern.search(target_text)
                    if match:
                        return match.group(0)
                        
        return ""
