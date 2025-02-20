// tkt/backend/routes/adminRoutes.js

import express from 'express';
import rateLimit from 'express-rate-limit';
import { getAllTickets, getIssueTypes, deleteTicket, updateTicket, updateTicketStatus } from '../controllers/adminController.js';

const adminRouter = express.Router();

// Configure rate limiter:  Adjust these values carefully!
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, //  Increased from 100 to 200 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes" // Optional message
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

export default adminRouter;
