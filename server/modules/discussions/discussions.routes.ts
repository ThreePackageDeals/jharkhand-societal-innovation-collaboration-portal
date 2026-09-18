import { Router } from 'express';
import { discussionService } from './discussions.service';
import { sendResponse, sendError } from '../../utils/apiResponse';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/:problemId', async (req, res) => {
  try {
    const messages = await discussionService.getMessagesByProblem(req.params.problemId);
    sendResponse(res, messages);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { problemId, message, senderName, senderRole } = req.body;
    if (!problemId || !message) {
      return sendError(res, 'problemId and message are required', 400);
    }

    const user = (req as any).user;
    const allowedSenderRoles = new Set([
      'Citizen',
      'Student Researcher',
      'Faculty Mentor',
      'Industry Guide',
      'Government Admin',
    ]);
    const roleFromAuth: Record<string, string> = {
      CITIZEN: 'Citizen',
      STUDENT: 'Student Researcher',
      FACULTY: 'Faculty Mentor',
      INDUSTRY_REP: 'Industry Guide',
      GOVT_ADMIN: 'Government Admin',
      SUPER_ADMIN: 'Government Admin',
    };
    const resolvedRole = process.env.AUTH_BYPASS === 'true' && allowedSenderRoles.has(senderRole)
      ? senderRole
      : roleFromAuth[user.role] || 'Citizen';
    const newMessage = await discussionService.createMessage({
      problemId,
      message,
      senderName: typeof senderName === 'string' && senderName.trim()
        ? senderName.trim()
        : user.name || 'Registered User',
      senderRole: resolvedRole,
    });

    sendResponse(res, newMessage, 201);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

export default router;
