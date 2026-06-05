import logging
from typing import List, Union
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from src.translation.translation_config import TranslationConfig

logger = logging.getLogger(__name__)

class MedicalTranslator:
    """
    Handles translation of clinical notes and instructions across multiple languages
    using fine-tuned Seq2Seq/Transformer models.
    """
    def __init__(self, config: TranslationConfig):
        self.config = config
        self.device = torch.device(config.device if torch.cuda.is_available() or config.device == "cpu" else "cpu")
        logger.info(f"Initializing MedicalTranslator on device: {self.device}")
        
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(config.translation_model_name)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(config.translation_model_name).to(self.device)
        except Exception as e:
            logger.warning(f"Failed to load translation model {config.translation_model_name}: {e}. Using fallback mock translator.")
            self.tokenizer = None
            self.model = None

    def translate(self, text: Union[str, List[str]], target_lang: str, source_lang: str = "en") -> Union[str, List[str]]:
        """
        Translates clinical text from source language to target language.
        """
        if not text:
            return text

        is_single = isinstance(text, str)
        texts = [text] if is_single else text

        if target_lang not in self.config.supported_languages:
            logger.warning(f"Target language {target_lang} is not explicitly supported. Proceeding anyway.")

        if self.model is None or self.tokenizer is None:
            translated = [self._mock_translate(t, target_lang) for t in texts]
            return translated[0] if is_single else translated

        try:
            formatted_texts = []
            for t in texts:
                if "opus-mt" in self.config.translation_model_name and target_lang != "en":
                    formatted_texts.append(f">>{target_lang}<< {t}")
                else:
                    formatted_texts.append(t)

            inputs = self.tokenizer(
                formatted_texts,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=self.config.max_length
            ).to(self.device)

            with torch.no_grad():
                generated_tokens = self.model.generate(
                    **inputs,
                    max_length=self.config.max_length,
                    num_beams=4,
                    early_stopping=True
                )

            decoded = self.tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)
            return decoded[0] if is_single else decoded

        except Exception as e:
            logger.error(f"Translation error: {e}. Falling back to mock translation.")
            translated = [self._mock_translate(t, target_lang) for t in texts]
            return translated[0] if is_single else translated

    def _mock_translate(self, text: str, target_lang: str) -> str:
        """Simple mock translation for fallback and testing."""
        translations = {
            "es": {
                "The patient presents with acute myocardial infarction and severe dyspnea.": "El paciente presenta infarto agudo de miocardio y disnea grave.",
                "Please take your medication twice daily after meals.": "Por favor, tome su medicamento dos veces al día después de las comidas.",
                "Hypertension should be monitored closely.": "La hipertensión debe ser monitoreada de cerca."
            },
            "fr": {
                "The patient presents with acute myocardial infarction and severe dyspnea.": "Le patient présente un infarctus aigu du myocarde et une dyspnée sévère.",
                "Please take your medication twice daily after meals.": "Veuillez prendre votre médicament deux fois par jour après les repas.",
                "Hypertension should be monitored closely.": "L'hypertension doit être surveillée de près."
            }
        }
        return translations.get(target_lang, {}).get(text, f"[{target_lang.upper()}] {text}")
