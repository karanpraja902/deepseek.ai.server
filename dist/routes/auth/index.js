"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const auth_1 = require("../../controllers/auth");
const auth_2 = require("../../middleware/auth");
const router = express_1.default.Router();
router.post('/init', auth_1.initializeStaticUser);
router.get('/user', auth_1.getUserWithMemory);
router.post('/login', auth_1.login);
router.post('/register', auth_1.register);
router.get('/me', auth_2.authMiddleware, auth_1.getCurrentUser);
console.log("google route");
router.get("/google", passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: '/sign-in' }), auth_1.googleCallback);
router.post('/logout', auth_1.logout);
router.put('/user/:userId/memory', auth_1.updateUserMemory);
exports.default = router;
//# sourceMappingURL=index.js.map