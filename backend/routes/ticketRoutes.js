// backend/routes/ticketRoutes.js
import express from "express";
import asyncHandler from 'express-async-handler';
import {
    createTicket,
    getAllTickets, // Assuming this is used by a different part or maybe redundant
} from "../controllers/ticketController.js";
import { protect } from '../middleware/authMiddleware.js'; // Add protect middleware

const ticketRouter = express.Router();

// POST /api/tickets - Create a new ticket (Requires Authentication)
ticketRouter.post("/", protect, asyncHandler(createTicket));

// GET /api/tickets - Get all tickets (Requires Authentication)
// Note: This duplicates GET /api/admin/tickets functionality. Consider removing one
// if the access rules (RLS) are the same. Keeping it here assumes it might have
// slightly different intended usage or RLS.
ticketRouter.get("/", protect, asyncHandler(getAllTickets));

export default ticketRouter;