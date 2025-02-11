// tkt/backend/middleware/setupMiddleware.js

import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const setupMiddleware = (app) => {
    app.use(express.json());
    app.use(morgan('dev'));

    // Retrieve allowed origins from environment variables
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

    // CORS configuration
    const corsOptions = {
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            // Check if the origin is in the allowed list
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'), false);
            }
        },
        credentials: true, // Allow cookies to be sent in cross-origin requests
        allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
        methods: ['GET', 'POST', 'PUT, DELETE'], // Specify allowed methods
        optionsSuccessStatus: 204 // Some legacy browsers choke on 204
    };

    app.use(cors(corsOptions));
};

export default setupMiddleware;