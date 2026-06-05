import { Leukocyte } from "../entities/Leukocyte";
import { Cytokine } from "../entities/Cytokine";
import { Antibody } from "../entities/Antibody";

export interface AutoimmuneSimulationResult {
  tissueDamageIndex: number;
  autoantibodyTiter: number;
  regulatoryTCellSuppressionRatio: number;
  epitopeSpreadingFactor: number;
  clinicalPhenotype: string;
}

export class AutoimmuneCascadeEngine {
  constructor(
    public selfReactiveTCells: Leukocyte[],
    public regulatoryTCells: Leukocyte[],
    public autoAntibodies: Antibody[],
    public localCytokines: Cytokine[]
  ) {}

  public simulateCascade(
    days: number,
    geneticSusceptibilityHLA: number,
    environmentalTrigger: boolean
  ): AutoimmuneSimulationResult {
    let tissueDamage = 1.0;
    let epitopeSpreading = 1.0;

    for (let day = 1; day <= days; day++) {
      const totalTregs = this.regulatoryTCells.filter(t => t.state === "ACTIVATED" || t.state === "EFFECTOR").length;
      const totalSelfReactive = this.selfReactiveTCells.filter(t => t.state === "ACTIVATED" || t.state === "EFFECTOR").length;
      
      const suppressionRatio = totalSelfReactive > 0 
        ? Math.min(1.0, (totalTregs * 1.5) / totalSelfReactive) 
        : 1.0;

      const triggerMultiplier = environmentalTrigger && day < 10 ? 2.5 : 1.0;

      for (const cell of this.selfReactiveTCells) {
        const activationChance = (geneticSusceptibilityHLA * 0.4) + (triggerMultiplier * 0.3) - (suppressionRatio * 0.5);
        if (Math.random() < activationChance) {
          cell.differentiate("EFFECTOR");
        }
      }

      const il6 = this.localCytokines.find(c => c.name === "IL-6");
      const tnfa = this.localCytokines.find(c => c.name === "TNF-alpha");
      const il10 = this.localCytokines.find(c => c.name === "IL-10");

      const proInflammatoryLoad = ((il6?.concentrationPgMl || 0) + (tnfa?.concentrationPgMl || 0)) / 100;
      const antiInflammatoryLoad = (il10?.concentrationPgMl || 0) / 50;

      const activeEffectorCount = this.selfReactiveTCells.filter(t => t.state === "EFFECTOR").length;
      const autoAbLoad = this.autoAntibodies.reduce((sum, ab) => sum + (ab.concentrationMgMl / ab.antigenAffinityKd) * 1e-9, 0);

      const damageDelta = (activeEffectorCount * 0.05 + autoAbLoad * 0.1 + proInflammatoryLoad) * (1.0 - antiInflammatoryLoad * 0.4);
      tissueDamage += Math.max(0, damageDelta);

      if (tissueDamage > 20 && Math.random() < 0.3) {
        epitopeSpreading += 0.15;
        this.selfReactiveTCells.push(
          new Leukocyte(
            `self-reactive-clone-${day}-${Math.floor(Math.random() * 1000)}`,
            "LYMPHOID",
            "T_CD4",
            "NAIVE",
            new Map([["CD4", 100], ["PD-1", 5]]),
            new Map(),
            0,
            `cryptic-self-epitope-${Math.floor(epitopeSpreading)}`
          )
        );
      }

      for (const ab of this.autoAntibodies) {
        ab.concentrationMgMl += (activeEffectorCount * 0.002) * epitopeSpreading;
        if (Math.random() < 0.1) {
          ab.performSomaticHypermutation(0.1, 0.5);
        }
      }

      this.localCytokines.forEach(c => {
        c.decay(1440);
        if (c.name === "TNF-alpha") {
          c.concentrationPgMl += activeEffectorCount * 1.2;
        }
        if (c.name === "IL-6") {
          c.concentrationPgMl += activeEffectorCount * 0.8;
        }
      });
    }

    const finalTissueDamage = Math.min(100, tissueDamage);
    const totalAutoAbTiter = this.autoAntibodies.reduce((sum, ab) => sum + ab.concentrationMgMl, 0);

    let clinicalPhenotype = "Subclinical Autoimmunity";
    if (finalTissueDamage > 70) {
      clinicalPhenotype = "Severe End-Organ Destruction (e.g., Lupus Nephritis / Erosive Rheumatoid Arthritis)";
    } else if (finalTissueDamage > 40) {
      clinicalPhenotype = "Moderate Active Autoimmune Disease";
    } else if (finalTissueDamage > 15) {
      clinicalPhenotype = "Mild / Early-Stage Autoimmune Flare";
    }

    return {
      tissueDamageIndex: finalTissueDamage,
      autoantibodyTiter: totalAutoAbTiter,
      regulatoryTCellSuppressionRatio: this.regulatoryTCells.length / (this.selfReactiveTCells.length + 1),
      epitopeSpreadingFactor: epitopeSpreading,
      clinicalPhenotype
    };
  }
}