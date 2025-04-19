// tkt/backend/models/userUploadModel.js

// ROLE: Schema Reference Document for Supabase Migration
// ======================================================
// This file previously defined the Mongoose schema for the 'users' collection in MongoDB.
// With Supabase (PostgreSQL), the database schema is defined directly via SQL.
// This file is now kept **commented out** solely as a reference to understand
// the intended structure of the 'public.users' table created in Supabase.
// NO ACTIVE CODE related to Supabase interaction belongs in this file.

/*
// Original Mongoose Schema (for reference):
// ----------------------------------------
import mongoose from 'mongoose';

const userUploadSchema = new mongoose.Schema({
    // user_id:
    //   - Mongoose Type: String
    //   - Required: true
    //   - Unique: true
    //   - Trim: true
    //   - Corresponding Supabase SQL:
    //     user_id TEXT PRIMARY KEY NOT NULL
    //     (Or: user_id TEXT UNIQUE NOT NULL)
    user_id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    // mobile_number:
    //   - Mongoose Type: String
    //   - Required: true
    //   - Validation: 10 digits regex
    //   - Corresponding Supabase SQL:
    //     mobile_number VARCHAR(10) NOT NULL,
    //     CONSTRAINT users_mobile_number_check CHECK (mobile_number ~ '^\d{10}$')
    mobile_number: {
        type: String,
        required: true,
        validate: {
            validator: (v) => /^\d{10}$/.test(v),
            message: 'Please enter a valid 10-digit mobile number',
        },
    },

    // Timestamps: (Optional but recommended)
    //   - Mongoose handles via `timestamps: true`
    //   - Corresponding Supabase SQL:
    //     created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    //     updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    //     (Plus trigger for auto-update on updated_at)

}, { timestamps: true }); // Mongoose option


// Mongoose Model Creation (Not used with Supabase)
const UserUploadModel = mongoose.model('User', userUploadSchema);

export default UserUploadModel;
*/

// --- NO ACTIVE CODE NEEDED HERE FOR SUPABASE ---
export {}; // Add an empty export to satisfy module systems if absolutely needed anywhere else.