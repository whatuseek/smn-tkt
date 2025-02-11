//  tkt/backend/controllers/userUploadController.js

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
            .on('data', (data) => results.push(data))
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
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    return jsonData;
}