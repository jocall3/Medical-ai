import great_expectations as gx

def validate_fhir_bundle(bundle_data):
    context = gx.get_context()
    validator = context.get_validator(batch_request=bundle_data)
    validator.expect_column_values_to_not_be_null('patient_id')
    validator.expect_column_values_to_be_in_set('resource_type', ['Patient', 'Observation', 'Condition'])
    return validator.validate()