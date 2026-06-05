import logging
from typing import Dict, Any
from src.translation.translation_config import TranslationConfig
from src.translation.medical_translator import MedicalTranslator
from src.translation.jargon_simplifier import JargonSimplifier
from src.translation.multilingual_ner import MultilingualNER
from src.translation.cross_lingual_aligner import CrossLingualAligner

logger = logging.getLogger(__name__)

class MedicalTranslationPipeline:
    """
    End-to-end medical translation and simplification pipeline.
    Translates clinical notes, simplifies jargon for patient-facing instructions,
    extracts clinical entities, and aligns them with medical codes.
    """
    def __init__(self, config: TranslationConfig = None):
        self.config = config or TranslationConfig()
        self.translator = MedicalTranslator(self.config)
        self.simplifier = JargonSimplifier(self.config)
        self.ner = MultilingualNER(self.config)
        self.aligner = CrossLingualAligner(self.config)
        logger.info("MedicalTranslationPipeline successfully initialized.")

    def process_clinical_note(self, clinical_note: str, target_lang: str, source_lang: str = "en") -> Dict[str, Any]:
        """
        Processes a clinical note:
        1. Simplifies the clinical note into patient-friendly language.
        2. Translates the simplified note into the target language.
        3. Translates the original clinical note into the target language.
        4. Extracts clinical entities from the original note.
        5. Aligns entities with medical codes and maps them to the translated text.
        """
        logger.info(f"Processing clinical note. Target language: {target_lang}")

        simplified_patient_instructions_en = self.simplifier.simplify(clinical_note)

        simplified_patient_instructions_target = self.translator.translate(
            simplified_patient_instructions_en,
            target_lang=target_lang,
            source_lang=source_lang
        )

        translated_clinical_note = self.translator.translate(
            clinical_note,
            target_lang=target_lang,
            source_lang=source_lang
        )

        entities = self.ner.extract_entities(clinical_note, lang=source_lang)

        aligned_entities = self.aligner.align_entities_to_codes(
            entities=entities,
            source_text=clinical_note,
            target_text=translated_clinical_note
        )

        return {
            "original_clinical_note": clinical_note,
            "translated_clinical_note": translated_clinical_note,
            "simplified_patient_instructions_en": simplified_patient_instructions_en,
            "simplified_patient_instructions_target": simplified_patient_instructions_target,
            "extracted_entities": entities,
            "aligned_entities_with_codes": aligned_entities,
            "target_language": target_lang,
            "source_language": source_lang
        }
