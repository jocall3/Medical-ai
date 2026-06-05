import { Cytokine } from "../entities/Cytokine";

export interface InflammationMetrics {
  cReactiveProteinMgL: number;
  erythrocyteSedimentationRateMmHr: number;
  cytokines: Cytokine[];
}

export interface CytokineStormRiskAssessment {
  riskScore: number;
  riskCategory: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  hyperinflammationIndex: number;
  recommendedIntervention: string;
}

export class InflammationStateTracker {
  public static calculateInflammationState(metrics: InflammationMetrics): CytokineStormRiskAssessment {
    const il6 = metrics.cytokines.find(c => c.name === "IL-6")?.concentrationPgMl || 0;
    const tnfa = metrics.cytokines.find(c => c.name === "TNF-alpha")?.concentrationPgMl || 0;
    const il1b = metrics.cytokines.find(c => c.name === "IL-1beta")?.concentrationPgMl || 0;
    const il10 = metrics.cytokines.find(c => c.name === "IL-10")?.concentrationPgMl || 0;

    const proInflammatorySum = il6 * 1.2 + tnfa * 1.5 + il1b * 2.0;
    const antiInflammatoryBuffer = 1.0 + (il10 * 0.8);
    const cytokineIndex = proInflammatorySum / antiInflammatoryBuffer;

    const crpFactor = metrics.cReactiveProteinMgL / 10.0;
    const esrFactor = metrics.erythrocyteSedimentationRateMmHr / 15.0;

    const hyperinflammationIndex = (cytokineIndex * 0.5) + (crpFactor * 15.0) + (esrFactor * 10.0);

    let riskScore = Math.min(100, (hyperinflammationIndex / 150) * 100);
    if (il6 > 1000 || tnfa > 500) {
      riskScore = Math.max(riskScore, 85);
    }

    let riskCategory: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
    let recommendedIntervention = "Routine monitoring of vital signs and inflammatory markers.";

    if (riskScore >= 85) {
      riskCategory = "CRITICAL";
      recommendedIntervention = "Immediate ICU admission. Initiate anti-IL-6 therapy (Tocilizumab) or JAK inhibitors, plus high-dose corticosteroids.";
    } else if (riskScore >= 60) {
      riskCategory = "HIGH";
      recommendedIntervention = "Close inpatient monitoring. Consider early corticosteroid intervention (Dexamethasone) and IL-1 receptor antagonists (Anakinra).";
    } else if (riskScore >= 30) {
      riskCategory = "MODERATE";
      recommendedIntervention = "Supportive care, hydration, and serial cytokine/CRP measurements every 12 hours.";
    }

    return {
      riskScore: parseFloat(riskScore.toFixed(1)),
      riskCategory,
      hyperinflammationIndex: parseFloat(hyperinflammationIndex.toFixed(2)),
      recommendedIntervention
    };
  }
}