import mongoose, { Schema, Document } from 'mongoose';
import { IChat, IMessage, IFile } from '../../types';

const ChatSchema: Schema<IChat> = new Schema({
  id: {
    type: String,
    unique: true,
    index: true,
  },
  userId: {
    type: String,
    required: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  messages: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    files: [{
      filename: {
        type: String,
      },
      url: {
        type: String,
        required: true,
      },
      mediaType: {
        type: String,
      },
      pdfAnalysis: {
        type: String,
        required: false,
      },
    }],
    parts: [{
      type: {
        type: String,
        enum: ['text', 'file', 'generated-image'],
      },
      text: {
        type: String,
      },
      mediaType: {
        type: String,
      },
      url: {
        type: String,
      },
      filename: {
        type: String,
      },
      image: {
        type: String, // For base64 images
      },
      prompt: {
        type: String,
      },
      generatedAt: {
        type: Date,
      },
    }],
    metadata: {
      chatId: {
        type: String,
      },
      model: {
        type: String,
      },
      isImageGeneration: {
        type: Boolean,
        default: false,
      },
    },
  }],
  title: {
    type: String,
    default: 'New Chat',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Update the updatedAt field before saving
ChatSchema.pre<IChat>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create compound indexes for better query performance
ChatSchema.index({ id: 1, isActive: 1 });
ChatSchema.index({ userId: 1, isActive: 1 });
ChatSchema.index({ createdAt: -1 });
ChatSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IChat>('Chat', ChatSchema);
