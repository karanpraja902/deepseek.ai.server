import { Router } from 'express';
import { streamChat, generateImageHandler } from '../../controllers/ai';
import { performWebSearchWithAI } from '../../controllers/search';

const router = Router();

// Stream chat with Google AI
router.post('/chat/stream', streamChat);

// Image generation endpoint
router.post('/generate-image', generateImageHandler);

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
