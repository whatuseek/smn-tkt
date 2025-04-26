// backend/controllers/ticketController.js
import asyncHandler from 'express-async-handler';
import supabase from '../config/supabaseClient.js'; // Import Supabase default client
import { supabaseAdmin } from '../config/supabaseClient.js'; // Import Supabase Admin client (for user validation if needed)

// --- Utility Functions ---
const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
        const dateObject = new Date(timestamp);
        if (isNaN(dateObject.getTime())) {
             console.error("TicketCtrl: Error parsing timestamp:", timestamp);
             return 'Invalid Date';
        }
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true };
        return new Intl.DateTimeFormat('en-US', options).format(dateObject);
    } catch (e) {
        console.error("TicketCtrl: Error formatting timestamp:", timestamp, e);
        return 'Invalid Date';
    }
};

function padZeroes(value, length) {
    const stringValue = String(value);
    return stringValue.padStart(length, '0');
}

const mapTicketForFrontend = (ticket) => {
    if (!ticket) return null;
    const formattedCreatedAt = formatTimestamp(ticket.created_at);
    const formattedUpdatedAt = formatTimestamp(ticket.updated_at);
    return {
        _id: ticket.id,
        user_id: ticket.user_id,
        mobile_number: ticket.mobile_number,
        location: ticket.location || 'N/A',
        issue_type: ticket.issue_type || 'N/A',
        comments: ticket.comments || '',
        ticket_id: ticket.ticket_id || 'TKT-??',
        status: ticket.status || 'Open',
        timestamp: formattedCreatedAt,
        createdAt: formattedCreatedAt, // "Created On"
        updatedAt: formattedUpdatedAt, // "Last Edited On"
        created_by_auth_id: ticket.created_by_auth_id, // Creator's Supabase Auth ID
        last_edited_by_auth_id: ticket.last_edited_by_auth_id // Editor's Supabase Auth ID
    };
};
// --- End Utility Functions ---


// --- Controller Functions ---

export const getAllTickets = asyncHandler(async (req, res, next) => {
    // Access controlled by RLS policy
    const requesterUserId = req.authUserId || 'Unknown (public?)';
    console.log(`User ${requesterUserId} fetching tickets via ticketController.`);
    try {
        const { data: tickets, error } = await supabase
            .from('tickets')
            .select('*') // RLS filters results
            .order('created_at', { ascending: false });

        if (error) {
            console.error(`Supabase error fetching tickets for user ${requesterUserId}:`, error);
            throw error;
        }
        const formattedTickets = tickets.map(mapTicketForFrontend);
        res.status(200).json(formattedTickets);
    } catch (error) {
        console.error('Error in getAllTickets (ticketController):', error);
        next(error);
    }
});

