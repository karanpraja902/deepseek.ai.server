import { Router } from 'express';
import {
  uploadFile,
  deleteFile,
  getFileInfo,
  testCloudinaryConfig,
  upload
} from '../../controllers/cloudinary';

const router = Router();

// Handle preflight OPTIONS requests for CORS
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Upload file
console.log("uploadFileBackend1");
router.post('/upload', upload.single('file'), uploadFile);

// Test Cloudinary configuration
router.get('/config', testCloudinaryConfig);

// Delete file
router.delete('/:publicId', deleteFile);

// Get file info
router.get('/:publicId', getFileInfo);

export default router;
