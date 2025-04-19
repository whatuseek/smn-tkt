// backend/src/index.js
import express from 'express';
import dotenv from 'dotenv';
import setupMiddleware from '../middleware/setupMiddleware.js'; // Basic middleware (CORS, JSON, logging)
import { notFound, errorHandler } from '../middleware/errorMiddleware.js'; // Error handlers

// Import Routes
import adminRoutes from '../routes/adminRoutes.js';
import ticketRoutes from '../routes/ticketRoutes.js';
import userUploadRoutes from '../routes/userUploadRoutes.js';

// Load Environment Variables
dotenv.config();

// Initialize Express App
const app = express();

// Setup Core Middleware (CORS, JSON parsing, logging)
setupMiddleware(app);

// --- API Routes ---
// Apply routes (Middleware like 'protect' is applied within the route files)
app.use('/api/admin', adminRoutes); // Routes for general ticket management now
app.use('/api/tickets', ticketRoutes); // Routes for ticket creation etc.
app.use('/api/user', userUploadRoutes); // Routes for adding users to public.users table

// --- Basic Welcome Route ---
app.get('/', (req, res) => {
    res.send('API is running...');
});

// --- Error Handling Middleware ---
// 404 Not Found Handler (if no routes matched)
app.use(notFound);
// General Error Handler (catches errors passed via next())
app.use(errorHandler);

// --- Server ---
const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

app.listen(PORT, () => {
    console.log(`--------------------------------------------------`);
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`--------------------------------------------------`);
});