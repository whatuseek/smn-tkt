// backend/controllers/userUploadController.js
import asyncHandler from 'express-async-handler';
// Default client usually not needed here unless checking something allowed by RLS
// import supabase from '../config/supabaseClient.js';
import { supabaseAdmin } from '../config/supabaseClient.js'; // Admin client needed to bypass potential RLS on insert
import exceljs from 'exceljs';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Helper Functions ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const validateUserData = (userData) => { /* ... (Keep existing validation logic) ... */
    const errors = []; const userIds = new Set(); const mobileNumbers = new Set();
    userData.forEach((user, index) => {
        const rowNum = index + 2;
        if (!user.user_id) { errors.push(`User ID is missing on row ${rowNum}`); }
        else if (userIds.has(user.user_id)) { errors.push(`Duplicate User ID found in file: '${user.user_id}' on row ${rowNum}`); }
        else { userIds.add(user.user_id); }
        if (!user.mobile_number) { errors.push(`Mobile number is missing for User ID '${user.user_id || '??'}' on row ${rowNum}`); }
        else { const cleanedMobile = String(user.mobile_number).replace(/\D/g, ''); if (!/^\d{10}$/.test(cleanedMobile)) { errors.push(`Mobile number format is invalid for User ID '${user.user_id || '??'}' on row ${rowNum} (Value: ${user.mobile_number})`); } else if (mobileNumbers.has(cleanedMobile)) { errors.push(`Duplicate Mobile Number found in file: '${cleanedMobile}' for User ID '${user.user_id || '??'}' on row ${rowNum}`); } else { mobileNumbers.add(cleanedMobile); } }
    }); return errors;
};
const isCsvFile = (fileName) => fileName.toLowerCase().endsWith('.csv');
const isXlsxFile = (fileName) => fileName.toLowerCase().endsWith('.xlsx');
const parseCSV = (filePath) => { /* ... (Keep existing CSV parsing logic) ... */
     return new Promise((resolve, reject) => { const results = []; fs.createReadStream(filePath).pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '').replace(/\./g, '') })).on('data', (data) => { const userId = data.userid?.trim(); const mobileRaw = data.mobileno?.toString().trim(); const mobileClean = mobileRaw?.replace(/\D/g, ''); if (userId && mobileClean && /^\d{10}$/.test(mobileClean)) { results.push({ user_id: userId, mobile_number: mobileClean }); } else if (userId || mobileRaw) { console.warn(`Skipping CSV row due to missing/invalid data: UserID='${userId || 'missing'}', MobileRaw='${mobileRaw || 'missing'}'`); } }).on('end', () => resolve(results)).on('error', (error) => reject(new Error(`CSV parsing error: ${error.message}`))); });
};
const parseExcel = async (filePath) => { /* ... (Keep existing Excel parsing logic) ... */
    const workbook = new exceljs.Workbook(); try { await workbook.xlsx.readFile(filePath); const worksheet = workbook.getWorksheet(1); if (!worksheet) throw new Error("Excel file contains no worksheets."); const jsonData = []; let headerMap = { userIdCol: null, mobileCol: null }; let headersFound = false; worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => { if (!headersFound) { row.eachCell({ includeEmpty: true }, (cell, colNumber) => { const headerText = cell.value?.toString().trim().toLowerCase().replace(/\s+/g, '').replace(/\./g, '') || ''; if (headerText === 'userid') headerMap.userIdCol = colNumber; if (headerText === 'mobileno') headerMap.mobileCol = colNumber; }); if (headerMap.userIdCol !== null && headerMap.mobileCol !== null) { headersFound = true; } else if (rowNumber > 5) { throw new Error("Required headers 'User ID' or 'Mobile No.' not found in Excel file."); } } else { const userIdCell = row.getCell(headerMap.userIdCol); const mobileCell = row.getCell(headerMap.mobileCol); const getCellValueAsString = (cell) => { /* ... robust cell value getter ... */ if (!cell || cell.value === null || cell.value === undefined) return ''; if (typeof cell.value === 'object') { if (cell.value.result !== undefined) return cell.value.result.toString().trim(); if (cell.value.richText) return cell.value.richText.map(rt => rt.text).join('').trim(); if (cell.value instanceof Date) return cell.value.toISOString(); try { return JSON.stringify(cell.value).trim(); } catch { return ''; } } return cell.value.toString().trim(); }; const userId = getCellValueAsString(userIdCell); const mobileNumberRaw = getCellValueAsString(mobileCell); const mobileNumberClean = mobileNumberRaw.replace(/\D/g, ''); if (userId && mobileNumberClean && /^\d{10}$/.test(mobileNumberClean)) { jsonData.push({ user_id: userId, mobile_number: mobileNumberClean }); } else if (userId || mobileNumberRaw) { console.warn(`Skipping Excel row ${rowNumber} due to missing/invalid data (User: '${userId || 'missing'}', Mobile Raw: '${mobileNumberRaw || 'missing'}')`); } } }); if (!headersFound) throw new Error("Required headers 'User ID' or 'Mobile No.' not found in the Excel file."); return jsonData; } catch (error) { throw new Error(`Excel parsing error: ${error.message}`); }
};
// --- End Helper Functions ---


/**
 * @desc    Create users from uploaded file (CSV or XLSX) into public.users
 * @route   POST /api/user/upload-users
 * @access  Private (Authenticated User - enforced by 'protect' middleware)
 */
