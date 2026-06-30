"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const rateLimiterMiddleware_1 = require("./middleware/rateLimiterMiddleware");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
// Security: Disable X-Powered-By header
app.disable('x-powered-by');
// Security: Custom headers middleware (Alternative to Helmet)
app.use((_req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
    next();
});
// Rate limiting for API requests
app.use('/api', rateLimiterMiddleware_1.rateLimiter);
// CORS configuration for supporting credentials (cookies)
app.use((0, cors_1.default)({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Built-in body parsers
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
// Cookie parser for reading JWT tokens in cookies
app.use((0, cookie_parser_1.default)());
// Base Route
app.get('/', (_req, res) => {
    res.json({
        message: 'Welcome to DSA Master API',
        status: 'online',
        version: '1.0.0',
    });
});
// API Routes mounting
app.use('/api', routes_1.default);
// Global Error Handler
app.use(errorMiddleware_1.errorHandler);
// Start the server
const server = app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` 🚀 DSA Master API Server running on port ${PORT}`);
    console.log(` 🌐 Frontend URL configured: ${FRONTEND_URL}`);
    console.log(` 🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=========================================`);
});
exports.default = server;
