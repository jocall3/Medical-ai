import re
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

app = FastAPI(
    title="Medical-AI Administrative Workflow Automation Service",
    description="Primary API service for clinical data extraction and NLP-driven administrative automation.",
    version="1.0.0"
)

class ExtractionRequest(BaseModel):
    clinical_note: str = Field(..., description="Unstructured clinical note or OCR'd text")

class ExtractedEntity(BaseModel):
    text: str = Field(..., description="The exact text segment extracted")
    category: str = Field(..., description="The clinical category (e.g., 'DIAGNOSIS', 'MEDICATION', 'DOSAGE')")
    confidence: float = Field(..., description="Extraction confidence score (0.0 to 1.0)")
    standardized_code: str = Field(..., description="Standardized clinical code (ICD-10, RxNorm, or SNOMED-CT)")

class ExtractionResponse(BaseModel):
    extracted_entities: List[ExtractedEntity]
    processing_time_ms: float

@app.post("/api/v1/admin-workflow/extract", response_model=ExtractionResponse, status_code=status.HTTP_200_OK)
async def extract_clinical_data(request: ExtractionRequest):
    note = request.clinical_note
    entities = []

    # Simulated Named Entity Recognition (NER) and clinical entity linking
    # In production, this runs a fine-tuned clinical LLM or BioBERT model
    
    # Regex-based mock extraction for demonstration
    diagnoses = [
        ("diabetes mellitus", "E11.9", "DIAGNOSIS"),
        ("hypertension", "I10", "DIAGNOSIS"),
        ("pneumonia", "J18.9", "DIAGNOSIS")
    ]
    
    medications = [
        ("metformin", "860974", "MEDICATION"),
        ("lisinopril", "29046", "MEDICATION"),
        ("amoxicillin", "308182", "MEDICATION")
    ]

    for term, code, cat in diagnoses:
        if re.search(rf"\b{term}\b", note, re.IGNORECASE):
            entities.append(
                ExtractedEntity(
                    text=term,
                    category=cat,
                    confidence=0.95,
                    standardized_code=code
                )
            )

    for term, code, cat in medications:
        if re.search(rf"\b{term}\b", note, re.IGNORECASE):
            entities.append(
                ExtractedEntity(
                    text=term,
                    category=cat,
                    confidence=0.98,
                    standardized_code=code
                )
            )

    # Extract dosages (e.g., "500mg", "10mg")
    dosages = re.findall(r"\b\d+\s*(?:mg|g|ml)\b", note, re.IGNORECASE)
    for dose in dosages:
        entities.append(
            ExtractedEntity(
                text=dose,
                category="DOSAGE",
                confidence=0.91,
                standardized_code="N/A"
            )
        )

    return ExtractionResponse(
        extracted_entities=entities,
        processing_time_ms=12.4
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8010)
