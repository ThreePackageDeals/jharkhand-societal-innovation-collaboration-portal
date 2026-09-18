import { createHmac, timingSafeEqual } from 'crypto';
import { ENV } from '../config/env';
import { logger } from '../utils/logger';

const BASE_URL = 'https://services.sheerid.com/rest/v2';

export class SheerIdService {
  async createVerification() {
    if (!ENV.SHEERID_API_KEY || !ENV.SHEERID_PROJECT_ID) {
      if (ENV.NODE_ENV === 'production') {
        throw new Error('SheerID is not configured');
      }
      const verificationId = `mock_${crypto.randomUUID()}`;
      return { verificationId, verificationUrl: undefined, mock: true };
    }

    const response = await fetch(`${BASE_URL}/verification`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ENV.SHEERID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ programId: ENV.SHEERID_PROJECT_ID }),
    });

    if (!response.ok) {
      logger.error(`SheerID verification creation failed: ${response.status} ${await response.text()}`);
      throw new Error('Unable to start student verification');
    }

    const result = await response.json() as { verificationId?: string };
    if (!result.verificationId) throw new Error('SheerID did not return a verification ID');

    return {
      verificationId: result.verificationId,
      verificationUrl: `https://services.sheerid.com/verify/${ENV.SHEERID_PROJECT_ID}/?verificationId=${encodeURIComponent(result.verificationId)}`,
      mock: false,
    };
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string | undefined) {
    if (!ENV.SHEERID_WEBHOOK_SECRET || !signature) return false;
    const expected = createHmac('sha256', ENV.SHEERID_WEBHOOK_SECRET).update(rawBody).digest('hex');
    const received = Buffer.from(signature, 'hex');
    const computed = Buffer.from(expected, 'hex');
    return received.length === computed.length && timingSafeEqual(received, computed);
  }

  async getVerificationDetails(verificationId: string) {
    if (!ENV.SHEERID_API_KEY) throw new Error('SheerID is not configured');
    const response = await fetch(`${BASE_URL}/verification/${encodeURIComponent(verificationId)}/details`, {
      headers: { Authorization: `Bearer ${ENV.SHEERID_API_KEY}` },
    });
    if (!response.ok) throw new Error('Unable to retrieve SheerID verification details');
    return response.json() as Promise<{ lastResponse?: { currentStep?: string } }>;
  }
}

export const sheerIdService = new SheerIdService();
