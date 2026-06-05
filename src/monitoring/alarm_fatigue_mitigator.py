import time
from typing import Dict, List
from src.monitoring.monitoring_config import MonitoringConfig

class AlarmFatigueMitigator:
    def __init__(self, config: MonitoringConfig):
        self.config = config
        # Track consecutive threshold breaches per patient
        # patient_id -> consecutive_breach_count
        self.breach_tracker: Dict[str, int] = {}
        # Track last triggered alarm timestamp to prevent rapid re-triggering
        # patient_id -> last_alarm_timestamp
        self.last_alarm_time: Dict[str, float] = {}

    def should_trigger_alarm(self, patient_id: str, risk_score: float, contextual_suppression: bool = False) -> bool:
        """
        Applies persistence filtering and contextual suppression to mitigate alarm fatigue.
        - Persistence: Risk score must exceed threshold for N consecutive steps.
        - Contextual Suppression: Suppress if clinical context indicates a false positive (e.g., patient is known to be active/exercising, or recently administered medication).
        - Cool-down: Prevent duplicate alarms within a suppression window.
        """
        current_time = time.time()
        threshold = self.config.RISK_THRESHOLD

        # 1. Contextual Suppression
        if contextual_suppression:
            # Suppressed due to clinical context (e.g., active physical therapy, transient artifact)
            self.breach_tracker[patient_id] = 0
            return False

        # 2. Persistence Filtering
        if risk_score >= threshold:
            self.breach_tracker[patient_id] = self.breach_tracker.get(patient_id, 0) + 1
        else: 
            self.breach_tracker[patient_id] = 0
            return False

        # Check if persistence threshold is met
        if self.breach_tracker[patient_id] >= self.config.PERSISTENCE_THRESHOLD_STEPS:
            # 3. Cool-down Suppression
            last_alarm = self.last_alarm_time.get(patient_id, 0.0)
            suppression_window_seconds = self.config.SUPPRESSION_WINDOW_MINUTES * 60
            
            if (current_time - last_alarm) > suppression_window_seconds:
                # Update last alarm time and reset breach tracker to prevent immediate re-triggering
                self.last_alarm_time[patient_id] = current_time
                return True
                
        return False
