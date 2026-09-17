import { GoogleGenAI } from '@google/genai';
import { ENV } from '../config/env';
import { logger } from './logger';

class GeminiClient {
  private client: GoogleGenAI | null = null;

  constructor() {
    if (!ENV.GEMINI_API_KEY) {
      logger.warn('Gemini API Key not found. AI features will be disabled or use fallback.');
    } else {
      this.client = new GoogleGenAI({
        apiKey: ENV.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'jharkhand-innovation-portal',
          },
        },
      });
    }
  }

  public async generateContent(prompt: string, modelName = 'gemini-3.6-flash') {
    if (!this.client) {
      throw new Error('Gemini client not initialized. Check your API key.');
    }
    const response = await this.client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    return response.text || '{}';
  }

  public async embedContent(text: string, modelName = 'text-embedding-004') {
    if (!this.client) {
      throw new Error('Gemini client not initialized. Check your API key.');
    }
    const response: any = await this.client.models.embedContent({
      model: modelName,
      contents: [{ parts: [{ text }] }],
    });
    return response?.embeddings?.[0]?.values ?? [];
  }

  public isConfigured(): boolean {
    return !!this.client;
  }
}

export const gemini = new GeminiClient();
