from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime

@dataclass
class PatientDemographics:
    patient_id: str
    birth_date: str
    gender: str
    race: Optional[str] = None
    ethnicity: Optional[str] = None

@dataclass
class ClinicalObservation:
    observation_id: str
    patient_id: str
    code: str  # LOINC or SNOMED CT code
    display: str
    value: Any
    unit: str
    timestamp: datetime = field(default_factory=datetime.utcnow)

@dataclass
class DICOMMetadata:
    study_instance_uid: str
    series_instance_uid: str
    sop_instance_uid: str
    modality: str
    patient_id: str
    pixel_spacing: List[float] = field(default_factory=list)

@dataclass
class FHIRResource:
    resource_type: str
    id: str
    raw_data: Dict[str, Any]

@dataclass
class ModelPrediction:
    model_id: str
    prediction_id: str
    confidence: float
    output_class: str
    probabilities: Dict[str, float]
    clinical_recommendation: str
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class AnonymizationConfig:
    remove_direct_identifiers: bool = True
    shift_dates: bool = True
    date_shift_days: int = 0
    mask_zipcodes: bool = True
    custom_rules: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ClinicalSimulationResult:
    simulation_id: str
    cohort_size: int
    accuracy: float
    sensitivity: float
    specificity: float
    bias_detected: bool
    safety_score: float  # 0.0 to 1.0
    failed_cases: List[Dict[str, Any]] = field(default_factory=list)
