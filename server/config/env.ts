import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.AI_API_KEY,
  AI_API_KEY: process.env.AI_API_KEY || process.env.GEMINI_API_KEY,
  JWT_SECRET: process.env.JWT_SECRET || 'hackathon-secret-key-2026',
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  SHEERID_API_KEY: process.env.SHEERID_API_KEY,
  SHEERID_PROJECT_ID: process.env.SHEERID_PROJECT_ID,
  SHEERID_WEBHOOK_SECRET: process.env.SHEERID_WEBHOOK_SECRET,
  ENABLE_STUDENT_DOMAIN_FAST_TRACK: process.env.ENABLE_STUDENT_DOMAIN_FAST_TRACK === 'true',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  APP_URL: process.env.APP_URL,
} as const;

if (!ENV.DATABASE_URL) {
  console.warn('⚠️ WARNING: DATABASE_URL is not defined in .env');
}
