import { Router } from 'express';
import { proposalService } from './proposals.service';
import { sendResponse, sendError } from '../../utils/apiResponse';
import { authenticate, roleGuard } from '../../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  const { problemId } = req.query;
  try {
    const proposals = problemId
      ? await proposalService.getProposalsByProblem(problemId as string)
      : await proposalService.getAllProposals({});
    sendResponse(res, proposals);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const proposal = await proposalService.getProposalById(req.params.id);
    if (!proposal) {
      return sendError(res, 'Proposal not found', 404);
    }
    sendResponse(res, proposal);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

router.post('/', authenticate, roleGuard('FACULTY'), async (req, res) => {
  try {
    const proposal = await proposalService.createProposal(req.body);
    sendResponse(res, proposal, 201);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
});

router.patch('/:id/milestone', authenticate, roleGuard('FACULTY', 'GOVERNMENT_ADMIN', 'GOVERNMENT_OFFICIAL'), async (req, res) => {
  try {
    const { milestoneId, ...updates } = req.body;
    if (!milestoneId) return sendError(res, 'milestoneId is required', 400);
    const milestone = await proposalService.updateMilestone(req.params.id, milestoneId, updates);
    sendResponse(res, milestone);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

router.patch('/:id/status', authenticate, roleGuard('GOVERNMENT_ADMIN', 'GOVERNMENT_OFFICIAL'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return sendError(res, 'status is required', 400);
    const proposal = await proposalService.updateStatus(req.params.id, { status });
    sendResponse(res, proposal);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

export default router;
