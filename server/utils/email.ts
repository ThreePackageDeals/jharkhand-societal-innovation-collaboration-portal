import nodemailer from 'nodemailer';
import { ENV } from '../config/env';
import { logger } from './logger';

export class EmailService {
  private transporter;

  constructor() {
    if (ENV.EMAIL_HOST && ENV.EMAIL_USER && ENV.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: ENV.EMAIL_HOST,
        port: Number(ENV.EMAIL_PORT) || 587,
        secure: ENV.EMAIL_PORT === '465',
        auth: {
          user: ENV.EMAIL_USER,
          pass: ENV.EMAIL_PASS,
        },
      });
    } else if (!ENV.RESEND_API_KEY || !ENV.RESEND_FROM_EMAIL) {
      logger.warn('Email configuration missing. Emails will be logged instead of sent.');
    }
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    if (ENV.RESEND_API_KEY && ENV.RESEND_FROM_EMAIL) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ENV.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: ENV.RESEND_FROM_EMAIL,
            to: [to],
            subject,
            text,
            ...(html ? { html } : {}),
          }),
        });

        const result = await response.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
        if (!response.ok) {
          throw new Error(result.message || result.name || `Resend request failed with status ${response.status}`);
        }

        logger.info(`Email sent via Resend: ${result.id || 'accepted'}`);
        return { success: true, messageId: result.id };
      } catch (error) {
        logger.error('Failed to send email via Resend:', error);
        throw error;
      }
    }

    if (!this.transporter) {
      logger.info(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Body: ${text}`);
      return { success: true, mock: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${ENV.EMAIL_FROM_NAME || 'Jharkhand Innovation Portal'}" <${ENV.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });
      logger.info(`Email sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendOtpEmail(to: string, otp: string) {
    return this.sendEmail(
      to,
      'Your Jharkhand Innovation Portal verification code',
      `Your verification code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
      `<p>Your Jharkhand Innovation Portal verification code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:6px">${otp}</p><p>This code expires in 10 minutes. Do not share it with anyone.</p>`,
    );
  }
}

export const emailService = new EmailService();
