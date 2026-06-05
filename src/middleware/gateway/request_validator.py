from fastapi import Request, HTTPException
import jsonschema

class RequestValidator:
    def __init__(self, schema: dict):
        self.schema = schema

    def validate(self, data: dict):
        try:
            jsonschema.validate(instance=data, schema=self.schema)
        except jsonschema.ValidationError as e:
            raise HTTPException(status_code=400, detail=str(e))