// tkt/backend/src/index.js

import express from "express";
import connectDB from "../config/database.js";
import setupMiddleware from "../middleware/setupMiddleware.js";
import ticketRoutes from "../routes/ticketRoutes.js";
import adminRoutes from "../routes/adminRoutes.js";
import userUploadRoutes from "../routes/userUploadRoutes.js"
import { notFound, errorHandler } from '../middleware/errorMiddleware.js';
// import cors from 'cors';
// app.use(cors());

const app = express();

// Get the port from .env file
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Setup middleware
setupMiddleware(app);

// SERVE STATIC FILES - ADJUST THIS PATH CAREFULLY
// app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Define routes
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userUploadRoutes);
// Add this line for root route
app.get('/', (req, res) => {
    res.send('Hello from Ticket Server!');
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
//   });


// Error handling middleware
app.use(notFound); // Place 'notFound' middleware before 'errorHandler'
app.use(errorHandler); // Handles errors thrown in controllers

app.listen(port, () => {
    console.log(`==>=>=>=>=> userServer running on http://localhost:${port}`);
});