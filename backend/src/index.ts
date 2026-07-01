import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middleware/errorMiddleware';
import { rateLimiter } from './middleware/rateLimiterMiddleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Security: Disable X-Powered-By header
app.disable('x-powered-by');

// Security: Custom headers middleware (Alternative to Helmet)
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
  );
  next();
});

// Rate limiting for API requests
app.use('/api', rateLimiter);

// Allowed origins list
const allowedOrigins = [
  'http://localhost:5173',
  'https://dsa-master-phi.vercel.app',
  FRONTEND_URL
];

// CORS configuration for supporting credentials (cookies)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, postman, curl)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.vercel.app');
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);



// Built-in body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Cookie parser for reading JWT tokens in cookies
app.use(cookieParser());

// Base Route
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to DSA Master API',
    status: 'online',
    version: '1.0.0',
  });
});

// API Routes mounting
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

// Start the server
const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` 🚀 DSA Master API Server running on port ${PORT}`);
  console.log(` 🌐 Frontend URL configured: ${FRONTEND_URL}`);
  console.log(` 🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=========================================`);
});

export default server;
