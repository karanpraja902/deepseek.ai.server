import { Request, Response } from 'express';
import { streamText, experimental_generateImage as generateImage } from 'ai';
import { createVertex } from '@ai-sdk/google-vertex';
import { googleTools } from '@ai-sdk/google/internal';
import asyncHandler from 'express-async-handler';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { v2 as cloudinary } from 'cloudinary';


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

export const streamChat = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ 
        success: false,
        error: 'Messages array is required' 
      });
      return;
    }
    console.log("messagesss:",messages[messages.length-1].parts)

    // Optimized message transformation for multimodal content
    const transformedMessages = await Promise.all(messages
      .map(async (msg) => {
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
      })
      .filter((msg): msg is any => msg !== null));
      
    console.log("transformedMessages:",transformedMessages[transformedMessages.length-1].content)

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

    const result = await streamText({
      model: vertex('gemini-2.5-flash'),
      tools: { code_execution: googleTools.codeExecution({}) },
      providerOptions: {
        google: {
          thinkingConfig: {
            includeThoughts: true,
          },
          
          
        } satisfies GoogleGenerativeAIProviderOptions,

      },

      
      
      messages: transformedMessages,
      temperature: 0.4,
    });
    
    // Stream response directly to client
    result.pipeTextStreamToResponse(res,{
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  }
});

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

    // Generate image using Vertex AI
    const { image } = await generateImage({
      model: vertex.image('imagen-3.0-generate-002'),
      prompt: prompt,
      aspectRatio: '16:9',
    });

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
      model: vertex('gemini-2.5-flash'),
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