import { CardiacCycle } from "../entities/CardiacCycle";
import { HeartValve } from "../entities/HeartValve";
import { VesselSegment } from "../entities/VesselSegment";
import { Biomarkers, LipidProfile, MyocardialInfarctionPredictor, MIPrediction } from "../logic/MyocardialInfarctionPredictor";
import { ArrhythmiaStateDetector, ArrhythmiaClassification } from "../logic/ArrhythmiaStateDetector";

export interface ECGMetrics {
  rrIntervalsMs: number[];
  pWavePresent: boolean[];
  qrsDurationMs: number[];
  prIntervalsMs: number[];
}

export interface PathologyReport {
  arrhythmiaDiagnosis: ArrhythmiaClassification;
  miRiskAssessment: MIPrediction;
  valvularPathologies: string[];
  overallRiskScore: number; // 0.0 to 100.0
  clinicalSummary: string;
}

export class CardiovascularProfile {
  constructor(
    public readonly patientId: string,
    public cardiacCycle: CardiacCycle,
    public valves: HeartValve[],
    public vascularTree: VesselSegment[],
    public ecgMetrics: ECGMetrics,
    public biomarkers: Biomarkers,
    public lipidProfile: LipidProfile
  ) {}

  /**
   * Evaluates the overall cardiovascular risk score and generates a comprehensive pathology report.
   */
  public diagnosePathologies(): PathologyReport {
    const detector = new ArrhythmiaStateDetector();
    const arrhythmiaDiagnosis = detector.analyzeECG(
      this.ecgMetrics.rrIntervalsMs,
      this.ecgMetrics.pWavePresent,
      this.ecgMetrics.qrsDurationMs,
      this.ecgMetrics.prIntervalsMs
    );

    const miPredictor = new MyocardialInfarctionPredictor();
    const stDepression = this.ecgMetrics.qrsDurationMs.some(q => q > 110) ? 1.5 : 0.0;
    const miRiskAssessment = miPredictor.predictMIPrompt(
      this.vascularTree,
      this.lipidProfile,
      this.biomarkers,
      {
        stSegmentDepressionMm: stDepression,
        anginaInduced: stDepression > 1.0,
        maxHeartRateAchieved: 140
      }
    );

    const valvularPathologies: string[] = [];
    for (const valve of this.valves) {
      valve.evaluateSeverities();
      if (valve.stenosisSeverity !== 'NONE') {
        valvularPathologies.push(`${valve.valveType} Valve Stenosis: ${valve.stenosisSeverity}`);
      }
      if (valve.regurgitationSeverity !== 'NONE') {
        valvularPathologies.push(`${valve.valveType} Valve Regurgitation: ${valve.regurgitationSeverity}`);
      }
    }

    let riskScore = 10.0;
    riskScore += miRiskAssessment.overallMIPredictionScore * 40;

    if (arrhythmiaDiagnosis.type === 'VENTRICULAR_FIBRILLATION' || arrhythmiaDiagnosis.type === 'VENTRICULAR_TACHYCARDIA') {
      riskScore += 40;
    } else if (arrhythmiaDiagnosis.type === 'ATRIAL_FIBRILLATION' || arrhythmiaDiagnosis.type === 'THIRD_DEGREE_AV_BLOCK') {
      riskScore += 25;
    } else if (arrhythmiaDiagnosis.type !== 'NORMAL_SINUS_RHYTHM') {
      riskScore += 10;
    }

    const severeValves = this.valves.filter(v => v.stenosisSeverity === 'SEVERE' || v.regurgitationSeverity === 'SEVERE');
    riskScore += severeValves.length * 15;
    riskScore = Math.min(100.0, riskScore);

    let clinicalSummary = `Patient ${this.patientId} presents with an overall cardiovascular risk score of ${riskScore.toFixed(1)}%. `;
    clinicalSummary += `Rhythm is classified as ${arrhythmiaDiagnosis.type}. `;
    if (valvularPathologies.length > 0) {
      clinicalSummary += `Valvular assessment reveals: ${valvularPathologies.join(', ')}. `;
    } else {
      clinicalSummary += `Valvular structures are within normal limits. `;
    }
    clinicalSummary += `MI Risk Recommendation: ${miRiskAssessment.clinicalRecommendation}`;

    return {
      arrhythmiaDiagnosis,
      miRiskAssessment,
      valvularPathologies,
      overallRiskScore: parseFloat(riskScore.toFixed(1)),
      clinicalSummary
    };
  }
}