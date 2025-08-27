import { Router } from 'express';
import {
  uploadFile,
  deleteFile,
  getFileInfo,
  testCloudinaryConfig,
  upload
} from '../../controllers/cloudinary';

const router = Router();

// Upload file
router.post('/upload', upload.single('file'), uploadFile);

// Test Cloudinary configuration
router.get('/config', testCloudinaryConfig);

// Delete file
router.delete('/:publicId', deleteFile);

// Get file info
router.get('/:publicId', getFileInfo);

export default router;
