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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ChatSchema = new mongoose_1.Schema({
    id: {
        type: String,
        unique: true,
        index: true,
    },
    userId: {
        type: String,
        required: false,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    messages: [{
            _id: {
                type: mongoose_1.default.Schema.Types.ObjectId,
            },
            role: {
                type: String,
                enum: ['user', 'assistant'],
                required: true,
            },
            content: {
                type: String,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
            files: [{
                    filename: {
                        type: String,
                    },
                    url: {
                        type: String,
                        required: true,
                    },
                    mediaType: {
                        type: String,
                    },
                    pdfAnalysis: {
                        type: String,
                        required: false,
                    },
                }],
            parts: [{
                    type: {
                        type: String,
                        enum: ['text', 'file', 'generated-image'],
                    },
                    text: {
                        type: String,
                    },
                    mediaType: {
                        type: String,
                    },
                    url: {
                        type: String,
                    },
                    filename: {
                        type: String,
                    },
                    image: {
                        type: String, // For base64 images
                    },
                    prompt: {
                        type: String,
                    },
                    generatedAt: {
                        type: Date,
                    },
                }],
            metadata: {
                chatId: {
                    type: String,
                },
                model: {
                    type: String,
                },
                isImageGeneration: {
                    type: Boolean,
                    default: false,
                },
            },
        }],
    title: {
        type: String,
        default: 'New Chat',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Update the updatedAt field before saving
ChatSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Create compound indexes for better query performance
ChatSchema.index({ id: 1, isActive: 1 });
ChatSchema.index({ userId: 1, isActive: 1 });
ChatSchema.index({ createdAt: -1 });
ChatSchema.index({ userId: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('Chat', ChatSchema);
