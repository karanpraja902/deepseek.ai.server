import express from 'express';
import passport from 'passport';
import { 
  initializeStaticUser, 
  getUserWithMemory, 
  login, 
  updateUserMemory,
  register,
  getCurrentUser,
  googleAuth,
  googleCallback,
  logout
} from '../../controllers/auth';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();

// Initialize static user
router.post('/init', initializeStaticUser);

// Get user with memory
router.get('/user', getUserWithMemory);

// Login user
router.post('/login', login);

// Register new user
router.post('/register', register);

// Get current user
router.get('/me', authMiddleware as any, getCurrentUser);

// Google OAuth routes
console.log("google route");
router.get("/google", passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/sign-in' }),
  googleCallback
);

// Logout user
router.post('/logout', logout);

// Update user memory
router.put('/user/:userId/memory', updateUserMemory);

export default router;