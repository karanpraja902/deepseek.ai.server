import { z } from 'zod';
import { ValidationResult, IFile, IMessage, IChat, CreateChatRequest, AddMessageRequest, UpdateChatTitleRequest, AIChatRequest } from '../../types';

// File schema
const FileSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  url: z.string().url("Valid URL is required"),
  mediaType: z.string().min(1, "Media type is required"),
  pdfAnalysis: z.string().optional(),
});

// Message schema
const MessageSchema = z.object({
  _id: z.string().optional(), // MongoDB ObjectId as string
  role: z.enum(['user', 'assistant'], {
    errorMap: () => ({ message: "Role must be either 'user' or 'assistant'" })
  }),
  content: z.string().optional(), // Made optional since parts can contain the content
  timestamp: z.date().optional().default(() => new Date()),
  files: z.array(FileSchema).optional().default([]),
  parts: z.array(z.object({
    type: z.string(),
    text: z.string().optional(),
    mediaType: z.string().optional(),
    url: z.string().optional(),
    filename: z.string().optional(),
  })).optional().default([]),
});

// Chat schema
const ChatSchema = z.object({
  id: z.string().min(1, "Chat ID is required"),
  userId: z.string().min(1, "User ID is required"),
  createdAt: z.date().optional().default(() => new Date()),
  updatedAt: z.date().optional().default(() => new Date()),
  messages: z.array(MessageSchema).optional().default([]),
  title: z.string().optional().default("New Chat"),
  isActive: z.boolean().optional().default(true),
});

// Create chat request schema
const CreateChatRequestSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

// Add message request schema
const AddMessageRequestSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().optional(), // Made optional since parts can contain the content
  files: z.array(FileSchema).optional().default([]),
  parts: z.array(z.object({
    type: z.string(),
    text: z.string().optional(),
    mediaType: z.string().optional(),
    url: z.string().optional(),
    filename: z.string().optional(),
    image: z.string().optional(), // For base64 images
    prompt: z.string().optional(),
    generatedAt: z.string().optional(),
  })).optional().default([]),
  metadata: z.object({
    chatId: z.string().optional(),
    model: z.string().optional(),
    isImageGeneration: z.boolean().optional().default(false),
  }).optional().default({}),
}).refine((data) => {
  // Allow empty content for assistant messages (streaming responses can start empty)
  if (data.role === 'assistant') {
    return true;
  }
  
  // For user messages, ensure either content or parts with text content is provided
  if (data.content && data.content.trim()) {
    return true;
  }
  if (data.parts && data.parts.length > 0) {
    const hasTextContent = data.parts.some(part => 
      part.type === 'text' && part.text && part.text.trim()
    );
    const hasFileContent = data.parts.some(part => 
      part.type === 'file' && part.url
    );
    return hasTextContent || hasFileContent;
  }
  return false;
}, {
  message: "For user messages, either content or parts with text/file content must be provided",
  path: ["content"]
});

// Update chat title request schema
const UpdateChatTitleRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
});

// AI Chat request schema
const AIChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().optional(),
    text: z.string().optional(),
    parts: z.array(z.object({
      type: z.string(),
      text: z.string().optional(),
      mediaType: z.string().optional(),
      url: z.string().optional(),
      filename: z.string().optional(),
    })).optional(),
  })).optional(),
  content: z.string().optional(),
  text: z.string().optional(),
  parts: z.array(z.object({
    type: z.string(),
    text: z.string().optional(),
    mediaType: z.string().optional(),
    url: z.string().optional(),
    filename: z.string().optional(),
  })).optional(),
  chatId: z.string().optional(),
  userId: z.string().optional(),
  model: z.string().optional().default('google'),
  selectedModel: z.string().optional().default('google'),
  metadata: z.object({
    chatId: z.string().optional(),
    model: z.string().optional(),
    enableWebSearch: z.boolean().optional().default(false),
  }).optional(),
  enableWebSearch: z.boolean().optional().default(false),
});

// Validation functions
export const validateChat = (data: any): ValidationResult<any> => {
  try {
    return { success: true, data: ChatSchema.parse(data) };
  } catch (error: any) {
    return { success: false, error: error.errors };
  }
};

export const validateCreateChatRequest = (data: any): ValidationResult<CreateChatRequest> => {
  try {
    console.log("CreateChatRequestSchema:", CreateChatRequestSchema.parse(data));
    return { success: true, data: CreateChatRequestSchema.parse(data) };
  } catch (error: any) {
    console.log("error:", error);
    return { success: false, error: error.errors };
  }
};

export const validateAddMessageRequest = (data: any): ValidationResult<AddMessageRequest> => {
  try {
    return { success: true, data: AddMessageRequestSchema.parse(data) };
  } catch (error: any) {
    return { success: false, error: error.errors };
  }
};

export const validateUpdateChatTitleRequest = (data: any): ValidationResult<UpdateChatTitleRequest> => {
  try {
    return { success: true, data: UpdateChatTitleRequestSchema.parse(data) };
  } catch (error: any) {
    return { success: false, error: error.errors };
  }
};

export const validateAIChatRequest = (data: any): ValidationResult<AIChatRequest> => {
  try {
    return { success: true, data: AIChatRequestSchema.parse(data) };
  } catch (error: any) {
    return { success: false, error: error.errors };
  }
};

export {
  ChatSchema,
  CreateChatRequestSchema,
  AddMessageRequestSchema,
  UpdateChatTitleRequestSchema,
  AIChatRequestSchema,
};