export const createUsersFromFile = asyncHandler(async (req, res, next) => {
    console.log("--- createUsersFromFile controller hit ---");
    const uploaderAuthUserId = req.authUserId; // ID of logged-in user

    if (!req.file) { res.status(400); throw new Error('Please upload a file.'); }
    if (!supabaseAdmin) { res.status(500); throw new Error('Admin client not configured. Cannot process user upload.'); }
    if (!uploaderAuthUserId) { res.status(401); throw new Error('Uploader user ID not found in request.'); }

    const { originalname, path: tempFilePath } = req.file;
    console.log(`Processing uploaded file: ${originalname} by User: ${uploaderAuthUserId}`);
    let userData = [];

    try {
        // 1. Parse the file
        if (isCsvFile(originalname)) { userData = await parseCSV(tempFilePath); }
        else if (isXlsxFile(originalname)) { userData = await parseExcel(tempFilePath); }
        else { res.status(400); throw new Error('Invalid file type. Only CSV and XLSX are supported.'); }
        if (userData.length === 0) { res.status(400); throw new Error('Uploaded file is empty or contains no valid user data rows.'); }

        // 2. Validate parsed data
        const validationErrors = validateUserData(userData);
        if (validationErrors.length > 0) { res.status(400); throw new Error(`Validation errors in file: ${validationErrors.join('; ')}`); }
        console.log("User data validation successful.");

        // 3. Prepare data for insert (No created_by_auth_id)
        console.log(`Attempting Supabase bulk insert for ${userData.length} users by ${uploaderAuthUserId} using ADMIN client.`);
        const usersToInsert = userData.map(user => ({
            user_id: user.user_id,
            mobile_number: user.mobile_number
        }));

        // 4. Insert data using Admin client (to bypass RLS if needed)
        const { data: insertedResult, error: insertError } = await supabaseAdmin
            .from('users')
            .insert(usersToInsert)
            .select('user_id'); // Select minimal data

        if (insertError) {
            console.error('Supabase bulk insert error:', insertError);
            if (insertError.code === '23505') { // Unique constraint violation
                res.status(409); throw new Error(`Database error: ${insertError.details || 'Duplicate User ID or Mobile Number found.'}`);
            }
            throw new Error(`Database error during bulk insert: ${insertError.message}`);
        }

        const insertedCount = insertedResult?.length ?? userData.length;
        console.log(`Successfully processed Supabase bulk insert by ${uploaderAuthUserId}. Approx ${insertedCount} users processed.`);

        res.status(201).json({
            success: true,
            message: `Successfully processed file and attempted to insert ${userData.length} users.`,
            insertedCount: insertedCount
        });

    } catch (error) { next(error); } // Pass errors to central handler
    finally {
        if (tempFilePath) { fs.unlink(tempFilePath, (err) => { if (err) console.error('Error deleting temp file:', err); }); }
    }
});

/**
 * @desc    Create a single user manually into public.users
 * @route   POST /api/user/create
 * @access  Private (Authenticated User - enforced by 'protect' middleware)
 */
export const createUser = asyncHandler(async (req, res, next) => {
    console.log("--- createUser controller hit ---");
    const creatorAuthUserId = req.authUserId; // ID of logged-in user
    const { user_id, mobile_number } = req.body;

    if (!supabaseAdmin) { res.status(500); throw new Error('Admin client not configured. Cannot create user.'); }
    if (!creatorAuthUserId) { res.status(401); throw new Error('Creator user ID not found in request.'); }

    // 1. Validate input
    const trimmedUserId = user_id?.trim();
    const cleanedMobile = String(mobile_number).replace(/\D/g, '');
     if (!trimmedUserId || !/^\d{10}$/.test(cleanedMobile)) {
         res.status(400); throw new Error("Invalid User ID or Mobile Number format.");
     }
    console.log("Input validation passed.");

    try {
        // 2. Prepare user data for insert (No created_by_auth_id)
        const userData = {
            user_id: trimmedUserId,
            mobile_number: cleanedMobile,
        };
        console.log("Prepared user data for insert by", creatorAuthUserId, ":", userData);

        // 3. Insert into Supabase 'users' table using Admin Client
        console.log(`Attempting Supabase insert for user '${trimmedUserId}' by ${creatorAuthUserId} using ADMIN client...`);
        const { data: insertedUser, error: insertError } = await supabaseAdmin
            .from('users')
            .insert([userData])
            .select() // Select the created user data
            .single();

        if (insertError) {
            console.error(`Supabase error creating user '${trimmedUserId}':`, insertError);
            if (insertError.code === '23505') { res.status(409); throw new Error(`Database error: ${insertError.details || 'User ID or Mobile Number already exists.'}`); }
            throw new Error(`Database error creating user: ${insertError.message}`);
        }
        if (!insertedUser) { throw new Error("User data could not be retrieved after creation."); }

        console.log("Supabase insert successful:", insertedUser);

        // 4. Send success response
        res.status(201).json({
            success: true,
            message: `User '${insertedUser.user_id}' created successfully by ${creatorAuthUserId}!`,
            user: { // Return relevant fields
                user_id: insertedUser.user_id,
                mobile_number: insertedUser.mobile_number,
                created_at: insertedUser.created_at
            }
        });
        console.log("Success response sent for user creation.");

    } catch (error) { next(error); } // Pass errors to central handler
});