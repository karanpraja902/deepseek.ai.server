"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const weather_1 = require("../../controllers/weather");
const router = (0, express_1.Router)();
router.post('/with-ai', weather_1.getWeatherWithAI);
router.post('/data', weather_1.getWeatherDataOnly);
exports.default = router;
//# sourceMappingURL=index.js.map