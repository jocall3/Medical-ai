from pydantic import BaseModel, Field
from typing import List, Dict

class TranslationConfig(BaseModel):
    """Configuration for the medical translation, simplification, and multilingual NER pipeline."""
    translation_model_name: str = Field(
        default="Helsinki-NLP/opus-mt-en-mul",
        description="Hugging Face model name for multilingual translation."
    )
    simplification_model_name: str = Field(
        default="facebook/bart-large-cnn",
        description="Hugging Face model name for text simplification."
    )
    ner_model_name: str = Field(
        default="xlm-roberta-large",
        description="Multilingual transformer model for clinical NER."
    )
    supported_languages: List[str] = Field(
        default=["en", "es", "fr", "de", "zh", "ar", "it", "pt"],
        description="List of supported ISO language codes."
    )
    max_length: int = Field(
        default=512,
        description="Maximum sequence length for tokenization."
    )
    simplification_max_length: int = Field(
        default=150,
        description="Maximum length for simplified output."
    )
    device: str = Field(
        default="cpu",
        description="Device to run models on ('cpu', 'cuda', 'mps')."
    )
    jargon_dictionary: Dict[str, str] = Field(
        default={
            "myocardial infarction": "heart attack",
            "hypertension": "high blood pressure",
            "dyspnea": "shortness of breath",
            "cephalalgia": "headache",
            "otitis media": "middle ear infection",
            "gastroesophageal reflux": "acid reflux",
            "hyperlipidemia": "high cholesterol",
            "nephrolithiasis": "kidney stones",
            "varicella": "chickenpox",
            "acute coryza": "common cold",
            "diaphoresis": "excessive sweating",
            "syncope": "fainting",
            "alopecia": "hair loss",
            "pruritus": "itching",
            "erythema": "redness of the skin",
            "edema": "swelling",
            "hematoma": "bruise",
            "epistaxis": "nosebleed"
        },
        description="Fallback dictionary for exact medical jargon simplification."
    )
    concept_code_map: Dict[str, str] = Field(
        default={
            "heart attack": "ICD-10:I21.9",
            "myocardial infarction": "ICD-10:I21.9",
            "high blood pressure": "ICD-10:I10",
            "hypertension": "ICD-10:I10",
            "shortness of breath": "ICD-10:R06.02",
            "dyspnea": "ICD-10:R06.02",
            "headache": "ICD-10:R51.9",
            "cephalalgia": "ICD-10:R51.9",
            "middle ear infection": "ICD-10:H66.90",
            "otitis media": "ICD-10:H66.90"
        },
        description="Mapping of clinical concepts to standard medical codes (ICD-10/SNOMED)."
    )
