import { google } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, generateText } from 'ai';

// Model configuration
export interface ModelConfig {
  provider: 'google' | 'openrouter';
  model: string;
  displayName: string;
  fallback?: boolean;
  apiKeyEnv?: string; // Environment variable name for the API key
}

// Model key mapping for OpenRouter full model names
const MODEL_KEY_MAPPING: Record<string, string> = {
  'openrouter:deepseek/deepseek-r1-0528:free': 'deepseek-r1',
  'openrouter:nvidia/llama-3.1-nemotron-ultra-253b-v1:free': 'llama-3.1',
  'openrouter:openai/gpt-oss-20b:free': 'gpt-oss-20b'
};

// Available models configuration
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  'google': {
    provider: 'google',
    model: 'gemini-2.5-flash',
    displayName: 'Google Gemini 2.5 Flash',
    fallback: true, // This is our default/fallback model
    apiKeyEnv: 'GOOGLE_GENERATIVE_AI_API_KEY'
  },
  'deepseek-r1': {
    provider: 'openrouter',
    model: 'deepseek/deepseek-r1-0528:free',
    displayName: 'DeepSeek R1',
    apiKeyEnv: 'DEEPSEEK_R1_API_KEY'
  },
  'llama-3.1': {
    provider: 'openrouter',
    model: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
    displayName: 'Llama 3.1 Nemotron',
    apiKeyEnv: 'LLAMA_31_API_KEY'
  },
  'gpt-oss-20b': {
    provider: 'openrouter',
    model: 'openai/gpt-oss-20b:free',
    displayName: 'OpenAI:gpt-oss',
    apiKeyEnv: 'GPT_OSS_API_KEY'
  },
  'gemma-3n-e2b-it:free': {
    provider: 'openrouter',
    model: 'google/gemma-3n-e2b-it:free',
    displayName: 'google/gemma-3n',
    apiKeyEnv: 'GEMMA'
  }
};

// Default model
export const DEFAULT_MODEL = 'google';

// Initialize providers with model-specific API keys
const initializeProviders = () => {
  const providers: any = {};

  // Google provider
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    providers.google = google;
    console.log('✅ Google AI provider initialized');
  } else {
    console.warn('⚠️ Google AI API key not found');
  }

  // Initialize OpenRouter providers for each model with its specific API key
  Object.entries(AVAILABLE_MODELS).forEach(([modelKey, config]) => {
    if (config.provider === 'openrouter' && config.apiKeyEnv) {
      const apiKey = process.env[config.apiKeyEnv];
      if (apiKey) {
        // Create a unique provider instance for each model
        providers[`openrouter_${modelKey}`] = createOpenRouter({
          apiKey: apiKey,
        });
        console.log(`✅ OpenRouter provider initialized for ${config.displayName}`);
      } else {
        console.warn(`⚠️ API key not found for ${config.displayName} (${config.apiKeyEnv})`);
      }
    }
  });

  return providers;
};

let providers: any = {};

// Initialize providers on module load
try {
  providers = initializeProviders();
} catch (error) {
  console.error('❌ Error initializing AI providers:', error);
}

// Get model instance
export const getModel = (modelKey: string) => {
  // Map OpenRouter full model names to internal keys
  const mappedKey = MODEL_KEY_MAPPING[modelKey] || modelKey;
  const config = AVAILABLE_MODELS[mappedKey];
  if (!config) {
    throw new Error(`Model ${modelKey} (mapped to ${mappedKey}) not found in configuration`);
  }

  let provider;
  if (config.provider === 'google') {
    provider = providers.google;
  } else if (config.provider === 'openrouter') {
    // Use the model-specific OpenRouter provider
    provider = providers[`openrouter_${mappedKey}`];
  }

  if (!provider) {
    throw new Error(`Provider not available for model ${modelKey}. Check API key for ${config.apiKeyEnv}`);
  }

  return provider(config.model);
};

