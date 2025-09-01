import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../../models/User';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();
console.log("google strategy");
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
     callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, cb) => {
    try {
        console.log('Google profile:', profile);
        
        let user = await User.findOne({ email: profile.emails![0].value });
        console.log({"user": user, "message": "Existing user found"});
        
        if (user) {
            // Update avatar if not set
            if (!user.avatar && profile.photos && profile.photos.length > 0) {
                user.avatar = profile.photos[0].value;
                await user.save();
            }
        } else {
            // Create new user
            user = new User({
                id: uuidv4(),
                name: profile.displayName || profile.emails![0].value.split('@')[0],
                email: profile.emails![0].value,
                username: profile.emails![0].value.split('@')[0],
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
    } catch (error) {
        console.error('Google OAuth error:', error);
        return cb(error, undefined);
    }
}));

export default passport;