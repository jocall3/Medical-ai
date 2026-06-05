# AI Decision Explainability Logs: The Legal Audit Trail

## 1. The Black-Box Problem in Medicine
When an AI diagnoses a rare autoimmune disease or recommends a highly unorthodox, novel treatment protocol, it cannot simply output a binary decision. To be legally defensible in malpractice suits and to gain the trust of the medical establishment, the AI must explain *why*. 

## 2. Integrated Gradients and SHAP Values
We log the mathematical attribution of every input feature to the final prediction using **SHAP (SHapley Additive exPlanations)** and **Integrated Gradients (IG)**.

*   **SHAP:** Provides a unified measure of feature importance based on cooperative game theory.
*   **Integrated Gradients:** Attributes the prediction of a deep network to its inputs by integrating the gradient of the output with respect to the input along a straight path from a baseline.

## 3. Logging Schema
For every diagnostic inference, a high-dimensional tensor log is generated and compressed.

```json
{
  "inference_id": "diag_99384_alpha",
  "timestamp": "2026-06-05T02:51:00Z",
  "model_version": "OmniMed-v9.2",
  "prediction": "Systemic Lupus Erythematosus",
  "confidence_score": 0.987,
  "explainability": {
    "method": "Integrated_Gradients",
    "top_features": [
      {"feature": "ANA_Titer", "attribution_weight": 0.45},
      {"feature": "Genomic_Marker_HLA-DRB1", "attribution_weight": 0.32},
      {"feature": "Dermal_Image_Pixel_Cluster_7", "attribution_weight": 0.15}
    ],
    "baseline_reference": "s3://medical-baselines/healthy_adult_tensor.pt"
  }
}
```

## 4. Storage Optimization
Because storing gradient tensors for millions of decisions daily requires exabytes of data, we utilize **Principal Component Analysis (PCA)** to compress the attribution maps, storing only the top 95% of variance. This ensures a legally defensible audit trail that proves the AI's decision was empirical, unbiased, and superior to human diagnostic capabilities.