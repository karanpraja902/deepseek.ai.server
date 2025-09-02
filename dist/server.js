"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookieParser = require("cookie-parser");
// Load environment variables
dotenv_1.default.config();
const database_1 = __importDefault(require("./config/database"));
const auth_1 = __importDefault(require("./routes/auth"));
const chat_1 = __importDefault(require("./routes/chat"));
const user_1 = __importDefault(require("./routes/user"));
const pdf_1 = __importDefault(require("./routes/pdf"));
const cloudinary_1 = __importDefault(require("./routes/cloudinary"));
const ai_1 = __importDefault(require("./routes/ai"));
const weather_1 = __importDefault(require("./routes/weather"));
const stripe_1 = __importDefault(require("./routes/stripe"));
const validation_1 = require("./middleware/validation");
const passport_1 = __importDefault(require("passport"));
require("./strategy/google");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Connect to MongoDB
(0, database_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use(cookieParser());
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(passport_1.default.initialize());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Compression middleware
app.use((0, compression_1.default)());
// Logging middleware
app.use((0, morgan_1.default)('combined'));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/user', user_1.default);
app.use('/api/pdf', pdf_1.default);
app.use('/api/cloudinary', cloudinary_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/weather', weather_1.default);
app.use('/api/stripe', stripe_1.default);
// Validation error handling middleware
app.use(validation_1.handleValidationError);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
