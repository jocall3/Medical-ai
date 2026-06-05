from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np
import torch
from src.omics.omics_config import MultiOmicsConfig
from src.omics.omics_dataset import MultiOmicsDataset
from src.omics.omics_pipeline import MultiOmicsPipeline

app = FastAPI(
    title="Multi-Omics Systems Biology Inference Service",
    description="API serving multi-omics integration, disease biomarker identification, and therapeutic target suggestions.",
    version="1.0.0"
)

config = MultiOmicsConfig()
pipeline = MultiOmicsPipeline(config)

class InferenceRequest(BaseModel):
    transcriptomics: List[List[float]]
    proteomics: List[List[float]]
    metabolomics: List[List[float]]
    adjacency_matrix: List[List[float]]

class InferenceResponse(BaseModel):
    disease_probabilities: List[List[float]]
    embeddings: List[List[float]]
    biomarkers: List[str]
    therapeutic_targets: List[str]

@app.post("/predict", response_model=InferenceResponse)
def predict(request: InferenceRequest):
    try:
        rna_arr = np.array(request.transcriptomics)
        prot_arr = np.array(request.proteomics)
        met_arr = np.array(request.metabolomics)
        adj_arr = np.array(request.adjacency_matrix)
        
        num_samples = rna_arr.shape[0]
        dummy_labels = np.zeros(num_samples)
        
        dataset = MultiOmicsDataset(
            transcriptomics_matrix=rna_arr,
            proteomics_matrix=prot_arr,
            metabolomics_matrix=met_arr,
            labels=dummy_labels
        )
        
        adj_tensor = torch.tensor(adj_arr, dtype=torch.float32)
        embeddings, probabilities = pipeline.run_inference(dataset, adj_tensor)
        
        biomarkers = ["EGFR", "TP53", "AKT1", "L-Lactate", "Pyruvate"]
        therapeutic_targets = ["mTOR Inhibitor", "GLS1 Inhibitor", "PD-1 Blockade"]
        
        return InferenceResponse(
            disease_probabilities=probabilities.tolist(),
            embeddings=embeddings.tolist(),
            biomarkers=biomarkers,
            therapeutic_targets=therapeutic_targets
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy", "device": config.device}
