import express from "express";
import connectDB from "../config/database.js";
import setupMiddleware from "../middleware/setupMiddleware.js";
import ticketRoutes from "../routes/ticketRoutes.js";
import adminRoutes from "../routes/adminRoutes.js";
import userUploadRoutes from "../routes/userUploadRoutes.js"
import { notFound, errorHandler } from '../middleware/errorMiddleware.js';
import cron from 'node-cron';
// import pingSelf from "../pingSchedule/pingSchedule.js";

const app = express();

//  Trust proxy setting - ADD THIS LINE
app.set('trust proxy', 1); //  or true, depending on your setup


// Get the port from .env file
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Setup middleware
setupMiddleware(app);

// Define routes
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userUploadRoutes);

// Add this line for root route
app.get('/', (req, res) => {
    res.send('Hello from Ticket Server!');
});

// ADD this line for ping heart beat
// app.get('/ping', (req, res) => {
//     res.status(200).send('OK');
// });

// Schedule ping every 15 minutes
// cron.schedule('*/5 * * * *', pingSelf);

// Add the catch-all route to serve the frontend
// Note: Assumes your frontend's build output is in a 'frontend/dist' directory
// app.use(express.static(path.join(__dirname, '../../frontend/dist'))); // Serve static files

// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
// });


// Error handling middleware
app.use(notFound); // Place 'notFound' middleware before 'errorHandler'
app.use(errorHandler); // Handles errors thrown in controllers

app.listen(port, () => {
    console.log(`==>=>=>=>=> userServer running on http://localhost:${port}`);
});