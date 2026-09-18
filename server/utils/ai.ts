import { AudioTranscriptionConfigMode, GoogleGenAI } from '@google/genai';
import { ENV } from '../config/env';
import { logger } from './logger';

export class AIClient {
  private client: GoogleGenAI | null = null;

  constructor() {
    if (!ENV.AI_API_KEY) {
      logger.warn('AI API Key not found. AI features will be disabled or use fallback.');
    } else {
      this.client = new GoogleGenAI({
        apiKey: ENV.AI_API_KEY,
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
      throw new Error('AI client not initialized. Check your API key.');
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
        logger.warn(`AI model ${modelName} is temporarily unavailable; retrying in ${retryDelayMs}ms.`);
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }

    throw new Error('AI generation retries were exhausted.');
  }

  public async embedContent(text: string, modelName = 'gemini-embedding-2') {
    if (!this.client) {
      throw new Error('AI client not initialized. Check your API key.');
    }
    const response: any = await this.client.models.embedContent({
      model: modelName,
      contents: [{ parts: [{ text }] }],
    });
    return response?.embeddings?.[0]?.values ?? [];
  }

  public async transcribeAudio(audioBase64: string, mimeType: string) {
    if (!this.client) {
      throw new Error('AI client not initialized. Check your API key.');
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

    const transcript = (structuredTranscript || response.text || '').trim();
    return transcript ? this.translateSpeechToEnglish(transcript) : '';
  }

  /**
   * Gemini's transcription model intentionally returns what it hears, which
   * may be Hindi, another local language, or a phonetic Latin transliteration.
   * Challenge fields are stored and processed in English, so normalize that
   * speech before it reaches the client.
   */
  private async translateSpeechToEnglish(transcript: string): Promise<string> {
    if (!this.client) return transcript;

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Translate the following voice transcription into clear, natural English for a Jharkhand community challenge form.

Rules:
- Detect the source language yourself. It may be Hindi, Santali, Bengali, Urdu, or another Indian language, written in its native script or phonetically in Latin characters.
- Translate the meaning; never return a pronunciation, transliteration, or explanation.
- Preserve names, official place names, addresses, measurements, and phone numbers as faithfully as possible.
- Keep the wording concise and appropriate for a form field.
- If it is already English, return it unchanged except for obvious punctuation or grammar cleanup.
- Return only the final English text, with no quotes, labels, or commentary.

Voice transcription:
${transcript}`,
        config: { responseMimeType: 'text/plain' },
      });

      return (response.text || transcript).trim();
    } catch (error: any) {
      // Do not discard a valid transcription if the optional translation pass
      // is briefly unavailable; the user can still edit the field manually.
      logger.warn(`Voice translation failed; returning the original transcript: ${error.message}`);
      return transcript;
    }
  }

  public async verifyImage(
    imageBase64: string,
    mimeType: string,
    context: { title?: string; description?: string; domain?: string; district?: string },
    modelName = 'gemini-3.6-flash'
  ): Promise<{
    isValid: boolean;
    confidence: number;
    imageSummary: string;
    relevanceExplanation: string;
    detectedElements: string[];
    qualityScore: number;
  }> {
    if (!this.client) {
      throw new Error('AI client not initialized. Check your API key.');
    }

    const prompt = `You are the AI Ground-Evidence Verification Auditor for the Jharkhand Societal Innovation Collaboration Portal.
Examine this uploaded image carefully and evaluate its visual content:

Problem Context (if provided):
- Title: "${context.title || 'General Community Problem'}"
- Description: "${context.description || 'Grassroots issue in Jharkhand'}"
- Domain/Theme: "${context.domain || 'Not specified'}"
- District: "${context.district || 'Jharkhand'}"

Your Analysis Task:
1. What is literally shown in this image? Provide a detailed and specific description of the physical scene, objects, conditions, or environment.
2. Is this authentic field evidence (e.g. damaged infrastructure, agriculture, dry waterbed, waste, school, hospital, village conditions) or is it an invalid/irrelevant image (e.g. solid color canvas, random meme, screenshot of video game, cartoon, irrelevant personal selfie)?
3. Does it plausibly corroborate or relate to the reported challenge?

Return a STRICT JSON object in this exact schema:
{
  "isValid": true or false,
  "confidence": (number between 60 and 99),
  "imageSummary": "1-2 sentence specific description of what is visible in the photograph",
  "relevanceExplanation": "Clear explanation of how the visual evidence relates to the societal challenge or why it was rejected",
  "detectedElements": ["specific object 1", "specific object 2", "specific object 3"],
  "qualityScore": (number between 50 and 100)
}`;

    logger.info(`[AI Image Verification] Analyzing image (${mimeType}, ~${Math.round((imageBase64.length * 3) / 4 / 1024)} KB) with ${modelName}...`);

    const generate = async (model: string) => {
      const response = await this.client!.models.generateContent({
        model,
        contents: [
          {
            inlineData: {
              data: imageBase64,
              mimeType,
            },
          },
          prompt,
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });
      return response.text || '{}';
    };

    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const text = await generate(modelName);
        const parsed = JSON.parse(text);
        const result = {
          isValid: Boolean(parsed.isValid),
          confidence: Number(parsed.confidence) || 85,
          imageSummary: String(parsed.imageSummary || 'Image evidence analyzed'),
          relevanceExplanation: String(parsed.relevanceExplanation || 'Visual evidence reviewed'),
          detectedElements: Array.isArray(parsed.detectedElements) ? parsed.detectedElements : [],
          qualityScore: Number(parsed.qualityScore) || 80,
        };
        logger.info(`[AI Image Verification] Success: isValid=${result.isValid}, confidence=${result.confidence}%, summary="${result.imageSummary}"`);
        return result;
      } catch (err: any) {
        const status = err?.status ?? err?.error?.code;
        const isUnavailable = status === 503 || /\"code\":503/.test(err?.message || '');
        if (!isUnavailable || attempt === 3) {
          throw err;
        }

        const retryDelayMs = 700 * (attempt + 1);
        logger.warn(`AI model ${modelName} is temporarily unavailable for image verification; retrying in ${retryDelayMs}ms.`);
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }

    throw new Error('AI image verification retries were exhausted.');
  }

  public isConfigured(): boolean {
    return !!this.client;
  }
}

export const ai = new AIClient();
