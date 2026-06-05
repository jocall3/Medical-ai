import pytest
import numpy as np
import torch
from src.monitoring.monitoring_config import MonitoringConfig
from src.monitoring.vital_sign_preprocessor import VitalSignPreprocessor
from src.monitoring.deterioration_predictor import DeteriorationPredictor, DeteriorationLSTM
from src.monitoring.alarm_fatigue_mitigator import AlarmFatigueMitigator
from src.monitoring.explainable_ai_attribution import IntegratedGradientsAttribution

def test_vital_sign_preprocessor():
    config = MonitoringConfig()
    preprocessor = VitalSignPreprocessor(config)
    
    # Create a mock sequence of raw readings
    raw_sequence = [
        {"HR": 80.0, "RR": 16.0, "SBP": 120.0, "DBP": 75.0, "SpO2": 97.0, "Temp": 37.0}
        for _ in range(10)
    ]
    
    processed = preprocessor.preprocess_stream_window(raw_sequence)
    
    # Check shape: should be (SEQUENCE_LENGTH, INPUT_DIM)
    assert processed.shape == (config.SEQUENCE_LENGTH, config.INPUT_DIM)
    # Check that values are normalized (should be close to 0 for mean values)
    assert np.allclose(processed[-1], 0.0, atol=1e-2)

def test_deterioration_predictor():
    config = MonitoringConfig()
    predictor = DeteriorationPredictor(config)
    
    # Create a mock preprocessed sequence
    mock_input = np.zeros((config.SEQUENCE_LENGTH, config.INPUT_DIM), dtype=np.float32)
    
    risk_score = predictor.predict_risk(mock_input)
    assert 0.0 <= risk_score <= 1.0

def test_alarm_fatigue_mitigator():
    config = MonitoringConfig()
    mitigator = AlarmFatigueMitigator(config)
    patient_id = "patient_123"
    
    # Below threshold should not trigger
    assert not mitigator.should_trigger_alarm(patient_id, 0.5)
    
    # Above threshold but not persistent enough
    assert not mitigator.should_trigger_alarm(patient_id, 0.8)
    assert not mitigator.should_trigger_alarm(patient_id, 0.8)
    
    # Third consecutive breach should trigger
    assert mitigator.should_trigger_alarm(patient_id, 0.8)
    
    # Immediate subsequent breach should be suppressed due to cool-down
    assert not mitigator.should_trigger_alarm(patient_id, 0.8)

def test_explainable_ai_attribution():
    config = MonitoringConfig()
    predictor = DeteriorationPredictor(config)
    attribution_engine = IntegratedGradientsAttribution(predictor.model, config)
    
    mock_input = np.zeros((config.SEQUENCE_LENGTH, config.INPUT_DIM), dtype=np.float32)
    attributions = attribution_engine.compute_attributions(mock_input, steps=5)
    
    assert attributions.shape == (config.SEQUENCE_LENGTH, config.INPUT_DIM)
    
    explanations = attribution_engine.get_clinical_explanations(mock_input, attributions)
    assert len(explanations) == config.SEQUENCE_LENGTH
    assert "HR" in explanations[0]
    assert "attribution" in explanations[0]["HR"]
