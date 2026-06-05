import os

class MonitoringConfig:
    # Kafka Configuration
    KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    KAFKA_TOPIC_VITAL_SIGNS = os.getenv("KAFKA_TOPIC_VITAL_SIGNS", "bedside-vitals")
    KAFKA_GROUP_ID = os.getenv("KAFKA_GROUP_ID", "deterioration-predictor-group")

    # Vital Sign Definitions & Normalization Parameters (Mean, SD)
    # Order: Heart Rate (HR), Respiratory Rate (RR), Systolic Blood Pressure (SBP), 
    # Diastolic Blood Pressure (DBP), Oxygen Saturation (SpO2), Temperature (Temp)
    VITAL_SIGNS_KEYS = ["HR", "RR", "SBP", "DBP", "SpO2", "Temp"]
    
    NORMALIZATION_PARAMS = {
        "HR": {"mean": 80.0, "std": 15.0, "min": 30.0, "max": 220.0},
        "RR": {"mean": 16.0, "std": 4.0, "min": 4.0, "max": 60.0},
        "SBP": {"mean": 120.0, "std": 20.0, "min": 50.0, "max": 250.0},
        "DBP": {"mean": 75.0, "std": 12.0, "min": 30.0, "max": 150.0},
        "SpO2": {"mean": 97.0, "std": 3.0, "min": 50.0, "max": 100.0},
        "Temp": {"mean": 37.0, "std": 0.8, "min": 32.0, "max": 42.0}
    }

    # Model Architecture
    INPUT_DIM = len(VITAL_SIGNS_KEYS)
    HIDDEN_DIM = 64
    NUM_LAYERS = 2
    DROPOUT = 0.2
    SEQUENCE_LENGTH = 24  # 24 hours of hourly aggregated data or 24 steps of 15-min intervals
    PREDICTION_WINDOW_HOURS = 6

    # Alarm Fatigue Mitigation Parameters
    PERSISTENCE_THRESHOLD_STEPS = 3  # Must exceed threshold for 3 consecutive steps
    SUPPRESSION_WINDOW_MINUTES = 30
    RISK_THRESHOLD = 0.75  # High risk threshold for deterioration alert
