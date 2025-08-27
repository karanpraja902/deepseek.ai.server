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

const router = Router();

// Create new chat
router.post('/', validateCreateChat, createChat);

// Get chat by ID
router.get('/:id', getChat);

// Get all chats for a user
router.get('/', getUserChats);

// Add message to chat
router.post('/:id/messages', validateAddMessage, addMessage);

// Update chat title
router.put('/:id/title', validateUpdateChatTitle, updateChatTitle);

// Delete chat
router.delete('/:id', deleteChat);

// Get chat messages
router.get('/:id/messages', getChatMessages);

export default router;
