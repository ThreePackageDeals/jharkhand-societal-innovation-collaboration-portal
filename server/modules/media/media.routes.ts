import { Router } from 'express';
import multer from 'multer';
import { mediaService } from './media.service';

const router = Router();

// Configure multer for temporary storage before the service moves it
const upload = multer({ dest: 'uploads/tmp/' }) as any;
const uploadSingle = upload.single.bind(upload, 'file') as any;

// Ensure upload directory exists
mediaService.init();

router.post('/upload', uploadSingle, async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { problemId } = req.body;
    const media = await mediaService.uploadFile(req.file, problemId);

    res.json({ data: media });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await mediaService.deleteFile(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete file' });
  }
});

export default router;
