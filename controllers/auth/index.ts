import { Request, Response } from 'express';
import User from '../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { IUser, ApiResponse, JWTPayload } from '../../types';

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
    
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    const response: ApiResponse<any> = {
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
