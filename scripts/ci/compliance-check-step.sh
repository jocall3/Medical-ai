#!/bin/bash
echo "Running HIPAA and FDA compliance audit..."
# Check for PHI patterns in code
grep -rE "(SSN|MRN|PatientID)" src/ && exit 1
# Verify audit logging presence
if ! grep -q "logger.info" src/core/auth.py; then echo "Missing audit logs"; exit 1; fi
echo "Compliance check passed."