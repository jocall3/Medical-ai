/**
 * Models the synaptic cleft between two neurons.
 * Tracks pre-synaptic vesicle release dynamics and post-synaptic receptor density,
 * which are critical for understanding synaptic transmission and plasticity.
 */
export class Synapse {
  public id: string;
  public preSynapticNeuronId: string;
  public postSynapticNeuronId: string;
  public vesicleReleaseProbability: number; // 0.0 to 1.0
  public receptorDensity: {
    AMPA: number;
    NMDA: number;
    GABA_A: number;
  };
  public synapticWeight: number;

  constructor(id: string, preId: string, postId: string) {
    this.id = id;
    this.preSynapticNeuronId = preId;
    this.postSynapticNeuronId = postId;
    this.vesicleReleaseProbability = 0.3;
    this.receptorDensity = { AMPA: 100, NMDA: 50, GABA_A: 20 };
    this.synapticWeight = 1.0;
  }

  public updateWeight(delta: number): void {
    this.synapticWeight = Math.max(0, this.synapticWeight + delta);
  }
}
