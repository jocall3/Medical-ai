import { GFRCalculator, GFRInput } from '../logic/GFRCalculator';

/**
 * RenalPanel Aggregate Root
 * Combines Blood Urea Nitrogen (BUN), Serum Creatinine, electrolytes, and urinalysis results
 * into a comprehensive kidney health profile.
 * Computes clinical indices like FENa, FEUrea, and Anion Gap to classify renal failure.
 */
export interface Urinalysis {
  specificGravity: number; // Normal: 1.002 - 1.030
  pH: number;              // Normal: 4.5 - 8.0
  proteinuriaGramsPerDay: number; // Normal < 0.15 g/day
  hematuria: 'None' | 'Microscopic' | 'Macroscopic';
  casts: ('None' | 'Hyaline' | 'Muddy Brown' | 'Red Blood Cell' | 'White Blood Cell')[];
  urineSodiumMeqL?: number;
  urineCreatinineMgDl?: number;
  urineUreaMgDl?: number;
}

export interface RenalPanelProps {
  patientId: string;
  timestamp: Date;
  bun: number;               // mg/dL (Normal: 7-20)
  serumCreatinine: number;   // mg/dL (Normal: 0.6-1.2)
  serumSodium: number;       // mEq/L
  serumChloride: number;     // mEq/L
  serumBicarbonate: number;  // mEq/L
  serumCystatinC?: number;   // mg/L
  age: number;
  sex: 'male' | 'female';
  urinalysis: Urinalysis;
}

export class RenalPanel {
  private props: RenalPanelProps;

  constructor(props: RenalPanelProps) {
    this.props = props;
  }

  public calculateBunCreatinineRatio(): number {
    return this.props.bun / this.props.serumCreatinine;
  }

  public calculateAnionGap(): number {
    return this.props.serumSodium - (this.props.serumChloride + this.props.serumBicarbonate);
  }

  public calculateFENa(): number | null {
    const { urineSodiumMeqL, urineCreatinineMgDl } = this.props.urinalysis;
    if (urineSodiumMeqL === undefined || urineCreatinineMgDl === undefined) {
      return null;
    }
    const fena = (urineSodiumMeqL * this.props.serumCreatinine) / (this.props.serumSodium * urineCreatinineMgDl) * 100;
    return Math.round(fena * 100) / 100;
  }

  public calculateFEUrea(): number | null {
    const { urineUreaMgDl, urineCreatinineMgDl } = this.props.urinalysis;
    if (urineUreaMgDl === undefined || urineCreatinineMgDl === undefined) {
      return null;
    }
    const feUrea = (urineUreaMgDl * this.props.serumCreatinine) / (this.props.bun * urineCreatinineMgDl) * 100;
    return Math.round(feUrea * 100) / 100;
  }

  public classifyRenalFailure(): {
    etiology: 'Pre-renal' | 'Intrinsic (ATN/Glomerular)' | 'Post-renal' | 'Normal/Chronic Stable';
    explanation: string;
  } {
    const ratio = this.calculateBunCreatinineRatio();
    const fena = this.calculateFENa();
    const feUrea = this.calculateFEUrea();
    const casts = this.props.urinalysis.casts;

    const gfrInput: GFRInput = {
      serumCreatinine: this.props.serumCreatinine,
      serumCystatinC: this.props.serumCystatinC,
      age: this.props.age,
      sex: this.props.sex,
    };
    const gfr = GFRCalculator.calculateCKDEPICreatinine(gfrInput).gfr;

    if (gfr >= 60 && this.props.serumCreatinine < 1.3) {
      return {
        etiology: 'Normal/Chronic Stable',
        explanation: 'Renal function parameters are within normal physiological limits.',
      };
    }

    if (casts.includes('Muddy Brown') || (fena !== null && fena > 2.0) || (feUrea !== null && feUrea > 50)) {
      return {
        etiology: 'Intrinsic (ATN/Glomerular)',
        explanation: 'Etiology points to intrinsic renal parenchymal damage (likely Acute Tubular Necrosis) indicated by muddy brown granular casts and/or FENa > 2% / FEUrea > 50%.',
      };
    }

    if (casts.includes('Red Blood Cell')) {
      return {
        etiology: 'Intrinsic (ATN/Glomerular)',
        explanation: 'Etiology points to Glomerulonephritis indicated by the presence of Red Blood Cell casts and significant proteinuria.',
      };
    }

    if (ratio > 20 || (fena !== null && fena < 1.0) || (feUrea !== null && feUrea < 35)) {
      return {
        etiology: 'Pre-renal',
        explanation: 'Etiology points to renal hypoperfusion (Pre-renal azotemia) indicated by BUN/Creatinine ratio > 20, FENa < 1%, and/or FEUrea < 35%.',
      };
    }

    return {
      etiology: 'Intrinsic (ATN/Glomerular)',
      explanation: 'Indeterminate profile, defaulting to intrinsic monitoring. Correlate with clinical volume status and renal ultrasound.',
    };
  }

  public getProps(): RenalPanelProps {
    return { ...this.props };
  }
}