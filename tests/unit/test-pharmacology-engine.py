import unittest

class MockPharmacologyEngine:
    def __init__(self):
        self.ddi_database = {
            ("warfarin", "aspirin"): "Major: Increased risk of bleeding",
            ("sildenafil", "nitroglycerin"): "Contraindicated: Severe hypotension",
            ("simvastatin", "amiodarone"): "Moderate: Increased risk of myopathy"
        }
        self.genomic_rules = {
            ("clopidogrel", "CYP2C19", "Poor Metabolizer"): "Alternative therapy recommended (e.g., prasugrel)",
            ("warfarin", "CYP2C9", "Poor Metabolizer"): "Reduce starting dose by 50%",
        }

    def check_interactions(self, drug_list):
        interactions = []
        for i in range(len(drug_list)):
            for j in range(i + 1, len(drug_list)):
                pair = (drug_list[i].lower(), drug_list[j].lower())
                reverse_pair = (drug_list[j].lower(), drug_list[i].lower())
                if pair in self.ddi_database:
                    interactions.append({"drugs": pair, "severity": self.ddi_database[pair]})
                elif reverse_pair in self.ddi_database:
                    interactions.append({"drugs": reverse_pair, "severity": self.ddi_database[reverse_pair]})
        return interactions

    def optimize_dosage(self, drug, gene, phenotype, standard_dose):
        rule_key = (drug.lower(), gene, phenotype)
        if rule_key in self.genomic_rules:
            action = self.genomic_rules[rule_key]
            return {"status": "ADJUSTED", "recommendation": action}
        return {"status": "STANDARD", "recommendation": f"Maintain standard dose of {standard_dose}"}

class TestPharmacologyEngine(unittest.TestCase):
    def setUp(self):
        self.engine = MockPharmacologyEngine()

    def test_drug_drug_interaction_detection(self):
        drugs = ["Warfarin", "Aspirin", "Lisinopril"]
        interactions = self.engine.check_interactions(drugs)
        self.assertEqual(len(interactions), 1)
        self.assertEqual(interactions[0]["drugs"], ("warfarin", "aspirin"))
        self.assertIn("Increased risk of bleeding", interactions[0]["severity"])

    def test_contraindicated_interaction(self):
        drugs = ["Sildenafil", "Nitroglycerin"]
        interactions = self.engine.check_interactions(drugs)
        self.assertEqual(len(interactions), 1)
        self.assertIn("Contraindicated", interactions[0]["severity"])

    def test_genomic_dosage_optimization(self):
        result = self.engine.optimize_dosage("Warfarin", "CYP2C9", "Poor Metabolizer", "5mg")
        self.assertEqual(result["status"], "ADJUSTED")
        self.assertIn("Reduce starting dose", result["recommendation"])
        result_std = self.engine.optimize_dosage("Warfarin", "CYP2C9", "Normal Metabolizer", "5mg")
        self.assertEqual(result_std["status"], "STANDARD")

if __name__ == "__main__":
    unittest.main()