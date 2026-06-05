import logging
from typing import List, Dict, Any
import torch
from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
from src.translation.translation_config import TranslationConfig

logger = logging.getLogger(__name__)

class MultilingualNER:
    """
    Multilingual Named Entity Recognition (NER) for extracting clinical concepts
    (e.g., diseases, drugs, procedures) from non-English and English clinical text.
    """
    def __init__(self, config: TranslationConfig):
        self.config = config
        self.device = torch.device(config.device if torch.cuda.is_available() or config.device == "cpu" else "cpu")
        logger.info(f"Initializing MultilingualNER on device: {self.device}")

        try:
            self.tokenizer = AutoTokenizer.from_pretrained(config.ner_model_name)
            self.model = AutoModelForTokenClassification.from_pretrained(config.ner_model_name).to(self.device)
            self.ner_pipeline = pipeline(
                "ner",
                model=self.model,
                tokenizer=self.tokenizer,
                device=0 if self.device.type == "cuda" else -1,
                aggregation_strategy="simple"
            )
        except Exception as e:
            logger.warning(f"Failed to load NER model {config.ner_model_name}: {e}. Using rule-based/mock NER.")
            self.ner_pipeline = None

    def extract_entities(self, text: str, lang: str = "en") -> List[Dict[str, Any]]:
        """
        Extracts clinical entities from text.
        Returns a list of dictionaries containing entity text, label, start/end offsets, and confidence.
        """
        if not text:
            return []

        if self.ner_pipeline is not None:
            try:
                results = self.ner_pipeline(text)
                entities = []
                for res in results:
                    entities.append({
                        "text": res.get("word"),
                        "label": res.get("entity_group", "CLINICAL_CONCEPT"),
                        "start": res.get("start"),
                        "end": res.get("end"),
                        "confidence": float(res.get("score", 1.0))
                    })
                return entities
            except Exception as e:
                logger.error(f"NER pipeline execution failed: {e}. Falling back to rule-based extraction.")

        return self._mock_extract_entities(text, lang)

    def _mock_extract_entities(self, text: str, lang: str) -> List[Dict[str, Any]]:
        """Rule-based fallback entity extraction for testing and development."""
        entities = []
        keywords = {
            "myocardial infarction": "DISEASE",
            "infarto agudo de miocardio": "DISEASE",
            "infarctus aigu du myocarde": "DISEASE",
            "hypertension": "DISEASE",
            "hipertensión": "DISEASE",
            "dyspnea": "SYMPTOM",
            "disnea": "SYMPTOM",
            "dyspnée": "SYMPTOM",
            "medication": "DRUG",
            "medicamento": "DRUG",
            "médicament": "DRUG"
        }

        text_lower = text.lower()
        for kw, label in keywords.items():
            start_idx = 0
            while True:
                idx = text_lower.find(kw, start_idx)
                if idx == -1:
                    break
                entities.append({
                    "text": text[idx:idx+len(kw)],
                    "label": label,
                    "start": idx,
                    "end": idx + len(kw),
                    "confidence": 0.95
                })
                start_idx = idx + len(kw)

        return sorted(entities, key=lambda x: x["start"])
