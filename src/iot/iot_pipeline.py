from .device_connector import DeviceConnector
from .hl7_message_parser import HL7Parser
from .device_anomaly_detector import AnomalyDetector

class IoTPipeline:
    def __init__(self):
        self.parser = HL7Parser()
        self.detector = AnomalyDetector()

    def run_step(self, raw_data):
        parsed = self.parser.parse(raw_data)
        # Process and detect anomalies
        return parsed