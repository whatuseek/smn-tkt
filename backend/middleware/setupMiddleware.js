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
    const defaultAllowedOrigins = ['http://localhost:5173']; // Add your frontend origin

  const allowedOrigins = allowedOriginsEnv 
      ? allowedOriginsEnv.split(',').map(origin => origin.trim()) 
      : defaultAllowedOrigins;

  console.log("Allowed CORS Origins:", allowedOrigins.length > 0 ? allowedOrigins : "ANY (*) - Check CORS settings!");

app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS: Blocked origin - ${origin}`);
        callback(new Error(`Origin ${origin} Not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    // **** ADD EXPOSED HEADERS HERE ****
    exposedHeaders: ['Content-Disposition', 'Content-Type','X-Filename'] // Added X-Filename just to test
  }));

app.options('*', cors()); // Enable pre-flight across-the-board

   // Handle OPTIONS requests for CORS preflight
   app.options('*', cors()); // Enable pre-flight across-the-board

  // 2. JSON Body Parser
  app.use(express.json({ limit: '10mb' })); // Enable JSON body parsing

  // 3. URL-Encoded Body Parser
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. HTTP Request Logger (Morgan)
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'short'));

  
};

export default setupMiddleware;