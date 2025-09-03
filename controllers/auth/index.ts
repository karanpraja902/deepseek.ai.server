import { Request, Response } from 'express';
import User from '../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { IUser, ApiResponse, JWTPayload } from '../../types';
import { v4 as uuidv4 } from 'uuid';

// Initialize static user
export const initializeStaticUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const staticUserId = 'static_user_karanao';
    
    // Check if static user already exists
    let staticUser = await User.findOne({ id: staticUserId });
    console.log(staticUser);
    
    if (!staticUser) {
      // Create static user
      const hashedPassword = await bcrypt.hash('static_password', 10);
      
      staticUser = new User({
        id: staticUserId,
        email: 'static@example.com',
        username: 'static_user',
        password: hashedPassword,
        name: 'Static User',
        preferences: {
          theme: 'light' as const,
          language: 'en',
          aiModel: 'google',
          conversationStyle: 'casual' as const,
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
    
    const response: ApiResponse<any> = {
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
  } catch (error: any) {
    console.error('Init error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to initialize static user' 
    });
  }
});

// Get user with memory
export const getUserWithMemory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ 
        success: false,
        error: 'User ID required' 
      });
      return;
    }
    
    const user = await User.findOne({ id: userId, isActive: true });
    
    if (!user) {
      res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
      return;
    }
    
    const response: ApiResponse<any> = {
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
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get user' 
    });
  }
});

// User login
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Login request");
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
      return;
    }
    
    const user = await User.findOne({ email, isActive: true });
    
    if (!user) {
      res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
      return;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
      return;
    }
    
    // Generate JWT token
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email
    };
    console.log("login payload", payload);
    
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    console.log("login token", token);
    
    // Set secure HTTP-only cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true, // Required when sameSite is 'none'
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    const response: ApiResponse<any> = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          preferences: user.preferences,
        }
      }
    };
    console.log("login response", response);
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Login failed' 
    });
  }
});

// Update user memory
export const updateUserMemory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
    
    const user = await User.findOneAndUpdate(
      { id: userId, isActive: true },
      { 
        memory,
        lastActive: new Date()
      },
      { new: true }
    );
    
    if (!user) {
      res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
      return;
    }
    
    const response: ApiResponse<any> = {
      success: true,
      message: 'User memory updated successfully',
      data: {
        memory: user.memory,
      }
    };
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Update memory error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update user memory' 
    });
  }
});

// User registration
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Register request");
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      res.status(400).json({ 
        success: false,
        error: "Please provide all required fields" 
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ 
        success: false,
        error: "User already exists" 
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      id: uuidv4(),
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
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true, // Required when sameSite is 'none'
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    const response: ApiResponse<any> = {
      success: true,
      message: "User registered successfully",
      data: {
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
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get current user
export const getCurrentUser = asyncHandler(async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await User.findOne({ id: userId, isActive: true }).select("-password");
    
    if (!user) {
      res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
      return;
    }

    const response: ApiResponse<any> = {
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
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Google OAuth authentication
export const googleAuth = (req: Request, res: Response): void => {
  // This function will be handled by passport middleware
  // The actual authentication logic is in the Google strategy
};

// Google OAuth callback
export const googleCallback = asyncHandler(async (req: any, res: Response): Promise<void> => {
  try {
    console.log("google callback request");
    console.log({"request": req.user.email});
    console.log("Request headers:", req.headers);
    console.log("User agent:", req.get('User-Agent'));
    
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: "30d" }
    );
    console.log("google callback token", token);
    
    // Set CORS headers explicitly - allow the requesting origin if it's in our allowed list
    const allowedOrigins = [
      'http://localhost:3000',
      'https://deepseek-ai-web.vercel.app',
      'https://deepseek-ai-client.vercel.app',
      process.env.CLIENT_URL
    ].filter(Boolean);
    
    const requestOrigin = req.get('Origin') || req.get('Referer');
    const allowedOrigin = allowedOrigins.find(origin => 
      requestOrigin && requestOrigin.startsWith(origin)
    ) || allowedOrigins[0];
    
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    
    // Add headers to reduce bounce tracking detection
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    
    console.log('OAuth callback - Request origin:', requestOrigin);
    console.log('OAuth callback - Allowed origin set to:', allowedOrigin);
    
    // Set secure HTTP-only cookie - no token in URL
    res.cookie("auth_token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true, // Required when sameSite is 'none'
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      // Don't set domain for Vercel deployments - let browser handle it automatically
      // domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined,
      path: '/' // Ensure cookie is available on all paths
    });
    
    console.log("Cookie set with options:", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      domain: 'auto (browser-determined)'
    });
    
    console.log("Response headers before redirect:", res.getHeaders());
    
    // Use 302 redirect for faster bounce and better Chrome compatibility
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(302, `${clientUrl}/auth/success`);
  } catch (error: any) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/sign-in?error=auth_failed`);
  }
});

// User logout
export const logout = (req: Request, res: Response): void => {
  console.log("Logout called - clearing cookies");
  console.log("Current cookies:", req.cookies);
  
  // Clear cookie with the same options used when setting it
  res.clearCookie("auth_token", {
    httpOnly: true,
    sameSite: 'none',
    secure: true
  });
  
  // Set cookie to expire immediately as an additional measure
  res.cookie("auth_token", "", {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    expires: new Date(0) // Expire immediately
  });
  
  console.log("Cookies cleared successfully");
  
  res.status(200).json({ 
    success: true,
    message: "User logout successful" 
  });
}
