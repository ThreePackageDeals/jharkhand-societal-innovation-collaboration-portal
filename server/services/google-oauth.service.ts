import { ENV } from '../config/env';

interface GoogleTokenResponse {
  access_token?: string;
}

interface GoogleUserInfo {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

export class GoogleOAuthService {
  get configured() {
    return Boolean(ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET && ENV.GOOGLE_REDIRECT_URI);
  }

  createAuthorizationUrl(state: string) {
    if (!this.configured) throw new Error('Google OAuth is not configured');
    const params = new URLSearchParams({
      client_id: ENV.GOOGLE_CLIENT_ID!,
      redirect_uri: ENV.GOOGLE_REDIRECT_URI!,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async getVerifiedUser(code: string) {
    if (!this.configured) throw new Error('Google OAuth is not configured');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: ENV.GOOGLE_CLIENT_ID!,
        client_secret: ENV.GOOGLE_CLIENT_SECRET!,
        redirect_uri: ENV.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenResponse.ok) throw new Error('Google sign-in could not be completed');

    const tokens = await tokenResponse.json() as GoogleTokenResponse;
    if (!tokens.access_token) throw new Error('Google did not return an access token');
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileResponse.ok) throw new Error('Could not retrieve your Google account information');

    const profile = await profileResponse.json() as GoogleUserInfo;
    if (!profile.sub || !profile.email || profile.email_verified !== true) {
      throw new Error('A verified Google email address is required');
    }
    return { subject: profile.sub, email: profile.email.toLowerCase(), name: profile.name };
  }
}

export const googleOAuthService = new GoogleOAuthService();
