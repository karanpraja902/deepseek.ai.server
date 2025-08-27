import { Request, Response, NextFunction } from 'express';
import { 
  validateAIChatRequest, 
  validateCreateChatRequest, 
  validateAddMessageRequest, 
  validateUpdateChatTitleRequest 
} from '../../schemas/chatSchema';
import { ValidationResult } from '../../types';

// Generic validation middleware
const validateRequest = <T>(validationFunction: (data: any) => ValidationResult<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validation = validationFunction(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error
      });
      return;
    }
    
    // Replace req.body with validated data
    req.body = validation.data;
    next();
  };
};

// Specific validation middlewares
export const validateAIChat = validateRequest(validateAIChatRequest);
export const validateCreateChat = validateRequest(validateCreateChatRequest);
export const validateAddMessage = validateRequest(validateAddMessageRequest);
export const validateUpdateChatTitle = validateRequest(validateUpdateChatTitleRequest);

// Error handling middleware for validation errors
export const handleValidationError = (error: any, req: Request, res: Response, next: NextFunction): void => {
  if (error.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    });
    return;
  }
  next(error);
};

export { validateRequest };
