export interface MucosalBarrierMetrics {
  zonulinLevelNgMl: number;       // Biomarker of tight junction permeability (Normal < 45 ng/mL)
  occludinExpressionRatio: number; // Relative expression (Normal = 1.0, lower = degraded)
  claudin1ExpressionRatio: number; // Relative expression (Normal = 1.0, lower = degraded)
  luminalLpsConcentrationEuMl: number; // Lipopolysaccharide load in the gut lumen
}

export class MucosalBarrierModel {
  /**
   * Calculates the tight junction permeability index (0.0 to 1.0).
   * 0.0 represents an impermeable, fully intact barrier; 1.0 represents complete barrier breakdown.
   */
  public static calculateTightJunctionPermeability(metrics: MucosalBarrierMetrics): number {
    const zonulinFactor = Math.min(0.5, (metrics.zonulinLevelNgMl / 150));
    const structuralDeficit = 1.0 - ((metrics.occludinExpressionRatio + metrics.claudin1ExpressionRatio) / 2);
    const boundedStructuralDeficit = Math.max(0, Math.min(0.5, structuralDeficit));

    return Math.min(1.0, zonulinFactor + boundedStructuralDeficit);
  }

  /**
   * Predicts the rate of Lipopolysaccharide (LPS) translocation into the portal circulation.
   * LPS translocation is the primary driver of metabolic endotoxemia and systemic inflammation.
   */
  public static predictLpsTranslocationRate(
    metrics: MucosalBarrierMetrics,
    permeability: number
  ): number {
    const baseTranslocationCoefficient = 0.05;
    return metrics.luminalLpsConcentrationEuMl * permeability * baseTranslocationCoefficient;
  }

  /**
   * Evaluates the risk of 'Leaky Gut' syndrome and systemic endotoxemia.
   */
  public static evaluateLeakyGutRisk(metrics: MucosalBarrierMetrics): {
    riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
    permeabilityIndex: number;
    predictedLpsTranslocation: number;
    clinicalActionRequired: boolean;
  } {
    const permeability = this.calculateTightJunctionPermeability(metrics);
    const lpsTranslocation = this.predictLpsTranslocationRate(metrics, permeability);

    let riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
    if (permeability > 0.75 || lpsTranslocation > 50) {
      riskLevel = 'Critical';
    } else if (permeability > 0.5 || lpsTranslocation > 20) {
      riskLevel = 'High';
    } else if (permeability > 0.25 || lpsTranslocation > 5) {
      riskLevel = 'Moderate';
    }

    return {
      riskLevel,
      permeabilityIndex: permeability,
      predictedLpsTranslocation: lpsTranslocation,
      clinicalActionRequired: riskLevel === 'High' || riskLevel === 'Critical'
    };
  }
}