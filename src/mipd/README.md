# MIPD Module

This module provides the infrastructure for Model-Informed Precision Dosing. 

## Components
- **API Router**: Exposes endpoints for simulation.
- **Covariate Resolver**: Maps FHIR resources to PK/PD model inputs.
- **Safety Validator**: Ensures all doses remain within clinical safety bounds.