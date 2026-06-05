/**
 * @module BiopsyReport
 * @description The Aggregate Root compiling all microscopic findings, IHC results,
 * AI inferences, and the final pathological diagnosis. This is the ultimate output
 * delivered to the oncologist or referring physician.
 */

import { TissueSample } from '../entities/TissueSample';
import { StainMarker } from '../entities/StainMarker';
import { DigitalSlide } from './DigitalSlide';

export enum DiagnosisSeverity {
  BENIGN = 'BENIGN',
  ATYPICAL = 'ATYPICAL',
  IN_SITU_CARCINOMA = 'IN_SITU_CARCINOMA',
  MALIGNANT_INVASIVE = 'MALIGNANT_INVASIVE'
}

export class BiopsyReport {
  private stains: StainMarker[] = [];
  private slides: DigitalSlide[] = [];
  private aiFindings: string[] = [];

  constructor(
    public readonly reportId: string,
    public readonly patientId: string,
    public readonly tissueSample: TissueSample,
    public readonly pathologistId: string,
    public finalDiagnosis: string = 'Pending',
    public severity: DiagnosisSeverity = DiagnosisSeverity.BENIGN
  ) {}

  public addSlide(slide: DigitalSlide): void {
    this.slides.push(slide);
  }

  public addStainResult(stain: StainMarker): void {
    this.stains.push(stain);
  }

  public addAIFinding(finding: string): void {
    this.aiFindings.push(finding);
  }

  public finalizeDiagnosis(diagnosis: string, severity: DiagnosisSeverity): void {
    this.finalDiagnosis = diagnosis;
    this.severity = severity;
  }

  /**
   * Compiles the report into a standardized HL7 FHIR or JSON format for EHR integration.
   */
  public generateClinicalSummary(): Record<string, any> {
    return {
      reportId: this.reportId,
      patientId: this.patientId,
      specimen: this.tissueSample.getMetadataSummary(),
      diagnosis: this.finalDiagnosis,
      severity: this.severity,
      biomarkers: this.stains.map(s => ({
        marker: s.markerName,
        interpretation: s.getClinicalInterpretation()
      })),
      aiInsights: this.aiFindings,
      slidesAnalyzed: this.slides.length,
      timestamp: new Date().toISOString()
    };
  }
}
