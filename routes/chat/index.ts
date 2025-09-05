import { Router } from 'express';
import { 
  createChat, 
  getChat, 
  getUserChats, 
  addMessage, 
  updateChatTitle, 
  deleteChat, 
  getChatMessages 
} from '../../controllers/chat';
import { 
  validateCreateChat, 
  validateAddMessage, 
  validateUpdateChatTitle 
} from '../../middleware/validation';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// Create new chat
router.post('/', authMiddleware as any, validateCreateChat, createChat);

// Get all chats for a user (must come before /:id route)
router.get('/', authMiddleware as any, getUserChats);

// Get chat by ID


// Add message to chat
router.post('/:id/messages', validateAddMessage, addMessage);

// Update chat title
router.put('/:id/title', validateUpdateChatTitle, updateChatTitle);

// Delete chat
router.delete('/:id', deleteChat);

// Get chat messages
router.get('/:id/messages', getChatMessages);

router.get('/:id', getChat);

export default router;
