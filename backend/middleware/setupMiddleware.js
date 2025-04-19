// backend/middleware/setupMiddleware.js
import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path'; // Needed if serving static files

// Load environment variables
dotenv.config();

const setupMiddleware = (app) => {
  // 1. CORS Configuration
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  const allowedOrigins = allowedOriginsEnv ? allowedOriginsEnv.split(',').map(origin => origin.trim()) : [];

  console.log("Allowed CORS Origins:", allowedOrigins.length > 0 ? allowedOrigins : "ANY (*) - Check CORS settings!");

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin OR from whitelisted origins
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) { // Allow all if array is empty
        callback(null, true);
      } else {
        console.warn(`CORS: Blocked origin - ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

   // Handle OPTIONS requests for CORS preflight
   app.options('*', cors()); // Enable pre-flight across-the-board

  // 2. JSON Body Parser
  app.use(express.json({ limit: '10mb' })); // Enable JSON body parsing

  // 3. URL-Encoded Body Parser
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. HTTP Request Logger (Morgan)
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'short'));

  // 5. Serve Static Files (Example - Uncomment and adjust if needed)
  // if (process.env.NODE_ENV === 'production') {
  //   const __dirname = path.resolve();
  //   app.use(express.static(path.join(__dirname, '/frontend/dist'))); // Adjust path to your frontend build
  //   // Catch-all for SPAs
  //   app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html')));
  // }
};

export default setupMiddleware;