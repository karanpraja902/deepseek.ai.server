"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_1 = require("../../controllers/chat");
const validation_1 = require("../../middleware/validation");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Create new chat
router.post('/', auth_1.authMiddleware, chat_1.createChat);
// Get all chats for a user (must come before /:id route)
router.get('/', auth_1.authMiddleware, chat_1.getUserChats);
// Get chat by ID
// Add message to chat
router.post('/:id/messages', auth_1.authMiddleware, validation_1.validateAddMessage, chat_1.addMessage);
// Update chat title
router.put('/:id/title', auth_1.authMiddleware, validation_1.validateUpdateChatTitle, chat_1.updateChatTitle);
// Delete chat
router.delete('/:id', auth_1.authMiddleware, chat_1.deleteChat);
// Delete all chats for user
router.delete('/', auth_1.authMiddleware, chat_1.deleteAllChats);
// Get chat messages
router.get('/:id/messages', auth_1.authMiddleware, chat_1.getChatMessages);
router.get('/:id', auth_1.authMiddleware, chat_1.getChat);
exports.default = router;
