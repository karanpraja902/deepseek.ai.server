import { Router } from 'express';
import { getWeatherWithAI, getWeatherDataOnly } from '../../controllers/weather';

const router = Router();

// Weather endpoint with AI processing
router.post('/with-ai', getWeatherWithAI);

// Simple weather data endpoint
router.post('/data', getWeatherDataOnly);

export default router;
