# Model-Specific API Keys Configuration

This system supports individual API keys for different OpenRouter models, allowing you to use different keys for different models based on your access or billing preferences.

## Environment Variables Setup

Add these environment variables to your `.env` file:

```env
# Google AI (Default/Fallback Model)
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key

# OpenRouter Model-Specific API Keys
DEEPSEEK_R1_API_KEY=your-deepseek-r1-api-key
LLAMA_31_API_KEY=your-llama-31-api-key
GPT_OSS_API_KEY=your-gpt-oss-api-key
```

## How It Works

### 1. **Individual Provider Instances**
- Each OpenRouter model gets its own provider instance
- Each instance uses its specific API key
- Google uses a single provider instance

### 2. **Model Configuration**
```typescript
'deepseek-r1': {
  provider: 'openrouter',
  model: 'deepseek/deepseek-r1-0528:free',
  displayName: 'DeepSeek R1',
  apiKeyEnv: 'DEEPSEEK_R1_API_KEY'  // Specific API key
}
```

### 3. **Dynamic Provider Initialization**
- System checks each model's API key on startup
- Only initializes providers for models with valid API keys
- Shows availability status in the UI

### 4. **Fallback System**
- If selected model fails → falls back to Google
- If Google fails → returns error
- Clear logging for debugging

## Adding New Models

To add a new OpenRouter model:

1. **Add environment variable** to `.env`:
```env
NEW_MODEL_API_KEY=your-new-model-api-key
```

2. **Update model configuration** in `services/modelProvider.ts`:
```typescript
'new-model': {
  provider: 'openrouter',
  model: 'provider/model-name',
  displayName: 'New Model Name',
  apiKeyEnv: 'NEW_MODEL_API_KEY'
}
```

3. **Restart the server** - providers are initialized on startup

## Debugging

### Check Model Availability
Visit: `GET /api/ai/models`

Response includes:
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "key": "deepseek-r1",
        "displayName": "DeepSeek R1",
        "provider": "openrouter",
        "isDefault": false,
        "isAvailable": true,
        "apiKeyEnv": "DEEPSEEK_R1_API_KEY"
      }
    ]
  }
}
```

### Server Logs
Check startup logs for provider initialization:
```
✅ Google AI provider initialized
✅ OpenRouter provider initialized for DeepSeek R1
⚠️ API key not found for Llama 3.1 Nemotron (LLAMA_31_API_KEY)
```

### Model Selection Logic
```
1. User selects model in UI
2. System checks if model provider is available
3. If available → uses model-specific API key
4. If not available → shows as disabled in UI
5. If model fails during chat → falls back to Google
```

## Benefits

- **Flexible Billing**: Use different API keys for different models
- **Access Control**: Enable/disable specific models per environment
- **Cost Management**: Track usage per model with separate keys
- **Reliability**: Automatic fallback ensures chat always works
- **Transparency**: Clear UI indicators for model availability

## Troubleshooting

### Model Shows as Unavailable
1. Check if API key is set in `.env`
2. Verify API key is valid for that specific model
3. Restart server after adding new keys
4. Check server logs for initialization errors

### Model Selection Fails
1. Check server logs for specific error
2. Verify API key has access to the specific model
3. Test API key directly with OpenRouter API
4. System will automatically fall back to Google

### No Models Available
1. Ensure `GOOGLE_GENERATIVE_AI_API_KEY` is set (fallback)
2. Check that at least one model API key is valid
3. Restart server to reinitialize providers

## Security Notes

- Never commit actual API keys to version control
- Use different API keys for development/production
- Regularly rotate API keys for security
- Monitor API key usage through provider dashboards
