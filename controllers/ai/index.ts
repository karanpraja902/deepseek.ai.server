import { Request, Response } from 'express';
import { streamText, experimental_generateImage as generateImage, convertToModelMessages } from 'ai';
import { createVertex } from '@ai-sdk/google-vertex';
// import { googleTools } from '@ai-sdk/google/internal';
import asyncHandler from 'express-async-handler';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { v2 as cloudinary } from 'cloudinary';
import { google } from '@ai-sdk/google';
// import { GoogleAICacheManager } from '@google/generative-ai/server';

// Mem0 imports
import { createMem0 } from '@mem0/vercel-ai-provider';
import { addMemories, retrieveMemories } from '@mem0/vercel-ai-provider';


const cloudinaryConfig = {
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
};

// Validate Cloudinary configuration
if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
  console.warn('⚠️ Cloudinary configuration incomplete. Image uploads may fail.');
  console.log('Cloudinary config:', {
    cloud_name: cloudinaryConfig.cloud_name ? 'SET' : 'MISSING',
    api_key: cloudinaryConfig.api_key ? 'SET' : 'MISSING',
    api_secret: cloudinaryConfig.api_secret ? 'SET' : 'MISSING'
  });
}

cloudinary.config(cloudinaryConfig);

// Memory cache for faster retrieval
interface MemoryCache {
  [userId: string]: {
    memories: string;
    timestamp: number;
    query: string;
  };
}

const memoryCache: MemoryCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

// Initialize Mem0 Client for Google
const mem0 = createMem0({
  provider: 'google',
  mem0ApiKey: process.env.MEM0_API_KEY || '',
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
  config: {
    // Configure the Google LLM Provider here
  },
  // Optional Mem0 Global Config
  mem0Config: {
    enable_graph: true,
  },
});

// Function to get cached memories or fetch from Mem0
const getMemoriesWithCache = async (userId: string, query: string): Promise<string> => {
  const cacheKey = userId;
  const now = Date.now();
  
  // Check if we have valid cached memories
  if (memoryCache[cacheKey] && 
      (now - memoryCache[cacheKey].timestamp) < CACHE_DURATION &&
      memoryCache[cacheKey].query === query) {
    console.log('✅ Using cached memories for user:', userId);
    return memoryCache[cacheKey].memories;
  }
  
  // Fetch fresh memories from Mem0
  try {
    console.log('🔄 Fetching fresh memories from Mem0 for user:', userId);
    const memories = await retrieveMemories(query, { 
      user_id: userId,
      mem0ApiKey: process.env.MEM0_API_KEY 
    });
    
    // Cache the memories
    memoryCache[cacheKey] = {
      memories: memories || '',
      timestamp: now,
      query: query
    };
    
    console.log('✅ Memories cached for user:', userId);
    return memories || '';
  } catch (error) {
    console.error('❌ Error fetching memories from Mem0:', error);
    
    // Return cached memories if available (even if expired)
    if (memoryCache[cacheKey]) {
      console.log('⚠️ Using expired cached memories due to Mem0 error');
      return memoryCache[cacheKey].memories;
    }
    
    return '';
  }
};

// Function to invalidate cache for a user (when new memories are added)
const invalidateUserCache = (userId: string) => {
  if (memoryCache[userId]) {
    delete memoryCache[userId];
    console.log('🗑️ Invalidated memory cache for user:', userId);
  }
};

