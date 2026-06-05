import pytest
from src.translation.translation_config import TranslationConfig
from src.translation.medical_translator import MedicalTranslator
from src.translation.jargon_simplifier import JargonSimplifier
from src.translation.multilingual_ner import MultilingualNER
from src.translation.cross_lingual_aligner import CrossLingualAligner
from src.translation.translation_pipeline import MedicalTranslationPipeline

@pytest.fixture
def config():
    return TranslationConfig(
        translation_model_name="mock-translation-model",
        simplification_model_name="mock-simplification-model",
        ner_model_name="mock-ner-model",
        device="cpu"
    )

def test_medical_translator_fallback(config):
    translator = MedicalTranslator(config)
    text = "The patient presents with acute myocardial infarction and severe dyspnea."
    translated = translator.translate(text, target_lang="es")
    assert "infarto agudo de miocardio" in translated or "[ES]" in translated

def test_jargon_simplifier(config):
    simplifier = JargonSimplifier(config)
    text = "The patient has severe hypertension and dyspnea."
    simplified = simplifier._dictionary_simplify(text)
    assert "high blood pressure" in simplified
    assert "shortness of breath" in simplified

def test_multilingual_ner(config):
    ner = MultilingualNER(config)
    text = "The patient presents with acute myocardial infarction."
    entities = ner.extract_entities(text, lang="en")
    assert len(entities) > 0
    assert any(ent["label"] == "DISEASE" for ent in entities)

def test_cross_lingual_aligner(config):
    aligner = CrossLingualAligner(config)
    entities = [{"text": "myocardial infarction", "label": "DISEASE", "confidence": 0.95}]
    aligned = aligner.align_entities_to_codes(
        entities=entities,
        source_text="The patient presents with acute myocardial infarction.",
        target_text="El paciente presenta infarto agudo de miocardio."
    )
    assert len(aligned) == 1
    assert aligned[0]["medical_code"] == "ICD-10:I21.9"

def test_end_to_end_pipeline(config):
    pipeline = MedicalTranslationPipeline(config)
    note = "The patient presents with acute myocardial infarction and severe dyspnea."
    result = pipeline.process_clinical_note(note, target_lang="es")
    
    assert "original_clinical_note" in result
    assert "translated_clinical_note" in result
    assert "simplified_patient_instructions_en" in result
    assert "simplified_patient_instructions_target" in result
    assert len(result["extracted_entities"]) > 0
