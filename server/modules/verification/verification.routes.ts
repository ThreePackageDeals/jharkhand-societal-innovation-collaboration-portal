import { Router } from 'express';
import { verificationService } from './verification.service';
import { sendResponse, sendError } from '../../utils/apiResponse';
import { authenticate, requireRole, AuthRequest } from '../../middleware/auth';
import { VerificationStatus } from '@prisma/client';

const router = Router();

router.get('/requests', authenticate, requireRole('UNIVERSITY_ADMIN', 'GOVERNMENT_ADMIN', 'GOVERNMENT_OFFICIAL', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const requests = await verificationService.getPendingRequests(userId);
    sendResponse(res, requests);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

router.patch('/requests/:id', authenticate, requireRole('UNIVERSITY_ADMIN', 'GOVERNMENT_ADMIN', 'GOVERNMENT_OFFICIAL', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { status, notes } = req.body;

    if (!status || !Object.values(VerificationStatus).includes(status as VerificationStatus)) {
      return sendError(res, 'Valid status is required', 400);
    }

    const result = await verificationService.updateRequestStatus(
      req.params.id,
      userId,
      status as VerificationStatus,
      notes
    );
    sendResponse(res, result, 200, 'Verification request updated successfully');
  } catch (err: any) {
    sendError(res, err.message);
  }
});

router.post('/upload-url', authenticate, async (req: AuthRequest, res) => {
  try {
    const { fileName, bucket = 'verification-docs' } = req.body;
    if (!fileName) return sendError(res, 'fileName is required', 400);

    const url = await verificationService.getSignedUploadUrl(bucket, fileName);
    sendResponse(res, url);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

export default router;
