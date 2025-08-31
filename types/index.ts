import { Document } from 'mongoose';
import { Request } from 'express';

// User types
export interface IUserPreferences {
  theme: 'light' | 'dark';
  language: string;
  aiModel: string;
  conversationStyle: 'formal' | 'casual' | 'technical';
  topics: string[];
}

export interface IUserMemory {
  preferences?: {
    conversationStyle?: string;
    topics?: string[];
  };
  recentConversations?: any[];
  learningProgress?: Record<string, any>;
  [key: string]: any;
}

export interface IUser extends Document {
  id: string;
  email: string;
  username: string;
  password: string;
  name: string;
  avatar: string;
  preferences: IUserPreferences;
  memory: IUserMemory;
  subscription?: {
    plan: string;
    status: string;
    subscribedAt: Date;
    currentPeriodEnd?: Date;
    trialEnd?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
  isActive: boolean;
}

// Chat types
export interface IFile {
  filename: string;
  url: string;
  mediaType: string;
  pdfAnalysis?: string;
}

export interface IMessage {
  _id?: string;
  role: 'user' | 'assistant';
  content?: string; // Made optional since parts can contain the content
  timestamp?: Date;
  files?: IFile[];
  parts?: AIChatPart[];
  metadata?: {
    chatId?: string;
    model?: string;
    isImageGeneration?: boolean;
  };
}

export interface IChat extends Document {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: IMessage[];
  title: string;
  isActive: boolean;
}

// Request types
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export interface CreateChatRequest {
  userId: string;
}

export interface AddMessageRequest {
  role: 'user' | 'assistant';
  content?: string; // Made optional since parts can contain the content
  files?: IFile[];
  parts?: AIChatPart[];
  metadata?: {
    chatId?: string;
    model?: string;
    isImageGeneration?: boolean;
  };
}

export interface UpdateChatTitleRequest {
  title: string;
}

export interface AIChatPart {
  type: string;
  text?: string;
  mediaType?: string;
  url?: string;
  filename?: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content?: string;
  text?: string;
  parts?: AIChatPart[];
}

export interface AIChatRequest {
  messages?: AIChatMessage[];
  content?: string;
  text?: string;
  parts?: AIChatPart[];
  chatId?: string;
  userId?: string;
  model?: string;
  selectedModel?: string;
  metadata?: {
    chatId?: string;
    model?: string;
    enableWebSearch?: boolean;
  };
  enableWebSearch?: boolean;
}

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: any;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// PDF Analysis types
export interface PDFAnalysisRequest {
  url: string;
  filename: string;
}

export interface PDFAnalysisResponse {
  summary: string;
  content: string;
  pageCount: number;
  filename: string;
}

// Search types
export interface WebSearchRequest {
  query: string;
}

export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

export interface WebSearchWithAIRequest {
  query: string;
  userQuestion: string;
}

export interface WebSearchWithAIResponse {
  answer: string;
  searchResults: WebSearchResult[];
  sources: string[];
}

export interface ScrapeWebpageRequest {
  url: string;
}

export interface ScrapeWebpageResponse {
  title: string;
  text: string;
  url: string;
}

// Cloudinary types
export interface CloudinaryUploadResponse {
  url: string;
  publicId: string;
  filename: string;
  mediaType: string;
  size: number;
  width?: number;
  height?: number;
}

export interface CloudinaryFileInfo {
  url: string;
  publicId: string;
  filename: string;
  mediaType: string;
  size: number;
  createdAt: string;
  width?: number;
  height?: number;
}
