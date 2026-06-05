import { Antibody } from "../entities/Antibody";

export interface AllergenExposure {
  allergenName: string;
  concentrationPpm: number;
  exposureRoute: "INHALATION" | "INGESTION" | "INTRAVENOUS" | "CUTANEOUS";
}

export interface AnaphylaxisRiskAssessment {
  anaphylaxisRiskScore: number;
  histamineReleaseLevelMcgL: number;
  bronchoconstrictionIndex: number;
  vasodilationDropSbpMmhg: number;
  clinicalSeverity: "NONE" | "MILD_LOCAL" | "MODERATE_SYSTEMIC" | "SEVERE_ANAPHYLAXIS";
}

export class AllergicReactionModel {
  private static readonly FceRI_RECEPTOR_DENSITY = 150000;

  public static simulateAllergicResponse(
    exposure: AllergenExposure,
    circulatingIgE: Antibody,
    mastCellSensitivityFactor: number
  ): AnaphylaxisRiskAssessment {
    if (circulatingIgE.isotype !== "IgE") {
      throw new Error("Allergic reaction model requires IgE isotype antibody.");
    }

    const igeMolarity = (circulatingIgE.concentrationMgMl * 1e-3) / 190000;
    const receptorKd = 1e-10;
    const receptorOccupancyFraction = igeMolarity / (igeMolarity + receptorKd);
    const boundIgEPerCell = this.FceRI_RECEPTOR_DENSITY * receptorOccupancyFraction;

    const allergenMolarity = exposure.concentrationPpm * 1e-6;
    const crossLinkingProbability = (allergenMolarity / (allergenMolarity + circulatingIgE.antigenAffinityKd)) * receptorOccupancyFraction;

    const activationThreshold = 0.15;
    let histamineReleaseLevelMcgL = 0;

    if (crossLinkingProbability > activationThreshold) {
      const degranulationIntensity = (crossLinkingProbability - activationThreshold) / (1.0 - activationThreshold);
      histamineReleaseLevelMcgL = degranulationIntensity * 150 * mastCellSensitivityFactor;
    }

    let systemicDistributionFactor = 0.1;
    switch (exposure.exposureRoute) { 
      case "INTRAVENOUS": systemicDistributionFactor = 1.0; break;
      case "INGESTION": systemicDistributionFactor = 0.4; break;
      case "INHALATION": systemicDistributionFactor = 0.6; break;
      case "CUTANEOUS": systemicDistributionFactor = 0.15; break;
    }

    const systemicHistamine = histamineReleaseLevelMcgL * systemicDistributionFactor;
    const bronchoconstrictionIndex = Math.min(0.95, (systemicHistamine / 100) * (exposure.exposureRoute === "INHALATION" ? 1.5 : 1.0));
    const vasodilationDropSbpMmhg = Math.min(60, systemicHistamine * 0.4);

    const anaphylaxisRiskScore = Math.min(
      100,
      (systemicHistamine / 120) * 100 * (exposure.exposureRoute === "INTRAVENOUS" ? 1.3 : 1.0)
    );

    let clinicalSeverity: "NONE" | "MILD_LOCAL" | "MODERATE_SYSTEMIC" | "SEVERE_ANAPHYLAXIS" = "NONE";
    if (anaphylaxisRiskScore > 75 || vasodilationDropSbpMmhg > 40) {
      clinicalSeverity = "SEVERE_ANAPHYLAXIS";
    } else if (anaphylaxisRiskScore > 40) {
      clinicalSeverity = "MODERATE_SYSTEMIC";
    } else if (anaphylaxisRiskScore > 10) {
      clinicalSeverity = "MILD_LOCAL";
    }

    return {
      anaphylaxisRiskScore: parseFloat(anaphylaxisRiskScore.toFixed(1)),
      histamineReleaseLevelMcgL: parseFloat(histamineReleaseLevelMcgL.toFixed(2)),
      bronchoconstrictionIndex: parseFloat(bronchoconstrictionIndex.toFixed(2)),
      vasodilationDropSbpMmhg: parseFloat(vasodilationDropSbpMmhg.toFixed(1)),
      clinicalSeverity
    };
  }
}