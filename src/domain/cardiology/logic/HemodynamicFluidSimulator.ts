import { VesselSegment } from "../entities/VesselSegment";

export interface HemodynamicReport {
  totalVascularResistance: number; // Pa·s/m3
  meanArterialPressureMmHg: number;
  segmentFlowRatesMlPerSec: Record<string, number>;
  segmentReynoldsNumbers: Record<string, number>;
  turbulentSegments: string[];
}

export class HemodynamicFluidSimulator {
  private readonly bloodDensityKgM3 = 1060; // Density of blood

  /**
   * Simulates blood flow across a vascular network using 1D Navier-Stokes approximations
   * and Poiseuille flow assumptions.
   */
  public simulateNetworkFlow(
    segments: VesselSegment[],
    cardiacOutputLMin: number,
    heartRate: number,
    bloodViscositycP: number = 3.5
  ): HemodynamicReport {
    const cardiacOutputMlPerSec = (cardiacOutputLMin * 1000) / 60;
    const segmentFlowRatesMlPerSec: Record<string, number> = {};
    const segmentReynoldsNumbers: Record<string, number> = {};
    const turbulentSegments: string[] = [];

    // Calculate total resistance of the network (assuming parallel/serial simplified model)
    let totalResistance = 0;
    for (const segment of segments) {
      const resistance = segment.calculateResistance(bloodViscositycP);
      totalResistance += resistance;
    }

    // Distribute flow and calculate Reynolds numbers
    for (const segment of segments) {
      const flowRate = cardiacOutputMlPerSec; // Simplified series flow
      segmentFlowRatesMlPerSec[segment.segmentId] = flowRate;

      segment.calculateAndSetShearStress(flowRate, bloodViscositycP);

      // Reynolds number: Re = (rho * v * D) / eta
      const effectiveRadiusMeters = (segment.radiusMm * (1 - segment.plaqueBuildupPercentage / 100)) / 1000;
      const areaM2 = Math.PI * Math.pow(effectiveRadiusMeters, 2);
      const velocityMPerSec = areaM2 > 0 ? (flowRate * 1e-6) / areaM2 : 0;
      const diameterMeters = effectiveRadiusMeters * 2;
      const etaPaS = bloodViscositycP * 0.001;

      const reynoldsNumber = etaPaS > 0 ? (this.bloodDensityKgM3 * velocityMPerSec * diameterMeters) / etaPaS : 0;
      segmentReynoldsNumbers[segment.segmentId] = reynoldsNumber;

      if (reynoldsNumber > 2300) {
        turbulentSegments.push(segment.segmentId);
      }
    }

    // Mean Arterial Pressure (MAP) = CO * SVR + CVP (assume Central Venous Pressure = 5 mmHg)
    const svrMmHgMinL = totalResistance * 4.5e-7; 
    const meanArterialPressureMmHg = (cardiacOutputLMin * svrMmHgMinL) + 5;

    return {
      totalVascularResistance: totalResistance,
      meanArterialPressureMmHg,
      segmentFlowRatesMlPerSec,
      segmentReynoldsNumbers,
      turbulentSegments
    };
  }
}