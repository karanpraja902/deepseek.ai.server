import { Router } from 'express';
import { streamChat, 
  generateImageHandler,
  getMemories,
  addMemoriesForUser,
  getAvailableModelsHandler
} from '../../controllers/ai';
import { performWebSearchWithAI } from '../../controllers/search';
import { analyzePDFWithLangChain, streamPDFAnalysis } from '../../controllers/pdf';

const router = Router();

// Stream chat with Google AI
router.post('/chat/stream', streamChat);

// Image generation endpoint
router.post('/generate-image', generateImageHandler);

// Get memories for a user (for debugging only)
router.get('/memories/:userId', getMemories);

// Add memory for a user (for testing)
router.post('/memories/add', addMemoriesForUser);

// Get available models
router.get('/models', getAvailableModelsHandler);

// PDF Analysis endpoints


// Web search endpoint for chat integration
router.post('/web-search', async (req, res) => {
  try {
    const { query, userQuestion } = req.body;
    
    if (!query || !userQuestion) {
      return res.status(400).json({
        success: false,
        error: 'Both query and userQuestion are required'
      });
    }
    
    const result = await performWebSearchWithAI(query, userQuestion);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Web search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to perform web search'
    });
  }
});

export default router;
