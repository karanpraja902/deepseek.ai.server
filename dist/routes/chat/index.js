"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_1 = require("../../controllers/chat");
const validation_1 = require("../../middleware/validation");
const router = (0, express_1.Router)();
router.post('/', validation_1.validateCreateChat, chat_1.createChat);
router.get('/', chat_1.getUserChats);
router.get('/:id', chat_1.getChat);
router.post('/:id/messages', validation_1.validateAddMessage, chat_1.addMessage);
router.put('/:id/title', validation_1.validateUpdateChatTitle, chat_1.updateChatTitle);
router.delete('/:id', chat_1.deleteChat);
router.get('/:id/messages', chat_1.getChatMessages);
exports.default = router;
//# sourceMappingURL=index.js.map