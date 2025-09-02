"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.googleCallback = exports.googleAuth = exports.getCurrentUser = exports.register = exports.updateUserMemory = exports.login = exports.getUserWithMemory = exports.initializeStaticUser = void 0;
const User_1 = __importDefault(require("../../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const uuid_1 = require("uuid");
// Initialize static user
exports.initializeStaticUser = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const staticUserId = 'static_user_karanao';
        // Check if static user already exists
        let staticUser = await User_1.default.findOne({ id: staticUserId });
        console.log(staticUser);
        if (!staticUser) {
            // Create static user
            const hashedPassword = await bcryptjs_1.default.hash('static_password', 10);
            staticUser = new User_1.default({
                id: staticUserId,
                email: 'static@example.com',
                username: 'static_user',
                password: hashedPassword,
                name: 'Static User',
                preferences: {
                    theme: 'light',
                    language: 'en',
                    aiModel: 'google',
                    conversationStyle: 'casual',
                    topics: ['technology', 'programming', 'ai']
                },
                memory: {
                    preferences: {
                        conversationStyle: 'casual',
                        topics: ['technology', 'programming', 'ai']
                    },
                    recentConversations: [],
                    learningProgress: {}
                }
            });
            console.log(staticUser);
            await staticUser.save();
        }
        const response = {
            success: true,
            message: 'Static user initialized successfully',
            data: {
                user: {
                    id: staticUser.id,
                    email: staticUser.email,
                    username: staticUser.username,
                    name: staticUser.name,
                }
            }
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Init error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initialize static user'
        });
    }
});
// Get user with memory
exports.getUserWithMemory = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId || typeof userId !== 'string') {
            res.status(400).json({
                success: false,
                error: 'User ID required'
            });
            return;
        }
        const user = await User_1.default.findOne({ id: userId, isActive: true });
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found'
            });
            return;
        }
        const response = {
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    name: user.name,
                    preferences: user.preferences,
                },
                memory: user.memory,
            }
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user'
        });
    }
});
// User login
exports.login = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
            return;
        }
        const user = await User_1.default.findOne({ email, isActive: true });
        if (!user) {
            res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
            return;
        }
        // Generate JWT token
        const payload = {
            userId: user.id,
            email: user.email
        };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        const response = {
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    name: user.name,
                    preferences: user.preferences,
                }
            }
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
});
// Update user memory
exports.updateUserMemory = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { userId } = req.params;
        const { memory } = req.body;
        if (!userId) {
            res.status(400).json({
                success: false,
                error: 'User ID required'
            });
            return;
        }
        const user = await User_1.default.findOneAndUpdate({ id: userId, isActive: true }, {
            memory,
            lastActive: new Date()
        }, { new: true });
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found'
            });
            return;
        }
        const response = {
            success: true,
            message: 'User memory updated successfully',
            data: {
                memory: user.memory,
            }
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Update memory error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user memory'
        });
    }
});
// User registration
exports.register = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                error: "Please provide all required fields"
            });
            return;
        }
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                error: "User already exists"
            });
            return;
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create new user
        const user = new User_1.default({
            id: (0, uuid_1.v4)(),
            email,
            username: email.split('@')[0],
            password: hashedPassword,
            name,
            preferences: {
                theme: 'light',
                language: 'en',
                aiModel: 'gemini-2.5-flash',
                conversationStyle: 'casual',
                topics: []
            },
            memory: {}
        });
        await user.save();
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        // Set cookie
        res.cookie("auth_token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });
        const response = {
            success: true,
            message: "User registered successfully",
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    preferences: user.preferences,
                }
            }
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get current user
exports.getCurrentUser = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const userId = req.user?.userId;
        const user = await User_1.default.findOne({ id: userId, isActive: true }).select("-password");
        if (!user) {
            res.status(404).json({
                success: false,
                error: "User not found"
            });
            return;
        }
        const response = {
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    avatar: user.avatar,
                    preferences: user.preferences,
                }
            }
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Google OAuth authentication
const googleAuth = (req, res) => {
    // This function will be handled by passport middleware
    // The actual authentication logic is in the Google strategy
};
exports.googleAuth = googleAuth;
// Google OAuth callback
exports.googleCallback = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        console.log("google callback request", req);
        console.log({ "request": req.user.email });
        const token = jsonwebtoken_1.default.sign({ userId: req.user.id, email: req.user.email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: "30d" });
        console.log("google callback token", token);
        res.cookie("auth_token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}?token=${token}`);
    }
    catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/sign-in?error=auth_failed`);
    }
});
// User logout
const logout = (req, res) => {
    res.clearCookie("auth_token", {
        httpOnly: true,
        sameSite: 'none',
        secure: true
    });
    res.status(200).json({
        success: true,
        message: "User logout successful"
    });
};
exports.logout = logout;
