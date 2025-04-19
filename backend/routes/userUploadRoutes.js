// backend/routes/userUploadRoutes.js
import express from "express";
import { createUsersFromFile, createUser } from "../controllers/userUploadController.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import asyncHandler from 'express-async-handler';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/authMiddleware.js'; // Only need protect

const userUploadRouter = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '..', 'uploads');

// Ensure upload directory exists
try { if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir, { recursive: true }); } }
catch (err) { console.error(`Error ensuring uploads directory exists:`, err); }

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'userupload-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Multer file filter
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const allowedExts = ['.csv', '.xlsx'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(fileExt)) { cb(null, true); }
    else { cb(new Error('Invalid file type. Only CSV and XLSX files are allowed.'), false); }
};

// Multer instance
const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }).single('file');

// POST /api/user/upload-users (Requires Auth)
userUploadRouter.post(
    "/upload-users",
    protect, // Apply auth middleware
    (req, res, next) => { // Multer handling
        upload(req, res, function (err) {
            if (err) { return res.status(400).json({ message: err.message || 'File upload failed.' }); }
            next();
        });
    },
    asyncHandler(createUsersFromFile)
);

// POST /api/user/create (Requires Auth)
userUploadRouter.post(
    "/create",
    protect, // Apply auth middleware
    asyncHandler(createUser)
);

export default userUploadRouter;