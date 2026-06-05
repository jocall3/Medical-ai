import { Participant } from "../entities/Participant";

export class RandomizationAlgorithm {
  private static strataSequences: Map<string, string[]> = new Map();

  public static generateBlockSequence(arms: string[], blockSize: number): string[] {
    if (blockSize % arms.length !== 0) {
      throw new Error("Block size must be a multiple of the number of arms.");
    }

    const sequence: string[] = [];
    const repetitions = blockSize / arms.length;

    const block: string[] = [];
    for (const arm of arms) {
      for (let i = 0; i < repetitions; i++) {
        block.push(arm);
      }
    }

    const shuffledBlock = [...block];
    for (let i = shuffledBlock.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledBlock[i], shuffledBlock[j]] = [shuffledBlock[j], shuffledBlock[i]];
    }

    return shuffledBlock;
  }

  public static assignParticipant(
    participant: Participant,
    arms: string[],
    strataKey: string,
    blockSize: number = 4
  ): string {
    let sequence = this.strataSequences.get(strataKey);

    if (!sequence || sequence.length === 0) {
      sequence = this.generateBlockSequence(arms, blockSize);
      this.strataSequences.set(strataKey, sequence);
    }

    const assignedArm = sequence.shift()!;
    this.strataSequences.set(strataKey, sequence);

    participant.assignArm(assignedArm);
    return assignedArm;
  }

  public static reset(): void {
    this.strataSequences.clear();
  }
}