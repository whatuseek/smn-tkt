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
  const defaultAllowedOrigins = ['http://localhost:5173']; // Default fallback if env var is missing

  const allowedOrigins = allowedOriginsEnv
      ? allowedOriginsEnv.split(',').map(origin => origin.trim())
      : defaultAllowedOrigins;

  // **** ADD DETAILED LOGGING HERE ****
  console.log("--- CORS CONFIGURATION ---");
  console.log("process.env.ALLOWED_ORIGINS:", allowedOriginsEnv);
  console.log("Effective Allowed CORS Origins:", allowedOrigins);
  console.log("--- END CORS CONFIGURATION ---");

  const corsOptions = {
    origin: (origin, callback) => {
      // Log every origin check
      console.log(`CORS: Checking origin: ${origin}`);

      if (!origin) { // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        console.log("CORS: No origin provided, allowing.");
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        console.log(`CORS: Origin '${origin}' IS ALLOWED.`);
        callback(null, true);
      } else {
        console.error(`CORS: Origin '${origin}' IS NOT ALLOWED. Allowed list: [${allowedOrigins.join(', ')}]`);
        callback(new Error(`Origin ${origin} Not allowed by CORS`)); // This error should be handled by the cors middleware
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'X-Filename']
  };

  // Apply the configured CORS middleware. This middleware will also handle preflight OPTIONS requests.
  app.use(cors(corsOptions));

  // The explicit app.options('*', cors()) might be redundant if the above handles it,
  // but can serve as a catch-all. Ensure it uses the same options or is broad enough.
  // For simplicity now, let's rely on the main app.use(cors(corsOptions)) to handle preflights.
  // If issues persist, we can re-evaluate this line:
  // app.options('*', cors(corsOptions)); // Or just cors() for a broader default

  // 2. JSON Body Parser
  app.use(express.json({ limit: '10mb' }));

  // 3. URL-Encoded Body Parser
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. HTTP Request Logger (Morgan)
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'short'));
};

export default setupMiddleware;