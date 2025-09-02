"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamPDFAnalysis = exports.analyzePDFWithLangChain = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
const google_genai_1 = require("@langchain/google-genai");
const pdf_1 = require("@langchain/community/document_loaders/fs/pdf");
const textsplitters_1 = require("@langchain/textsplitters");
const memory_1 = require("langchain/vectorstores/memory");
const retrieval_1 = require("langchain/chains/retrieval");
const prompts_1 = require("@langchain/core/prompts");
const google_genai_2 = require("@langchain/google-genai");
const combine_documents_1 = require("langchain/chains/combine_documents");
exports.analyzePDFWithLangChain = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { pdfUrl, question, analysisType = 'general' } = req.body;
        if (!pdfUrl) {
            res.status(400).json({
                success: false,
                error: 'PDF URL is required'
            });
            return;
        }
        console.log(`Analyzing PDF: ${pdfUrl}`);
        console.log(`Question: ${question}`);
        console.log(`Analysis Type: ${analysisType}`);
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempFilePath = path.join(tempDir, `temp_${Date.now()}.pdf`);
        const response = await axios_1.default.get(pdfUrl, {
            responseType: 'stream',
            maxContentLength: 50 * 1024 * 1024,
            timeout: 30000
        });
        const writer = fs.createWriteStream(tempFilePath);
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', () => resolve());
            writer.on('error', reject);
            response.data.on('error', reject);
        });
        try {
            const loader = new pdf_1.PDFLoader(tempFilePath);
            const pdfDocs = await loader.load();
            console.log(`Loaded ${pdfDocs.length} pages from PDF`);
            const maxTextLength = 100000;
            const totalText = pdfDocs.map(doc => doc.pageContent).join(' ');
            if (totalText.length > maxTextLength) {
                console.log(`⚠️ PDF text is large (${totalText.length} chars), truncating to ${maxTextLength} chars`);
                pdfDocs[0].pageContent = totalText.substring(0, maxTextLength) + '...[truncated]';
                pdfDocs.splice(1);
            }
            const textSplitter = new textsplitters_1.RecursiveCharacterTextSplitter({
                chunkSize: 800,
                chunkOverlap: 100,
            });
            const splitDocs = await textSplitter.splitDocuments(pdfDocs);
            const maxChunks = 20;
            if (splitDocs.length > maxChunks) {
                console.log(`⚠️ Too many chunks (${splitDocs.length}), limiting to ${maxChunks}`);
                splitDocs.splice(maxChunks);
            }
            console.log(`Split into ${splitDocs.length} chunks`);
            const vectorStore = await memory_1.MemoryVectorStore.fromDocuments(splitDocs, new google_genai_2.GoogleGenerativeAIEmbeddings({
                model: 'embedding-001',
                apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            }));
            const llm = new google_genai_1.ChatGoogleGenerativeAI({
                model: 'gemini-2.0-flash-exp',
                apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
                temperature: 0.3,
            });
            const embeddings = new google_genai_2.GoogleGenerativeAIEmbeddings({
                apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            });
            let systemPrompt;
            switch (analysisType) {
                case 'summary':
                    systemPrompt = `You are a helpful AI assistant. Analyze the provided PDF document and provide a comprehensive summary.

Please provide a detailed summary covering:
1. Main topics and themes
2. Key findings or conclusions
3. Important data or statistics mentioned
4. Overall document structure

Context: {context}`;
                    break;
                case 'qa':
                    systemPrompt = `You are a helpful AI assistant. Answer questions based on the provided PDF document context.

Guidelines:
- Provide detailed answers based only on the information in the PDF
- If the information is not available in the PDF, state that clearly
- Cite specific parts of the document when possible
- Keep answers accurate and relevant

Context: {context}`;
                    break;
                case 'extract':
                    systemPrompt = `You are a helpful AI assistant. Extract specific information from the provided PDF document.

Please extract and organize the following information:
1. Key dates and timelines
2. Names of people, organizations, or companies
3. Important numbers, statistics, or metrics
4. Main conclusions or recommendations
5. Any technical terms or definitions

Context: {context}`;
                    break;
                default:
                    systemPrompt = `You are a helpful AI assistant. Analyze the provided PDF document comprehensively.

Please provide a comprehensive analysis covering:
1. Main content and purpose of the document
2. Key points and findings
3. Important details and context
4. Any notable insights or implications

Context: {context}`;
            }
            const questionAnsweringPrompt = prompts_1.ChatPromptTemplate.fromMessages([
                ['system', systemPrompt],
                ['human', '{input}'],
            ]);
            const combineDocsChain = await (0, combine_documents_1.createStuffDocumentsChain)({
                llm,
                prompt: questionAnsweringPrompt,
            });
            const chain = await (0, retrieval_1.createRetrievalChain)({
                retriever: vectorStore.asRetriever({ k: 5 }),
                combineDocsChain,
            });
            let query = question || 'Provide a comprehensive analysis of this document';
            const result = await chain.invoke({
                input: query,
            });
            console.log('✅ PDF analysis completed successfully');
            fs.unlinkSync(tempFilePath);
            const response = {
                success: true,
                data: {
                    analysis: result.answer,
                    sourceDocuments: splitDocs.map((doc) => ({
                        pageContent: doc.pageContent.substring(0, 200) + '...',
                        metadata: doc.metadata
                    })),
                    analysisType,
                    question: question || null,
                    pdfUrl,
                    analyzedAt: new Date().toISOString(),
                    documentInfo: {
                        totalPages: pdfDocs.length,
                        totalChunks: splitDocs.length,
                        chunkSize: 1000,
                        chunkOverlap: 200
                    }
                }
            };
            res.status(200).json(response);
        }
        catch (pdfError) {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
            throw pdfError;
        }
    }
    catch (error) {
        console.error('PDF Analysis error:', error);
        let errorMessage = 'Failed to analyze PDF';
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
exports.streamPDFAnalysis = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { pdfUrl, question, analysisType = 'general' } = req.body;
        if (!pdfUrl) {
            res.status(400).json({
                success: false,
                error: 'PDF URL is required'
            });
            return;
        }
        console.log(`Streaming PDF analysis: ${pdfUrl}`);
        const response = await axios_1.default.get(pdfUrl, {
            responseType: 'arraybuffer'
        });
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempFilePath = path.join(tempDir, `temp_${Date.now()}.pdf`);
        fs.writeFileSync(tempFilePath, response.data);
        try {
            const loader = new pdf_1.PDFLoader(tempFilePath);
            const pdfDocs = await loader.load();
            const textSplitter = new textsplitters_1.RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });
            const splitDocs = await textSplitter.splitDocuments(pdfDocs);
            const vectorStore = await memory_1.MemoryVectorStore.fromDocuments(splitDocs, new google_genai_2.GoogleGenerativeAIEmbeddings({
                model: 'embedding-001',
                apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            }));
            const llm = new google_genai_1.ChatGoogleGenerativeAI({
                model: 'gemini-2.0-flash-exp',
                apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
                temperature: 0.3,
                streaming: true,
            });
            const embeddings = new google_genai_2.GoogleGenerativeAIEmbeddings({
                apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            });
            const questionAnsweringPrompt = prompts_1.ChatPromptTemplate.fromMessages([
                [
                    'system',
                    `You are a helpful AI assistant. Analyze the provided PDF document and provide a detailed analysis.

Please provide a comprehensive analysis covering:
1. Main content and purpose of the document
2. Key points and findings
3. Important details and context
4. Any notable insights or implications

Context: {context}`
                ],
                ['human', '{input}'],
            ]);
            const combineDocsChain = await (0, combine_documents_1.createStuffDocumentsChain)({
                llm,
                prompt: questionAnsweringPrompt,
            });
            const chain = await (0, retrieval_1.createRetrievalChain)({
                retriever: vectorStore.asRetriever({ k: 5 }),
                combineDocsChain,
            });
            const query = question || 'Provide a comprehensive analysis of this document';
            const result = await chain.invoke({
                input: query,
            });
            fs.unlinkSync(tempFilePath);
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.write(`Analysis: ${result.answer}\n\n`);
            res.write(`Document Info: ${pdfDocs.length} pages analyzed\n`);
            res.write(`Chunks processed: ${splitDocs.length}\n`);
            res.end();
        }
        catch (pdfError) {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
            throw pdfError;
        }
    }
    catch (error) {
        console.error('Streaming PDF Analysis error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to analyze PDF',
                timestamp: new Date().toISOString()
            });
        }
    }
});
//# sourceMappingURL=index.js.map