class SurveillanceEngine:
    def __init__(self, resistance_db):
        self.resistance_db = resistance_db

    def detect_outbreak(self, sequenced_dna):
        alerts = []
        for cassette in self.resistance_db:
            if cassette in sequenced_dna:
                alerts.append(f'Resistance detected: {cassette}')
        return alerts