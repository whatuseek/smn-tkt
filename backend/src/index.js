// backend/src/index.js
// import dotenv from 'dotenv';
// Load Environment Variables
// dotenv.config();
import express from 'express';
import setupMiddleware from '../middleware/setupMiddleware.js'; // Basic middleware (CORS, JSON, logging)
import { notFound, errorHandler } from '../middleware/errorMiddleware.js'; // Error handlers

// Import Routes
import adminRoutes from '../routes/adminRoutes.js';
import ticketRoutes from '../routes/ticketRoutes.js';
import userUploadRoutes from '../routes/userUploadRoutes.js';
import reportRoutes from '../routes/reportRoutes.js'; // <-- IMPORT NEW ROUTES



// Initialize Express App
const app = express();

// Setup Core Middleware (CORS, JSON parsing, logging)
setupMiddleware(app);

// --- API Routes ---
// Apply routes (Middleware like 'protect' is applied within the route files)
app.use('/api/admin', adminRoutes); // Routes for general ticket management now
app.use('/api/tickets', ticketRoutes); // Routes for ticket creation etc.
app.use('/api/user', userUploadRoutes); // Routes for adding users to public.users table
app.use('/api/reports', reportRoutes); // <-- MOUNT NEW ROUTES

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

app.listen(PORT,'0.0.0.0', () => {
    console.log(`--------------------------------------------------`);
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`--------------------------------------------------`);
});