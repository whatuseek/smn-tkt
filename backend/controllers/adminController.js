// backend/controllers/adminController.js
import supabase from '../config/supabaseClient.js'; // Default client (RLS applies)
import { supabaseAdmin } from '../config/supabaseClient.js'; // Admin client (Bypass RLS)
import asyncHandler from 'express-async-handler';

// --- Utility Functions ---
// Utility function to format timestamps (ensure this matches your needs)
const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
        const dateObject = new Date(timestamp);
        if (isNaN(dateObject.getTime())) {
             console.error("AdminCtrl: Error parsing timestamp:", timestamp);
             return 'Invalid Date';
        }
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true };
        return new Intl.DateTimeFormat('en-US', options).format(dateObject);
    } catch (e) {
        console.error("AdminCtrl: Error formatting timestamp:", timestamp, e);
        return 'Invalid Date';
    }
};

// Utility to map ticket data for frontend responses
const mapTicketForFrontend = (ticket) => {
    if (!ticket) return null;
    // const formattedCreatedAt = formatTimestamp(ticket.created_at); // REMOVE
    // const formattedUpdatedAt = formatTimestamp(ticket.updated_at); // REMOVE

    return {
        _id: ticket.id,
        user_id: ticket.user_id,
        mobile_number: ticket.mobile_number,
        location: ticket.location || 'N/A',
        issue_type: ticket.issue_type || 'N/A',
        comments: ticket.comments || '',
        ticket_id: ticket.ticket_id || 'TKT-??',
        status: ticket.status || 'Open',
        // Keep the original ISO timestamp strings
        originalCreatedAt: ticket.created_at,
        originalUpdatedAt: ticket.updated_at,
        // Remove the backend-formatted versions to avoid confusion
        // timestamp: formattedCreatedAt, // REMOVE
        // createdAt: formattedCreatedAt, // REMOVE
        // updatedAt: formattedUpdatedAt, // REMOVE
        created_by_auth_id: ticket.created_by_auth_id,
        last_edited_by_auth_id: ticket.last_edited_by_auth_id
    };
};
// --- End Utility Functions ---


// --- Controller Functions (Rely on RLS for access control where using default client) ---

export const getIssueTypes = asyncHandler(async (req, res, next) => {
    try {
        // Using a predefined list as per previous code
        const distinctIssueTypes = ["Speed Issue", "Cable Complaint", "Recharge Related", "No Internet", "Others"];
        res.status(200).json(distinctIssueTypes);
    } catch (error) {
        console.error("Error fetching issue types:", error);
        next(error); // Pass to central error handler
    }
});

export const getAllTickets = asyncHandler(async (req, res, next) => {
    // Access controlled by RLS policies on 'tickets' table
    console.log(`User ${req.authUserId} fetching all accessible tickets (via admin controller).`);
    try {
        const { data: tickets, error } = await supabase // Use default client
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
    // Access controlled by RLS policies on 'tickets' table
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
            if (error.message.includes('violates row-level security policy')) {
                 res.status(403); throw new Error("Permission denied to delete this ticket.");
             }
            throw error; // Let central handler manage other errors
        }

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
    // Access controlled by RLS policies on 'tickets' table
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
                // updated_at handled by trigger or Supabase default
                last_edited_by_auth_id: editorUserId // Track who edited last
            })
            .eq('id', id)
            .select() // Select updated data
            .single(); // Expect one row

        if (error) {
            console.error(`Error updating status for ticket ${id} by user ${editorUserId}:`, error);
            if (error.message.includes('violates row-level security policy')) {
                 res.status(403); throw new Error("Permission denied to update this ticket's status.");
             }
            throw error; // Let RLS denial or other errors be handled centrally
        }
        if (!data) {
            res.status(404); throw new Error('Ticket not found or access denied for update.'); // If RLS denied or ID wrong
        }

        const updatedTicket = mapTicketForFrontend(data);
        return res.status(200).json(updatedTicket);

    } catch (error) {
        next(error); // Pass to central error handler
    }
});

