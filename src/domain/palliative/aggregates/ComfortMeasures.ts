/**
 * Manages the acute protocols for the actively dying patient.
 * Ensures rapid response to pain crises, terminal secretions ("death rattle"),
 * and terminal agitation. This is the ultimate execution of the palliative goal:
 * a peaceful, dignified death.
 */

export enum ActiveDyingSymptom {
  PAIN_CRISIS = 'PAIN_CRISIS',
  TERMINAL_SECRETIONS = 'TERMINAL_SECRETIONS',
  TERMINAL_AGITATION = 'TERMINAL_AGITATION',
  SEVERE_DYSPNEA = 'SEVERE_DYSPNEA'
}

export interface ComfortProtocol {
  symptom: ActiveDyingSymptom;
  medication: string;
  route: 'SUBCUT' | 'IV' | 'SUBLINGUAL' | 'BUCCAL';
  frequency: string;
  titrationInstructions: string;
}

export class ComfortMeasures {
  private protocols: Map<ActiveDyingSymptom, ComfortProtocol> = new Map();

  constructor(public readonly patientId: string) {
    this.initializeStandardOrderSet();
  }

  /**
   * Initializes the standard "Comfort Care Order Set" used in hospitals and hospice.
   */
  private initializeStandardOrderSet(): void {
    this.protocols.set(ActiveDyingSymptom.PAIN_CRISIS, {
      symptom: ActiveDyingSymptom.PAIN_CRISIS,
      medication: 'Morphine Sulfate',
      route: 'SUBCUT',
      frequency: 'q1H PRN',
      titrationInstructions: 'If pain unrelieved after 2 doses, double the dose.'
    });

    this.protocols.set(ActiveDyingSymptom.TERMINAL_SECRETIONS, {
      symptom: ActiveDyingSymptom.TERMINAL_SECRETIONS,
      medication: 'Glycopyrrolate or Scopolamine Patch',
      route: 'SUBCUT',
      frequency: 'q4H PRN',
      titrationInstructions: 'Reposition patient. Do not suction deeply as it increases distress.'
    });

    this.protocols.set(ActiveDyingSymptom.TERMINAL_AGITATION, {
      symptom: ActiveDyingSymptom.TERMINAL_AGITATION,
      medication: 'Haloperidol or Midazolam',
      route: 'SUBCUT',
      frequency: 'q2H PRN',
      titrationInstructions: 'Rule out urinary retention first. Titrate to calm.'
    });
  }

  public overrideProtocol(symptom: ActiveDyingSymptom, customProtocol: ComfortProtocol): void {
    this.protocols.set(symptom, customProtocol);
  }

  /**
   * Triggers an acute crisis response, returning the immediate nursing orders.
   */
  public triggerCrisisResponse(symptom: ActiveDyingSymptom): ComfortProtocol {
    const protocol = this.protocols.get(symptom);
    if (!protocol) {
      throw new Error(`No comfort protocol defined for ${symptom}`);
    }
    // In a full system, this would dispatch an urgent event to the nursing dashboard
    return protocol;
  }

  public getAllActiveProtocols(): ComfortProtocol[] {
    return Array.from(this.protocols.values());
  }
}
