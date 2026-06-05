import unittest
from src.mips.dosing_safety_guardrails import SafetyGuardrails

class TestDosing(unittest.TestCase):
    def test_safety_guardrail(self):
        guard = SafetyGuardrails()
        self.assertTrue(guard.validate_dose(100, 70, 500)[0])
        self.assertFalse(guard.validate_dose(1000, 70, 500)[0])