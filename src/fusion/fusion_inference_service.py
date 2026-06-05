import json
import torch
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from src.fusion.multimodal_fusion_engine import MultimodalFusionEngine
from src.fusion.fusion_config import FusionConfig

app = FastAPI(title="OmniMed Multi-Modal Fusion Inference Service", version="1.0.0")

model = None
config = None
device = "cuda" if torch.cuda.is_available() else "cpu"

class FHIRPayload(BaseModel):
    resourceType: str
    id: str
    text: Optional[dict] = None
    code: Optional[dict] = None

def initialize_service(checkpoint_path: str = None):
    global model, config
    config = FusionConfig()
    model = MultimodalFusionEngine(config)
    if checkpoint_path:
        checkpoint = torch.load(checkpoint_path, map_location=device)
        model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)
    model.eval()

@app.post("/predict")
async def predict(
    fhir_clinical_note: str = Form(...),
    fastq_sequence: str = Form(...),
    image_file: Optional[UploadFile] = File(None)
):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not initialized")

    try:
        fhir_dict = json.loads(fhir_clinical_note)
        clinical_text = fhir_dict.get("text", {}).get("div", "No clinical text provided.")
    except json.JSONDecodeError:
        clinical_text = fhir_clinical_note

    words = clinical_text.lower().split()
    text_tokens = [hash(w) % config.text_vocab_size for w in words]
    if len(text_tokens) > config.text_max_length:
        text_tokens = text_tokens[:config.text_max_length]
        text_mask = [1] * config.text_max_length
    else:
        padding_len = config.text_max_length - len(text_tokens)
        text_mask = [1] * len(text_tokens) + [0] * padding_len
        text_tokens = text_tokens + [0] * padding_len

    dna_vocab = {'A': 1, 'T': 2, 'C': 3, 'G': 4, 'N': 5}
    genomic_tokens = [dna_vocab.get(char, 0) for char in fastq_sequence.upper()]
    if len(genomic_tokens) > config.genomic_max_length:
        genomic_tokens = genomic_tokens[:config.genomic_max_length]
        genomic_mask = [1] * config.genomic_max_length
    else:
        padding_len = config.genomic_max_length - len(genomic_tokens)
        genomic_mask = [1] * len(genomic_tokens) + [0] * padding_len
        genomic_tokens = genomic_tokens + [0] * padding_len

    if image_file:
        image_tensor = torch.randn(1, *config.image_input_shape)
    else:
        image_tensor = torch.randn(1, *config.image_input_shape)

    image_tensor = image_tensor.to(device)
    genomic_tensor = torch.tensor([genomic_tokens], dtype=torch.long).to(device)
    genomic_mask_tensor = torch.tensor([genomic_mask], dtype=torch.float32).to(device)
    text_tensor = torch.tensor([text_tokens], dtype=torch.long).to(device)
    text_mask_tensor = torch.tensor([text_mask], dtype=torch.float32).to(device)

    with torch.no_grad():
        outputs = model(image_tensor, genomic_tensor, text_tensor, genomic_mask_tensor, text_mask_tensor)
        probs = torch.sigmoid(outputs["logits"]).squeeze(0).cpu().tolist()
        fused_emb = outputs["fused_representation"].squeeze(0).cpu().tolist()

    return {
        "diagnostic_probabilities": probs,
        "unified_latent_embedding": fused_emb,
        "status": "success"
    }
