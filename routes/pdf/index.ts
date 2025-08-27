import { Router } from 'express';
import {
  analyzePDFWithLangChain,
  streamPDFAnalysis
} from '../../controllers/pdf';

const router = Router();

// Analyze PDF with LangChain
router.post('/analyze', analyzePDFWithLangChain);

// Stream PDF Analysis
router.post('/analyze/stream', streamPDFAnalysis);

export default router;
