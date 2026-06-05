from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from src.knowledge_graph.graph_config import GraphConfig
from src.knowledge_graph.graph_pipeline import ClinicalGraphPipeline

app = FastAPI(
    title="Clinical Knowledge Graph Inference Service",
    description="API serving clinical knowledge graph queries, reasoning paths, and differential diagnosis suggestions.",
    version="1.0.0"
)

_pipeline: Optional[ClinicalGraphPipeline] = None

def get_pipeline() -> ClinicalGraphPipeline:
    global _pipeline
    if _pipeline is None:
        config = GraphConfig()
        _pipeline = ClinicalGraphPipeline(config)
        sample_records = [
            {
                "patient_id": "P001",
                "diagnoses": [{"name": "Myocardial infarction", "type": "disease"}],
                "symptoms": [{"name": "Chest pain", "type": "symptom"}, {"name": "Dyspnea", "type": "symptom"}],
                "medications": [{"name": "Aspirin", "type": "drug"}],
                "labs": [{"name": "Troponin", "type": "lab_test", "value": "high"}]
            },
            {
                "patient_id": "P002",
                "diagnoses": [{"name": "Pneumonia", "type": "disease"}],
                "symptoms": [{"name": "Cough", "type": "symptom"}, {"name": "Fever", "type": "symptom"}, {"name": "Dyspnea", "type": "symptom"}],
                "medications": [{"name": "Amoxicillin", "type": "drug"}],
                "labs": [{"name": "WBC", "type": "lab_test", "value": "high"}]
            }
        ]
        _pipeline.ingest_ehr_records(sample_records)
        _pipeline.run_embedding_pipeline()
    return _pipeline

class DiagnosisRequest(BaseModel):
    symptoms: List[str]

class PathRequest(BaseModel):
    symptom: str
    disease: str

class EHRRecordRequest(BaseModel):
    patient_id: str
    diagnoses: List[Dict[str, str]]
    symptoms: List[Dict[str, str]]
    medications: List[Dict[str, str]]
    labs: List[Dict[str, str]]

@app.post("/ingest")
def ingest_record(record: EHRRecordRequest, pipeline: ClinicalGraphPipeline = Depends(get_pipeline)):
    try:
        pipeline.ingest_ehr_records([record.dict()])
        pipeline.run_embedding_pipeline()
        return {"status": "success", "message": f"Record for patient {record.patient_id} ingested successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/differential-diagnosis")
def differential_diagnosis(request: DiagnosisRequest, pipeline: ClinicalGraphPipeline = Depends(get_pipeline)):
    try:
        reasoner = pipeline.get_reasoner()
        candidates = reasoner.find_differential_diagnosis(request.symptoms)
        return {"symptoms": request.symptoms, "candidates": candidates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain-path")
def explain_path(request: PathRequest, pipeline: ClinicalGraphPipeline = Depends(get_pipeline)):
    try:
        reasoner = pipeline.get_reasoner()
        paths = reasoner.explain_diagnosis_path(request.symptom, request.disease)
        return {"symptom": request.symptom, "disease": request.disease, "paths": paths}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/graph-summary")
def graph_summary(pipeline: ClinicalGraphPipeline = Depends(get_pipeline)):
    return pipeline.builder.get_graph_summary()
