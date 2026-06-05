from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

app = FastAPI(
    title="Medical-AI Genomic Sequencing Service",
    description="Primary API service for genomic variant detection, pathogenicity annotation, and clinical interpretation.",
    version="1.0.0"
)

class Variant(BaseModel):
    chromosome: str = Field(..., description="Chromosome (e.g., '1', 'X')")
    position: int = Field(..., description="Genomic coordinate position (1-based)", ge=1)
    reference: str = Field(..., description="Reference allele")
    alternate: str = Field(..., description="Alternate allele")

class GenomicRequest(BaseModel):
    variants: List[Variant] = Field(..., description="List of genomic variants to analyze")

class AnnotatedVariant(BaseModel):
    variant: str
    pathogenicity: str
    associated_phenotypes: List[str]
    pharmacogenomic_implications: str

class GenomicResponse(BaseModel):
    annotated_variants: List[AnnotatedVariant]
    total_pathogenic_variants: int

# Mock database of known pathogenic variants
KNOWN_VARIANTS: Dict[str, Dict[str, Any]] = {
    "17:41197764:A:G": {
        "pathogenicity": "Pathogenic",
        "associated_phenotypes": ["Hereditary Breast and Ovarian Cancer Syndrome (BRCA1)"],
        "pharmacogenomic_implications": "Increased sensitivity to PARP inhibitors (e.g., Olaparib)."
    },
    "7:55249071:C:T": {
        "pathogenicity": "Pathogenic",
        "associated_phenotypes": ["EGFR-mutated Non-Small Cell Lung Cancer"],
        "pharmacogenomic_implications": "Indicates responsiveness to EGFR tyrosine kinase inhibitors (e.g., Osimertinib)."
    },
    "3:10183712:G:A": {
        "pathogenicity": "Likely Pathogenic",
        "associated_phenotypes": ["Brugada Syndrome 1"],
        "pharmacogenomic_implications": "Avoid sodium channel blockers; high risk of drug-induced arrhythmia."
    }
}

@app.post("/api/v1/genomic/analyze-variants", response_model=GenomicResponse, status_code=status.HTTP_200_OK)
async def analyze_variants(request: GenomicRequest):
    annotated_list = []
    pathogenic_count = 0

    for var in request.variants:
        key = f"{var.chromosome}:{var.position}:{var.reference}:{var.alternate}"
        variant_str = f"chr{var.chromosome}:{var.position}{var.reference}>{var.alternate}"
        
        if key in KNOWN_VARIANTS:
            info = KNOWN_VARIANTS[key]
            pathogenicity = info["pathogenicity"]
            phenotypes = info["associated_phenotypes"]
            pgx = info["pharmacogenomic_implications"]
            if pathogenicity in ["Pathogenic", "Likely Pathogenic"]:
                pathogenic_count += 1
        else:
            pathogenicity = "Variant of Uncertain Significance (VUS)"
            phenotypes = ["No well-documented clinical phenotype"]
            pgx = "No specific pharmacogenomic guidelines available."

        annotated_list.append(
            AnnotatedVariant(
                variant=variant_str,
                pathogenicity=pathogenicity,
                associated_phenotypes=phenotypes,
                pharmacogenomic_implications=pgx
            )
        )

    return GenomicResponse(
        annotated_variants=annotated_list,
        total_pathogenic_variants=pathogenic_count
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
