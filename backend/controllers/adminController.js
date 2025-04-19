// backend/controllers/adminController.js
import supabase from '../config/supabaseClient.js'; // Use default client (RLS applies)
// supabaseAdmin could be used for specific overrides if needed, but RLS is preferred
import { supabaseAdmin } from '../config/supabaseClient.js';
import asyncHandler from 'express-async-handler';

// --- Utility Functions ---
const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: true, timeZone: 'UTC' // Example: Use UTC or server's timezone
        }).format(new Date(timestamp));
    } catch (e) { return 'Invalid Date'; }
};

const mapTicketForFrontend = (ticket) => {
    if (!ticket) return null;
    const formattedCreatedAt = formatTimestamp(ticket.created_at);
    const formattedUpdatedAt = formatTimestamp(ticket.updated_at);
    return {
        _id: ticket.id, // Use Supabase primary key 'id' as '_id'
        user_id: ticket.user_id,
        mobile_number: ticket.mobile_number,
        location: ticket.location || 'N/A',
        issue_type: ticket.issue_type || 'N/A',
        comments: ticket.comments || '',
        ticket_id: ticket.ticket_id || 'TKT-??????', // Use formatted ID
        status: ticket.status || 'Open',
        timestamp: formattedCreatedAt, // Use creation time for 'timestamp' field
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
        // last_edited_by_auth_id: ticket.last_edited_by_auth_id // Optionally include audit ID
    };
};
// --- End Utility Functions ---


// --- Controller Functions (Rely on RLS for access control) ---

export const getIssueTypes = asyncHandler(async (req, res, next) => {
    try {
        // Example: Return a predefined list or fetch distinct values if allowed by RLS
        const distinctIssueTypes = ["Speed Issue", "Cable Complaint", "Recharge Related", "No Internet", "Others"];
        // If fetching from DB:
        // const { data, error } = await supabase.from('tickets').select('issue_type', { distinct: true });
        // if (error) throw error;
        // const distinctIssueTypes = [...new Set(data.map(item => item.issue_type).filter(Boolean))];
        res.status(200).json(distinctIssueTypes);
    } catch (error) {
        console.error("Error fetching issue types:", error);
        next(error);
    }
});

export const getAllTickets = asyncHandler(async (req, res, next) => {
    // Access controlled by RLS policies on the 'tickets' table for the authenticated user
    console.log(`User ${req.authUserId} fetching all accessible tickets.`); // Log who is asking
    try {
        const { data: tickets, error } = await supabase
            .from('tickets')
            .select('*') // RLS will filter rows based on the policy
            .order('created_at', { ascending: false });

        if (error) throw error; // Let central handler manage DB errors

        const formattedTickets = tickets.map(mapTicketForFrontend);
        res.status(200).json(formattedTickets);
    } catch (error) {
        console.error('Error fetching all tickets:', error);
        next(error); // Pass to central error handler
    }
});

export const deleteTicket = asyncHandler(async (req, res, next) => {
    // Access controlled by RLS policies on the 'tickets' table
    const id = parseInt(req.params.id, 10);
    console.log(`User ${req.authUserId} attempting to delete ticket ${id}`);

    try {
        // Use default client - RLS policy must allow delete for this user
        const { error, count } = await supabase
            .from('tickets')
            .delete({ count: 'exact' }) // Request count of deleted rows
            .eq('id', id);

        if (error) {
            console.error(`Error deleting ticket ${id} by user ${req.authUserId}:`, error);
            // Handle potential RLS denial or other DB errors
            throw error; // Let central handler manage
        }

        // Check if a row was actually deleted
        if (count === 0) {
             res.status(404); // Not found or RLS denied access
             throw new Error('Ticket not found or access denied for deletion.');
        }

        console.log(`Ticket ${id} deleted successfully by user ${req.authUserId}.`);
        res.status(200).json({ success: true, message: 'Ticket deleted successfully' });
    } catch (error) {
        next(error); // Pass to central error handler
    }
});

export const updateTicketStatus = asyncHandler(async (req, res, next) => {
    // Access controlled by RLS policies on the 'tickets' table
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const editorUserId = req.authUserId; // Get editor ID from 'protect' middleware

    if (!status || !['Open', 'In Progress', 'Resolved'].includes(status)) {
        res.status(400); throw new Error('Invalid status provided.');
    }
    if (!editorUserId) { res.status(401); throw new Error('Editor user ID not found in request.'); }

    console.log(`User ${editorUserId} attempting to update status for ticket ${id} to ${status}`);

    try {
        // Use default client - RLS policy must allow update for this user
        const { data, error } = await supabase
            .from('tickets')
            .update({
                status: status,
                // updated_at handled by trigger
                last_edited_by_auth_id: editorUserId // Track who edited last
            })
            .eq('id', id)
            .select() // Select updated data
            .single(); // Expect one row

        if (error) { throw error; } // Let RLS denial or other errors be handled centrally
        if (!data) { res.status(404); throw new Error('Ticket not found or access denied for update.'); } // If RLS denied or ID wrong

        const updatedTicket = mapTicketForFrontend(data);
        return res.status(200).json(updatedTicket);

    } catch (error) {
        console.error(`Error updating status for ticket ${id} by user ${editorUserId}:`, error);
        next(error); // Pass to central error handler
    }
});

export const updateTicket = asyncHandler(async (req, res, next) => {
    // Access controlled by RLS policies on the 'tickets' table
    const id = parseInt(req.params.id, 10);
    const updateData = req.body;
    const editorUserId = req.authUserId; // Get editor ID from 'protect' middleware

    if (!editorUserId) { res.status(401); throw new Error('Editor user ID not found.'); }

    console.log(`User ${editorUserId} attempting general update for ticket ${id}`);

    // Sanitize updates
    const allowedUpdates = {};
    const editableFields = ['issue_type', 'location', 'comments', 'mobile_number'];
    for (const key of editableFields) {
        if (updateData[key] !== undefined) {
            allowedUpdates[key] = updateData[key];
            // Add field-specific validation/sanitization
            if (key === 'issue_type' && allowedUpdates[key]) { allowedUpdates[key] = String(allowedUpdates[key]).toUpperCase(); }
            if (key === 'mobile_number' && allowedUpdates[key]) {
                const cleaned = String(allowedUpdates[key]).replace(/\D/g, '');
                if (!/^\d{10}$/.test(cleaned)) { res.status(400); throw new Error('Invalid mobile number format for update.'); }
                allowedUpdates[key] = cleaned;
            }
        }
    }

    if (Object.keys(allowedUpdates).length === 0) {
        return res.status(400).json({ success: false, message: "No valid fields provided for update." });
    }

    // Add audit field
    allowedUpdates.last_edited_by_auth_id = editorUserId; // Track editor
    // updated_at handled by trigger

    console.log(`Sanitized data for update by ${editorUserId}:`, allowedUpdates);

    try {
        // Use default client - RLS must allow update
        const { data, error } = await supabase
            .from('tickets')
            .update(allowedUpdates)
            .eq('id', id)
            .select() // Select updated data
            .single();

        if (error) { throw error; } // Let RLS denial or other errors be handled centrally
        if (!data) { res.status(404); throw new Error('Ticket not found or access denied for update.'); }

        console.log(`Ticket ${id} updated successfully by ${editorUserId}.`);
        const responseTicket = mapTicketForFrontend(data);
        res.status(200).json(responseTicket);
    } catch (error) {
         console.error(`Error updating ticket ${id} by user ${editorUserId}:`, error);
        next(error); // Pass to central error handler
    }
});