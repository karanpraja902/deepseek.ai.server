import { Router } from 'express';
import { 
  createChat, 
  getChat, 
  getUserChats, 
  addMessage, 
  updateChatTitle, 
  deleteChat, 
  deleteAllChats,
  getChatMessages 
} from '../../controllers/chat';
import { 
  validateAddMessage, 
  validateUpdateChatTitle 
} from '../../middleware/validation';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// Create new chat
router.post('/', authMiddleware as any, createChat);

// Get all chats for a user (must come before /:id route)
router.get('/', authMiddleware as any, getUserChats);

// Get chat by ID

console.log("addMessage route")
// Add message to chat
router.post('/:id/messages', authMiddleware as any, addMessage);

// Update chat title
router.put('/:id/title', authMiddleware as any,  updateChatTitle);

// Delete chat
router.delete('/:id', authMiddleware as any, deleteChat);

// Get chat messages
router.get('/:id/messages', authMiddleware as any, getChatMessages);

// Get chat by ID
router.get('/:id', authMiddleware as any, getChat);


// Delete all chats for user (must come after /:id routes)
router.delete('/', authMiddleware as any, deleteAllChats);

export default router;
