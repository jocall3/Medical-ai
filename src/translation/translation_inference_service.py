import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from src.translation.translation_config import TranslationConfig
from src.translation.translation_pipeline import MedicalTranslationPipeline

app = FastAPI(
    title="Panacea Multilingual Clinical Translation & Simplification API",
    description="API serving multilingual translations, simplified patient instructions, and multilingual clinical entity extraction.",
    version="1.0.0"
)

pipeline_instance = None

def get_pipeline() -> MedicalTranslationPipeline:
    global pipeline_instance
    if pipeline_instance is None:
        config = TranslationConfig()
        pipeline_instance = MedicalTranslationPipeline(config)
    return pipeline_instance

class TranslationRequest(BaseModel):
    text: str = Field(..., description="The clinical text or note to translate.")
    target_lang: str = Field(..., description="ISO language code for target translation (e.g., 'es', 'fr').")
    source_lang: str = Field("en", description="ISO language code for source text.")

class SimplificationRequest(BaseModel):
    text: str = Field(..., description="The complex clinical text to simplify.")

class NERRequest(BaseModel):
    text: str = Field(..., description="The clinical text to extract entities from.")
    lang: str = Field("en", description="Language of the input text.")

class PipelineRequest(BaseModel):
    clinical_note: str = Field(..., description="The raw clinical note.")
    target_lang: str = Field(..., description="ISO language code for patient instructions.")
    source_lang: str = Field("en", description="ISO language code of the clinical note.")

@app.on_event("startup")
def startup_event():
    get_pipeline()

@app.post("/translate", summary="Translate clinical text")
def translate(request: TranslationRequest, pipeline: MedicalTranslationPipeline = Depends(get_pipeline)):
    try:
        translated = pipeline.translator.translate(
            request.text,
            target_lang=request.target_lang,
            source_lang=request.source_lang
        )
        return {"translated_text": translated, "target_lang": request.target_lang}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simplify", summary="Simplify medical jargon")
def simplify(request: SimplificationRequest, pipeline: MedicalTranslationPipeline = Depends(get_pipeline)):
    try:
        simplified = pipeline.simplifier.simplify(request.text)
        return {"simplified_text": simplified}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ner", summary="Extract clinical entities")
def extract_ner(request: NERRequest, pipeline: MedicalTranslationPipeline = Depends(get_pipeline)):
    try:
        entities = pipeline.ner.extract_entities(request.text, lang=request.lang)
        return {"entities": entities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pipeline", summary="Run end-to-end translation and simplification pipeline")
def run_pipeline(request: PipelineRequest, pipeline: MedicalTranslationPipeline = Depends(get_pipeline)):
    try:
        result = pipeline.process_clinical_note(
            clinical_note=request.clinical_note,
            target_lang=request.target_lang,
            source_lang=request.source_lang
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health", summary="Health check endpoint")
def health_check():
    return {"status": "healthy", "service": "Panacea Translation Service"}
