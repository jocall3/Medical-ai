export interface ProgressionPoint {
  age: number;
  severityScore: number; // 0-100
  biomarkerLevel: number;
}

export class NaturalHistoryModel {
  private globalDataPoints: ProgressionPoint[] = [];

  public addDataPoint(point: ProgressionPoint): void {
    this.globalDataPoints.push(point);
  }

  /**
   * Constructs the expected progression timeline of an ultra-rare disease.
   * Uses sparse data aggregation to establish baselines for clinical trials.
   */
  public predictProgression(currentAge: number, currentSeverity: number): ProgressionPoint[] {
    // Simple linear regression simulation for progression
    const slope = this.calculateAverageSlope();
    const predictions = [];
    
    for (let i = 1; i <= 5; i++) {
      predictions.push({
        age: currentAge + i,
        severityScore: Math.min(100, currentSeverity + (slope * i)),
        biomarkerLevel: 0 // Simplified
      });
    }
    
    return predictions;
  }

  private calculateAverageSlope(): number {
    if (this.globalDataPoints.length < 2) return 5; // Default progression
    const sorted = [...this.globalDataPoints].sort((a, b) => a.age - b.age);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    return (last.severityScore - first.severityScore) / (last.age - first.age);
  }
}