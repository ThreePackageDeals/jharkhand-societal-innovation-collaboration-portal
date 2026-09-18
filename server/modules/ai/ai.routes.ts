import { Router } from 'express';
import { aiService } from './ai.service';
import { sendResponse, sendError } from '../../utils/apiResponse';
import { authenticate, roleGuard } from '../../middleware/auth';

const router = Router();

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
]);
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

router.post('/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;

    if (typeof audioBase64 !== 'string' || typeof mimeType !== 'string') {
      return sendError(res, 'Audio data and MIME type are required', 400);
    }

    if (!ALLOWED_AUDIO_MIME_TYPES.has(mimeType)) {
      return sendError(res, 'Unsupported audio format', 400);
    }

    const dataUrlMatch = audioBase64.match(/^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!dataUrlMatch || dataUrlMatch[1] !== mimeType) {
      return sendError(res, 'Audio must be a valid base64 data URL', 400);
    }

    const encodedAudio = dataUrlMatch[2];
    const audioBytes = Math.floor((encodedAudio.length * 3) / 4) - (encodedAudio.endsWith('==') ? 2 : encodedAudio.endsWith('=') ? 1 : 0);
    if (audioBytes > MAX_AUDIO_BYTES) {
      return sendError(res, 'Audio recording is too large. Please record a shorter clip.', 413);
    }

    const text = await aiService.transcribeAudio(encodedAudio, mimeType);
    if (!text) {
      return sendError(res, 'No speech could be detected in this recording', 422);
    }

    sendResponse(res, { text });
  } catch (err: any) {
    sendError(res, 'AI transcription is temporarily unavailable. Please try again later.', 503, 'AI_UNAVAILABLE');
  }
});

router.post('/verify-image', async (req, res) => {
  try {
    const { image, title, description, domain, district } = req.body;
    if (!image) {
      return sendError(res, 'Image data or URL is required for verification', 400);
    }

    const verification = await aiService.verifyImage({
      image,
      title,
      description,
      domain,
      district,
    });
    sendResponse(res, verification);
  } catch (err: any) {
    sendError(res, 'AI image verification is temporarily unavailable. Please try again later.', 503, 'AI_UNAVAILABLE');
  }
});

router.post('/analyze-problem', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return sendError(res, 'Title and description are required', 400);
    }
    const analysis = await aiService.analyzeProblem(req.body);
    sendResponse(res, analysis);
  } catch (err: any) {
    sendError(res, 'AI evaluation is temporarily unavailable. Please try again later.', 503, 'AI_UNAVAILABLE');
  }
});

router.post('/check-duplicate', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return sendError(res, 'Title and description are required', 400);
    }

    const result = await aiService.checkDuplicate(req.body);
    sendResponse(res, result);
  } catch (err: any) {
    sendError(res, err.message || 'Duplicate check failed');
  }
});

router.post('/generate-proposal', authenticate, roleGuard('FACULTY'), async (req, res) => {
  try {
    const { problemId, heiId, customInstructions } = req.body;
    if (!problemId || !heiId) {
      return sendError(res, 'problemId and heiId are required', 400);
    }
    const proposal = await aiService.generateProposal(problemId, heiId, customInstructions);
    sendResponse(res, proposal);
  } catch (err: any) {
    sendError(res, 'AI proposal generation is temporarily unavailable. Please try again later.', 503, 'AI_UNAVAILABLE');
  }
});

export default router;
