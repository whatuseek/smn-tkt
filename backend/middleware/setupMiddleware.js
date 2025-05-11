// backend/middleware/setupMiddleware.js
import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

const setupMiddleware = (app) => {
  // 1. CORS Configuration
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  const defaultAllowedOrigins = ['http://localhost:5173']; // Default fallback

  const allowedOrigins = allowedOriginsEnv
      ? allowedOriginsEnv.split(',').map(origin => origin.trim())
      : defaultAllowedOrigins;

  console.log("Allowed CORS Origins:", allowedOrigins.length > 0 ? allowedOrigins : "WARNING: No specific origins defined, check .env ALLOWED_ORIGINS!");

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS: Blocked origin - ${origin}. Not in allowed list:`, allowedOrigins);
        callback(new Error(`Origin ${origin} Not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'], // Added Accept
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'X-Filename']
  }));

  // Enable pre-flight requests for all routes
  // This single line is sufficient after the main cors middleware is configured.
  app.options('*', cors()); 

  // 2. JSON Body Parser
  app.use(express.json({ limit: '10mb' }));

  // 3. URL-Encoded Body Parser
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. HTTP Request Logger (Morgan)
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'short'));
};

export default setupMiddleware;