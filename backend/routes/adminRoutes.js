import express from 'express';
import rateLimit from 'express-rate-limit';
import { getAllTickets, getIssueTypes, deleteTicket, updateTicket, updateTicketStatus } from '../controllers/adminController.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import asyncHandler from 'express-async-handler';

dotenv.config();
const adminRouter = express.Router();

// Configure rate limiter: maximum of 100 requests per 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // max 100 requests per windowMs  [change by 500
    message: 'Too many requests from this IP, please try again after 15 minutes' // Optional message
});
adminRouter.get('/db-check', async (req, res) => {
    try {
        // Attempt to connect to the database (replace with your actual connection logic)
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // If connection is successful, respond with a 200 OK
        res.status(200).send('Database connection successful');
    } catch (error) {
        // If connection fails, respond with a 500 Server Error
        console.error("Database connection check failed:", error);
        res.status(500).send('Database connection failed');
    }
});
// Apply rate limiter to all routes
adminRouter.use(limiter);
// Route to fetch all tickets
adminRouter.get('/tickets', getAllTickets);
// Route to fetch tickets by issue type
// router.get('/tickets/:issue_type', getTicketsByIssueType);
// Route to fetch all unique issue types
adminRouter.get('/issue-types', getIssueTypes);
// Route to delete a ticket
adminRouter.delete('/tickets/:id', deleteTicket);
// Define the route for updating ticket status
adminRouter.put('/tickets/:id/status', updateTicketStatus);
// Route for updating a ticket
adminRouter.put('/tickets/:id', updateTicket);

// Bulk Delete Route  // REMOVED BULK TICKET DELETION
// Bulk Delete Route
adminRouter.post('/tickets/restore', asyncHandler(async (req, res) => {
    const { ticket } = req.body;

    if (!ticket || !ticket._id) {
        return res.status(400).json({ message: 'Please provide a ticket object with a valid _id to restore.' });
    }

    try {
        // Attempt to restore the deleted ticket by creating a new one with the same data
        const restoredTicket = await Ticket.create(ticket);

        res.status(201).json({ message: 'Ticket restored successfully.', restoredTicket }); // Respond with the restored ticket
    } catch (error) {
        console.error('Error restoring ticket:', error);
        res.status(500).json({ message: 'Server error while restoring the ticket.', error: error.message });
    }
}));
export default adminRouter;