/**
 * Represents a single nerve cell (Neuron) within the central or peripheral nervous system.
 * This entity tracks the fundamental biophysical properties required for simulating
 * neural dynamics, including resting membrane potential, ion channel states, and myelination.
 */
export class Neuron {
  public id: string;
  public restingMembranePotential: number; // in mV
  public myelinationLevel: number; // 0.0 (unmyelinated) to 1.0 (fully myelinated)
  public ionChannelStates: {
    sodium: { openProbability: number; conductance: number };
    potassium: { openProbability: number; conductance: number };
    calcium: { openProbability: number; conductance: number };
    chloride: { openProbability: number; conductance: number };
  };

  constructor(id: string, restingMembranePotential: number = -70, myelinationLevel: number = 0.5) {
    this.id = id;
    this.restingMembranePotential = restingMembranePotential;
    this.myelinationLevel = myelinationLevel;
    this.ionChannelStates = {
      sodium: { openProbability: 0.05, conductance: 120 },
      potassium: { openProbability: 0.1, conductance: 36 },
      calcium: { openProbability: 0.01, conductance: 10 },
      chloride: { openProbability: 0.2, conductance: 0.3 }
    };
  }

  public updateMembranePotential(deltaV: number): void {
    this.restingMembranePotential += deltaV;
  }
}