// Stream text with fallback
export const streamTextWithFallback = async (params: any) => {
  const modelKey = params.modelKey || DEFAULT_MODEL;
  
  try {
    // Map OpenRouter full model names to internal keys for display
    const mappedKey = MODEL_KEY_MAPPING[modelKey] || modelKey;
    console.log(`🤖 Attempting to use model: ${AVAILABLE_MODELS[mappedKey]?.displayName || modelKey}`);
    
    const model = getModel(modelKey);
    const result = await streamText({
      ...params,
      model,
    });
    
    console.log(`✅ Successfully using model: ${AVAILABLE_MODELS[modelKey]?.displayName}`);
    return result;
    
  } catch (error) {
    console.error(`❌ Model ${modelKey} failed:`, error);
    
    // Try fallback to default model if we weren't already using it
    if (modelKey !== DEFAULT_MODEL) {
      console.log(`🔄 Falling back to default model: ${AVAILABLE_MODELS[DEFAULT_MODEL]?.displayName}`);
      
      try {
        const fallbackModel = getModel(DEFAULT_MODEL);
        const result = await streamText({
          ...params,
          model: fallbackModel,
        });
        
        console.log(`✅ Fallback successful: ${AVAILABLE_MODELS[DEFAULT_MODEL]?.displayName}`);
        return result;
        
      } catch (fallbackError) {
        console.error(`❌ Fallback model also failed:`, fallbackError);
        throw new Error(`Both primary model (${modelKey}) and fallback model (${DEFAULT_MODEL}) failed`);
      }
    } else {
      // We were already using the default model, so no fallback available
      throw new Error(`Default model (${modelKey}) failed and no fallback available`);
    }
  }
};

// Generate text with fallback
export const generateTextWithFallback = async (params: any) => {
  const modelKey = params.modelKey || DEFAULT_MODEL;
  
  try {
    console.log(`🤖 Attempting to use model: ${AVAILABLE_MODELS[modelKey]?.displayName}`);
    
    const model = getModel(modelKey);
    const result = await generateText({
      ...params,
      model,
    });
    
    console.log(`✅ Successfully using model: ${AVAILABLE_MODELS[modelKey]?.displayName}`);
    return result;
    
  } catch (error) {
    console.error(`❌ Model ${modelKey} failed:`, error);
    
    // Try fallback to default model if we weren't already using it
    if (modelKey !== DEFAULT_MODEL) {
      console.log(`🔄 Falling back to default model: ${AVAILABLE_MODELS[DEFAULT_MODEL]?.displayName}`);
      
      try {
        const fallbackModel = getModel(DEFAULT_MODEL);
        const result = await generateText({
          ...params,
          model: fallbackModel,
        });
        
        console.log(`✅ Fallback successful: ${AVAILABLE_MODELS[DEFAULT_MODEL]?.displayName}`);
        return result;
        
      } catch (fallbackError) {
        console.error(`❌ Fallback model also failed:`, fallbackError);
        throw new Error(`Both primary model (${modelKey}) and fallback model (${DEFAULT_MODEL}) failed`);
      }
    } else {
      // We were already using the default model, so no fallback available
      throw new Error(`Default model (${modelKey}) failed and no fallback available`);
    }
  }
};

// Get available models for client
export const getAvailableModels = () => {
  return Object.entries(AVAILABLE_MODELS).map(([key, config]) => {
    let isAvailable = false;
    
    if (config.provider === 'google') {
      isAvailable = !!providers.google;
    } else if (config.provider === 'openrouter') {
      isAvailable = !!providers[`openrouter_${key}`];
    }
    
    return {
      key,
      displayName: config.displayName,
      provider: config.provider,
      isDefault: key === DEFAULT_MODEL,
      isAvailable,
      apiKeyEnv: config.apiKeyEnv // Include this for debugging
    };
  });
};

// Validate model key
export const isValidModel = (modelKey: string): boolean => {
  return modelKey in AVAILABLE_MODELS;
};
