import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { prisma } from '../config/db';
import { ENV } from '../config/env';
import { emailService } from '../utils/email';
import { smsService } from './sms.service';

export type OtpChannel = 'email' | 'sms';

export class OtpService {
  static readonly TTL_MS = 10 * 60 * 1000;
  static readonly MAX_ATTEMPTS = 5;

  normalizeIdentifier(identifier: string): { identifier: string; channel: OtpChannel } {
    const value = identifier.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return { identifier: value.toLowerCase(), channel: 'email' };
    }

    const phone = value.replace(/[\s()-]/g, '');
    if (/^\+[1-9]\d{7,14}$/.test(phone)) {
      return { identifier: phone, channel: 'sms' };
    }

    throw new Error('Enter a valid email address or an E.164 phone number');
  }

  async sendOtp(rawIdentifier: string) {
    const { identifier, channel } = this.normalizeIdentifier(rawIdentifier);
    const otp = randomInt(100000, 1_000_000).toString();
    const expiresAt = new Date(Date.now() + OtpService.TTL_MS);

    await prisma.otpChallenge.upsert({
      where: { identifier },
      create: { identifier, otpHash: this.hash(otp), expiresAt },
      update: { otpHash: this.hash(otp), expiresAt, attempts: 0 },
    });

    if (channel === 'email') {
      await emailService.sendOtpEmail(identifier, otp);
    } else {
      await smsService.sendOtp(identifier, otp);
    }

    return { identifier, channel, expiresAt };
  }

  async verifyOtp(rawIdentifier: string, otp: string) {
    const { identifier, channel } = this.normalizeIdentifier(rawIdentifier);
    if (!/^\d{6}$/.test(otp)) return { valid: false, identifier, channel };

    const challenge = await prisma.otpChallenge.findUnique({ where: { identifier } });
    if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= OtpService.MAX_ATTEMPTS) {
      return { valid: false, identifier, channel };
    }

    const expected = Buffer.from(challenge.otpHash, 'hex');
    const actual = Buffer.from(this.hash(otp), 'hex');
    const valid = expected.length === actual.length && timingSafeEqual(expected, actual);

    if (!valid) {
      await prisma.otpChallenge.update({
        where: { identifier },
        data: { attempts: { increment: 1 } },
      });
      return { valid: false, identifier, channel };
    }

    await prisma.otpChallenge.delete({ where: { identifier } });
    return { valid: true, identifier, channel };
  }

  private hash(otp: string) {
    return createHmac('sha256', ENV.JWT_SECRET).update(otp).digest('hex');
  }
}

export const otpService = new OtpService();
