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
    } else {
      logger.warn('Email configuration missing. Emails will be logged instead of sent.');
    }
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
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
    );
  }
}

export const emailService = new EmailService();
