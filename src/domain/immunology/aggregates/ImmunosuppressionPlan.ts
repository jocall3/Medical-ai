export interface ImmunosuppressiveDrug {
  name: string;
  doseMg: number;
  frequencyHours: number;
  targetTroughLevelNgMl?: number;
  mechanismOfAction: string;
}

export interface ImmunosuppressionStatus {
  tCellSuppressionPercentage: number;
  bCellSuppressionPercentage: number;
  opportunisticInfectionRiskScore: number;
  organRejectionRiskScore: number;
  therapeuticIndexStatus: "SUB_THERAPEUTIC" | "THERAPEUTIC" | "TOXIC";
}

export class ImmunosuppressionPlan {
  constructor(
    public readonly planId: string,
    public readonly patientId: string,
    public readonly indication: "ORGAN_TRANSPLANT" | "AUTOIMMUNE_FLARE" | "GRAFT_VERSUS_HOST",
    public drugs: ImmunosuppressiveDrug[],
    public currentTroughLevels: Map<string, number>,
    public graftMismatchesCount: number = 0
  ) {}

  public evaluatePlanStatus(): ImmunosuppressionStatus {
    let tCellSuppression = 0;
    let bCellSuppression = 0;
    let toxicityScore = 0;

    for (const drug of this.drugs) {
      const measuredLevel = this.currentTroughLevels.get(drug.name) || 0;
      const targetLevel = drug.targetTroughLevelNgMl || 1.0;

      const drugSuppressionFactor = targetLevel > 0 ? Math.min(1.5, measuredLevel / targetLevel) : 1.0;

      if (drug.name === "Tacrolimus" || drug.name === "Cyclosporine") {
        tCellSuppression += 45 * drugSuppressionFactor;
        toxicityScore += measuredLevel > (targetLevel * 1.3) ? 30 : 0;
      } else if (drug.name === "Mycophenolate Mofetil" || drug.name === "Azathioprine") {
        tCellSuppression += 25 * drugSuppressionFactor;
        bCellSuppression += 35 * drugSuppressionFactor;
        toxicityScore += measuredLevel > (targetLevel * 1.2) ? 20 : 0;
      } else if (drug.name === "Prednisone" || drug.name === "Methylprednisolone") {
        tCellSuppression += 20 * drugSuppressionFactor;
        bCellSuppression += 15 * drugSuppressionFactor;
      } else if (drug.name === "Rituximab") {
        bCellSuppression += 95 * drugSuppressionFactor;
      }
    }

    tCellSuppression = Math.min(99, tCellSuppression);
    bCellSuppression = Math.min(99, bCellSuppression);

    const baselineRejectionRisk = this.indication === "ORGAN_TRANSPLANT" 
      ? 30 + (this.graftMismatchesCount * 10) 
      : 50;

    const organRejectionRiskScore = Math.max(
      2,
      baselineRejectionRisk * (1.0 - (tCellSuppression / 100) * 0.85)
    );

    const opportunisticInfectionRiskScore = Math.min(
      98,
      (tCellSuppression * 0.6 + bCellSuppression * 0.4) * 1.1
    );

    let therapeuticIndexStatus: "SUB_THERAPEUTIC" | "THERAPEUTIC" | "TOXIC" = "THERAPEUTIC";
    if (toxicityScore > 40) {
      therapeuticIndexStatus = "TOXIC";
    } else if (tCellSuppression < 30 && this.indication === "ORGAN_TRANSPLANT") {
      therapeuticIndexStatus = "SUB_THERAPEUTIC";
    }

    return {
      tCellSuppressionPercentage: parseFloat(tCellSuppression.toFixed(1)),
      bCellSuppressionPercentage: parseFloat(bCellSuppression.toFixed(1)),
      opportunisticInfectionRiskScore: parseFloat(opportunisticInfectionRiskScore.toFixed(1)),
      organRejectionRiskScore: parseFloat(organRejectionRiskScore.toFixed(1)),
      therapeuticIndexStatus
    };
  }

  public adjustDrugDose(drugName: string, newDoseMg: number): void {
    const drug = this.drugs.find(d => d.name === drugName);
    if (drug) {
      drug.doseMg = newDoseMg;
    }
  }
}