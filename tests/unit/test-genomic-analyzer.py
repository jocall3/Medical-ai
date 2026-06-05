import unittest
from unittest.mock import MagicMock, patch

class MockGenomicRustEngine:
    def align_sequences(self, seq1, seq2):
        matches = sum(1 for a, b in zip(seq1, seq2) if a == b)
        score = matches - abs(len(seq1) - len(seq2))
        return {"score": score, "alignment": f"{seq1} || {seq2}"}

    def find_mutation_signature(self, sequence, signature):
        return sequence.count(signature)

    def detect_brca_variants(self, sequence):
        variants = []
        if "BRCA1_MUT" in sequence:
            variants.append({"gene": "BRCA1", "variant": "c.5266dupC", "pathogenicity": "Pathogenic"})
        return variants

class TestGenomicAnalyzer(unittest.TestCase):
    def setUp(self):
        self.engine = MockGenomicRustEngine()

    def test_sequence_alignment(self):
        seq1 = "ATCGATCG"
        seq2 = "ATCGATCG"
        result = self.engine.align_sequences(seq1, seq2)
        self.assertEqual(result["score"], 8)
        seq3 = "ATCGTTTT"
        result2 = self.engine.align_sequences(seq1, seq3)
        self.assertEqual(result2["score"], 5)

    def test_mutation_signature_detection(self):
        sequence = "ATCGATCGATCG"
        signature = "ATC"
        count = self.engine.find_mutation_signature(sequence, signature)
        self.assertEqual(count, 3)

    def test_brca_variant_detection(self):
        sequence_with_mut = "ATCG_BRCA1_MUT_GCTA"
        sequence_normal = "ATCG_NORMAL_GCTA"
        mut_results = self.engine.detect_brca_variants(sequence_with_mut)
        normal_results = self.engine.detect_brca_variants(sequence_normal)
        self.assertEqual(len(mut_results), 1)
        self.assertEqual(mut_results[0]["gene"], "BRCA1")
        self.assertEqual(mut_results[0]["pathogenicity"], "Pathogenic")
        self.assertEqual(len(normal_results), 0)

if __name__ == "__main__":
    unittest.main()