import json
def provision_data():
    print("Provisioning high-fidelity synthetic patient data...")
    # Mocking generation of Synthea-compliant records
    data = {"patient_id": "synth-123", "condition": "diabetes", "vitals": "normal"}
    with open('tests/data/synthetic_patient.json', 'w') as f:
        json.dump(data, f)
if __name__ == '__main__':
    provision_data()