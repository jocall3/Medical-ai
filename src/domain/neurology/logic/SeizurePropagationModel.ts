import { BrainNetworkGraph } from '../aggregates/BrainNetworkGraph';

/**
 * Simulates the hypersynchronous firing of cortical networks to predict
 * the spread of epileptic foci. Uses a network-based epidemic spreading model (e.g., SI/SIR).
 */
export class SeizurePropagationModel {
  private propagationThreshold: number = 0.75;

  /**
   * Predicts the spread of seizure activity over a given number of time steps.
   * @param network The connectome graph
   * @param focusRegionId The anatomical ID of the seizure origin
   * @param timeSteps Number of simulation steps
   */
  public predictSpread(network: BrainNetworkGraph, focusRegionId: string, timeSteps: number): Map<string, number> {
    const seizureState = new Map<string, number>(); // Region ID -> Seizure Intensity (0 to 1)
    
    // Initialize all regions to 0, focus to 1
    network.getRegions().forEach(region => seizureState.set(region.id, 0));
    seizureState.set(focusRegionId, 1.0);

    for (let t = 0; t < timeSteps; t++) {
      const nextState = new Map(seizureState);
      
      network.getRegions().forEach(region => {
        const currentIntensity = seizureState.get(region.id) || 0;
        if (currentIntensity < 1.0) {
          // Calculate incoming excitatory drive from connected regions
          const connections = network.getConnections(region.id);
          let incomingDrive = 0;
          
          connections.forEach(conn => {
            const neighborIntensity = seizureState.get(conn.targetId) || 0;
            incomingDrive += neighborIntensity * conn.weight;
          });

          if (incomingDrive > this.propagationThreshold) {
            // Non-linear activation function for seizure recruitment
            const newIntensity = Math.min(1.0, currentIntensity + (incomingDrive * 0.2));
            nextState.set(region.id, newIntensity);
          }
        }
      });
      
      // Update state for next iteration
      nextState.forEach((val, key) => seizureState.set(key, val));
    }

    return seizureState;
  }
}
