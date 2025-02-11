// tkt/backend/middleware/setupMiddleware.js

import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors'

dotenv.config();

const setupMiddleware = (app) => {
  app.use(express.json());
  app.use(morgan('dev'));
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];


  app.use(cors({
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));
};

export default setupMiddleware;