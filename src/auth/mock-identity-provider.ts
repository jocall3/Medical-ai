import * as jose from 'jose';

export class MockIdentityProvider {
  private privateKey!: jose.KeyLike;
  private publicKey!: jose.KeyLike;
  private issuer: string;
  private audience: string;

  constructor(issuer = 'https://mock-ehr.local/oauth2', audience = 'https://api.medical-ai.local') {
    this.issuer = issuer;
    this.audience = audience;
  }

  public async initialize(): Promise<void> {
    const { privateKey, publicKey } = await jose.generateKeyPair('RS256', {
      modulusLength: 2048,
    });
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  public getSmartConfiguration() {
    return {
      issuer: this.issuer,
      authorization_endpoint: `${this.issuer}/authorize`,
      token_endpoint: `${this.issuer}/token`,
      jwks_uri: `${this.issuer}/keys`,
      scopes_supported: [
        'openid',
        'fhirUser',
        'launch',
        'patient/*.read',
        'patient/*.write',
        'user/*.read',
        'user/*.write',
        'offline_access',
      ],
      response_types_supported: ['code'],
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
    };
  }

  public async getJwks() {
    const jwk = await jose.exportJWK(this.publicKey);
    return {
      keys: [
        {
          ...jwk,
          kid: 'mock-key-id-1',
          use: 'sig',
          alg: 'RS256',
        },
      ],
    };
  }

  public async generateMockToken(options: {
    userId: string;
    patientId?: string;
    encounterId?: string;
    scopes: string[];
    expiresInSeconds?: number;
  }): Promise<string> {
    const exp = Math.floor(Date.now() / 1000) + (options.expiresInSeconds || 3600);

    return new jose.SignJWT({
      fhirUser: `Practitioner/${options.userId}`,
      patient: options.patientId,
      encounter: options.encounterId,
      scope: options.scopes.join(' '),
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'mock-key-id-1' })
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setIssuedAt()
      .setExpirationTime(exp)
      .sign(this.privateKey);
  }

  public handleAuthorize(reqQuery: any): { code: string; state: string } {
    const { state, redirect_uri, client_id } = reqQuery;
    if (!state || !redirect_uri || !client_id) {
      throw new Error('Missing required authorization parameters');
    }
    const code = `mock_code_${Math.random().toString(36).substring(2, 15)}`;
    return { code, state };
  }

  public async handleTokenExchange(reqBody: any): Promise<any> {
    const { grant_type, code } = reqBody;
    if (grant_type !== 'authorization_code') {
      throw new Error('Unsupported grant type');
    }
    if (!code || !code.startsWith('mock_code_')) {
      throw new Error('Invalid authorization code');
    }

    const patientId = 'pat-99281';
    const encounterId = 'enc-44102';
    const scopes = ['openid', 'fhirUser', 'patient/*.read', 'patient/*.write'];

    const accessToken = await this.generateMockToken({
      userId: 'practitioner-102',
      patientId,
      encounterId,
      scopes,
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: scopes.join(' '),
      patient: patientId,
      encounter: encounterId,
      need_patient_banner: true,
    };
  }
}