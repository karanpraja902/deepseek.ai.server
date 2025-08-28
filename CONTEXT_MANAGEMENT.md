# Context Management System

This system automatically manages conversation context to prevent token limit errors and ensure smooth operation across different AI models.

## The Problem

AI models have token limits (e.g., 163,840 tokens for some models). When conversations get too long, you get errors like:
```
This endpoint's maximum context length is 163840 tokens. However, you requested about 1379283 tokens.
```

## The Solution

### 🤖 **Automatic Context Management**

1. **Token Estimation**: Rough estimation of tokens in messages
2. **Context Truncation**: Automatically removes older messages when approaching limits
3. **Smart Preservation**: Always keeps the latest user message and recent context
4. **Fallback Protection**: Validates context before sending to AI models

### 📊 **Token Limits by Model**

```typescript
'google': 150,000 tokens      // Gemini 2.5 Flash
'deepseek-r1': 150,000 tokens // DeepSeek R1
'llama-3.1': 120,000 tokens   // Llama 3.1 Nemotron
'gpt-oss': 8,000 tokens       // GPT-OSS 20B
```

## How It Works

### 🔄 **Server-Side Processing**

1. **Message Conversion**: Transform UI messages to AI format
2. **Context Analysis**: Calculate total tokens in conversation
3. **Smart Truncation**: Remove older messages if over limit
4. **Validation**: Final check before sending to AI
5. **Error Prevention**: Return helpful error if still too large

### 📱 **Client-Side Warnings**

- **70% Usage**: Yellow warning - "Consider starting new chat soon"
- **90% Usage**: Red warning - "Next messages may be truncated"
- **Real-time Updates**: Updates as conversation grows

## Context Truncation Logic

### 🎯 **Preservation Priority**

1. **Always Keep**: Latest user message (current input)
2. **Work Backwards**: Include as many recent messages as possible
3. **Add Summary**: If messages removed, add truncation notice
4. **Respect Limits**: Never exceed model's token limit

### ✂️ **Example Truncation**

```
Original: 50 messages (200,000 tokens)
Truncated: 15 messages (140,000 tokens)
Added: "[Previous conversation truncated due to length. Total messages removed: 35]"
```

## Implementation Details

### 🛠️ **Server Files**

- **`services/contextManager.ts`** - Core context management logic
- **`controllers/ai/index.ts`** - Integration with AI streaming

### 🎨 **Client Files**

- **`lib/context-manager.ts`** - Client-side token estimation
- **`components/chat/ChatInput.tsx`** - Context warning UI

### 🔍 **Key Functions**

```typescript
// Server-side
manageContext(messages, modelKey) // Auto-truncate if needed
validateContext(messages, modelKey) // Final validation
calculateMessageTokens(messages) // Token counting

// Client-side  
getContextStatus(messages, modelKey) // Warning status
estimateTokens(text) // Token estimation
```

## Usage Examples

### 🚨 **Error Prevention**

Before:
```
❌ Error: Context length exceeded (1,379,283 tokens)
```

After:
```
✅ Auto-truncated: 45 → 15 messages (140,000 tokens)
🤖 Response generated successfully
```

### 📊 **Logging Output**

```
📊 Context Management:
  Original: 45 messages (200,000 tokens)
  Managed: 15 messages (140,000 tokens)  
  Limit: 150,000 tokens
  Model: google
```

## Benefits

### ⚡ **Automatic Prevention**
- No more context length errors
- Seamless conversation flow
- No user intervention needed

### 🎯 **Smart Truncation**
- Preserves recent context
- Keeps conversation coherent
- Maintains user intent

### 📱 **User Awareness**
- Visual warnings in UI
- Token usage display
- Proactive notifications

### 🔧 **Developer Features**
- Detailed logging
- Configurable limits
- Model-specific handling

## Configuration

### 🎛️ **Adjusting Token Limits**

Edit `services/contextManager.ts`:
```typescript
const MODEL_TOKEN_LIMITS: Record<string, number> = {
  'your-model': 100000, // Set custom limit
};
```

### ⚙️ **Tuning Truncation**

- **Safety Buffer**: Reserve tokens for response (default: 1000)
- **System Prompt**: Reserve tokens for system instructions (default: 500)
- **Truncation Threshold**: When to start truncating (default: 80% of limit)

## Troubleshooting

### 🔍 **Debug Information**

Check server logs for:
```
📊 Context Management: [details]
✂️ Truncated from X to Y messages
⚠️ Single message too long: X tokens
❌ Context validation failed
```

### 🛠️ **Common Issues**

1. **Single Message Too Long**
   - Solution: Message content truncation
   - Automatic: Text truncated with "...[truncated]"

2. **Rapid Token Growth**
   - Solution: More aggressive truncation
   - Adjust: Lower token limits in config

3. **Context Loss**
   - Solution: Start new conversation
   - User Action: Create new chat

## Future Improvements

- **Smart Summarization**: AI-powered conversation summaries
- **Selective Retention**: Keep important messages
- **User Control**: Manual context management options
- **Compression**: Advanced token optimization techniques
