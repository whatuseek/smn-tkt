//smn/admin-page/backend/models/adminTicketModel.js

import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    mobile_number: { type: String, required: true },
    location: { type: String, required: true },
    issue_type: { type: String, required: true },
    comments: { type: String, required: true },
    ticket_id: { type: String, required: true, unique: true },
    status: { type: String, default: "Open" }
    // type: { type: String, default: "user" }
  },
  { timestamps: true },
  // Enable 

);

const AdminTicket = mongoose.model("Ticket", ticketSchema);
export default AdminTicket;