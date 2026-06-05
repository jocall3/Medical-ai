import { Neuron } from '../entities/Neuron';

/**
 * Utilizes the Hodgkin-Huxley model to simulate the electrical characteristics
 * of neuronal action potentials. This forms the basis of our biophysical simulation layer.
 */
export class ActionPotentialSimulator {
  /**
   * Simulates the membrane potential over a given time step using HH equations.
   * @param neuron The neuron to simulate
   * @param injectedCurrent The external stimulus current (uA/cm^2)
   * @param dt Time step in milliseconds
   */
  public simulateStep(neuron: Neuron, injectedCurrent: number, dt: number): number {
    // Simplified Hodgkin-Huxley integration step for demonstration
    const C_m = 1.0; // Membrane capacitance (uF/cm^2)
    const E_Na = 50.0; // Sodium reversal potential (mV)
    const E_K = -77.0; // Potassium reversal potential (mV)
    const E_L = -54.387; // Leak reversal potential (mV)

    const g_Na = neuron.ionChannelStates.sodium.conductance * neuron.ionChannelStates.sodium.openProbability;
    const g_K = neuron.ionChannelStates.potassium.conductance * neuron.ionChannelStates.potassium.openProbability;
    const g_L = 0.3; // Leak conductance

    const V = neuron.restingMembranePotential;

    const I_Na = g_Na * (V - E_Na);
    const I_K = g_K * (V - E_K);
    const I_L = g_L * (V - E_L);

    const dV = (injectedCurrent - (I_Na + I_K + I_L)) / C_m;
    
    neuron.updateMembranePotential(dV * dt);
    return neuron.restingMembranePotential;
  }
}
