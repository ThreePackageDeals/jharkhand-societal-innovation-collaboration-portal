import { ENV } from '../config/env';
import { logger } from '../utils/logger';

export class SmsService {
  async sendOtp(to: string, otp: string) {
    const { TWILIO_ACCOUNT_SID: accountSid, TWILIO_AUTH_TOKEN: authToken, TWILIO_PHONE_NUMBER: from } = ENV;
    const message = `Your Jharkhand Innovation Portal verification code is ${otp}. It expires in 10 minutes.`;

    if (!accountSid || !authToken || !from) {
      logger.info(`[MOCK SMS] To: ${to} | Message: ${message}`);
      return { success: true, mock: true };
    }

    const form = new URLSearchParams({ To: to, From: from, Body: message });
    const authorization = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authorization}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form,
      },
    );

    if (!response.ok) {
      const details = await response.text();
      logger.error(`Twilio OTP delivery failed: ${response.status} ${details}`);
      throw new Error('Unable to send SMS verification code');
    }

    const result = await response.json() as { sid: string };
    logger.info(`SMS OTP sent: ${result.sid}`);
    return { success: true, messageId: result.sid };
  }
}

export const smsService = new SmsService();
