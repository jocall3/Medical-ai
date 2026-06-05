import random
class Patient:
    def __init__(self, age, comorbidities, baseline_vitals):
        self.age = age
        self.comorbidities = comorbidities
        self.vitals = baseline_vitals
class PopulationGenerator:
    @staticmethod
    def generate(size=100):
        return [Patient(random.randint(18, 90), [], {'hr': 70, 'bp': 120}) for _ in range(size)]