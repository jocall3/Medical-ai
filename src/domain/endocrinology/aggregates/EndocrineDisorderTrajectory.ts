import { MetabolicPanel } from './MetabolicPanel';

export enum DisorderStage {
  PRE_DIABETIC = 'PRE_DIABETIC',
  EARLY_STAGE = 'EARLY_STAGE',
  COMPENSATED = 'COMPENSATED',
  DECOMPENSATED = 'DECOMPENSATED',
  END_STAGE = 'END_STAGE'
}

export interface TrajectoryPoint {
  date: Date;
  panel: MetabolicPanel;
  stage: DisorderStage;
  notes: string;
}

export class EndocrineDisorderTrajectory {
  private history: TrajectoryPoint[] = [];

  constructor(
    public readonly patientId: string,
    public readonly disorderName: string // e.g., "Type 2 Diabetes", "Hashimoto's"
  ) {}

  public addObservation(panel: MetabolicPanel, stage: DisorderStage, notes: string): void {
    this.history.push({
      date: new Date(),
      panel,
      stage,
      notes
    });
  }

  public getProgressionRate(): number {
    if (this.history.length < 2) return 0;
    
    // Calculate rate of change of a primary marker (e.g., HbA1c for Diabetes)
    const first = this.history[0].panel.getMarker('HbA1c')?.value || 0;
    const last = this.history[this.history.length - 1].panel.getMarker('HbA1c')?.value || 0;
    const days = (this.history[this.history.length - 1].date.getTime() - this.history[0].date.getTime()) / (1000 * 3600 * 24);
    
    return (last - first) / days;
  }

  public getCurrentStage(): DisorderStage {
    return this.history.length > 0 
      ? this.history[this.history.length - 1].stage 
      : DisorderStage.PRE_DIABETIC;
  }

  public getFullHistory(): TrajectoryPoint[] {
    return [...this.history];
  }
}