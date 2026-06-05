class ErrorClassificationEngine:
    def classify(self, error_log):
        if 'clinical_impact' in error_log and error_log['clinical_impact'] > 0.8:
            return 'Clinical Risk'
        return 'UI Bug'