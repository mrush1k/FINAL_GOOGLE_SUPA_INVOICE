import crypto from 'crypto';

// OAuth State Management
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// Token Encryption/Decryption
const ENCRYPTION_KEY = process.env.OAUTH_ENCRYPTION_KEY || 'default-key-change-in-production';

export function encryptToken(token: string): string {
  if (!token) return '';
  
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptToken(encryptedToken: string): string {
  if (!encryptedToken) return '';
  
  try {
    const [ivHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt token:', error);
    return '';
  }
}

// OAuth URLs and Scopes
export const OAUTH_CONFIG = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid profile email',
  },
  microsoft: {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    scope: 'openid profile email User.Read',
  },
  apple: {
    authUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    scope: 'name email',
  },
};

// Google OAuth Functions
export function buildGoogleAuthUrl(redirectUri: string, state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: OAUTH_CONFIG.google.scope,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
  });

  return `${OAUTH_CONFIG.google.authUrl}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string, redirectUri: string, codeVerifier: string) {
  const response = await fetch(OAUTH_CONFIG.google.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  return response.json();
}

export async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch(`${OAUTH_CONFIG.google.userInfoUrl}?access_token=${accessToken}`);
  return response.json();
}

// Microsoft OAuth Functions
export function buildMicrosoftAuthUrl(redirectUri: string, state: string, codeChallenge: string): string {
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: OAUTH_CONFIG.microsoft.scope,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeMicrosoftCode(code: string, redirectUri: string, codeVerifier: string) {
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  return response.json();
}

export async function getMicrosoftUserInfo(accessToken: string) {
  const response = await fetch(OAUTH_CONFIG.microsoft.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.json();
}

// Apple OAuth Functions (requires JWT signing)
export function buildAppleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: OAUTH_CONFIG.apple.scope,
    response_mode: 'form_post',
    state: state,
  });

  return `${OAUTH_CONFIG.apple.authUrl}?${params.toString()}`;
}

export function createAppleClientSecret(): string {
  // For Apple Sign In, we need to create a JWT token as the client secret
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: 'ES256',
    kid: process.env.APPLE_KEY_ID!,
  };

  const payload = {
    iss: process.env.APPLE_TEAM_ID!,
    iat: now,
    exp: now + 3600, // 1 hour
    aud: 'https://appleid.apple.com',
    sub: process.env.APPLE_CLIENT_ID!,
  };

  // Note: This is a simplified version. In production, you'd need to properly sign the JWT
  // with the ES256 algorithm using the Apple private key
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  // This would need proper ES256 signing with the private key
  // For now, returning a placeholder that indicates proper JWT signing is needed
  return `${headerB64}.${payloadB64}.SIGNATURE_REQUIRED`;
}

export async function exchangeAppleCode(code: string, redirectUri: string) {
  const clientSecret = createAppleClientSecret();
  
  const response = await fetch(OAUTH_CONFIG.apple.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.APPLE_CLIENT_ID!,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  return response.json();
}

export function decodeAppleIdToken(idToken: string) {
  // Decode JWT payload (without signature verification for demo)
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid Apple ID token format');
  }
  
  const payload = Buffer.from(parts[1], 'base64url').toString();
  return JSON.parse(payload);
}

// Utility function to check if tokens need refresh
export function isTokenExpired(tokenExpiry: Date | null): boolean {
  if (!tokenExpiry) return true;
  return new Date() >= new Date(tokenExpiry.getTime() - 5 * 60 * 1000); // 5 minutes buffer
}

// Base URL helper
export function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // Production fallback
  return 'http://localhost:3000';
}