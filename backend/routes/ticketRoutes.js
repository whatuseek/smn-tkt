// tkt/backend/routes/ticketRoutes.js

import express from "express";
import {
    createTicket,
    getAllTickets,
    updateExistingTimestamps, // Temporary function
} from "../controllers/ticketController.js";

const ticketRouter = express.Router();

ticketRouter.post("/", createTicket);
ticketRouter.get("/", getAllTickets);

// Temporary route to update existing timestamps
ticketRouter.patch("/update-timestamps", updateExistingTimestamps);

export default ticketRouter;

