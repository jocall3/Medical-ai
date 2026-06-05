export type TherapeuticDietType = 
  | 'LOW_FODMAP' 
  | 'DASH' 
  | 'RENAL_DIET_STAGE_3_4' 
  | 'KETOGENIC_THERAPEUTIC' 
  | 'LOW_SODIUM_HEPATIC';

export interface PhysiologicalOutcome {
  timestamp: Date;
  systolicBp?: number;
  diastolicBp?: number;
  serumCreatinineMgDl?: number;
  serumPotassiumMeqL?: number;
  serumPhosphorusMgDl?: number;
  hba1cPercent?: number;
  weightKg?: number;
}

export interface DietRestrictions {
  maxSodiumMg: number;
  maxPotassiumMg?: number;
  maxPhosphorusMg?: number;
  maxProteinGramsPerKg?: number;
  maxCarbsGrams?: number;
}

export class NutritionalIntervention {
  private outcomes: PhysiologicalOutcome[] = [];
  private adherenceLogs: { date: Date; adhered: boolean; notes?: string }[] = [];

  constructor(
    public readonly interventionId: string,
    public readonly patientId: string,
    public readonly dietType: TherapeuticDietType,
    public readonly startDate: Date,
    public readonly restrictions: DietRestrictions,
    public isActive: boolean = true
  ) {}

  public logAdherence(date: Date, adhered: boolean, notes?: string): void {
    this.adherenceLogs.push({ date, adhered, notes });
  }

  public logPhysiologicalOutcome(outcome: PhysiologicalOutcome): void {
    this.outcomes.push(outcome);
  }

  public calculateAdherenceRate(): number {
    if (this.adherenceLogs.length === 0) return 1.0;
    const adheredCount = this.adherenceLogs.filter(log => log.adhered).length;
    return adheredCount / this.adherenceLogs.length;
  }

  public evaluateEfficacy(): {
    efficacyStatus: 'IMPROVED' | 'STABLE' | 'DETERIORATED' | 'INSUFFICIENT_DATA';
    clinicalSummary: string;
  } {
    if (this.outcomes.length < 2) {
      return {
        efficacyStatus: 'INSUFFICIENT_DATA',
        clinicalSummary: 'At least two physiological outcome measurements are required to evaluate efficacy.'
      };
    }

    const sorted = [...this.outcomes].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const initial = sorted[0];
    const latest = sorted[sorted.length - 1];

    let improvementCount = 0;
    let deteriorationCount = 0;

    if (this.dietType === 'DASH' && initial.systolicBp && latest.systolicBp) {
      if (latest.systolicBp < initial.systolicBp) {
        improvementCount++;
      } else if (latest.systolicBp > initial.systolicBp + 5) {
        deteriorationCount++;
      }
    }

    if (this.dietType === 'RENAL_DIET_STAGE_3_4') {
      if (initial.serumPotassiumMeqL && latest.serumPotassiumMeqL) {
        if (latest.serumPotassiumMeqL <= 5.0 && latest.serumPotassiumMeqL < initial.serumPotassiumMeqL) {
          improvementCount++;
        } else if (latest.serumPotassiumMeqL > 5.2) {
          deteriorationCount++;
        }
      }
      if (initial.serumPhosphorusMgDl && latest.serumPhosphorusMgDl) {
        if (latest.serumPhosphorusMgDl <= 4.5 && latest.serumPhosphorusMgDl < initial.serumPhosphorusMgDl) {
          improvementCount++;
        } else if (latest.serumPhosphorusMgDl > 4.7) {
          deteriorationCount++;
        }
      }
    }

    if (initial.hba1cPercent && latest.hba1cPercent) {
      if (latest.hba1cPercent < initial.hba1cPercent) {
        improvementCount++;
      } else if (latest.hba1cPercent > initial.hba1cPercent + 0.2) {
        deteriorationCount++;
      }
    }

    let status: 'IMPROVED' | 'STABLE' | 'DETERIORATED' = 'STABLE';
    if (improvementCount > deteriorationCount) {
      status = 'IMPROVED';
    } else if (deteriorationCount > improvementCount) {
      status = 'DETERIORATED';
    }

    const summary = `Evaluated ${this.dietType} intervention over ${sorted.length} data points. ` +
      `Adherence rate is ${(this.calculateAdherenceRate() * 100).toFixed(1)}%. ` +
      `Status determined as ${status} based on physiological markers.`;

    return {
      efficacyStatus: status,
      clinicalSummary: summary
    };
  }

  public getOutcomes(): PhysiologicalOutcome[] {
    return [...this.outcomes];
  }

  public getAdherenceLogs(): { date: Date; adhered: boolean; notes?: string }[] {
    return [...this.adherenceLogs];
  }
}