"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_1 = require("../../controllers/ai");
const search_1 = require("../../controllers/search");
const router = (0, express_1.Router)();
router.post('/chat/stream', ai_1.streamChat);
router.post('/generate-image', ai_1.generateImageHandler);
router.get('/memories/:userId', ai_1.getMemories);
router.post('/memories/add', ai_1.addMemoriesForUser);
router.get('/models', ai_1.getAvailableModelsHandler);
router.post('/web-search', async (req, res) => {
    try {
        const { query, userQuestion } = req.body;
        if (!query || !userQuestion) {
            return res.status(400).json({
                success: false,
                error: 'Both query and userQuestion are required'
            });
        }
        const result = await (0, search_1.performWebSearchWithAI)(query, userQuestion);
        return res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Web search error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to perform web search'
        });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map