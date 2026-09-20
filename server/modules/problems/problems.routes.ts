import { Router } from 'express';
import { problemsService } from './problems.service';
import { sendResponse, sendError } from '../../utils/apiResponse';
import { authenticate, roleGuard } from '../../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  try {
    console.log('Fetching all problems with filters:', req.query);
    const problems = await problemsService.getAllProblems(req.query as any);
    console.log(`Found ${problems?.length || 0} problems`);
    sendResponse(res, problems);
  } catch (err: any) {
    console.error('Error fetching problems:', err);
    sendError(res, err.message);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const problem = await problemsService.getProblemById(req.params.id);
    if (!problem) {
      return sendError(res, 'Problem statement not found', 404);
    }
    sendResponse(res, problem);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

router.post('/:id/upvote', authenticate, async (req, res) => {
  try {
    const problem = await problemsService.upvoteProblem(req.params.id);
    sendResponse(res, { success: true, upvotesCount: problem.upvotesCount });
  } catch (err: any) {
    sendError(res, err.message);
  }
});

router.post('/', async (req, res) => {
  try {
    const problem = await problemsService.createProblem(req.body);
    sendResponse(res, problem, 201);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
});

router.post('/:id/assign', authenticate, roleGuard('GOVERNMENT_ADMIN'), async (req, res) => {
  try {
    const { heiId, department } = req.body;
    if (!heiId) return sendError(res, 'heiId is required', 400);
    const problem = await problemsService.assignToHei(req.params.id, heiId, department);
    sendResponse(res, problem);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

router.patch('/:id/status', authenticate, roleGuard('GOVERNMENT_ADMIN', 'GOVERNMENT_OFFICIAL', 'FACULTY', 'INDUSTRY_REP'), async (req, res) => {
  try {
    const problem = await problemsService.updateStatus(req.params.id, req.body);
    sendResponse(res, problem);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

export default router;
