"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("../../models/User"));
const uuid_1 = require("uuid");
dotenv_1.default.config();
console.log("google strategy");
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, cb) => {
    try {
        console.log('Google profile:', profile);
        let user = await User_1.default.findOne({ email: profile.emails[0].value });
        console.log({ "user": user, "message": "Existing user found" });
        if (user) {
            // Update avatar if not set
            if (!user.avatar && profile.photos && profile.photos.length > 0) {
                user.avatar = profile.photos[0].value;
                await user.save();
            }
        }
        else {
            // Create new user
            user = new User_1.default({
                id: (0, uuid_1.v4)(),
                name: profile.displayName || profile.emails[0].value.split('@')[0],
                email: profile.emails[0].value,
                username: profile.emails[0].value.split('@')[0],
                password: 'google_oauth_user', // Placeholder password for Google users
                avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
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
            console.log('New Google user created:', user.email);
        }
        return cb(null, user);
    }
    catch (error) {
        console.error('Google OAuth error:', error);
        return cb(error, undefined);
    }
}));
exports.default = passport_1.default;
