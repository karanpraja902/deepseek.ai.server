import { Router } from 'express';
import {
  analyzePDF,
  extractText
} from '../../controllers/pdf';

const router = Router();

// Analyze PDF
router.post('/analyze', analyzePDF);

// Extract text from PDF
router.post('/extract', extractText);

export default router;
