/**
 * Represents a cluster of co-occurring distressing symptoms common in terminal illness.
 * In palliative care, symptoms rarely occur in isolation. For example, the psychoneurological
 * cluster often includes pain, fatigue, sleep disturbance, and depression.
 */

export enum SymptomType {
  PAIN = 'PAIN',
  FATIGUE = 'FATIGUE',
  NAUSEA = 'NAUSEA',
  DEPRESSION = 'DEPRESSION',
  ANXIETY = 'ANXIETY',
  DROWSINESS = 'DROWSINESS',
  APPETITE_LOSS = 'APPETITE_LOSS',
  DYSPNEA = 'DYSPNEA',
  DELIRIUM = 'DELIRIUM'
}

export interface Symptom {
  type: SymptomType;
  severity: number; // 0-10 scale (e.g., ESAS)
  isRefractory: boolean;
}

export class SymptomCluster {
  private constructor(
    public readonly id: string,
    public readonly patientId: string,
    private symptoms: Symptom[],
    public readonly recordedAt: Date
  ) {}

  public static create(id: string, patientId: string, symptoms: Symptom[]): SymptomCluster {
    return new SymptomCluster(id, patientId, symptoms, new Date());
  }

  /**
   * Calculates the overall distress score of the cluster.
   * Uses a weighted sum approach, as certain symptoms (like refractory dyspnea)
   * have a disproportionate impact on quality of life.
   */
  public calculateClusterDistressScore(): number {
    return this.symptoms.reduce((total, symptom) => {
      let weight = 1.0;
      if (symptom.isRefractory) weight = 1.5;
      if (symptom.type === SymptomType.PAIN || symptom.type === SymptomType.DYSPNEA) weight *= 1.2;
      return total + (symptom.severity * weight);
    }, 0);
  }

  public addSymptom(symptom: Symptom): void {
    const existing = this.symptoms.find(s => s.type === symptom.type);
    if (existing) {
      existing.severity = symptom.severity;
      existing.isRefractory = symptom.isRefractory;
    } else {
      this.symptoms.push(symptom);
    }
  }

  public getSymptoms(): ReadonlyArray<Symptom> {
    return this.symptoms;
  }

  /**
   * Identifies if the cluster matches known high-risk palliative phenotypes.
   */
  public identifyPhenotype(): string {
    const types = this.symptoms.map(s => s.type);
    if (types.includes(SymptomType.PAIN) && types.includes(SymptomType.FATIGUE) && types.includes(SymptomType.DEPRESSION)) {
      return 'PSYCHONEUROLOGICAL_CLUSTER';
    }
    if (types.includes(SymptomType.NAUSEA) && types.includes(SymptomType.APPETITE_LOSS)) {
      return 'GASTROINTESTINAL_CACHEXIA_CLUSTER';
    }
    return 'MIXED_UNSPECIFIED';
  }
}
