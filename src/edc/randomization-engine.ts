import * as crypto from 'crypto';

export interface RandomizationKit {
  id: string;
  kitNumber: string;
  treatmentArm: string;
  isAllocated: boolean;
  allocatedToSubjectId?: string;
  allocatedAt?: Date;
}

export class RandomizationEngine {
  private kits: RandomizationKit[] = [];
  private subjectAllocations: Map<string, string> = new Map();
  private unblindingLogs: { subjectId: string; unblindedBy: string; timestamp: Date; reason: string }[] = [];

  constructor() {
    this.initializeMockKits();
  }

  private initializeMockKits(): void {
    for (let i = 1; i <= 100; i++) {
      this.kits.push({
        id: crypto.randomUUID(),
        kitNumber: `KIT-${1000 + i}`,
        treatmentArm: i % 2 === 0 ? 'ARM-A' : 'ARM-B',
        isAllocated: false,
      });
    }
  }

  public randomizeSubject(subjectId: string): { treatmentArm: string; kitNumber: string } {
    if (this.subjectAllocations.has(subjectId)) {
      throw new Error(`Subject ${subjectId} is already randomized.`);
    }

    const armACount = Array.from(this.subjectAllocations.values()).filter((arm) => arm === 'ARM-A').length;
    const armBCount = Array.from(this.subjectAllocations.values()).filter((arm) => arm === 'ARM-B').length;

    let assignedArm: string;
    if (armACount < armBCount) {
      assignedArm = 'ARM-A';
    } else if (armBCount < armACount) {
      assignedArm = 'ARM-B';
    } else {
      assignedArm = Math.random() < 0.5 ? 'ARM-A' : 'ARM-B';
    }

    const availableKit = this.kits.find((k) => !k.isAllocated && k.treatmentArm === assignedArm);
    if (!availableKit) {
      throw new Error(`No available kits in inventory for treatment arm ${assignedArm}.`);
    }

    availableKit.isAllocated = true;
    availableKit.allocatedToSubjectId = subjectId;
    availableKit.allocatedAt = new Date();

    this.subjectAllocations.set(subjectId, assignedArm);

    return {
      treatmentArm: assignedArm,
      kitNumber: availableKit.kitNumber,
    };
  }

  public emergencyUnblind(subjectId: string, unblindedBy: string, reason: string): string {
    const arm = this.subjectAllocations.get(subjectId);
    if (!arm) {
      throw new Error(`Subject ${subjectId} has not been randomized.`);
    }

    this.unblindingLogs.push({
      subjectId,
      unblindedBy,
      timestamp: new Date(),
      reason,
    });

    return arm;
  }

  public getUnblindingLogs(): typeof this.unblindingLogs {
    return [...this.unblindingLogs];
  }

  public getKitInventory(): RandomizationKit[] {
    return [...this.kits];
  }
}