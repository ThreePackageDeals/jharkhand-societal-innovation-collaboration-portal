import { Router } from 'express';
import { universityService } from './universities.service';
import { sendResponse, sendError } from '../../utils/apiResponse';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const universities = await universityService.getAllUniversities();

    const filtered = search
      ? universities.filter(u =>
          u.name.toLowerCase().includes(String(search).toLowerCase()) ||
          u.shortName.toLowerCase().includes(String(search).toLowerCase())
        )
      : universities;

    sendResponse(res, filtered);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const university = await universityService.getUniversityById(req.params.id);
    if (!university) {
      return sendError(res, 'University not found', 404);
    }
    sendResponse(res, university);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

router.post('/', authenticate, requireRole('GOVERNMENT_ADMIN', 'UNIVERSITY_ADMIN'), async (req, res) => {
  try {
    const university = await universityService.createUniversity(req.body);
    sendResponse(res, university, 201);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
});

router.patch('/:id', authenticate, requireRole('GOVERNMENT_ADMIN', 'UNIVERSITY_ADMIN'), async (req, res) => {
  try {
    const university = await universityService.updateUniversity(req.params.id, req.body);
    sendResponse(res, university);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

router.delete('/:id', authenticate, requireRole('GOVERNMENT_ADMIN'), async (req, res) => {
  try {
    await universityService.deleteUniversity(req.params.id);
    sendResponse(res, { success: true, message: 'University deleted' });
  } catch (err: any) {
    sendError(res, err.message);
  }
});

export default router;
