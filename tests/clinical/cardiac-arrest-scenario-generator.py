class CardiacArrestScenario:
    def execute(self, patient):
        return {'condition': 'cardiac_arrest', 'rhythm': 'VFib', 'cpr_required': True}