export const updateTicket = asyncHandler(async (req, res, next) => {
    // Access controlled by RLS policies on 'tickets' table
    const id = parseInt(req.params.id, 10);
    const updateData = req.body;
    const editorUserId = req.authUserId; // Get editor ID from 'protect' middleware

    if (!editorUserId) { res.status(401); throw new Error('Editor user ID not found.'); }

    console.log(`User ${editorUserId} attempting general update for ticket ${id}`);

    // Sanitize updates
    const allowedUpdates = {};
    const editableFields = ['issue_type', 'location', 'comments', 'mobile_number'];
    for (const key of editableFields) {
        // Only include fields that are actually present in the request body
        if (updateData.hasOwnProperty(key)) {
            allowedUpdates[key] = updateData[key];
            // Add field-specific validation/sanitization
            if (key === 'issue_type' && allowedUpdates[key]) {
                allowedUpdates[key] = String(allowedUpdates[key]).trim().toUpperCase(); // Use uppercase from request
            }
             if (key === 'location' && allowedUpdates[key]) {
                 allowedUpdates[key] = String(allowedUpdates[key]).trim();
             }
             if (key === 'comments' && allowedUpdates[key]) {
                 allowedUpdates[key] = String(allowedUpdates[key]).trim();
             }
             // Allow mobile number to be cleared or updated
            if (key === 'mobile_number') {
                if(allowedUpdates[key]){
                    const cleaned = String(allowedUpdates[key]).replace(/\D/g, '');
                    if (!/^\d{10}$/.test(cleaned)) {
                        res.status(400); throw new Error('Invalid mobile number format for update.');
                    }
                    allowedUpdates[key] = cleaned;
                } else {
                    allowedUpdates[key] = null; // Set to null if empty string or null is passed
                }
            }
        }
    }

    if (Object.keys(allowedUpdates).length === 0) {
        return res.status(400).json({ success: false, message: "No valid editable fields provided for update." });
    }

    // Add audit field
    allowedUpdates.last_edited_by_auth_id = editorUserId; // Track editor

    console.log(`Sanitized data for update by ${editorUserId}:`, allowedUpdates);

    try {
        // Use default client - RLS must allow update
        const { data, error } = await supabase
            .from('tickets')
            .update(allowedUpdates)
            .eq('id', id)
            .select() // Select updated data
            .single();

        if (error) {
             console.error(`Error updating ticket ${id} by user ${editorUserId}:`, error);
             if (error.message.includes('violates row-level security policy')) {
                 res.status(403); throw new Error("Permission denied to update this ticket.");
             }
            throw error; // Let other errors be handled centrally
         }
        if (!data) {
             res.status(404); throw new Error('Ticket not found or access denied for update.');
        }

        console.log(`Ticket ${id} updated successfully by ${editorUserId}.`);
        const responseTicket = mapTicketForFrontend(data);
        res.status(200).json(responseTicket);
    } catch (error) {
        next(error); // Pass to central error handler
    }
});


// --- Get Team User Details (Using Admin Client) ---
// --- RE-ADDED DEBUG LOGGING ---
export const getTeamUserDetails = asyncHandler(async (req, res, next) => {
    const requesterUserId = req.authUserId;
    console.log(`User ${requesterUserId} fetching team user details.`);

    if (!supabaseAdmin) {
        res.status(500); throw new Error('Admin client not configured. Cannot fetch user list.');
    }

    try {
        // Fetch users from Supabase Auth Admin API
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
             // Add pagination if you expect > 1000 users: perPage: 1000
        });

        if (listError) {
            console.error(`Error listing users for request by ${requesterUserId}:`, listError);
            throw new Error(`Failed to retrieve user list: ${listError.message}`);
        }

        if (!users) {
             console.warn(`No users array returned from listUsers for request by ${requesterUserId}`);
             return res.status(200).json([]); // Return empty array if no users
        }

        // Map to only include necessary fields for frontend lookup
        const teamData = users.map(user => {
            // **** START DEBUG LOGGING ****
            // Log details for a specific user or all users to check metadata
            // Example: Log for admin@gmail.com or the first user
             if (user.email === 'admin@gmail.com') { // Adjust email if needed
                 console.log(`[DEBUG - adminController] Raw user data for ${user.email}:`, JSON.stringify(user, null, 2));
                 console.log(`[DEBUG - adminController] user.user_metadata for ${user.email}:`, user.user_metadata);
            }
            // **** END DEBUG LOGGING ****

            // Safely access user_metadata and display_name
            const metadata = user.user_metadata || {}; // Default to empty object
            const displayName = metadata.display_name || null; // Get display_name or null

            return {
                id: user.id, // UUID
                email: user.email,
                display_name: displayName // Assign the correctly retrieved (or null) display name
            };
        });

        console.log(`Returning details for ${teamData.length} team users.`);
        res.status(200).json(teamData);

    } catch (error) {
        next(error); // Pass errors to central handler
    }
});
// --- END MODIFIED ---