// Function to clean up expired cache entries
const cleanupExpiredCache = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  Object.keys(memoryCache).forEach(userId => {
    if ((now - memoryCache[userId].timestamp) > CACHE_DURATION) {
      delete memoryCache[userId];
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
  }
};

// Clean up expired cache every 10 minutes
setInterval(cleanupExpiredCache, 10 * 60 * 1000);


export const streamChat = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  console.log("streamChat");
  try {
    console.log("streamChat req.body:", req.body)
    const { messages, userId } = req.body;
    console.log("userId0:", userId)
    console.log("StreamChat messages:", messages)
    
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ 
        success: false,
        error: 'Messages array is required' 
      });
      return;
    }

    console.log("messagesss:",messages[messages.length-1].parts)
    console.log("userId1:", userId)

    // Optimized message transformation for multimodal content
    let transformedMessages = (await Promise.all(messages
      .map(async (msg) => {
        // Handle tool messages properly
        if (msg.role === 'tool') {
          return {
            role: msg.role,
            content: msg.content,
            toolCallId: msg.toolCallId,
            toolName: msg.toolName
          };
        }

        // Fast path for simple text messages
        if (!msg.parts || !Array.isArray(msg.parts)) {
          return msg.content?.trim() ? {
            role: msg.role,
            content: msg.content
          } : null;
        }

        // Process multimodal content efficiently
        const content: any[] = [];
        
        for (const part of msg.parts) {
          if (part.type === 'text' && part.text?.trim()) {
            content.push({ type: 'text', text: part.text });
          } else if (part.type === 'file' && part.url && part.mediaType?.startsWith('image/')) {
            content.push({ type: 'image', image: new URL(part.url) });
          } else if (part.type === 'file' && part.url && part.mediaType === 'application/pdf') {
            try {
              // Download the PDF file from the URL
              const response = await axios.get(part.url, {
                responseType: 'arraybuffer'
              });
              
              // Create file content for Vertex AI
              content.push({
                type: 'file',
                data: Buffer.from(response.data),
                mediaType: part.mediaType,
                filename: part.filename || 'document.pdf'
              });
            } catch (downloadError) {
              console.error('Error downloading PDF:', downloadError);
              // Fallback to text description if download fails
              let pdfContent = `PDF Document: ${part.filename || 'Document'}\nURL: ${part.url}`;
              
              if (part.pdfAnalysis) {
                pdfContent += `\n\nPDF Analysis:\n- Page Count: ${part.pdfAnalysis.pageCount || 'Unknown'}`;
                if (part.pdfAnalysis.text) {
                  pdfContent += `\n- Extracted Text: ${part.pdfAnalysis.text.substring(0, 1000)}${part.pdfAnalysis.text.length > 1000 ? '...' : ''}`;
                }
              }
              
              content.push({ type: 'text', text: pdfContent });
            }
          }
        }
        
        // Fallback to simple content if no parts processed
        if (content.length === 0 && msg.content?.trim()) {
          return {
            role: msg.role,
            content: msg.content
          };
        }
        
        return content.length > 0 ? {
          role: msg.role,
          content
        } : null;
      })))
      .filter((msg): msg is any => msg !== null);
     
    // Retrieve memories from Mem0 and add to system context
    let memoryContext = '';
    if (userId && process.env.MEM0_API_KEY) {
      console.log("Mem0 integration enabled for user:", userId);
      
      try {
        // Get the latest user message to use as query for memory retrieval
        const latestUserMessage = transformedMessages
          .filter(msg => msg.role === 'user')
          .pop();
        
        if (latestUserMessage) {
          const userQuery = typeof latestUserMessage.content === 'string' 
            ? latestUserMessage.content 
            : latestUserMessage.content?.find((part: any) => part.type === 'text')?.text || '';
          
          console.log('Retrieving memories for query:', userQuery);
          
          // Retrieve memories using cache for faster response
          const memories = await getMemoriesWithCache(userId, userQuery);
          
          if (memories && memories.trim()) {
            memoryContext = `\n\nUser Memory Context:\n${memories}\n\nPlease use this memory context to provide personalized and relevant responses.`;
            console.log('✅ Memories retrieved and added to context');
            console.log('Memory context length:', memoryContext.length);
          } else {
            console.log('No relevant memories found for this query');
          }
        }
      } catch (memoryError) {
        console.error('❌ Error retrieving memories:', memoryError);
        console.log('Continuing without memory context');
      }
    } else {
      console.log('Skipping Mem0 - userId:', !!userId, 'MEM0_API_KEY:', !!process.env.MEM0_API_KEY);
    }
      
    console.log("transformedMessages:",transformedMessages[transformedMessages.length-1].content)

  
    // Try Mem0 first, fallback to regular Google if it fails
        // Add memory context to the first message if available
    let messagesWithMemory = transformedMessages;
    if (memoryContext && transformedMessages.length > 0) {
      // Create a system message with memory context
      const systemMessage = {
        role: 'system' as const,
        content: `You are a helpful AI assistant.${memoryContext}`
      };
      
      // Add system message at the beginning
      messagesWithMemory = [systemMessage, ...transformedMessages];
      console.log('Added memory context to system message');
    }
    
    // Convert messages to the correct format for AI SDK
    const convertedMessages = messagesWithMemory.map(msg => {
      if (msg.role === 'system') {
        return {
          role: 'system' as const,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        };
      } else if (msg.role === 'user') {
        return {
          role: 'user' as const,
          content: typeof msg.content === 'string' ? msg.content : 
            Array.isArray(msg.content) ? msg.content.map((part: any) => 
              typeof part === 'string' ? part : 
              part.type === 'text' ? part.text : 
              part.type === 'image' ? part.image : 
              JSON.stringify(part)
            ).join(' ') : JSON.stringify(msg.content)
        };
      } else if (msg.role === 'assistant') {
        return {
          role: 'assistant' as const,
          content: typeof msg.content === 'string' ? msg.content : 
            Array.isArray(msg.content) ? msg.content.map((part: any) => 
              typeof part === 'string' ? part : 
              part.type === 'text' ? part.text : 
              JSON.stringify(part)
            ).join(' ') : JSON.stringify(msg.content)
        };
      } else if (msg.role === 'tool') {
        return {
          role: 'tool' as const,
          content: msg.content,
          toolCallId: msg.toolCallId,
          toolName: msg.toolName
        };
      }
      return msg;
    });
    
    console.log("convertedMessages:", convertedMessages.length, "messages");
    
    let result = await streamText({
      model: google('gemini-2.5-flash'),
      tools: { 
        code_execution: google.tools.codeExecution({}),
        google_search: google.tools.googleSearch({}),
        url_context: google.tools.urlContext({}),
      },
      providerOptions: {
        google: {
          thinkingConfig: {
            includeThoughts: true,
          },
        } satisfies GoogleGenerativeAIProviderOptions,
      },
      messages: convertedMessages,
      temperature: 0.4,
    });
    
    // Stream response directly to client with error handling
    try {
      result.pipeTextStreamToResponse(res,{
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    } catch (streamError) {
      console.error('❌ Error streaming response:', streamError);
      
      // Fallback: send a simple text response
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.write('I apologize, but I encountered an error while processing your request. Please try again.');
        res.end();
      }
    }

    // Store the conversation in Mem0 memory after streaming starts
    if (userId && process.env.MEM0_API_KEY) {
      // Use setTimeout to avoid blocking the response
      setTimeout(async () => {
        try {
          console.log('Storing conversation in Mem0 memory for user:', userId);
          
          // Get the latest user message
          const latestUserMessage = transformedMessages
            .filter(msg => msg.role === 'user')
            .pop();
          
          if (latestUserMessage) {
            // Validate message format before adding to memories
            const messageToAdd = {
              role: 'user' as const,
              content: typeof latestUserMessage.content === 'string' 
                ? latestUserMessage.content 
                : latestUserMessage.content?.find((part: any) => part.type === 'text')?.text || ''
            };
            
                         if (messageToAdd.content.trim()) {
               await addMemories([messageToAdd], { 
                 user_id: userId,
                 mem0ApiKey: process.env.MEM0_API_KEY 
               });
               console.log('✅ Conversation stored in Mem0 memory successfully');
               
               // Invalidate cache since new memories were added
               invalidateUserCache(userId);
             } else {
               console.log('Skipping empty message for memory storage');
             }
          }
        } catch (memoryError) {
          console.error('❌ Error storing conversation in memory:', memoryError);
          console.error('Memory error details:', {
            message: memoryError instanceof Error ? memoryError.message : 'Unknown error',
            name: memoryError instanceof Error ? memoryError.name : 'Unknown'
          });
        }
      }, 1000); // Wait 1 second after streaming starts
    }

  } catch (error: any) {
    console.error('Streaming error:', error);
    if (!res.headersSent) {
      // Provide detailed error information
      let errorMessage = 'Internal server error';
      let errorDetails = '';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.code) {
        errorDetails = `Error code: ${error.code}`;
      }
      
      if (error.status) {
        errorDetails = `${errorDetails} | Status: ${error.status}`;
      }
      
      res.status(500).json({ 
        success: false,
        error: errorMessage,
        details: errorDetails || undefined,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Image Generation Endpoint
// Add Memories for a user (for testing)
export const addMemoriesForUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      res.status(400).json({ 
        success: false,
        error: 'User ID and message are required' 
      });
      return;
    }

    if (!process.env.MEM0_API_KEY) {
      res.status(400).json({ 
        success: false,
        error: 'Mem0 API key is not configured' 
      });
      return;
    }

    console.log(`Adding memory for user: ${userId}`);

    try {
      const messageToAdd = {
        role: 'user' as const,
        content: message
      };

      await addMemories([messageToAdd], { 
        user_id: userId,
        mem0ApiKey: process.env.MEM0_API_KEY 
      });

      console.log('✅ Memory added successfully');

      res.status(200).json({
        success: true,
        data: {
          message: 'Memory added successfully',
          userId,
          addedAt: new Date().toISOString()
        }
      });

    } catch (mem0Error) {
      console.error('❌ Error adding memory:', mem0Error);
      res.status(500).json({
        success: false,
        error: 'Failed to add memory',
        details: mem0Error instanceof Error ? mem0Error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error: any) {
    console.error('Add memory error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to add memory',
      timestamp: new Date().toISOString()
    });
  }
});

// Get Memories for a user (for debugging only)
export const getMemories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("getMemories")
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({ 
        success: false,
        error: 'User ID is required' 
      });
      return;
    }
    console.log("getMemories:");
    if (!process.env.MEM0_API_KEY) {
      res.status(400).json({ 
        success: false,
        error: 'Mem0 API key is not configured' 
      });
      return;
    }

    console.log(`Retrieving memories for user: ${userId}`);

    try {
      // Use a general query to retrieve all memories for the user
      const memories = await retrieveMemories('Retrieve all memories for this user', { 
        user_id: userId,
        mem0ApiKey: process.env.MEM0_API_KEY 
      });

      console.log('✅ Memories retrieved successfully');

      res.status(200).json({
        success: true,
        data: {
          memories,
          userId,
          retrievedAt: new Date().toISOString()
        }
      });

    } catch (mem0Error) {
      console.error('❌ Error retrieving memories:', mem0Error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve memories',
        details: mem0Error instanceof Error ? mem0Error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error: any) {
    console.error('Get memories error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to get memories',
      timestamp: new Date().toISOString()
    });
  }
});

