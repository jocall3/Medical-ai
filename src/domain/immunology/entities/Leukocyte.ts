export type LeukocyteLineage = "MYELOID" | "LYMPHOID";
export type LeukocyteType = "T_CD4" | "T_CD8" | "B_CELL" | "MACROPHAGE" | "NEUTROPHIL" | "DENDRITIC_CELL";
export type ActivationState = "NAIVE" | "ACTIVATED" | "EFFECTOR" | "MEMORY" | "EXHAUSTED" | "ANERGIC";

export interface ReceptorExpression {
  marker: string;
  density: number;
}

export class Leukocyte {
  constructor(
    public readonly id: string,
    public readonly lineage: LeukocyteLineage,
    public readonly type: LeukocyteType,
    public state: ActivationState,
    public receptors: Map<string, number>,
    public cytokineSecretionProfile: Map<string, number>,
    public clonalGeneration: number = 0,
    public antigenSpecificity?: string
  ) {}

  public activate(antigenAffinity: number, coStimulationLevel: number): void {
    if (this.state === "EXHAUSTED" || this.state === "ANERGIC") {
      return;
    }

    const pd1Density = this.receptors.get("PD-1") || 0;
    const ctla4Density = this.receptors.get("CTLA-4") || 0;
    const inhibitorySignal = pd1Density * 0.6 + ctla4Density * 0.8;

    const activationThreshold = 10.0 + inhibitorySignal;
    const activationSignal = antigenAffinity * 100 * (1 + coStimulationLevel);

    if (activationSignal > activationThreshold) {
      this.state = "ACTIVATED";
      this.clonalGeneration += 1;
      this.upregulateActivationMarkers();
    } else if (antigenAffinity > 0.1 && coStimulationLevel < 0.1) {
      this.state = "ANERGIC";
    }
  }

  public differentiate(targetState: ActivationState): void {
    this.state = targetState;
    if (targetState === "EFFECTOR") {
      if (this.type === "T_CD4") {
        this.cytokineSecretionProfile.set("IL-2", 50);
        this.cytokineSecretionProfile.set("IFN-gamma", 120);
        this.cytokineSecretionProfile.set("IL-4", 10);
      } else if (this.type === "T_CD8") {
        this.cytokineSecretionProfile.set("IFN-gamma", 200);
        this.cytokineSecretionProfile.set("TNF-alpha", 150);
      } else if (this.type === "MACROPHAGE") {
        this.cytokineSecretionProfile.set("IL-6", 180);
        this.cytokineSecretionProfile.set("TNF-alpha", 250);
        this.cytokineSecretionProfile.set("IL-1beta", 140);
      }
    } else if (targetState === "EXHAUSTED") {
      this.receptors.set("PD-1", 500);
      this.receptors.set("CTLA-4", 300);
      this.cytokineSecretionProfile.clear();
    }
  }

  private upregulateActivationMarkers(): void {
    this.receptors.set("CD25", (this.receptors.get("CD25") || 0) + 150);
    this.receptors.set("HLA-DR", (this.receptors.get("HLA-DR") || 0) + 100);
    if (this.type === "T_CD4" || this.type === "T_CD8") {
      this.receptors.set("PD-1", (this.receptors.get("PD-1") || 0) + 15);
    }
  }
}