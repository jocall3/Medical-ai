import math
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

app = FastAPI(
    title="Medical-AI Personalized Pharmacology Engine",
    description="Primary API service for PK/PD simulation and personalized dosing optimization.",
    version="1.0.0"
)

class PKPDSimulationRequest(BaseModel):
    drug_name: str = Field(..., description="Name of the drug (e.g., 'Gentamicin', 'Warfarin')")
    dose_mg: float = Field(..., description="Administered dose in milligrams", gt=0)
    patient_weight_kg: float = Field(..., description="Patient weight in kilograms", gt=0)
    egfr: float = Field(..., description="Estimated Glomerular Filtration Rate in mL/min/1.73m2", gt=0)

class PKPDSimulationResponse(BaseModel):
    time_points: List[float] = Field(..., description="Time points in hours")
    concentrations: List[float] = Field(..., description="Simulated plasma concentrations in mg/L")
    therapeutic_effect: List[float] = Field(..., description="Simulated therapeutic effect percentage (0 to 100)")
    half_life_hours: float = Field(..., description="Calculated drug elimination half-life in hours")

@app.post("/api/v1/pharmacology/pkpd-simulation", response_model=PKPDSimulationResponse, status_code=status.HTTP_200_OK)
async def simulate_pkpd(request: PKPDSimulationRequest):
    # Define pharmacokinetic parameters based on drug and renal function (eGFR)
    drug = request.drug_name.upper()
    
    # Default parameters (1-compartment model)
    v_d = 0.25 * request.patient_weight_kg  # Volume of distribution (L)
    
    if "GENTAMICIN" in drug:
        # Elimination rate constant dependent on renal function
        k_e = 0.00293 * request.egfr + 0.014
        k_a = 1.5  # Absorption rate constant (1/h)
        f = 1.0    # Bioavailability (IV/IM)
    elif "WARFARIN" in drug:
        k_e = 0.018  # Warfarin has a long half-life
        k_a = 0.8
        f = 0.95
        v_d = 0.14 * request.patient_weight_kg
    else:
        # Generic drug parameters
        k_e = 0.05
        k_a = 1.0
        f = 0.8

    half_life = math.log(2) / k_e

    # Simulate concentration over 24 hours
    time_points = [float(t) for t in range(0, 25)]
    concentrations = []
    therapeutic_effect = []

    for t in time_points:
        # Bateman equation for 1-compartment model with first-order absorption
        if k_a == k_e:
            k_a += 0.001  # Avoid division by zero
        conc = (f * request.dose_mg / v_d) * (k_a / (k_a - k_e)) * (math.exp(-k_e * t) - math.exp(-k_a * t))
        conc = max(0.0, conc)
        concentrations.append(round(conc, 4))

        # Emax model for pharmacodynamics (therapeutic effect)
        e_max = 100.0
        ec_50 = 2.0  # Concentration at 50% effect
        effect = (e_max * conc) / (ec_50 + conc) if conc > 0 else 0.0
        therapeutic_effect.append(round(effect, 2))

    return PKPDSimulationResponse(
        time_points=time_points,
        concentrations=concentrations,
        therapeutic_effect=therapeutic_effect,
        half_life_hours=round(half_life, 2)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8007)
