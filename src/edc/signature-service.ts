import * as crypto from 'crypto';

export interface ElectronicSignature {
  id: string;
  subjectId: string;
  signedBy: string;
  signedAt: Date;
  signatureMeaning: string;
  checksum: string;
  publicKey: string;
  signatureValue: string;
}

export class SignatureService {
  private signatures: Map<string, ElectronicSignature> = new Map();
  private keyPairs: Map<string, { publicKey: string; privateKey: string }> = new Map();

  public generateKeyPairForUser(userId: string): { publicKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    });

    this.keyPairs.set(userId, { publicKey, privateKey });
    return { publicKey };
  }

  public signCasebook(params: {
    subjectId: string;
    casebookData: any;
    userId: string;
    passwordHash: string;
    expectedPasswordHash: string;
    signatureMeaning: string;
  }): ElectronicSignature {
    if (params.passwordHash !== params.expectedPasswordHash) {
      throw new Error('Authentication failed. Electronic signature rejected.');
    }

    let keys = this.keyPairs.get(params.userId);
    if (!keys) {
      this.generateKeyPairForUser(params.userId);
      keys = this.keyPairs.get(params.userId)!;
    }

    const dataString = JSON.stringify(params.casebookData);
    const checksum = crypto.createHash('sha256').update(dataString).digest('hex');

    const sign = crypto.createSign('SHA256');
    sign.update(checksum);
    const signatureValue = sign.sign(keys.privateKey, 'base64');

    const signature: ElectronicSignature = {
      id: crypto.randomUUID(),
      subjectId: params.subjectId,
      signedBy: params.userId,
      signedAt: new Date(),
      signatureMeaning: params.signatureMeaning,
      checksum,
      publicKey: keys.publicKey,
      signatureValue,
    };

    this.signatures.set(signature.id, signature);
    return signature;
  }

  public verifySignature(signatureId: string, currentCasebookData: any): boolean {
    const signature = this.signatures.get(signatureId);
    if (!signature) {
      throw new Error(`Signature with ID ${signatureId} not found.`);
    }

    const dataString = JSON.stringify(currentCasebookData);
    const currentChecksum = crypto.createHash('sha256').update(dataString).digest('hex');
    if (currentChecksum !== signature.checksum) {
      return false;
    }

    const verify = crypto.createVerify('SHA256');
    verify.update(signature.checksum);
    return verify.verify(signature.publicKey, signature.signatureValue, 'base64');
  }

  public getSignaturesForSubject(subjectId: string): ElectronicSignature[] {
    return Array.from(this.signatures.values()).filter((sig) => sig.subjectId === subjectId);
  }
}