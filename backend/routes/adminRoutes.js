// backend/routes/adminRoutes.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import {
    getAllTickets, getIssueTypes, deleteTicket, updateTicket, updateTicketStatus
} from '../controllers/adminController.js';
import dotenv from 'dotenv';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/authMiddleware.js'; // Only need protect

dotenv.config();
const adminRouter = express.Router();

// Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    standardHeaders: true, legacyHeaders: false,
});

// Ticket ID Validation Middleware
const validateTicketId = (req, res, next) => {
    const id = req.params.id;
    if (!id || !/^\d+$/.test(id) || parseInt(id, 10) <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid Ticket ID format.' });
    }
    next();
};

// Apply Middleware to all routes in this file
adminRouter.use(limiter);
adminRouter.use(protect); // All routes require authentication

// --- Routes (Access controlled by RLS) ---
adminRouter.get('/tickets', asyncHandler(getAllTickets));
adminRouter.get('/issue-types', asyncHandler(getIssueTypes));
adminRouter.delete('/tickets/:id', validateTicketId, asyncHandler(deleteTicket));
adminRouter.put('/tickets/:id/status', validateTicketId, asyncHandler(updateTicketStatus));
adminRouter.put('/tickets/:id', validateTicketId, asyncHandler(updateTicket));

export default adminRouter;