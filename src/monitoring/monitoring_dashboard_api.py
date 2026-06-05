import numpy as np
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from src.monitoring.monitoring_config import MonitoringConfig
from src.monitoring.vital_sign_preprocessor import VitalSignPreprocessor
from src.monitoring.deterioration_predictor import DeteriorationPredictor
from src.monitoring.explainable_ai_attribution import IntegratedGradientsAttribution
from src.monitoring.alarm_fatigue_mitigator import AlarmFatigueMitigator

app = FastAPI(
    title="Clinical Deterioration Monitoring Dashboard API",
    description="Real-time patient risk scores, historical trajectories, and explainable AI attributions.",
    version="1.0.0"
)

# Initialize components
config = MonitoringConfig()
preprocessor = VitalSignPreprocessor(config)
predictor = DeteriorationPredictor(config)
attribution_engine = IntegratedGradientsAttribution(predictor.model, config)
mitigator = AlarmFatigueMitigator(config)

# In-memory database for demonstration/real-time tracking
# patient_id -> list of raw vital sign readings
patient_history_db: Dict[str, List[Dict[str, float]]] = {}

class VitalReading(BaseModel):
    HR: float
    RR: float
    SBP: float
    DBP: float
    SpO2: float
    Temp: float

class PatientTelemetry(BaseModel):
    patient_id: str
    reading: VitalReading
    contextual_suppression: Optional[bool] = False

class RiskPredictionResponse(BaseModel):
    patient_id: str
    risk_score: float
    alarm_triggered: bool
    explanations: List[Dict[str, Any]]

@app.post("/telemetry", response_model=RiskPredictionResponse)
async def post_telemetry(telemetry: PatientTelemetry):
    patient_id = telemetry.patient_id
    reading_dict = telemetry.reading.dict()

    # Initialize history if not present
    if patient_id not in patient_history_db:
        patient_history_db[patient_id] = []

    # Append new reading
    patient_history_db[patient_id].append(reading_dict)

    # Keep history bounded to 2x sequence length to prevent memory leaks
    max_history = config.SEQUENCE_LENGTH * 2
    if len(patient_history_db[patient_id]) > max_history:
        patient_history_db[patient_id] = patient_history_db[patient_id][-max_history:]

    # Preprocess the sequence
    try:
        preprocessed_seq = preprocessor.preprocess_stream_window(patient_history_db[patient_id])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Preprocessing failed: {str(e)}")

    # Predict risk
    try:
        risk_score = predictor.predict_risk(preprocessed_seq)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    # Explain prediction using Integrated Gradients
    try:
        attributions = attribution_engine.compute_attributions(preprocessed_seq)
        explanations = attribution_engine.get_clinical_explanations(preprocessed_seq, attributions)
    except Exception as e:
        explanations = [{"error": f"Explanation generation failed: {str(e)}"}]

    # Determine if alarm should trigger (mitigating fatigue)
    alarm_triggered = mitigator.should_trigger_alarm(
        patient_id=patient_id,
        risk_score=risk_score,
        contextual_suppression=telemetry.contextual_suppression
    )

    return RiskPredictionResponse(
        patient_id=patient_id,
        risk_score=risk_score,
        alarm_triggered=alarm_triggered,
        explanations=explanations
    )

@app.get("/patient/{patient_id}/trajectory")
async def get_patient_trajectory(patient_id: str):
    if patient_id not in patient_history_db:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {
        "patient_id": patient_id,
        "history_length": len(patient_history_db[patient_id]),
        "history": patient_history_db[patient_id]
    }
