"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_1 = require("../../controllers/search");
const router = (0, express_1.Router)();
// Web search
router.post('/', search_1.webSearch);
// Web search with AI
router.post('/with-ai', search_1.webSearchWithAI);
// Scrape webpage
router.post('/scrape', search_1.scrapeWebpage);
exports.default = router;
