# OpenRouter API Keys Setup Guide

## Why OpenRouter Models Aren't Working

The OpenRouter models are not working because the required API keys are not configured in your environment variables.

## Required Environment Variables

Add these to your `.env` file in the server directory:

```env
# OpenRouter Model-Specific API Keys
DEEPSEEK_R1_API_KEY=your-deepseek-r1-api-key-here
LLAMA_31_API_KEY=your-llama-31-api-key-here
GPT_OSS_API_KEY=your-gpt-oss-api-key-here
```

## How to Get OpenRouter API Keys

1. **Visit OpenRouter**: Go to https://openrouter.ai/
2. **Sign up/Login**: Create an account or log in
3. **Get API Key**: Navigate to your API keys section
4. **Copy Key**: Copy your API key

## Model-Specific Setup

### DeepSeek R1
- **Model**: `deepseek/deepseek-r1-0528:free`
- **API Key**: Set `DEEPSEEK_R1_API_KEY` in your `.env`

### Llama 3.1 Nemotron
- **Model**: `nvidia/llama-3.1-nemotron-ultra-253b-v1:free`
- **API Key**: Set `LLAMA_31_API_KEY` in your `.env`

### GPT-Oss-20b
- **Model**: `openai/gpt-oss-20b:free`
- **API Key**: Set `GPT_OSS_API_KEY` in your `.env`

## Verification

After setting the API keys:

1. **Restart the server**
2. **Check server logs** for:
   ```
   ✅ OpenRouter provider initialized for DeepSeek R1
   ✅ OpenRouter provider initialized for Llama 3.1 Nemotron
   ✅ OpenRouter provider initialized for OpenAI:gpt-oss
   ```

3. **Test the models** in your chat interface

## Troubleshooting

- **"API key not found"**: Check that the environment variable names match exactly
- **"Provider not available"**: Ensure the API key is valid and has credits
- **"Model not found"**: Verify the model configuration in `services/modelProvider.ts`

## Current Status

Based on the environment check, all OpenRouter API keys are currently **NOT SET**.
