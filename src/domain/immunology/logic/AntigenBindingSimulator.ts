import { Antibody, ParatopeSequence } from "../entities/Antibody";

export interface EpitopeSequence {
  sequence: string;
  chargeDistribution: number[];
  hydrophobicityIndex: number;
}

export class AntigenBindingSimulator {
  private static readonly GAS_CONSTANT_R = 8.314;
  private static readonly BODY_TEMP_KELVIN = 310.15;

  public static simulateBinding(
    paratope: ParatopeSequence,
    epitope: EpitopeSequence
  ): {
    kd: number;
    deltaG: number;
    deltaH: number;
    deltaS: number;
    hydrogenBonds: number;
  } {
    const combinedParatope = (paratope.cdr1 + paratope.cdr2 + paratope.cdr3).toUpperCase();
    const epitopeSeq = epitope.sequence.toUpperCase();

    let alignmentScore = 0;
    const minLen = Math.min(combinedParatope.length, epitopeSeq.length);
    
    for (let i = 0; i < minLen; i++) {
      if (combinedParatope[i] === epitopeSeq[i]) {
        alignmentScore += 2.0;
      } else if (this.areAminoAcidsSimilar(combinedParatope[i], epitopeSeq[i])) {
        alignmentScore += 1.0;
      } else {
        alignmentScore -= 0.5;
      }
    }

    let electrostaticEnergy = 0;
    const chargeLen = Math.min(combinedParatope.length, epitope.chargeDistribution.length);
    for (let i = 0; i < chargeLen; i++) {
      const paratopeCharge = this.getAminoAcidCharge(combinedParatope[i]);
      const epitopeCharge = epitope.chargeDistribution[i];
      electrostaticEnergy += (paratopeCharge * epitopeCharge) * -12.5;
    }

    const paratopeHydrophobicity = this.calculateHydrophobicity(combinedParatope);
    const hydrophobicMatch = Math.min(paratopeHydrophobicity, epitope.hydrophobicityIndex);
    const hydrophobicEnergy = -15.0 * hydrophobicMatch;

    const hydrogenBonds = Math.floor(alignmentScore * 0.6 + Math.random() * 2);
    const hBondEnergy = hydrogenBonds * -5.0;

    const flexibleResidues = (combinedParatope.match(/[GASYP]/g) || []).length;
    const deltaS = -10.0 - (flexibleResidues * 4.5);

    const deltaH = electrostaticEnergy + hydrophobicEnergy + hBondEnergy;
    const deltaG = deltaH - (this.BODY_TEMP_KELVIN * (deltaS / 1000.0));

    const deltaGJoules = deltaG * 1000.0;
    const exponent = deltaGJoules / (this.GAS_CONSTANT_R * this.BODY_TEMP_KELVIN);
    const kd = Math.exp(exponent);

    return {
      kd: Math.max(1e-13, Math.min(1e-2, kd)),
      deltaG,
      deltaH,
      deltaS,
      hydrogenBonds
    };
  }

  private static areAminoAcidsSimilar(a: string, b: string): boolean {
    const groups = [
      ["I", "L", "V", "M", "A", "F"],
      ["K", "R", "H"],
      ["D", "E"],
      ["S", "T", "N", "Q", "Y"],
      ["C", "G", "P"]
    ];
    return groups.some(g => g.includes(a) && g.includes(b));
  }

  private static getAminoAcidCharge(aa: string): number {
    if (["K", "R"].includes(aa)) return 1.0;
    if (aa === "H") return 0.5;
    if (["D", "E"].includes(aa)) return -1.0;
    return 0.0;
  }

  private static calculateHydrophobicity(seq: string): number {
    const hydrophobicAA = ["I", "L", "V", "M", "F", "W", "Y", "A"];
    let count = 0;
    for (const char of seq) {
      if (hydrophobicAA.includes(char)) count++;
    }
    return seq.length > 0 ? count / seq.length : 0;
  }
}