class RegulatoryMapper:
    def __init__(self):
        self.mapping = {'test_case_001': '21 CFR 820.30(g) Design Validation'}

    def get_requirement(self, test_id):
        return self.mapping.get(test_id, 'Unknown')