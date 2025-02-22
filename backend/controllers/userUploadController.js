// tkt/backend/controllers/userUploadController.js

import asyncHandler from 'express-async-handler';
import User from '../models/userUploadModel.js';
import exceljs from 'exceljs';
import csv from 'csv-parser';
import fs from 'fs';

// Helper function to validate user data before inserting
const validateUserData = (userData) => {
    const errors = [];
    for (const user of userData) {
        if (!user.user_id) {
            errors.push(`User ID is missing`);
        }
        if (!/^\d{10}$/.test(user.mobile_number)) {
            errors.push(`Mobile number is invalid for User ID: ${user.user_id}`);
        }
    }

    return errors;
};
const isCsvFile = (fileName) => fileName.toLowerCase().endsWith('.csv');
const isXlsxFile = (fileName) => fileName.toLowerCase().endsWith('.xlsx');

// Controller function for creating users using file upload
export const createUsersFromFile = asyncHandler(async (req, res) => {

    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file.');
    }

    const { originalname, path } = req.file;
    let userData = [];
    try {
        if (isCsvFile(originalname)) {
            userData = await parseCSV(path);
        }
        else if (isXlsxFile(originalname)) {
            userData = await parseExcel(path)
        }
        else {
            res.status(400);
            throw new Error('Invalid File Type')
        }
        if (userData.length === 0) {
            res.status(400);
            throw new Error("Uploaded File is empty");
        }
        const validationErrors = validateUserData(userData);
        if (validationErrors.length > 0) {
            res.status(400)
            throw new Error(validationErrors.join(', '));
        }
        await User.insertMany(userData, { ordered: false });
        res.status(201).json({
            success: true,
            message: "User data uploaded successfully!",
        });
    } catch (error) {
        res.status(500)
        throw new Error(error.message || 'Error parsing or processing file');
    } finally {
        // Remove temporary file after processing
        fs.unlink(path, (err) => {
            if (err) console.log("File not deleted", err)
        });
    }
});


// Helper function to parse CSV file
const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                // Map the new headers to the expected keys
                const mappedData = {
                    user_id: data['User ID'], // Maps "User ID" column in CSV to user_id
                    mobile_number: data['Mobile No.'] // Maps "Mobile No." column in CSV to mobile_number
                };
                results.push(mappedData);
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};
// Helper function to parse excel file
const parseExcel = async (filePath) => {
    const workbook = new exceljs.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1); // Get the first worksheet

    const jsonData = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
            // Skip header row
            return;
        }

        const rowData = {
            user_id: row.getCell(1).value,         // Assuming "User ID" is in the first column
            mobile_number: row.getCell(2).value?.toString(),  // Assuming "Mobile No." is in the second column, and convert to string
        };
        jsonData.push(rowData);
    });

    return jsonData;
}

// Controller function to create a single user manually
export const createUser = asyncHandler(async (req, res) => {
    const { user_id, mobile_number } = req.body;

    // Validate the input
    if (!user_id || !mobile_number) {
        res.status(400);
        throw new Error("Please provide User ID and Mobile No.");
    }

    if (!/^\d{10}$/.test(mobile_number)) {
        res.status(400);
        throw new Error("Please enter a valid 10-digit mobile number.");
    }

    try {
        // Check if the user already exists
        const userExists = await User.findOne({ user_id });
        if (userExists) {
            res.status(400);
            throw new Error("User already exists.");
        }

        // Create the new user
        const user = await User.create({
            user_id,
            mobile_number
        });

        if (user) {
            res.status(201).json({
                success: true,
                message: "User created successfully!",
                user: user
            });
        } else {
            res.status(400);
            throw new Error("Invalid user data.");
        }
    } catch (error) {
        res.status(500);
        throw new Error(error.message || "Error creating user.");
    }
});