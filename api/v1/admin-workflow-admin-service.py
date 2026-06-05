from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

app = FastAPI(
    title="Medical-AI Administrative Workflow Admin Service",
    description="Primary API service for managing extraction templates, auditing extraction results, and configuring OCR/NLP pipelines.",
    version="1.0.0"
)

class TemplateConfig(BaseModel):
    template_id: str = Field(..., description="Unique identifier for the template")
    hospital_name: str = Field(..., description="Name of the hospital or clinic")
    document_type: str = Field(..., description="Type of document (e.g., 'Discharge Summary', 'Referral Letter')")
    fields_to_extract: List[str] = Field(..., description="List of fields to extract from the document")

class AuditLog(BaseModel):
    job_id: str
    timestamp: str
    accuracy_score: float
    human_corrected: bool

@app.post("/api/v1/admin-workflow-admin/templates", status_code=status.HTTP_201_CREATED)
async def create_template(template: TemplateConfig):
    # In production, this would save the template configuration to a database
    return {
        "status": "success",
        "message": f"Template '{template.template_id}' successfully created and registered.",
        "template": template
    }

@app.get("/api/v1/admin-workflow-admin/audit-logs", response_model=List[AuditLog], status_code=status.HTTP_200_OK)
async def get_audit_logs():
    # Mock audit logs for clinical data extraction pipeline
    return [
        AuditLog(
            job_id="job_99281",
            timestamp="2026-06-05T01:30:00Z",
            accuracy_score=0.965,
            human_corrected=False
        ),
        AuditLog(
            job_id="job_99282",
            timestamp="2026-06-05T01:45:00Z",
            accuracy_score=0.842,
            human_corrected=True
        )
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8009)
