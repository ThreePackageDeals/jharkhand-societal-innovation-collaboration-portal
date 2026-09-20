import { Router } from 'express';
import { industryService } from './industry.service';
import { sendResponse, sendError } from '../../utils/apiResponse';
import { authenticate, roleGuard } from '../../middleware/auth';

const router = Router();

router.get('/partners', async (req, res) => {
  try {
    const partners = await industryService.getAllPartners();
    sendResponse(res, partners);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

router.get('/partners/:id', async (req, res) => {
  try {
    const partner = await industryService.getPartnerById(req.params.id);
    if (!partner) {
      return sendError(res, 'Partner not found', 404);
    }
    sendResponse(res, partner);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

router.post('/partners', authenticate, roleGuard('GOVERNMENT_ADMIN'), async (req, res) => {
  try {
    const partner = await industryService.createPartner(req.body);
    sendResponse(res, partner, 201);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
});

router.patch('/partners/:id', authenticate, roleGuard('GOVERNMENT_ADMIN', 'INDUSTRY_REP'), async (req, res) => {
  try {
    const partner = await industryService.updatePartner(req.params.id, req.body);
    sendResponse(res, partner);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

router.delete('/partners/:id', authenticate, roleGuard('GOVERNMENT_ADMIN'), async (req, res) => {
  try {
    await industryService.deletePartner(req.params.id);
    sendResponse(res, { success: true, message: 'Partner deleted' });
  } catch (err: any) {
    sendError(res, err.message);
  }
});

router.post('/pledge', authenticate, roleGuard('INDUSTRY_REP'), async (req, res) => {
  try {
    const result = await industryService.pledgeFunding(req.body);
    sendResponse(res, result);
  } catch (err: any) {
    sendError(res, err.message);
  }
});

export default router;
