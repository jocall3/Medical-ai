class ResponseTransformer:
    @staticmethod
    def transform(data: dict, target_format: str = "fhir") -> dict:
        if target_format == "fhir":
            return {"resourceType": "Bundle", "entry": [{"resource": data}]}
        return data