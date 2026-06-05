from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from datetime import datetime

app = FastAPI(
    title="Medical-AI Predictive Patient Monitoring Service",
    description="Primary API service for real-time telemetry stream processing and clinical deterioration prediction.",
    version="1.0.0"
)

class TelemetryData(BaseModel):
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    heart_rate: float = Field(..., description="Heart rate in bpm")
    spo2: float = Field(..., description="Oxygen saturation percentage")
    systolic_bp: float = Field(..., description="Systolic blood pressure in mmHg")
    respiratory_rate: float = Field(..., description="Respiratory rate in breaths per minute")

class MonitoringRequest(BaseModel):
    telemetry_stream: List[TelemetryData] = Field(..., description="Time-series telemetry data stream")

class MonitoringResponse(BaseModel):
    deterioration_probability: float = Field(..., description="Probability of clinical deterioration within 4 hours")
    news2_score: int = Field(..., description="National Early Warning Score 2")
    sepsis_risk: str = Field(..., description="Sepsis risk level (LOW, MEDIUM, HIGH)")
    recommended_action: str = Field(..., description="Recommended clinical action")

def calculate_news2(hr: float, spo2: float, sbp: float, rr: float) -> int:
    score = 0
    
    # Respiration Rate
    if rr <= 8 or rr >= 25: score += 3
    elif 21 <= rr <= 24: score += 2
    elif 9 <= rr <= 11: score += 1
    
    # SpO2
    if spo2 < 92: score += 3
    elif spo2 in [92, 93]: score += 2
    elif spo2 in [94, 95]: score += 1
    
    # Systolic BP
    if sbp <= 90 or sbp >= 220: score += 3
    elif 91 <= sbp <= 100: score += 2
    elif 101 <= sbp <= 110: score += 1
    
    # Heart Rate
    if hr <= 40 or hr >= 131: score += 3
    elif 111 <= hr <= 130: score += 2
    elif 41 <= hr <= 50 or 91 <= hr <= 110: score += 1
    
    return score

@app.post("/api/v1/patient-monitoring/predict-deterioration", response_model=MonitoringResponse, status_code=status.HTTP_200_OK)
async def predict_deterioration(request: MonitoringRequest):
    if not request.telemetry_stream:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telemetry stream cannot be empty."
        )

    # Analyze the latest telemetry data point
    latest = request.telemetry_stream[-1]
    news2 = calculate_news2(
        hr=latest.heart_rate,
        spo2=latest.spo2,
        sbp=latest.systolic_bp,
        rr=latest.respiratory_rate
    )

    # Calculate deterioration probability using a simulated trend analysis
    # If vitals are worsening over the stream, increase probability
    trend_factor = 0.0
    if len(request.telemetry_stream) > 1:
        first = request.telemetry_stream[0]
        # Check if SpO2 is dropping or HR is rising
        spo2_diff = first.spo2 - latest.spo2
        hr_diff = latest.heart_rate - first.heart_rate
        trend_factor += max(0.0, spo2_diff * 0.05)
        trend_factor += max(0.0, hr_diff * 0.005)

    base_prob = 0.05
    if news2 >= 7:
        base_prob = 0.75
        sepsis_risk = "HIGH"
        recommended_action = "Immediate emergency assessment by a clinical rapid response team."
    elif news2 >= 5:
        base_prob = 0.40
        sepsis_risk = "MEDIUM"
        recommended_action = "Urgent clinical review; increase monitoring frequency to hourly."
    elif news2 >= 1:
        base_prob = 0.15
        sepsis_risk = "LOW"
        recommended_action = "Registered nurse assessment; adjust monitoring frequency."
    else:
        sepsis_risk = "LOW"
        recommended_action = "Continue routine clinical monitoring."

    deterioration_probability = min(0.99, base_prob + trend_factor)

    return MonitoringResponse(
        deterioration_probability=round(deterioration_probability, 3),
        news2_score=news2,
        sepsis_risk=sepsis_risk,
        recommended_action=recommended_action
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8008)