export const generateImageHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, aspectRatio = '16:9', size = '1024x1024' } = req.body;
    
    if (!prompt) {
      res.status(400).json({ 
        success: false,
        error: 'Prompt is required for image generation' 
      });
      return;
    }

    console.log(`Generating image with prompt: ${prompt}`);

    // Read the clever-bee service account credentials
    const serviceAccountPath = path.join(__dirname, '../../clever-bee-468418-s7-9d2a25e023ff.json');
    const serviceAccountKey = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    const vertex = createVertex({
      project: serviceAccountKey.project_id,
      location: 'us-central1',
      googleAuthOptions: {
        credentials: serviceAccountKey,
      },
    });

    const { image } = await generateImage({
      model: vertex.image('imagen-3.0-generate-002'),
      prompt: prompt,
      aspectRatio: '16:9',
    });
    
    // console.log(
    //   `Revised prompt: ${providerMetadata.vertex.images[0].revisedPrompt}`,
    // );

    console.log('✅ Image generated successfully');
    console.log('Image type:', typeof image);
    console.log('Image object keys:', Object.keys(image));
    console.log('Image object:', JSON.stringify(image, null, 2));
    
    // Convert image to base64 string
    let imageBase64: string;
    if (typeof image === 'string') {
      imageBase64 = image;
    } else if (image && typeof image === 'object') {
      // Handle different image object formats
      if ('base64' in image && image.base64) {
        imageBase64 = image.base64;
      } else if ('toString' in image && typeof image.toString === 'function') {
        imageBase64 = image.toString();
      } else {
        // Try to convert to base64 using Buffer
        imageBase64 = Buffer.from(image as any).toString('base64');
      }
    } else {
      throw new Error('Invalid image format received from Vertex AI');
    }
    
    console.log('Image base64 length:', imageBase64.length);
    
    let cloudinaryUrl: string;
    try {
      cloudinaryUrl = await uploadBase64ImageToCloudinary(imageBase64, prompt);
    } catch (uploadError) {
      console.error('Failed to upload to Cloudinary, falling back to base64:', uploadError);
      // Fallback to base64 if Cloudinary upload fails
      cloudinaryUrl = `data:image/png;base64,${imageBase64}`;
    }

    // Generate AI commentary about the image
    const commentaryResult = await streamText({
      model: google('gemini-2.5-flash'),
      messages: [
        {
          role: 'user',
          content: `I just generated an image with the prompt: "${prompt}". Please provide a brief, friendly commentary about this image generation. Keep it under 2-3 sentences and make it conversational. Don't describe the image itself, just comment on the generation process or creative aspect.`
        }
      ],
      temperature: 0.7,
    });

    // Get the commentary text
    let commentary = '';
    for await (const chunk of commentaryResult.textStream) {
      commentary += chunk;
    }

    const response = {
      success: true,
      data: {
        image: cloudinaryUrl,
        prompt: prompt,
        aspectRatio: aspectRatio,
        size: size,
        generatedAt: new Date().toISOString(),
        commentary: commentary.trim()
      }
    };
    console.log("responseImage:", response.data.image);
    console.log("responseImage type:", typeof response.data.image);
    console.log("Full response data:", JSON.stringify(response.data, null, 2));
    res.status(200).json(response);

  } catch (error: any) {
    console.error('Image generation error:', error);
    
    // Provide detailed error information
    let errorMessage = 'Failed to generate image';
    let errorDetails = '';
    
    if (error.message) {
      errorMessage = error.message;
    }
    
    if (error.code) {
      errorDetails = `Error code: ${error.code}`;
    }
    
    if (error.status) {
      errorDetails = `${errorDetails} | Status: ${error.status}`;
    }
    
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      details: errorDetails || undefined,
      timestamp: new Date().toISOString()
    });
  }
});



// Helper function to upload base64 image to Cloudinary
const uploadBase64ImageToCloudinary = async (base64Data: string, prompt: string): Promise<string> => {
  try {
    // Create a unique filename based on prompt and timestamp
    const timestamp = Date.now();
    const sanitizedPrompt = prompt.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const filename = `ai-generated-${sanitizedPrompt}-${timestamp}`;
    
    console.log('Uploading to Cloudinary - Base64 length:', base64Data.length);
    console.log('Base64 starts with:', base64Data.substring(0, 50));
    
    // Ensure base64 data has proper format for Cloudinary
    let formattedBase64 = base64Data;
    if (!base64Data.startsWith('data:image/')) {
      formattedBase64 = `data:image/png;base64,${base64Data}`;
    }
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(formattedBase64, {
      resource_type: 'image',
      folder: 'ai-generated-images',
      public_id: filename,
      format: 'png',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
    
    console.log('✅ Image uploaded to Cloudinary:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('❌ Failed to upload image to Cloudinary:', error);
    console.error('Error details:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};