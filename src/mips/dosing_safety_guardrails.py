class SafetyGuardrails:
    def validate_dose(self, dose, patient_weight, max_safe_dose):
        if dose > max_safe_dose:
            return False, "Supratherapeutic dose detected"
        return True, "Safe"