export const createTicket = asyncHandler(async (req, res, next) => {
    const { user_id, mobile_number, location, issue_type, comments } = req.body;
    const creatorAuthUserId = req.authUserId; // From protect middleware

    // 1. Validate required fields & creator ID
    if (!user_id || !location || !issue_type) {
        res.status(400); throw new Error('Please provide user_id, location, and issue_type');
    }
    if (!creatorAuthUserId) {
        console.error("CRITICAL AUTH ERROR in createTicket: req.authUserId is missing.");
        res.status(401); throw new Error('Authentication error: Creator user ID not found in request.');
    }

    // Validate mobile number format if provided
    let cleanedMobile = null;
    if (mobile_number) {
        cleanedMobile = String(mobile_number).replace(/\D/g, '');
        if (!/^\d{10}$/.test(cleanedMobile)) {
            res.status(400); throw new Error('Please enter a valid 10-digit mobile number or leave it blank.');
        }
    }

    const userIdFromForm = user_id.trim();

    console.log(`Authenticated user ${creatorAuthUserId} attempting to create ticket for application user_id ${userIdFromForm}`);

    try {
        // 2. Validate user_id exists in the 'users' table?
        //    Keeping this validation SKIPPED as per your last working version.
        //    If you want to re-enable it, replace the block below with the commented-out section.
        // --- KEEPING USER VALIDATION SKIPPED ---
        console.log("--- SKIPPING application user_id validation check ---");
        const userValidationPassed = true; // Assuming valid since check is skipped
        // --- END USER VALIDATION SKIP ---

        /* --- Optional: Re-enable User Validation Code ---
        console.log("--- RUNNING application user_id validation check ---");
        const userClient = supabaseAdmin || supabase; // Prefer admin to bypass RLS for check if needed
        console.log(`Checking existence of user_id: ${userIdFromForm} using ${supabaseAdmin ? 'ADMIN' : 'DEFAULT'} client.`);
        const { data: userCheckResult, error: userError } = await userClient
            .from('users') // Check against your public.users table
            .select('user_id', { count: 'exact', head: true })
            .eq('user_id', userIdFromForm);

        if (userError) {
            console.error(`Supabase error checking user ${userIdFromForm}:`, userError);
            throw new Error('Error verifying user existence.');
        }
        const userCount = userCheckResult?.count ?? 0;
        if (userCount === 0) {
            res.status(400); // Bad Request
            throw new Error(`Invalid user ID provided (${userIdFromForm}). User does not exist in application users table.`);
        }
        console.log(`User validation successful for: ${userIdFromForm}`);
        const userValidationPassed = true;
        // --- End Optional User Validation Code --- */

        if (!userValidationPassed) {
           throw new Error("User validation failed or was not performed."); // Should not be reached if skipping
        }

        // 3. Prepare data for initial insert - INCLUDING created_by_auth_id
        const initialTicketData = {
            user_id: userIdFromForm,
            location: location.trim(),
            issue_type: String(issue_type).trim().toUpperCase(),
            status: 'Open',
            created_by_auth_id: creatorAuthUserId, // Save the creator's Supabase Auth ID
            last_edited_by_auth_id: creatorAuthUserId, // Creator is also the first 'editor'
            ...(cleanedMobile && { mobile_number: cleanedMobile }),
            comments: comments ? comments.trim() : null,
        };
        console.log("Initial ticket data prepared:", initialTicketData);

        // 4. Insert basic ticket data, retrieve generated 'id' (use default client for RLS)
        const { data: insertedData, error: insertError } = await supabase
            .from('tickets')
            .insert([initialTicketData])
            .select('id')
            .single();

        if (insertError) {
            console.error("Supabase insert error (initial ticket):", insertError);
            if (insertError.message.includes('violates row-level security policy')) {
                 res.status(403); throw new Error("Permission denied to create tickets.");
            }
            throw insertError;
        }
        if (!insertedData || typeof insertedData.id !== 'number') {
            throw new Error('Failed to retrieve generated ticket ID after insert.');
        }
        const newNumericId = insertedData.id;
        console.log(`Ticket inserted with numeric ID: ${newNumericId}`);

        // 5. Format the TKT- ID
        const formattedTicketId = `TKT-${padZeroes(newNumericId, 3)}`;
        console.log(`Formatted ticket ID: ${formattedTicketId}`);
         if (!formattedTicketId || formattedTicketId.includes('undefined') || formattedTicketId === 'TKT-NaN') {
             console.error(`Critical error: Formatted Ticket ID generation failed! Numeric ID: ${newNumericId}, Result: ${formattedTicketId}`);
             throw new Error('Failed to generate valid formatted Ticket ID.');
         }

        // 6. Update the ticket with the formatted 'ticket_id' (use default client for RLS)
        const updatePayload = {
            ticket_id: formattedTicketId,
            // No need to update *_by_auth_id fields here again
        };
        const { data: updatedTicketData, error: updateError } = await supabase
            .from('tickets')
            .update(updatePayload)
            .eq('id', newNumericId)
            .select() // Select full data for the response
            .single();

        if (updateError) {
             console.error("Supabase update error (setting ticket_id):", updateError);
             if (updateError.code === '23505') { res.status(409); throw new Error(`Failed to set unique formatted ticket ID (${formattedTicketId}): ${updateError.details || updateError.message}`); }
             if (updateError.message.includes('violates row-level security policy')) {
                 res.status(403); throw new Error("Permission denied to update ticket after creation.");
             }
             throw updateError;
        }
        if (!updatedTicketData) { throw new Error('Failed to retrieve final ticket data after update.'); }
        console.log(`Ticket ${newNumericId} finalized with formatted ID ${formattedTicketId}.`);

        // 7. Format the final response
        const finalTicketResponse = mapTicketForFrontend(updatedTicketData);

        // 8. Send the successful response
        res.status(201).json({
            success: true,
            message: "Ticket created successfully.",
            ticket: finalTicketResponse,
        });

    } catch (error) {
        console.error("Error caught during ticket creation:", error.message);
        if (!res.statusCode || res.statusCode < 400) { res.status(500); }
        next(error);
    }
});
// --- END Controller Functions ---