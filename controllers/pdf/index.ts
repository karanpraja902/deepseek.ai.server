import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import pdf from 'pdf-parse';
import { 
  PDFAnalysisRequest, 
  PDFAnalysisResponse, 
  ApiResponse 
} from '../../types';

// Analyze PDF from URL
export const analyzePDF = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, filename }: PDFAnalysisRequest = req.body;
    
    if (!url || !filename) {
      res.status(400).json({ 
        success: false,
        error: 'Missing required fields: url and filename' 
      });
      return;
    }
    
    console.log(`Starting server-side analysis for PDF: ${filename}`);

    // Download the PDF from the provided URL
    const downloadResponse = await axios.get(url, {
      responseType: 'arraybuffer'
    });
    
    if (downloadResponse.status !== 200) {
      throw new Error(`Failed to download PDF: ${downloadResponse.statusText}`);
    }
    
    const buffer = Buffer.from(downloadResponse.data);
    
    // Parse PDF content
    const pdfData = await pdf(buffer);
    const fullContent = pdfData.text;
    
    // Generate a simple summary (you can integrate with AI service here)
    const summary = generateSummary(fullContent);
    
    console.log('Server-side PDF analysis completed.');

    const analysisResponse: PDFAnalysisResponse = {
      summary,
      content: fullContent,
      pageCount: pdfData.numpages,
      filename,
    };

    const response: ApiResponse<PDFAnalysisResponse> = {
      success: true,
      data: analysisResponse
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('PDF analysis error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to analyze PDF' 
    });
  }
});

// Helper function to generate summary
const generateSummary = (content: string): string => {
  // Simple summary generation - you can replace this with AI service
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const firstFewSentences = sentences.slice(0, 3).join('. ');
  return firstFewSentences.length > 200 
    ? firstFewSentences.substring(0, 200) + '...'
    : firstFewSentences;
};

// Extract text from PDF
export const extractText = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { url }: { url: string } = req.body;
    
    if (!url) {
      res.status(400).json({ 
        success: false,
        error: 'URL is required' 
      });
      return;
    }
    
    const downloadResponse = await axios.get(url, {
      responseType: 'arraybuffer'
    });
    
    const buffer = Buffer.from(downloadResponse.data);
    const pdfData = await pdf(buffer);
    
    const apiResponse: ApiResponse<any> = {
      success: true,
      data: {
        text: pdfData.text,
        pageCount: pdfData.numpages,
        info: pdfData.info
      }
    };
    
    res.status(200).json(apiResponse);
  } catch (error: any) {
    console.error('PDF text extraction error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to extract text from PDF' 
    });
  }
});
