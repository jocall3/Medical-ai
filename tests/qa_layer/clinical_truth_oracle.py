class ClinicalTruthOracle:
    def __init__(self, expert_panel):
        self.experts = expert_panel

    def validate_output(self, ai_prediction, patient_context):
        consensus = [expert.evaluate(ai_prediction, patient_context) for expert in self.experts]
        return sum(consensus) / len(consensus)