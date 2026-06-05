export type ArrhythmiaType = 
  | 'NORMAL_SINUS_RHYTHM'
  | 'ATRIAL_FIBRILLATION'
  | 'VENTRICULAR_TACHYCARDIA'
  | 'VENTRICULAR_FIBRILLATION'
  | 'FIRST_DEGREE_AV_BLOCK'
  | 'SECOND_DEGREE_AV_BLOCK_MOBITZ_I'
  | 'SECOND_DEGREE_AV_BLOCK_MOBITZ_II'
  | 'THIRD_DEGREE_AV_BLOCK';

export interface ArrhythmiaClassification {
  type: ArrhythmiaType;
  confidence: number; // 0.0 to 1.0
  heartRateBpm: number;
  clinicalNotes: string;
}

export class ArrhythmiaStateDetector {
  /**
   * State machine logic for classifying ECG waveforms based on R-R intervals, P-wave morphology,
   * QRS duration, and PR intervals.
   */
  public analyzeECG(
    rrIntervalsMs: number[],
    pWavePresent: boolean[],
    qrsDurationMs: number[],
    prIntervalsMs: number[]
  ): ArrhythmiaClassification {
    if (rrIntervalsMs.length < 3) {
      return {
        type: 'NORMAL_SINUS_RHYTHM',
        confidence: 0.1,
        heartRateBpm: 0,
        clinicalNotes: 'Insufficient data to perform accurate ECG analysis.'
      };
    }

    // Calculate average heart rate
    const avgRRMs = rrIntervalsMs.reduce((sum, val) => sum + val, 0) / rrIntervalsMs.length;
    const heartRateBpm = Math.round(60000 / avgRRMs);

    // Calculate R-R interval variability (standard deviation)
    const meanRR = avgRRMs;
    const variance = rrIntervalsMs.reduce((sum, val) => sum + Math.pow(val - meanRR, 2), 0) / rrIntervalsMs.length;
    const sdnn = Math.sqrt(variance);

    const avgQrsDuration = qrsDurationMs.reduce((sum, val) => sum + val, 0) / qrsDurationMs.length;
    const avgPrInterval = prIntervalsMs.reduce((sum, val) => sum + val, 0) / prIntervalsMs.length;
    const pWaveCount = pWavePresent.filter(p => p).length;
    const pWaveRatio = pWaveCount / pWavePresent.length;

    // 1. Ventricular Fibrillation (V-Fib)
    if (avgQrsDuration > 180 && sdnn > 150 && pWaveRatio < 0.1) {
      return {
        type: 'VENTRICULAR_FIBRILLATION',
        confidence: 0.95,
        heartRateBpm,
        clinicalNotes: 'EMERGENCY: Chaotic electrical activity with no distinct QRS complexes. Immediate defibrillation required.'
      };
    }

    // 2. Ventricular Tachycardia (V-Tach)
    if (heartRateBpm > 100 && avgQrsDuration > 120 && sdnn < 30) {
      return {
        type: 'VENTRICULAR_TACHYCARDIA',
        confidence: 0.92,
        heartRateBpm,
        clinicalNotes: 'CRITICAL: Monomorphic wide-complex tachycardia. High risk of hemodynamic collapse.'
      };
    }

    // 3. Atrial Fibrillation (AFib)
    if (sdnn > 100 && pWaveRatio < 0.2) {
      return {
        type: 'ATRIAL_FIBRILLATION',
        confidence: 0.89,
        heartRateBpm,
        clinicalNotes: 'Irregularly irregular rhythm with absent P-waves. High risk of thromboembolism; consider anticoagulation.'
      };
    }

    // 4. Third-Degree AV Block (Complete Heart Block)
    if (heartRateBpm < 45 && pWaveRatio > 1.5 && sdnn < 40) {
      return {
        type: 'THIRD_DEGREE_AV_BLOCK',
        confidence: 0.90,
        heartRateBpm,
        clinicalNotes: 'Complete AV dissociation. Atria and ventricles beat independently. Pacemaker implantation indicated.'
      };
    }

    // 5. Second-Degree AV Block Mobitz I (Wenckebach)
    let progressiveLengthening = false;
    if (prIntervalsMs.length >= 3) {
      if (prIntervalsMs[1] > prIntervalsMs[0] && prIntervalsMs[2] > prIntervalsMs[1]) {
        progressiveLengthening = true;
      }
    }
    if (progressiveLengthening && pWaveRatio > 1.0) {
      return {
        type: 'SECOND_DEGREE_AV_BLOCK_MOBITZ_I',
        confidence: 0.85,
        heartRateBpm,
        clinicalNotes: 'Progressive prolongation of the PR interval culminating in a non-conducted P-wave.'
      };
    }

    // 6. Second-Degree AV Block Mobitz II
    if (!progressiveLengthening && pWaveRatio > 1.1 && pWaveRatio < 1.5) {
      return {
        type: 'SECOND_DEGREE_AV_BLOCK_MOBITZ_II',
        confidence: 0.82,
        heartRateBpm,
        clinicalNotes: 'Intermittent non-conducted P-waves without PR prolongation. High risk of progression to complete heart block.'
      };
    }

    // 7. First-Degree AV Block
    if (avgPrInterval > 200 && sdnn < 50 && pWaveRatio >= 0.9) {
      return {
        type: 'FIRST_DEGREE_AV_BLOCK',
        confidence: 0.88,
        heartRateBpm,
        clinicalNotes: 'Prolonged PR interval (>200ms) with 1:1 AV conduction. Benign delay in AV node conduction.'
      };
    }

    // 8. Normal Sinus Rhythm
    return { 
      type: 'NORMAL_SINUS_RHYTHM',
      confidence: 0.95,
      heartRateBpm,
      clinicalNotes: 'Normal sinus rhythm with physiological rate and conduction intervals.'
    };
  }
}