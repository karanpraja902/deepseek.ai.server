import mongoose, { Schema, Document } from 'mongoose';
import { IUser, IUserPreferences, IUserMemory } from '../../types';

const UserSchema: Schema<IUser> = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    language: {
      type: String,
      default: 'en',
    },
    aiModel: {
      type: String,
      default: 'gemini-2.5-flash',
    },
    conversationStyle: {
      type: String,
      enum: ['formal', 'casual', 'technical'],
      default: 'casual',
    },
    topics: [{
      type: String,
      default: [],
    }],
  },
  memory: {
    type: Object,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  subscription: {
    plan: {
      type: String,
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'trial', 'cancelled'],
      default: 'inactive',
    },
    subscribedAt: {
      type: Date,
      default: null,
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
    trialEnd: {
      type: Date,
      default: null,
    },
  },
}, {
  timestamps: true,
});

// Update the updatedAt field before saving
UserSchema.pre<IUser>('save', function(next) {
  this.updatedAt = new Date();
  this.lastActive = new Date();
  next();
});

// Create indexes for better query performance
UserSchema.index({ id: 1, isActive: 1 });
UserSchema.index({ lastActive: -1 });

export default mongoose.model<IUser>('User', UserSchema);
