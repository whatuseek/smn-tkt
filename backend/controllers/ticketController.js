// backend/controllers/ticketController.js
import asyncHandler from 'express-async-handler';
import supabase from '../config/supabaseClient.js'; // Import Supabase default client
import { supabaseAdmin } from '../config/supabaseClient.js'; // Import Supabase Admin client

// --- Utility Functions ---

const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: true,
        }).format(new Date(timestamp));
    } catch (e) {
        console.error("Error formatting timestamp:", timestamp, e);
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
        ticket_id: ticket.ticket_id || 'TKT-??????',
        status: ticket.status || 'Open',
        timestamp: formattedCreatedAt,
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
    };
};
// --- End Utility Functions ---


// --- Controller Functions ---

export const getAllTickets = asyncHandler(async (req, res, next) => {
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
    const creatorAuthUserId = req.authUserId;

    // 1. Validate required fields & creator ID
    if (!user_id || !location || !issue_type) {
        res.status(400); throw new Error('Please provide user_id, location, and issue_type');
    }
    if (!creatorAuthUserId) {
        res.status(401); throw new Error('Authentication error: Creator user ID not found in request.');
    }

    let cleanedMobile = null;
    if (mobile_number) {
        cleanedMobile = String(mobile_number).replace(/\D/g, '');
        if (!/^\d{10}$/.test(cleanedMobile)) {
            res.status(400); throw new Error('Please enter a valid 10-digit mobile number or leave it blank.');
        }
    }

    const userIdFromForm = user_id.trim(); // Trim whitespace just in case

    console.log(`User ${creatorAuthUserId} attempting to create ticket for application user_id ${userIdFromForm}`);

    try {
        // --- TEMPORARY TEST: SKIP USER VALIDATION ---
        console.log("--- SKIPPING USER VALIDATION CHECK (Temporary Test) ---");
        const userValidationSkipped = true; // Set to true to SKIP the check
        let userValidationPassed = false; // Flag to track if validation succeeded (or was skipped)

        if (!userValidationSkipped) {
            // --- Original User Validation Code ---
            console.log("--- RUNNING ACTUAL USER VALIDATION CHECK ---");
            const userClient = supabaseAdmin || supabase;
            console.log(`Using client type: ${userClient === supabaseAdmin && supabaseAdmin !== null ? 'ADMIN' : 'DEFAULT'} for user check.`);
            console.log(`Checking existence of user_id: ${userIdFromForm} using this client.`);
            const { data: userCheckResult, error: userError } = await userClient
                .from('users')
                .select('user_id', { count: 'exact', head: true })
                .eq('user_id', userIdFromForm);

            if (userError) {
                console.error(`Supabase error checking user ${userIdFromForm}:`, userError);
                throw new Error('Error verifying user existence.');
            }
            const userCount = userCheckResult?.count ?? 0;
            if (userCount === 0) {
                res.status(400);
                throw new Error(`Invalid user ID provided (${userIdFromForm}). User does not exist.`);
            }
            console.log(`User validation successful for: ${userIdFromForm}`);
            userValidationPassed = true; // Mark as passed
            // --- End Original User Validation Code ---
        } else {
            console.log(`User validation successful for: ${userIdFromForm} (Skipped Actual Check)`);
            userValidationPassed = true; // Mark as passed since we skipped
        }
        // --- END TEMPORARY TEST ---

        // Only proceed if validation passed (or was skipped)
        if (!userValidationPassed) {
             // This should technically not be reachable if skipping is true, but safety check
            throw new Error("User validation failed or was not performed.");
        }


        // 3. Prepare data for initial insert
        const initialTicketData = {
            user_id: userIdFromForm,
            location: location.trim(),
            issue_type: String(issue_type).trim().toUpperCase(),
            status: 'Open',
            last_edited_by_auth_id: creatorAuthUserId,
            ...(cleanedMobile && { mobile_number: cleanedMobile }),
            comments: comments ? comments.trim() : null,
        };
        console.log("Initial ticket data prepared:", initialTicketData);

        // 4. Insert basic ticket data, retrieve generated 'id'
        const { data: insertedData, error: insertError } = await supabase
            .from('tickets')
            .insert([initialTicketData])
            .select('id')
            .single();

        if (insertError) { throw insertError; }
        if (!insertedData || typeof insertedData.id !== 'number') { throw new Error('Failed to retrieve generated ticket ID after insert.'); }

        const newNumericId = insertedData.id;
        console.log(`Ticket inserted with numeric ID: ${newNumericId}`);

        // 5. Format the TKT- ID
        const formattedTicketId = `TKT-${padZeroes(newNumericId, 3)}`;
        console.log(`Formatted ticket ID: ${formattedTicketId}`);
        if (!formattedTicketId || formattedTicketId.includes('undefined') || formattedTicketId === 'TKT-NaN') {
             console.error(`Critical error: Formatted Ticket ID generation failed! Numeric ID: ${newNumericId}, Result: ${formattedTicketId}`);
             throw new Error('Failed to generate valid formatted Ticket ID.');
        }

        // 6. Update the ticket with the formatted 'ticket_id'
        const { data: updatedTicketData, error: updateError } = await supabase
            .from('tickets')
            .update({
                ticket_id: formattedTicketId,
                last_edited_by_auth_id: creatorAuthUserId
            })
            .eq('id', newNumericId)
            .select()
            .single();

        if (updateError) {
             console.error("Supabase update error (setting ticket_id):", updateError);
            if (updateError.code === '23505') { res.status(409); throw new Error(`Failed to set unique formatted ticket ID (${formattedTicketId}): ${updateError.details || updateError.message}`); }
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