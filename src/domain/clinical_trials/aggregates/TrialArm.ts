import { Participant, ParticipantStatus } from "../entities/Participant";
import { AdverseEvent } from "../entities/AdverseEvent";

export interface ArmMetrics {
  totalEnrolled: number;
  activeCount: number;
  completedCount: number;
  withdrawnCount: number;
  dropoutRate: number;
  meanAdherence: number;
  saeRate: number;
}

export class TrialArm {
  private participants: Map<string, Participant> = new Map();
  private adverseEvents: AdverseEvent[] = [];

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly targetSize: number
  ) {}

  public addParticipant(participant: Participant): void {
    if (this.participants.has(participant.id)) {
      throw new Error(`Participant ${participant.id} is already assigned to this arm.`);
    }
    participant.assignArm(this.id);
    this.participants.set(participant.id, participant);
  }

  public recordAdverseEvent(ae: AdverseEvent): void {
    if (!this.participants.has(ae.participantId)) {
      throw new Error(`Participant ${ae.participantId} is not in this trial arm.`);
    }
    this.adverseEvents.push(ae);
  }

  public getParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  public getAdverseEvents(): AdverseEvent[] {
    return [...this.adverseEvents];
  }

  public getMetrics(): ArmMetrics {
    const participantsList = this.getParticipants();
    const totalEnrolled = participantsList.length;

    if (totalEnrolled === 0) {
      return {
        totalEnrolled: 0,
        activeCount: 0,
        completedCount: 0,
        withdrawnCount: 0,
        dropoutRate: 0,
        meanAdherence: 1.0,
        saeRate: 0
      };
    }

    let activeCount = 0;
    let completedCount = 0;
    let withdrawnCount = 0;
    let totalAdherence = 0;

    for (const p of participantsList) {
      if (p.status === ParticipantStatus.ACTIVE) activeCount++;
      else if (p.status === ParticipantStatus.COMPLETED) completedCount++;
      else if (p.status === ParticipantStatus.WITHDRAWN || p.status === ParticipantStatus.LOST_TO_FOLLOW_UP) {
        withdrawnCount++;
      }
      totalAdherence += p.adherenceRate;
    }

    const dropoutRate = parseFloat((withdrawnCount / totalEnrolled).toFixed(4));
    const meanAdherence = parseFloat((totalAdherence / totalEnrolled).toFixed(4));

    const saeCount = this.adverseEvents.filter(ae => ae.isSeriousAdverseEvent).length;
    const saeRate = parseFloat((saeCount / totalEnrolled).toFixed(4));

    return {
      totalEnrolled,
      activeCount,
      completedCount,
      withdrawnCount,
      dropoutRate,
      meanAdherence,
      saeRate
    };
  }
}