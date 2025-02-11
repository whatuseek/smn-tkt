// tkt/backend/controllers/adminController.js

import Ticket from "../models/ticketModel.js";

// Utility function to format timestamps
const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true, // AM/PM format
    }).format(new Date(timestamp));
};

// Fetch all unique issue types
export const getIssueTypes = async (req, res) => {
    try {
        const issueTypes = await Ticket.distinct("issue_type");
        res.status(200).json(issueTypes);
    } catch (error) {
        console.error("Error in getIssueTypes:", error); // Added error logging
        res.status(500).json({ message: "Error fetching issue types", error: error.message }); // Include error message
    }
};

// Fetch all tickets or with filtering by createdAt (latest first) with formatted timestamps
export const getAllTickets = async (req, res) => {
    const { issue_type } = req.query;
    try {
        let tickets;
        if (issue_type) {
            tickets = await Ticket.find({ issue_type }).sort({ createdAt: -1 }); // Sort by latest first
        } else {
            tickets = await Ticket.find({}).sort({ createdAt: -1 }); // Sort by latest first
        }
        const formattedTickets = tickets.map((ticket) => ({
            ...ticket.toObject(),
            timestamp: formatTimestamp(ticket.createdAt), // Format createdAt timestamp
            location: ticket.location, // Include location field
        }));

        res.status(200).json(formattedTickets);
    } catch (error) {
        console.error('Error in getAllTickets:', error); // Added error logging
        res.status(500).json({ message: "Error fetching tickets", error: error.message }); // Include error message
    }
};

// Delete a ticket by ID
export const deleteTicket = async (req, res) => {
    const { id } = req.params;
    try {
        const ticket = await Ticket.findByIdAndDelete(id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found.' });
        }
        res.json({ message: 'Ticket deleted successfully.' });
    } catch (error) {
        console.error('Error in deleteTicket:', error); // Added error logging
        res.status(500).json({ message: 'Server error while deleting the ticket.', error: error.message }); // Include error message
    }
};

// Controller function to update ticket status
export const updateTicketStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const ticket = await Ticket.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        return res.status(200).json(ticket);
    } catch (error) {
        console.error('Error in updateTicketStatus:', error); // Added error logging
        return res.status(500).json({ message: 'Error updating ticket status', error: error.message }); // Include error message
    }
};


// Controller to update a ticket
export const updateTicket = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Validate if updatedData is present
    if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "Request body is missing or empty" })
    }

    // Validate if required fields are present
    if (!updateData.issue_type || !updateData.location || !updateData.mobile_number) {
        return res.status(400).json({ message: 'Issue type, location, and mobile number are required' });
    }

    try {
        const updatedTicket = await Ticket.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedTicket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error('Error in updateTicket:', error); // Added error logging
        res.status(500).json({ message: 'Error updating ticket', error: error.message }); // Include error message
    }
};