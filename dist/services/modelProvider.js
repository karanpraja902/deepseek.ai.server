"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidModel = exports.getAvailableModels = exports.generateTextWithFallback = exports.streamTextWithFallback = exports.getModel = exports.DEFAULT_MODEL = exports.AVAILABLE_MODELS = void 0;
const google_1 = require("@ai-sdk/google");
const ai_sdk_provider_1 = require("@openrouter/ai-sdk-provider");
const ai_1 = require("ai");
const MODEL_KEY_MAPPING = {
    'openrouter:deepseek/deepseek-r1-0528:free': 'deepseek-r1',
    'openrouter:nvidia/llama-3.1-nemotron-ultra-253b-v1:free': 'llama-3.1',
    'openrouter:openai/gpt-oss-20b:free': 'gpt-oss-20b'
};
exports.AVAILABLE_MODELS = {
    'google': {
        provider: 'google',
        model: 'gemini-2.5-flash',
        displayName: 'Google Gemini 2.5 Flash',
        fallback: true,
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
exports.DEFAULT_MODEL = 'google';
const initializeProviders = () => {
    const providers = {};
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        providers.google = google_1.google;
        console.log('✅ Google AI provider initialized');
    }
    else {
        console.warn('⚠️ Google AI API key not found');
    }
    Object.entries(exports.AVAILABLE_MODELS).forEach(([modelKey, config]) => {
        if (config.provider === 'openrouter' && config.apiKeyEnv) {
            const apiKey = process.env[config.apiKeyEnv];
            if (apiKey) {
                providers[`openrouter_${modelKey}`] = (0, ai_sdk_provider_1.createOpenRouter)({
                    apiKey: apiKey,
                });
                console.log(`✅ OpenRouter provider initialized for ${config.displayName}`);
            }
            else {
                console.warn(`⚠️ API key not found for ${config.displayName} (${config.apiKeyEnv})`);
            }
        }
    });
    return providers;
};
let providers = {};
try {
    providers = initializeProviders();
}
catch (error) {
    console.error('❌ Error initializing AI providers:', error);
}
const getModel = (modelKey) => {
    const mappedKey = MODEL_KEY_MAPPING[modelKey] || modelKey;
    const config = exports.AVAILABLE_MODELS[mappedKey];
    if (!config) {
        throw new Error(`Model ${modelKey} (mapped to ${mappedKey}) not found in configuration`);
    }
    let provider;
    if (config.provider === 'google') {
        provider = providers.google;
    }
    else if (config.provider === 'openrouter') {
        provider = providers[`openrouter_${mappedKey}`];
    }
    if (!provider) {
        throw new Error(`Provider not available for model ${modelKey}. Check API key for ${config.apiKeyEnv}`);
    }
    return provider(config.model);
};
exports.getModel = getModel;
const streamTextWithFallback = async (params) => {
    const modelKey = params.modelKey || exports.DEFAULT_MODEL;
    try {
        const mappedKey = MODEL_KEY_MAPPING[modelKey] || modelKey;
        console.log(`🤖 Attempting to use model: ${exports.AVAILABLE_MODELS[mappedKey]?.displayName || modelKey}`);
        const model = (0, exports.getModel)(modelKey);
        const result = await (0, ai_1.streamText)({
            ...params,
            model,
        });
        console.log(`✅ Successfully using model: ${exports.AVAILABLE_MODELS[modelKey]?.displayName}`);
        return result;
    }
    catch (error) {
        console.error(`❌ Model ${modelKey} failed:`, error);
        if (modelKey !== exports.DEFAULT_MODEL) {
            console.log(`🔄 Falling back to default model: ${exports.AVAILABLE_MODELS[exports.DEFAULT_MODEL]?.displayName}`);
            try {
                const fallbackModel = (0, exports.getModel)(exports.DEFAULT_MODEL);
                const result = await (0, ai_1.streamText)({
                    ...params,
                    model: fallbackModel,
                });
                console.log(`✅ Fallback successful: ${exports.AVAILABLE_MODELS[exports.DEFAULT_MODEL]?.displayName}`);
                return result;
            }
            catch (fallbackError) {
                console.error(`❌ Fallback model also failed:`, fallbackError);
                throw new Error(`Both primary model (${modelKey}) and fallback model (${exports.DEFAULT_MODEL}) failed`);
            }
        }
        else {
            throw new Error(`Default model (${modelKey}) failed and no fallback available`);
        }
    }
};
exports.streamTextWithFallback = streamTextWithFallback;
const generateTextWithFallback = async (params) => {
    const modelKey = params.modelKey || exports.DEFAULT_MODEL;
    try {
        console.log(`🤖 Attempting to use model: ${exports.AVAILABLE_MODELS[modelKey]?.displayName}`);
        const model = (0, exports.getModel)(modelKey);
        const result = await (0, ai_1.generateText)({
            ...params,
            model,
        });
        console.log(`✅ Successfully using model: ${exports.AVAILABLE_MODELS[modelKey]?.displayName}`);
        return result;
    }
    catch (error) {
        console.error(`❌ Model ${modelKey} failed:`, error);
        if (modelKey !== exports.DEFAULT_MODEL) {
            console.log(`🔄 Falling back to default model: ${exports.AVAILABLE_MODELS[exports.DEFAULT_MODEL]?.displayName}`);
            try {
                const fallbackModel = (0, exports.getModel)(exports.DEFAULT_MODEL);
                const result = await (0, ai_1.generateText)({
                    ...params,
                    model: fallbackModel,
                });
                console.log(`✅ Fallback successful: ${exports.AVAILABLE_MODELS[exports.DEFAULT_MODEL]?.displayName}`);
                return result;
            }
            catch (fallbackError) {
                console.error(`❌ Fallback model also failed:`, fallbackError);
                throw new Error(`Both primary model (${modelKey}) and fallback model (${exports.DEFAULT_MODEL}) failed`);
            }
        }
        else {
            throw new Error(`Default model (${modelKey}) failed and no fallback available`);
        }
    }
};
exports.generateTextWithFallback = generateTextWithFallback;
const getAvailableModels = () => {
    return Object.entries(exports.AVAILABLE_MODELS).map(([key, config]) => {
        let isAvailable = false;
        if (config.provider === 'google') {
            isAvailable = !!providers.google;
        }
        else if (config.provider === 'openrouter') {
            isAvailable = !!providers[`openrouter_${key}`];
        }
        return {
            key,
            displayName: config.displayName,
            provider: config.provider,
            isDefault: key === exports.DEFAULT_MODEL,
            isAvailable,
            apiKeyEnv: config.apiKeyEnv
        };
    });
};
exports.getAvailableModels = getAvailableModels;
const isValidModel = (modelKey) => {
    return modelKey in exports.AVAILABLE_MODELS;
};
exports.isValidModel = isValidModel;
//# sourceMappingURL=modelProvider.js.map