"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSearchService = void 0;
const google_genai_1 = require("@langchain/google-genai");
const google_genai_2 = require("@langchain/google-genai");
const memory_1 = require("langchain/vectorstores/memory");
const textsplitters_1 = require("@langchain/textsplitters");
const searchapi_1 = require("@langchain/community/document_loaders/web/searchapi");
const prompts_1 = require("@langchain/core/prompts");
const combine_documents_1 = require("langchain/chains/combine_documents");
const retrieval_1 = require("langchain/chains/retrieval");
class WebSearchService {
    static initialize() {
        // Initialize Google GenAI components
        this.llm = new google_genai_1.ChatGoogleGenerativeAI({
            model: "gemini-1.5-flash",
            apiKey: process.env.GOOGLE_API_KEY,
        });
        this.embeddings = new google_genai_2.GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GOOGLE_API_KEY,
        });
        this.searchApiKey = process.env.SEARCHAPI_KEY || '';
        if (!this.searchApiKey) {
            console.warn('⚠️ SearchAPI key not found. Web search functionality will be limited.');
        }
    }
    static async performWebSearch(query) {
        try {
            if (!this.searchApiKey) {
                // Fallback to basic search results
                return this.getFallbackSearchResults(query);
            }
            // Use SearchApiLoader to load web search results
            const loader = new searchapi_1.SearchApiLoader({
                q: query,
                apiKey: this.searchApiKey,
                engine: "google"
            });
            const docs = await loader.load();
            if (!docs || docs.length === 0) {
                return this.getFallbackSearchResults(query);
            }
            // Convert documents to search results format
            const searchResults = docs.map((doc, index) => ({
                title: doc.metadata.title || `Search Result ${index + 1}`,
                snippet: doc.pageContent.substring(0, 200) + '...',
                url: doc.metadata.url || `https://example.com/result-${index + 1}`,
                source: 'Google Search'
            }));
            return searchResults;
        }
        catch (error) {
            console.error('Web search error:', error);
            return this.getFallbackSearchResults(query);
        }
    }
    static async performWebSearchWithAI(query, userQuestion) {
        try {
            if (!this.searchApiKey) {
                return {
                    answer: "I'm sorry, but web search is not currently available. Please try again later.",
                    searchResults: [],
                    sources: []
                };
            }
            // Perform web search
            const searchResults = await this.performWebSearch(query);
            if (searchResults.length === 0) {
                return {
                    answer: "I couldn't find any relevant information for your query.",
                    searchResults: [],
                    sources: []
                };
            }
            // Use SearchApiLoader to load web search results
            const loader = new searchapi_1.SearchApiLoader({
                q: query,
                apiKey: this.searchApiKey,
                engine: "google"
            });
            const docs = await loader.load();
            // Split documents for processing
            const textSplitter = new textsplitters_1.RecursiveCharacterTextSplitter({
                chunkSize: 800,
                chunkOverlap: 100,
            });
            const splitDocs = await textSplitter.splitDocuments(docs);
            // Create vector store
            const vectorStore = await memory_1.MemoryVectorStore.fromDocuments(splitDocs, this.embeddings);
            // Create question answering prompt
            const questionAnsweringPrompt = prompts_1.ChatPromptTemplate.fromMessages([
                [
                    "system",
                    `You are a helpful AI assistant. Answer the user's questions based on the provided context from web search results. 
          
          Guidelines:
          - Provide accurate and relevant answers based on the context
          - If the context doesn't contain enough information, say so
          - Cite sources when possible
          - Keep answers concise but informative
          - If you're unsure about something, acknowledge the uncertainty
          
          Context: {context}`
                ],
                ["human", "{input}"],
            ]);
            // Create document chain
            const combineDocsChain = await (0, combine_documents_1.createStuffDocumentsChain)({
                llm: this.llm,
                prompt: questionAnsweringPrompt,
            });
            // Create retrieval chain
            const chain = await (0, retrieval_1.createRetrievalChain)({
                retriever: vectorStore.asRetriever({ k: 5 }), // Get top 5 most relevant documents
                combineDocsChain,
            });
            // Get answer
            const result = await chain.invoke({
                input: userQuestion,
            });
            // Extract sources from the documents
            const sources = docs.map(doc => doc.metadata.url || doc.metadata.source || 'Unknown source');
            return {
                answer: result.answer,
                searchResults,
                sources: [...new Set(sources)] // Remove duplicates
            };
        }
        catch (error) {
            console.error('Web search with AI error:', error);
            return {
                answer: "I encountered an error while searching for information. Please try again.",
                searchResults: [],
                sources: []
            };
        }
    }
    static getFallbackSearchResults(query) {
        return [
            {
                title: `Search results for: ${query}`,
                snippet: `This is a fallback search result for "${query}". Web search functionality requires a SearchAPI key to be configured.`,
                url: 'https://example.com',
                source: 'Fallback Search'
            }
        ];
    }
}
exports.WebSearchService = WebSearchService;
// Initialize the service when the module is loaded
WebSearchService.initialize();
