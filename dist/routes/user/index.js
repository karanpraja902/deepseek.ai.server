"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_1 = require("../../controllers/user");
const router = (0, express_1.Router)();
router.get('/:userId', user_1.getUserProfile);
router.put('/:userId', user_1.updateUserProfile);
router.get('/:userId/stats', user_1.getUserStats);
exports.default = router;
//# sourceMappingURL=index.js.map