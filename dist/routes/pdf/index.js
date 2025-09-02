"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pdf_1 = require("../../controllers/pdf");
const router = (0, express_1.Router)();
router.post('/analyze', pdf_1.analyzePDFWithLangChain);
router.post('/analyze/stream', pdf_1.streamPDFAnalysis);
exports.default = router;
//# sourceMappingURL=index.js.map