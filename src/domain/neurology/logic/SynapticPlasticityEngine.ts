import { Synapse } from '../entities/Synapse';

/**
 * Implements Hebbian learning rules (Long-Term Potentiation and Long-Term Depression)
 * to model memory formation, learning, and neural network rewiring.
 */
export class SynapticPlasticityEngine {
  private learningRate: number = 0.01;
  private decayRate: number = 0.001;

  /**
   * Applies Spike-Timing-Dependent Plasticity (STDP) based on pre and post-synaptic activity.
   * @param synapse The synapse to modify
   * @param preSynapticFiringRate Firing rate in Hz
   * @param postSynapticFiringRate Firing rate in Hz
   */
  public applyHebbianLearning(synapse: Synapse, preSynapticFiringRate: number, postSynapticFiringRate: number): void {
    // Coincidence detection: if both fire at high rates, induce LTP
    const coincidence = preSynapticFiringRate * postSynapticFiringRate;
    
    let weightDelta = 0;
    if (coincidence > 500) {
      // LTP: Increase AMPA receptor density and synaptic weight
      weightDelta = this.learningRate * coincidence;
      synapse.receptorDensity.AMPA += weightDelta * 10;
    } else if (preSynapticFiringRate > 10 && postSynapticFiringRate < 5) {
      // LTD: Pre-synaptic firing without post-synaptic response leads to depression
      weightDelta = -this.learningRate * preSynapticFiringRate;
      synapse.receptorDensity.AMPA = Math.max(0, synapse.receptorDensity.AMPA + weightDelta * 10);
    }

    // Natural decay
    weightDelta -= this.decayRate * synapse.synapticWeight;
    
    synapse.updateWeight(weightDelta);
  }
}
