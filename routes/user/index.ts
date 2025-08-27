import { Router } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getUserStats
} from '../../controllers/user';

const router = Router();

// Get user profile
router.get('/:userId', getUserProfile);

// Update user profile
router.put('/:userId', updateUserProfile);

// Get user statistics
router.get('/:userId/stats', getUserStats);

export default router;
