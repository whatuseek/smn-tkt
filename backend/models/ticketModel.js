// tkt/backend/models/ticketModel.js
// ROLE: Schema Reference Document for Supabase Migration (No Active Code)
// ====================================================================
// This file previously defined the Mongoose schema for MongoDB.
// With Supabase (PostgreSQL), the schema is defined via SQL.
// This file is kept **commented out** as a reference only.

/*
import mongoose from 'mongoose';
// import Counter from './counterModel.js'; // Assuming Counter is also migrated or not used

// Utility function to format timestamps (Example, not used by Supabase directly)
const formatTimestamp = (timestamp) => { ... };

const ticketSchema = new mongoose.Schema(
    {
        user_id: { type: String, required: true }, // Corresponds to 'user_id' in Supabase 'tickets' table (likely text or varchar)
        mobile_number: {                           // Corresponds to 'mobile_number' (likely varchar(10) or text, nullable)
            type: String,
            // Validation might be handled by Supabase check constraints or triggers
        },
        location: { type: String, required: true, trim: true }, // Corresponds to 'location' (likely text, not null)
        issue_type: {                                          // Corresponds to 'issue_type' (likely text or an enum type in Postgres, not null)
            type: String,
            required: true,
            // Validation (enum check) handled by Supabase enum type or check constraint
        },
        comments: { type: String, default: "" }, // Corresponds to 'comments' (likely text, nullable with default '')
        ticket_id: { type: String },             // Corresponds to 'ticket_id' (likely text, unique constraint)
        // 'type' field seems unused/removed in Supabase version?
        status: {                               // Corresponds to 'status' (likely text or enum type, default 'Open')
            type: String,
            enum: ['Open', 'In Progress', 'Resolved'],
            default: 'Open',
        },
        // Supabase handles timestamps automatically with 'created_at' and 'updated_at' columns (timestamptz)
        // Add 'last_edited_by_auth_id' (uuid, nullable, foreign key to auth.users(id)) in Supabase
    },
    {
        timestamps: true, // Mongoose specific, not relevant for Supabase schema definition
    }
);

// Pre-save/update hooks for generating ticket_id (handled by backend logic in Supabase version)
// ticketSchema.pre('updateOne', async function (next) { ... });
// async function getIncrementingId() { ... } // Logic moved to controller
// function padZeroes(value, length) { ... } // Utility kept in controller

// Virtuals for formatting (handled by backend mapTicketForFrontend helper in Supabase version)
// ticketSchema.set('toJSON', { ... });

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
*/


// // tkt/backend/models/ticketModel.js

// // Import mongoose and Counter models
// // import mongoose from 'mongoose'; // Comment out
// // import Counter from './counterModel.js'; // Comment out
// // import Counter from '../models/counterModel.js';

// // Utility function to format timestamps in AM/PM
// const formatTimestamp = (timestamp) => {
//     return new Intl.DateTimeFormat('en-US', {
//         year: 'numeric',
//         month: '2-digit',
//         day: '2-digit',
//         hour: '2-digit',
//         minute: '2-digit',
//         second: '2-digit',
//         hour12: true, // Enable AM/PM format
//     }).format(new Date(timestamp));
// };

// // Define the ticket schema
// const ticketSchema = new mongoose.Schema(
//     {
//         // User ID (required)
//         user_id: { type: String, required: true },

//         // Mobile number (not required, validated) [Removed required]
//         mobile_number: {
//             type: String,
//             validate: { // keep validate
//                 // Validate mobile number using regular expression
//                 validator: (v) => /^\d{10}$/.test(v) || v === "",
//                 message: 'Please enter a valid 10-digit mobile number',
//             },
//         },

//         // Location (required, trimmed)
//         location: { type: String, required: true, trim: true },

//         // Issue type (required, validated)
//         issue_type: {
//             type: String,
//             required: true,
//             validate: {
//                 // Validate issue type against allowed values
//                 validator: (value) => {
//                     console.log(`Validating issue_type: ${value}`);
//                     const allowedValues = [
//                         'SPEED ISSUE',
//                         'CABLE COMPLAINT',
//                         'NO INTERNET',
//                         'RECHARGE RELATED',
//                         'OTHERS',
//                     ];
//                     const isValid = allowedValues.includes(value.toUpperCase());
//                     console.log(`isValid: ${isValid}`);
//                     return isValid;
//                 },
//                 message: 'Invalid issue type',
//             },
//         },

//         // Comments (required, trimmed)
//         comments: { type: String, default: "" },      //removed required:true

//         // Ticket ID (unique)
//         ticket_id: { type: String, }, // [removed unique:true] because same user unable to create multiple tickets

//         // Type (default: 'user')
//         type: { type: String, default: 'user' },

//         // Status (added)
//         status: {
//             type: String,
//             enum: ['Open', 'In Progress', 'Resolved'], // Valid statuses
//             default: 'Open', // Default status is 'Open'
//         },
//     },
//     {
//         timestamps: true, // Enable timestamps (createdAt, updatedAt)
//     }
// );

// // Pre-save hook to generate ticket ID for update
// ticketSchema.pre('updateOne', async function (next) {
//     const ticket = this;
//     const update = this.getUpdate();
//     // Check if ticket_id exists, if not, we generate the id
//     if (!update.ticket_id) {
//         const prefix = 'TKT-';
//         const incrementingId = await getIncrementingId();
//         const paddedId = padZeroes(incrementingId, 6);
//         update.ticket_id = `${prefix}${paddedId}`;
//         this.setUpdate(update);
//     }
//     next();
// });

// // Function to get incrementing ID
// async function getIncrementingId() {
//     const counter = await Counter.findOne({}, 'ticketId');
//     if (!counter) {
//         return 1;
//     }
//     return counter.ticketId + 1;
// }

// // Function to pad zeroes
// function padZeroes(value, length) {
//     return value.toString().padStart(length, '0');
// }

// // Add a virtual to format timestamps for API responses
// ticketSchema.set('toJSON', {
//     virtuals: true,
//     transform: (doc, ret) => {
//         // Format timestamps before returning the object
//         if (ret.createdAt) ret.createdAt = formatTimestamp(ret.createdAt);
//         if (ret.updatedAt) ret.updatedAt = formatTimestamp(ret.updatedAt);
//         return ret;
//     },
// });

// // Create Ticket model
// const Ticket = mongoose.model('Ticket', ticketSchema);
// export default Ticket;