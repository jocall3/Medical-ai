import unittest
from unittest.mock import MagicMock, patch

class MockNLPProcessor:
    def extract_entities(self, text):
        entities = []
        if "penicillin" in text.lower():
            entities.append({"text": "penicillin", "label": "DRUG", "start": text.lower().find("penicillin"), "end": text.lower().find("penicillin") + 10})
        if "hypertension" in text.lower():
            entities.append({"text": "hypertension", "label": "DISEASE", "start": text.lower().find("hypertension"), "end": text.lower().find("hypertension") + 12})
        return entities

    def map_icd10(self, disease_text):
        mapping = {
            "hypertension": "I10",
            "diabetes": "E11.9",
            "asthma": "J45.909"
        }
        return mapping.get(disease_text.lower(), "U07.1")

    def summarize_clinical_note(self, note):
        return "Patient presents with symptoms. Recommended follow-up."

class TestNLPProcessor(unittest.TestCase):
    def setUp(self):
        self.processor = MockNLPProcessor()

    def test_entity_extraction(self):
        text = "The patient was prescribed penicillin for their acute infection and has a history of hypertension."
        entities = self.processor.extract_entities(text)
        labels = [ent["label"] for ent in entities]
        texts = [ent["text"] for ent in entities]
        self.assertIn("DRUG", labels)
        self.assertIn("DISEASE", labels)
        self.assertIn("penicillin", texts)
        self.assertIn("hypertension", texts)

    def test_icd10_mapping(self):
        self.assertEqual(self.processor.map_icd10("hypertension"), "I10")
        self.assertEqual(self.processor.map_icd10("diabetes"), "E11.9")
        self.assertEqual(self.processor.map_icd10("unknown disease"), "U07.1")

    def test_summarize_clinical_note(self):
        note = "Patient is a 45-year-old male complaining of chest pain. EKG shows normal sinus rhythm. Discharged with instructions."
        summary = self.processor.summarize_clinical_note(note)
        self.assertTrue(len(summary) < len(note))
        self.assertIn("Patient", summary)

if __name__ == "__main__":
    unittest.main()