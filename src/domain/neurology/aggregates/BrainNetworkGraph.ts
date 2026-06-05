/**
 * Aggregate representing the connectome.
 * Maps functional and structural connectivity between different brain regions
 * (e.g., Default Mode Network, Salience Network, Central Executive Network).
 */
export interface BrainRegion {
  id: string;
  name: string;
  networkAffiliation: string; // e.g., 'DMN', 'CEN'
}

export interface ConnectivityEdge {
  targetId: string;
  weight: number; // -1.0 (strong anti-correlation) to 1.0 (strong correlation)
  isStructural: boolean;
}

export class BrainNetworkGraph {
  private regions: Map<string, BrainRegion> = new Map();
  private adjacencyList: Map<string, ConnectivityEdge[]> = new Map();

  public addRegion(region: BrainRegion): void {
    this.regions.set(region.id, region);
    if (!this.adjacencyList.has(region.id)) {
      this.adjacencyList.set(region.id, []);
    }
  }

  public addConnection(sourceId: string, targetId: string, weight: number, isStructural: boolean = false): void {
    this.adjacencyList.get(sourceId)?.push({ targetId, weight, isStructural });
    // Assuming undirected graph for structural, but functional can be directed. Keeping simple here.
  }

  public getRegions(): BrainRegion[] {
    return Array.from(this.regions.values());
  }

  public getConnections(regionId: string): ConnectivityEdge[] {
    return this.adjacencyList.get(regionId) || [];
  }

  /**
   * Analyzes the integrity of the Default Mode Network (DMN).
   * Reduced integrity is a biomarker for Alzheimer's and other pathologies.
   */
  public calculateDMNIntegrity(): number {
    const dmnNodes = this.getRegions().filter(r => r.networkAffiliation === 'DMN');
    if (dmnNodes.length === 0) return 0;

    let totalWeight = 0;
    let count = 0;

    dmnNodes.forEach(node => {
      const connections = this.getConnections(node.id);
      connections.forEach(conn => {
        const target = this.regions.get(conn.targetId);
        if (target && target.networkAffiliation === 'DMN') {
          totalWeight += conn.weight;
          count++;
        }
      });
    });

    return count > 0 ? totalWeight / count : 0;
  }
}
