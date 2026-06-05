import logging
import re
from typing import List, Union
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from src.translation.translation_config import TranslationConfig

logger = logging.getLogger(__name__)

class JargonSimplifier:
    """
    Simplifies complex medical jargon and clinical terminology into patient-friendly,
    easily understandable language using a hybrid approach of dictionary-based mapping
    and transformer-based text simplification.
    """
    def __init__(self, config: TranslationConfig):
        self.config = config
        self.device = torch.device(config.device if torch.cuda.is_available() or config.device == "cpu" else "cpu")
        logger.info(f"Initializing JargonSimplifier on device: {self.device}")

        try:
            self.tokenizer = AutoTokenizer.from_pretrained(config.simplification_model_name)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(config.simplification_model_name).to(self.device)
        except Exception as e:
            logger.warning(f"Failed to load simplification model {config.simplification_model_name}: {e}. Using dictionary-only simplification.")
            self.tokenizer = None
            self.model = None

    def simplify(self, text: str) -> str:
        """
        Simplifies medical jargon in the input text.
        Uses dictionary-based replacement first, followed by generative simplification.
        """
        if not text:
            return text

        simplified_text = self._dictionary_simplify(text)

        if self.model is not None and self.tokenizer is not None:
            try:
                prompt = f"Simplify medical text: {simplified_text}"
                inputs = self.tokenizer(
                    prompt,
                    return_tensors="pt",
                    padding=True,
                    truncation=True,
                    max_length=self.config.max_length
                ).to(self.device)

                with torch.no_grad():
                    generated_tokens = self.model.generate(
                        **inputs,
                        max_length=self.config.simplification_max_length,
                        min_length=self.config.max_length // 10,
                        num_beams=4,
                        early_stopping=True
                    )

                simplified_text = self.tokenizer.decode(generated_tokens[0], skip_special_tokens=True)
            except Exception as e:
                logger.error(f"Generative simplification failed: {e}. Returning dictionary-simplified text.")

        return simplified_text

    def _dictionary_simplify(self, text: str) -> str:
        """Replaces known medical jargon with patient-friendly terms."""
        simplified = text
        sorted_jargon = sorted(self.config.jargon_dictionary.keys(), key=len, reverse=True)
        
        for jargon in sorted_jargon:
            pattern = re.compile(r'\b' + re.escape(jargon) + r'\b', re.IGNORECASE)
            simplified = pattern.sub(self.config.jargon_dictionary[jargon], simplified)
            
        return simplified
