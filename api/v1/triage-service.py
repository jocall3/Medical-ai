import math
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

app = FastAPI(
    title="Medical-AI Automated Triage Service",
    description="Primary API service for automated clinical triage scoring and ICU admission prediction.",
    version="1.0.0"
)

class Vitals(BaseModel):
    heart_rate: int = Field(..., description="Heart rate in beats per minute", ge=0, le=300)
    systolic_bp: int = Field(..., description="Systolic blood pressure in mmHg", ge=0, le=300)
    diastolic_bp: int = Field(..., description="Diastolic blood pressure in mmHg", ge=0, le=300)
    temperature: float = Field(..., description="Body temperature in Celsius", ge=30.0, le=45.0)
    spo2: int = Field(..., description="Oxygen saturation percentage", ge=0, le=100)
    respiratory_rate: int = Field(..., description="Respiratory rate in breaths per minute", ge=0, le=100)

class TriageRequest(BaseModel):
    vitals: Vitals
    symptoms: List[str] = Field(..., description="List of patient symptoms")
    age: int = Field(..., description="Patient age in years", ge=0, le=125)

class TriageResponse(BaseModel):
    esi_score: int = Field(..., description="Emergency Severity Index (1-5, where 1 is most severe)", ge=1, le=5)
    icu_admission_probability: float = Field(..., description="Predicted probability of ICU admission (0.0 to 1.0)")
    recommended_disposition: str = Field(..., description="Recommended clinical disposition")
    clinical_reasoning: str = Field(..., description="Automated clinical reasoning explanation")

@app.post("/api/v1/triage/score", response_model=TriageResponse, status_code=status.HTTP_200_OK)
async def calculate_triage_score(request: TriageRequest):
    v = request.vitals
    symptoms_lower = [s.lower() for s in request.symptoms]
    
    # Determine ESI Score based on clinical rules
    # ESI 1: Requires immediate life-saving intervention
    is_esi_1 = (
        v.heart_rate == 0 or 
        v.respiratory_rate == 0 or 
        v.spo2 < 85 or 
        any(s in symptoms_lower for s in ["cardiac arrest", "respiratory arrest", "unresponsive", "severe anaphylaxis"])
    )
    
    # ESI 2: High risk situation, confused/lethargic/disoriented, or severe pain/distress
    is_esi_2 = (
        not is_esi_1 and (
            v.spo2 < 90 or 
            v.heart_rate > 130 or 
            v.respiratory_rate > 30 or 
            v.systolic_bp < 90 or 
            any(s in symptoms_lower for s in ["chest pain", "stroke symptoms", "severe dyspnea", "active seizure", "suicidal ideation"])
        )
    )
    
    if is_esi_1:
        esi_score = 1
        recommended_disposition = "Immediate Resuscitation Room"
    elif is_esi_2:
        esi_score = 2
        recommended_disposition = "Emergent Treatment Bay"
    elif len(symptoms_lower) >= 3 or v.temperature > 38.5 or v.temperature < 36.0:
        esi_score = 3
        recommended_disposition = "Urgent Care / Standard Exam Room"
    elif len(symptoms_lower) == 1 or (36.0 <= v.temperature <= 38.0):
        esi_score = 4
        recommended_disposition = "Fast Track / Minor Care"
    else:
        esi_score = 5
        recommended_disposition = "Primary Care Referral / Discharge"

    # Calculate ICU Admission Probability using a simulated logistic regression model
    logit_score = -2.5
    logit_score += 0.02 * (v.heart_rate - 80)
    logit_score += 0.05 * (18 - v.respiratory_rate if v.respiratory_rate < 12 else v.respiratory_rate - 18)
    logit_score += 0.15 * (95 - v.spo2 if v.spo2 < 95 else 0)
    logit_score += 0.03 * (request.age - 40)
    if esi_score == 1:
        logit_score += 3.0
    elif esi_score == 2:
        logit_score += 1.5

    icu_prob = 1.0 / (1.0 + math.exp(-logit_score))
    icu_prob = max(0.01, min(0.99, icu_prob))

    # Generate clinical reasoning
    reasoning_parts = []
    if is_esi_1:
        reasoning_parts.append("Critical physiological instability or life-threatening symptoms detected.")
    if v.spo2 < 92:
        reasoning_parts.append(f"Hypoxemia noted with SpO2 of {v.spo2}%.")
    if v.heart_rate > 100:
        reasoning_parts.append(f"Tachycardia present (HR: {v.heart_rate} bpm).")
    if not reasoning_parts:
        reasoning_parts.append("Vitals are within acceptable limits. Symptoms suggest low-acuity condition.")
    
    clinical_reasoning = " ".join(reasoning_parts)

    return TriageResponse(
        esi_score=esi_score,
        icu_admission_probability=round(icu_prob, 4),
        recommended_disposition=recommended_disposition,
        clinical_reasoning=clinical_reasoning
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
