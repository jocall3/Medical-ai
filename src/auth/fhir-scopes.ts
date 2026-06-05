export interface ParsedScope {
  raw: string;
  context: 'patient' | 'user' | 'system' | 'launch' | 'openid' | 'fhirUser' | 'offline_access' | 'online_access' | 'unknown';
  resource: string;
  action: 'read' | 'write' | '*' | 'all';
}

export class FhirScopeParser {
  public static parse(scopesString: string): ParsedScope[] {
    const scopes = scopesString.split(/\s+/).filter(Boolean);
    return scopes.map((scope) => this.parseSingleScope(scope));
  }

  private static parseSingleScope(scope: string): ParsedScope {
    if (scope === 'launch' || scope.startsWith('launch/')) {
      return { raw: scope, context: 'launch', resource: '*', action: 'all' };
    }
    if (scope === 'openid') {
      return { raw: scope, context: 'openid', resource: '*', action: 'all' };
    }
    if (scope === 'fhirUser') {
      return { raw: scope, context: 'fhirUser', resource: '*', action: 'all' };
    }
    if (scope === 'offline_access' || scope === 'online_access') {
      return { raw: scope, context: scope as 'offline_access' | 'online_access', resource: '*', action: 'all' };
    }

    const match = scope.match(/^(patient|user|system)\/([A-Za-z*]+)\.([a-z*]+)$/);
    if (match) {
      const [, context, resource, action] = match;
      return {
        raw: scope,
        context: context as 'patient' | 'user' | 'system',
        resource,
        action: action as 'read' | 'write' | '*',
      };
    }

    return { raw: scope, context: 'unknown', resource: '*', action: 'all' };
  }

  public static hasPermission(
    userScopes: string[],
    required: {
      context: 'patient' | 'user' | 'system';
      resource: string;
      action: 'read' | 'write';
    }
  ): boolean {
    const parsedScopes = this.parse(userScopes.join(' '));

    return parsedScopes.some((scope) => {
      const contextMatches = scope.context === required.context || scope.context === 'system';
      if (!contextMatches) return false;

      const resourceMatches = scope.resource === '*' || scope.resource === required.resource;
      if (!resourceMatches) return false;

      const actionMatches = scope.action === '*' || scope.action === required.action;
      return actionMatches;
    });
  }
}