// backend/middleware/setupMiddleware.js

import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const setupMiddleware = (app) => {
    app.use(express.json());
    app.use(morgan('dev'));

    // Determine the environment
    const isProduction = process.env.NODE_ENV === 'production';

    let allowedOrigins;

    if (isProduction) {
        // Production: Get allowed origins from environment variable
        allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
        console.log('Production CORS enabled for:', allowedOrigins); // Log for debugging
    } else {
        // Development: Get allowed origins from environment variable (or use defaults)
        allowedOrigins = process.env.DEV_ALLOWED_ORIGINS
            ? process.env.DEV_ALLOWED_ORIGINS.split(',')
            : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5171']; // Default ports
        console.log('Development CORS enabled for:', allowedOrigins); // Log for debugging
    }

    // CORS configuration
    const corsOptions = {
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            // Check if the origin is in the allowed list
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.log('CORS blocked origin:', origin); // Log blocked origins
                callback(new Error('Not allowed by CORS'), false);
            }
        },
        credentials: true, // Allow cookies to be sent in cross-origin requests
        allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
        methods: ['GET', 'POST', 'PUT, DELETE, OPTIONS'], // Include OPTIONS
        optionsSuccessStatus: 204 // Some legacy browsers choke on 204
    };

    app.use(cors(corsOptions));
};

export default setupMiddleware;