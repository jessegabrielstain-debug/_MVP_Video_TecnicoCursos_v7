
/**
 * SPRINT 34 - SSO/SAML AUTHENTICATION
 * Enterprise Single Sign-On with SAML 2.0
 */

export interface SAMLProvider {
  id: string;
  name: string;
  entityId: string;
  ssoUrl: string;
  x509cert: string;
  enabled: boolean;
}

export interface SAMLUser {
  nameID: string;
  email: string;
  firstName?: string;
  lastName?: string;
  attributes: Record<string, unknown>;
}

/**
 * Supported SSO providers configuration
 */
export const SSO_PROVIDERS = {
  okta: {
    name: 'Okta',
    authorizationUrl: 'https://{{domain}}/oauth2/v1/authorize',
    tokenUrl: 'https://{{domain}}/oauth2/v1/token',
    userInfoUrl: 'https://{{domain}}/oauth2/v1/userinfo',
  },
  azure: {
    name: 'Azure AD',
    authorizationUrl: 'https://login.microsoftonline.com/{{tenantId}}/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/{{tenantId}}/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
  },
  google: {
    name: 'Google Workspace',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v1/userinfo',
  },
};

/**
 * SAML Service Provider Configuration
 */
export class SAMLServiceProvider {
  private entityId: string;
  private callbackUrl: string;
  private privateKey?: string;
  private certificate?: string;

  constructor() {
    this.entityId = process.env.SAML_ENTITY_ID || 'estudio-ia-videos';
    this.callbackUrl = process.env.SAML_CALLBACK_URL || 'https://treinx.abacusai.app/api/auth/saml/callback';
    this.privateKey = process.env.SAML_PRIVATE_KEY;
    this.certificate = process.env.SAML_CERTIFICATE;
  }

  /**
   * Generate SAML AuthN Request
   */
  generateAuthRequest(provider: SAMLProvider, relayState?: string): string {
    const requestId = `_${this.generateId()}`;
    const timestamp = new Date().toISOString();

    const authRequest = `<?xml version="1.0"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="${requestId}"
                    Version="2.0"
                    IssueInstant="${timestamp}"
                    Destination="${provider.ssoUrl}"
                    AssertionConsumerServiceURL="${this.callbackUrl}"
                    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${this.entityId}</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
                      AllowCreate="true"/>
  <samlp:RequestedAuthnContext Comparison="exact">
    <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
  </samlp:RequestedAuthnContext>
</samlp:AuthnRequest>`;

    return Buffer.from(authRequest).toString('base64');
  }

  /**
   * Parse and validate SAML Response
   */
  async validateResponse(
    samlResponse: string,
    provider: SAMLProvider
  ): Promise<SAMLUser> {
    try {
      // Decode base64 response
      const decodedResponse = Buffer.from(samlResponse, 'base64').toString('utf-8');

      // In production, we would:
      // 1. Validate XML signature using provider's certificate
      // 2. Check timestamps and expiration
      // 3. Verify audience restriction matches our entity ID
      // 4. Extract user attributes from assertion

      // For now, we'll do basic parsing
      const user = this.parseUserFromResponse(decodedResponse);

      return user;
    } catch (error) {
      console.error('SAML response validation failed:', error);
      throw new Error('Invalid SAML response');
    }
  }

  private parseUserFromResponse(response: string): SAMLUser {
    // Simplified parsing - in production use proper XML parser and validation
    const emailMatch = response.match(/<saml:Attribute Name="email"[^>]*>.*?<saml:AttributeValue>([^<]+)<\/saml:AttributeValue>/);
    const firstNameMatch = response.match(/<saml:Attribute Name="firstName"[^>]*>.*?<saml:AttributeValue>([^<]+)<\/saml:AttributeValue>/);
    const lastNameMatch = response.match(/<saml:Attribute Name="lastName"[^>]*>.*?<saml:AttributeValue>([^<]+)<\/saml:AttributeValue>/);

    return {
      nameID: emailMatch?.[1] || '',
      email: emailMatch?.[1] || '',
      firstName: firstNameMatch?.[1],
      lastName: lastNameMatch?.[1],
      attributes: {},
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Get SP metadata XML
   */
  getMetadata(): string {
    return `<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
                     entityID="${this.entityId}">
  <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                 Location="${this.callbackUrl}"
                                 index="0"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
  }
}

/**
 * OAuth 2.0 / OpenID Connect helper
 */
export class OAuthHelper {
  static generateAuthUrl(
    provider: keyof typeof SSO_PROVIDERS,
    config: { clientId: string; redirectUri: string; state: string }
  ): string {
    const providerConfig = SSO_PROVIDERS[provider];
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state: config.state,
    });

    let authUrl = providerConfig.authorizationUrl;
    
    // Replace template variables
    if (provider === 'okta') {
      authUrl = authUrl.replace('{{domain}}', process.env.OKTA_DOMAIN || '');
    } else if (provider === 'azure') {
      authUrl = authUrl.replace('{{tenantId}}', process.env.AZURE_TENANT_ID || '');
    }

    return `${authUrl}?${params.toString()}`;
  }

  static async exchangeCodeForToken(
    provider: keyof typeof SSO_PROVIDERS,
    code: string,
    config: { clientId: string; clientSecret: string; redirectUri: string }
  ): Promise<any> {
    const providerConfig = SSO_PROVIDERS[provider];
    let tokenUrl = providerConfig.tokenUrl;

    // Replace template variables
    if (provider === 'okta') {
      tokenUrl = tokenUrl.replace('{{domain}}', process.env.OKTA_DOMAIN || '');
    } else if (provider === 'azure') {
      tokenUrl = tokenUrl.replace('{{tenantId}}', process.env.AZURE_TENANT_ID || '');
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error('Token exchange failed');
    }

    return await response.json();
  }
}
