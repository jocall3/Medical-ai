import * as crypto from 'crypto';
import axios from 'axios';

export interface SmartLaunchContext {
  patient?: string;
  encounter?: string;
  needPatientBanner?: boolean;
  smartStyleUrl?: string;
  tenant?: string;
}

export interface TokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  scope: string;
  expires_in: number;
  patient?: string;
  encounter?: string;
  need_patient_banner?: boolean;
}

export class SmartFhirAuthClient {
  private clientId: string;
  private redirectUri: string;
  private authEndpoint: string;
  private tokenEndpoint: string;

  constructor(config: {
    clientId: string;
    redirectUri: string;
    authEndpoint: string;
    tokenEndpoint: string;
  }) {
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    this.authEndpoint = config.authEndpoint;
    this.tokenEndpoint = config.tokenEndpoint;
  }

  public generatePkce(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    return { codeVerifier, codeChallenge };
  }

  public buildAuthUrl(options: {
    scopes: string[];
    state: string;
    codeChallenge: string;
    launch?: string;
    iss?: string;
  }): string {
    const url = new URL(this.authEndpoint);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.redirectUri);
    url.searchParams.set('scope', options.scopes.join(' '));
    url.searchParams.set('state', options.state);
    url.searchParams.set('code_challenge', options.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');

    if (options.launch) {
      url.searchParams.set('launch', options.launch);
    }
    if (options.iss) {
      url.searchParams.set('aud', options.iss);
    }

    return url.toString();
  }

  public async exchangeCodeForToken(options: {
    code: string;
    codeVerifier: string;
    clientSecret?: string;
  }): Promise<TokenResponse> {
    const params = new URLSearchParams();
    params.set('grant_type', 'authorization_code');
    params.set('code', options.code);
    params.set('redirect_uri', this.redirectUri);
    params.set('client_id', this.clientId);
    params.set('code_verifier', options.codeVerifier);

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (options.clientSecret) {
      const credentials = Buffer.from(`${this.clientId}:${options.clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const response = await axios.post<TokenResponse>(this.tokenEndpoint, params.toString(), { headers });
    return response.data;
  }

  public async refreshAccessToken(options: {
    refreshToken: string;
    clientSecret?: string;
  }): Promise<TokenResponse> {
    const params = new URLSearchParams();
    params.set('grant_type', 'refresh_token');
    params.set('refresh_token', options.refreshToken);
    params.set('client_id', this.clientId);

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (options.clientSecret) {
      const credentials = Buffer.from(`${this.clientId}:${options.clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const response = await axios.post<TokenResponse>(this.tokenEndpoint, params.toString(), { headers });
    return response.data;
  }

  public extractLaunchContext(tokenResponse: TokenResponse): SmartLaunchContext {
    return {
      patient: tokenResponse.patient,
      encounter: tokenResponse.encounter,
      needPatientBanner: tokenResponse.need_patient_banner,
    };
  }
}