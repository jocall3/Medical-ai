import * as jose from 'jose';

export interface TokenValidationResult {
  isValid: boolean;
  payload?: jose.JWTPayload & {
    fhirUser?: string;
    patient?: string;
    encounter?: string;
    scope?: string;
  };
  error?: string;
}

export class TokenValidator {
  private jwksUri: string;
  private issuer: string;
  private audience: string;
  private jwksKeystore: any;

  constructor(config: { jwksUri: string; issuer: string; audience: string }) {
    this.jwksUri = config.jwksUri;
    this.issuer = config.issuer;
    this.audience = config.audience;
    this.jwksKeystore = jose.createRemoteJWKSet(new URL(this.jwksUri));
  }

  public async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      const { payload } = await jose.jwtVerify(token, this.jwksKeystore, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['RS256', 'ES256'],
      });

      return {
        isValid: true,
        payload: payload as TokenValidationResult['payload'],
      };
    } catch (error) {
      return {
        isValid: false,
        error: (error as Error).message,
      };
    } 
  }

  public decodeWithoutVerification(token: string): jose.JWTPayload | null {
    try {
      return jose.decodeJwt(token);
    } catch {
      return null;
    }
  }
}