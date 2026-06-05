import { Leukocyte } from "../entities/Leukocyte";
import { Antibody } from "../entities/Antibody";
import { Cytokine } from "../entities/Cytokine";
import { InflammationStateTracker, CytokineStormRiskAssessment } from "../logic/InflammationStateTracker";

export interface HLATyping {
  hlaA: string[];
  hlaB: string[];
  hlaC: string[];
  hlaDRB1: string[];
  hlaDQB1: string[];
}

export class ImmuneSystemProfile {
  constructor(
    public readonly patientId: string,
    public readonly hlaTyping: HLATyping,
    public leukocytes: Leukocyte[],
    public antibodies: Antibody[],
    public cytokines: Cytokine[],
    public cReactiveProteinMgL: number,
    public erythrocyteSedimentationRateMmHr: number,
    public ageYears: number
  ) {}

  public evaluateImmuneCompetence(): number {
    const totalCD4 = this.leukocytes.filter(l => l.type === "T_CD4").length;
    const totalCD8 = this.leukocytes.filter(l => l.type === "T_CD8").length;
    const totalB = this.leukocytes.filter(l => l.type === "B_CELL").length;

    const cd4Cd8Ratio = totalCD8 > 0 ? totalCD4 / totalCD8 : 1.0;
    const ratioScore = cd4Cd8Ratio >= 1.0 && cd4Cd8Ratio <= 2.5 ? 20 : Math.max(0, 20 - Math.abs(1.5 - cd4Cd8Ratio) * 10);

    const exhaustedCount = this.leukocytes.filter(l => l.state === "EXHAUSTED").length;
    const exhaustionRatio = this.leukocytes.length > 0 ? exhaustedCount / this.leukocytes.length : 0;
    const exhaustionPenalty = exhaustionRatio * 40;

    const totalIgG = this.antibodies.filter(a => a.isotype === "IgG").reduce((sum, a) => sum + a.concentrationMgMl, 0);
    const antibodyScore = totalIgG >= 7.0 && totalIgG <= 16.0 ? 30 : (totalIgG < 7.0 ? (totalIgG / 7.0) * 30 : 20);

    const agePenalty = this.ageYears > 70 ? (this.ageYears - 70) * 0.5 : 0;

    const rawScore = 50 + ratioScore + antibodyScore - exhaustionPenalty - agePenalty;
    return Math.max(5, Math.min(100, rawScore));
  }

  public getInflammationAssessment(): CytokineStormRiskAssessment {
    return InflammationStateTracker.calculateInflammationState({
      cReactiveProteinMgL: this.cReactiveProteinMgL,
      erythrocyteSedimentationRateMmHr: this.erythrocyteSedimentationRateMmHr,
      cytokines: this.cytokines
    });
  }

  public simulatePathogenChallenge(
    pathogenEpitope: string,
    pathogenLoad: number
  ): {
    cleared: boolean;
    daysToClear: number;
    peakSymptomSeverity: "NONE" | "MILD" | "MODERATE" | "SEVERE";
  } {
    const competence = this.evaluateImmuneCompetence();
    
    const matchingAbs = this.antibodies.filter(ab => ab.antigenAffinityKd < 1e-6);
    const bestAffinity = matchingAbs.length > 0 
      ? Math.min(...matchingAbs.map(ab => ab.antigenAffinityKd)) 
      : 1e-3;

    const clearancePower = (competence / 100) * (1e-6 / bestAffinity);
    
    if (clearancePower > 5.0) {
      return { cleared: true, daysToClear: Math.max(1, 7 - clearancePower), peakSymptomSeverity: "NONE" };
    } else if (clearancePower > 1.0) {
      return { cleared: true, daysToClear: Math.max(3, 14 - clearancePower * 2), peakSymptomSeverity: "MILD" };
    } else if (clearancePower > 0.2) {
      return { cleared: true, daysToClear: Math.min(30, 21 + (1.0 / clearancePower)), peakSymptomSeverity: "MODERATE" };
    } else {
      return { cleared: false, daysToClear: 999, peakSymptomSeverity: "SEVERE" };
    }
  }
}