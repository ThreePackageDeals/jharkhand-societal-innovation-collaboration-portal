import { Router } from 'express';
import { ENV } from '../../config/env';
import { authService } from './auth.service';
import { sendResponse, sendError } from '../../utils/apiResponse';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { authRateLimiter, strictRateLimiter } from '../../middleware/rateLimit';
import { googleOAuthService } from '../../services/google-oauth.service';

const router = Router();

router.use(authRateLimiter);

const googleStateCookie = 'google_oauth_state';

const readCookie = (cookieHeader: string | undefined, name: string) => {
  const value = cookieHeader?.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.slice(name.length + 1)) : undefined;
};

const redirectToAuth = (res: any, parameter: 'google_token' | 'google_error', value: string) => {
  const url = new URL('/auth', ENV.APP_URL || `http://localhost:${ENV.PORT}`);
  url.hash = new URLSearchParams({ [parameter]: value }).toString();
  return res.redirect(url.toString());
};

router.get('/google', (req, res) => {
  try {
    const state = authService.createGoogleOAuthState();
    res.cookie(googleStateCookie, state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: ENV.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000,
      path: '/api/auth/google',
    });
    return res.redirect(googleOAuthService.createAuthorizationUrl(state));
  } catch (err: any) {
    return redirectToAuth(res, 'google_error', err.message);
  }
});

router.get('/google/link', authenticate, (req: AuthRequest, res) => {
  try {
    if (!req.user?.userId || req.user.userId === 'dev-user-id') {
      throw new Error('A registered account is required to link Google');
    }
    const state = authService.createGoogleOAuthState('google-link', req.user.userId);
    res.cookie(googleStateCookie, state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: ENV.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000,
      path: '/api/auth/google',
    });
    return res.redirect(googleOAuthService.createAuthorizationUrl(state));
  } catch (err: any) {
    return redirectToAuth(res, 'google_error', err.message);
  }
});

router.get('/google/callback', async (req, res) => {
  res.clearCookie(googleStateCookie, { path: '/api/auth/google' });
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : undefined;
    const state = typeof req.query.state === 'string' ? req.query.state : undefined;
    const cookieState = readCookie(req.headers.cookie, googleStateCookie);
    const statePayload = state ? authService.readGoogleOAuthState(state) : null;
    if (!code || !state || state !== cookieState || !statePayload) {
      throw new Error('Google sign-in session is invalid or has expired');
    }
    const googleUser = await googleOAuthService.getVerifiedUser(code);
    if (statePayload.purpose === 'google-link') {
      if (!statePayload.userId) throw new Error('Google linking session is invalid');
      await authService.linkGoogleAccount(statePayload.userId, googleUser.email, googleUser.subject);
      return res.redirect(new URL('/', ENV.APP_URL || `http://localhost:${ENV.PORT}`).toString());
    }
    const accessToken = await authService.loginWithGoogle(googleUser.email, googleUser.subject, googleUser.name);
    return redirectToAuth(res, 'google_token', accessToken);
  } catch (err: any) {
    return redirectToAuth(res, 'google_error', err.message || 'Google sign-in failed');
  }
});

router.post('/send-otp', strictRateLimiter, async (req, res) => {
  try {
    if (typeof req.body.identifier !== 'string') throw new Error('An email address or phone number is required');
    const result = await authService.sendOtp(req.body.identifier);
    sendResponse(res, { channel: result.channel, expiresAt: result.expiresAt }, 200, 'Verification code sent');
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
});

router.post('/verify-otp', strictRateLimiter, async (req, res) => {
  try {
    if (typeof req.body.identifier !== 'string' || typeof req.body.otp !== 'string') {
      throw new Error('Identifier and verification code are required');
    }
    const result = await authService.verifyOtp(
      req.body.identifier,
      req.body.otp,
      typeof req.body.registrationToken === 'string' ? req.body.registrationToken : undefined,
    );
    if (!result.valid) return sendError(res, 'Invalid, expired, or already used verification code', 400, 'INVALID_OTP');
    sendResponse(res, result, 200, 'Verification code confirmed');
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
});

router.post('/complete-profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : '';
    const registration = authService.verifyRegistrationToken(token);
    if (req.body.email?.trim().toLowerCase() !== registration.email || req.body.phone?.trim().replace(/[\s()-]/g, '') !== registration.phone) {
      throw new Error('Profile contact details do not match the verified email and phone number');
    }
    const userId = registration.userId!;
    const result = await authService.completeProfile(userId, req.body);
    sendResponse(res, result, 200, 'Profile completed successfully');
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
});

router.post('/verify-sheerid', async (req, res) => {
  try {
    const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
    if (!rawBody) throw new Error('Missing webhook payload');
    const signature = req.header('X-SheerID-Signature') || undefined;
    const result = await authService.processSheerIdWebhook(rawBody, signature, req.body);
    sendResponse(res, result, 200);
  } catch (err: any) {
    sendError(res, err.message, err.message.includes('signature') ? 401 : 400);
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  try {
    const authHeader = req.headers.authorization;
    const useDevUser = !authHeader || authHeader === 'Bearer dev-bypass-token';
    const user = await authService.getMe(userId, useDevUser);
    sendResponse(res, user);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

export default router;
