import { Router } from 'express';
import {
  initializeStaticUser,
  getUserWithMemory,
  login,
  updateUserMemory
} from '../../controllers/auth';

const router = Router();

// Initialize static user
router.post('/init', initializeStaticUser);

// Get user with memory
router.get('/user', getUserWithMemory);

// User login
router.post('/login', login);

// Update user memory
router.put('/user/:userId/memory', updateUserMemory);

export default router;
