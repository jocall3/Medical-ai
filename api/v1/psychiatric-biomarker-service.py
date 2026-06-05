from typing import Dict, Any
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

app = FastAPI(
    title="Medical-AI Psychiatric Biomarker Service",
    description="Primary API service for acoustic and linguistic psychiatric biomarker analysis.",
    version="1.0.0"
)

class AcousticFeatures(BaseModel):
    pitch_mean: float = Field(..., description="Mean fundamental frequency (F0) in Hz")
    jitter: float = Field(..., description="Cycle-to-cycle variation of fundamental frequency")
    shimmer: float = Field(..., description="Cycle-to-cycle variation of amplitude")
    speech_rate: float = Field(..., description="Speech rate in syllables per second")

class PsychiatricAnalysisRequest(BaseModel):
    audio_features: AcousticFeatures
    transcript: str = Field(..., description="Transcribed text of the patient's speech")

class PsychiatricAnalysisResponse(BaseModel):
    depression_risk_score: float = Field(..., description="Calculated risk score for depression (0.0 to 1.0)")
    anxiety_risk_score: float = Field(..., description="Calculated risk score for anxiety (0.0 to 1.0)")
    cognitive_decline_risk_score: float = Field(..., description="Calculated risk score for cognitive decline (0.0 to 1.0)")
    linguistic_coherence_score: float = Field(..., description="Linguistic coherence score (0.0 to 1.0)")

@app.post("/api/v1/psychiatric-biomarker/analyze", response_model=PsychiatricAnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_psychiatric_biomarkers(request: PsychiatricAnalysisRequest):
    af = request.audio_features
    text = request.transcript.lower()

    # Calculate linguistic coherence and sentiment indicators
    words = text.split()
    unique_words = set(words)
    lexical_diversity = len(unique_words) / len(words) if words else 0.0

    # Simple sentiment/depressive keyword matching
    depressive_keywords = ["sad", "hopeless", "tired", "exhausted", "empty", "alone", "worthless", "guilt"]
    depressive_hits = sum(1 for word in words if word in depressive_keywords)

    # Acoustic biomarker heuristics:
    # Depression is often associated with flat prosody (low pitch variability), reduced speech rate, and increased jitter/shimmer.
    depression_risk = 0.2
    if af.speech_rate < 2.5:
        depression_risk += 0.25
    if af.jitter > 0.02 or af.shimmer > 0.04:
        depression_risk += 0.2
    depression_risk += min(0.35, (depressive_hits * 0.1))

    # Anxiety is often associated with elevated pitch, rapid speech rate, and high jitter.
    anxiety_risk = 0.15
    if af.pitch_mean > 200.0:
        anxiety_risk += 0.25
    if af.speech_rate > 3.5:
        anxiety_risk += 0.2
    if "anxious" in text or "panic" in text or "scared" in text:
        anxiety_risk += 0.2

    # Cognitive decline is associated with low lexical diversity, frequent pauses (low speech rate), and low coherence.
    cognitive_decline_risk = 0.1
    if lexical_diversity < 0.4 and len(words) > 20:
        cognitive_decline_risk += 0.3
    if af.speech_rate < 2.0:
        cognitive_decline_risk += 0.3

    # Linguistic coherence score
    linguistic_coherence = max(0.1, min(1.0, lexical_diversity * 1.2))

    return PsychiatricAnalysisResponse(
        depression_risk_score=round(min(0.99, depression_risk), 3),
        anxiety_risk_score=round(min(0.99, anxiety_risk), 3),
        cognitive_decline_risk_score=round(min(0.99, cognitive_decline_risk), 3),
        linguistic_coherence_score=round(linguistic_coherence, 3)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
