import { AudioTranscriptionConfigMode, GoogleGenAI } from '@google/genai';
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

    const generate = async (model: string) => {
      const response = await this.client!.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      return response.text || '{}';
    };

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await generate(modelName);
      } catch (err: any) {
        const status = err?.status ?? err?.error?.code;
        const isUnavailable = status === 503 || /\"code\":503/.test(err?.message || '');
        if (!isUnavailable || attempt === 2) {
          throw err;
        }

        const retryDelayMs = 500 * (attempt + 1);
        logger.warn(`Gemini model ${modelName} is temporarily unavailable; retrying in ${retryDelayMs}ms.`);
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }

    throw new Error('Gemini generation retries were exhausted.');
  }

  public async embedContent(text: string, modelName = 'gemini-embedding-2') {
    if (!this.client) {
      throw new Error('Gemini client not initialized. Check your API key.');
    }
    const response: any = await this.client.models.embedContent({
      model: modelName,
      contents: [{ parts: [{ text }] }],
    });
    return response?.embeddings?.[0]?.values ?? [];
  }

  public async transcribeAudio(audioBase64: string, mimeType: string) {
    if (!this.client) {
      throw new Error('Gemini client not initialized. Check your API key.');
    }

    const response = await this.client.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: [{
        inlineData: {
          data: audioBase64,
          mimeType,
        },
      }],
      config: {
        audioTranscriptionConfig: {
          mode: AudioTranscriptionConfigMode.SMART,
        },
      },
    });

    // Dedicated transcription models can return text in an audioTranscription
    // part instead of the regular text part exposed by response.text.
    const structuredTranscript = response.candidates
      ?.flatMap((candidate) => candidate.content?.parts || [])
      .map((part) => part.audioTranscription?.text)
      .filter((text): text is string => Boolean(text))
      .join(' ');

    return (structuredTranscript || response.text || '').trim();
  }

  public isConfigured(): boolean {
    return !!this.client;
  }
}

export const gemini = new GeminiClient();
