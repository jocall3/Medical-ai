import * as crypto from "crypto";

export interface SealedAssignment {
  sealedId: string;
  participantId: string;
  encryptedArmId: string;
  hash: string;
  isUnblinded: boolean;
  unblindedAt?: Date;
  unblindingReason?: string;
}

export class DoubleBlindStateManager {
  private static assignments: Map<string, SealedAssignment> = new Map();
  private static masterSalt: string = crypto.randomBytes(16).toString("hex");

  public static sealAssignment(
    participantId: string,
    armId: string,
    investigatorKey: string
  ): SealedAssignment {
    const sealedId = crypto.randomUUID();
    
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      crypto.scryptSync(investigatorKey, this.masterSalt, 32),
      Buffer.alloc(16, 0)
    );
    let encryptedArmId = cipher.update(armId, "utf8", "hex");
    encryptedArmId += cipher.final("hex");

    const hash = crypto
      .createHmac("sha256", this.masterSalt)
      .update(`${participantId}:${armId}`)
      .digest("hex");

    const sealed: SealedAssignment = { 
      sealedId,
      participantId,
      encryptedArmId,
      hash,
      isUnblinded: false
    };

    this.assignments.set(sealedId, sealed);
    return sealed;
  }

  public static revealAssignment(
    sealedId: string,
    investigatorKey: string,
    reason: string
  ): string {
    const sealed = this.assignments.get(sealedId);
    if (!sealed) {
      throw new Error("Sealed assignment not found.");
    }

    if (sealed.isUnblinded) {
      throw new Error("Assignment has already been unblinded.");
    }

    try {
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        crypto.scryptSync(investigatorKey, this.masterSalt, 32),
        Buffer.alloc(16, 0)
      );
      let decryptedArmId = decipher.update(sealed.encryptedArmId, "hex", "utf8");
      decryptedArmId += decipher.final("utf8");

      const expectedHash = crypto
        .createHmac("sha256", this.masterSalt)
        .update(`${sealed.participantId}:${decryptedArmId}`)
        .digest("hex");

      if (expectedHash !== sealed.hash) {
        throw new Error("Integrity check failed. Cryptographic tampering detected.");
      }

      sealed.isUnblinded = true;
      sealed.unblindedAt = new Date();
      sealed.unblindingReason = reason;

      return decryptedArmId;
    } catch (error) {
      throw new Error(`Failed to unblind assignment: ${(error as Error).message}`);
    }
  }

  public static getAssignmentState(sealedId: string): Omit<SealedAssignment, "encryptedArmId"> {
    const sealed = this.assignments.get(sealedId);
    if (!sealed) {
      throw new Error("Sealed assignment not found.");
    }
    const { encryptedArmId, ...publicState } = sealed;
    return publicState;
  }
}