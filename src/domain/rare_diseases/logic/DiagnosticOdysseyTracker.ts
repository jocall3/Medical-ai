export interface MedicalEvent {
  date: Date;
  providerType: 'GP' | 'Specialist' | 'Geneticist';
  outcome: 'Misdiagnosis' | 'Inconclusive' | 'CorrectDiagnosis';
  notes: string;
}

export class DiagnosticOdysseyTracker {
  /**
   * Analyzes the timeline of misdiagnoses to identify bottlenecks in recognition.
   */
  public analyzeTimeline(events: MedicalEvent[]): {
    totalDurationDays: number;
    misdiagnosisCount: number;
    bottleneckPhase: string;
  } {
    if (events.length === 0) return { totalDurationDays: 0, misdiagnosisCount: 0, bottleneckPhase: 'N/A' };

    const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
    const start = sortedEvents[0].date;
    const end = sortedEvents[sortedEvents.length - 1].date;
    
    const misdiagnoses = events.filter(e => e.outcome === 'Misdiagnosis').length;
    
    return {
      totalDurationDays: (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      misdiagnosisCount: misdiagnoses,
      bottleneckPhase: misdiagnoses > 3 ? 'Specialist Referral Loop' : 'Initial Presentation'
    };
  }
}