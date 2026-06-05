class FalsePositiveTracker:
    def __init__(self):
        self.log = []

    def record_fp(self, model_id, input_data, clinical_reason):
        self.log.append({'model': model_id, 'data': input_data, 'reason': clinical_reason})

    def get_summary(self):
        return {reason: len([x for x in self.log if x['reason'] == reason]) for reason in set(x['reason'] for x in self.log)}