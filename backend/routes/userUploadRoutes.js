// tkt/backend/routes/userUploadRoutes.js

import express from "express";
import { createUsersFromFile } from "../controllers/userUploadController.js";
import multer from 'multer';
import { createUser } from "../controllers/userUploadController.js"; // Import the new controller function
const userUploadRouter = express.Router();

// Configure multer for file upload, using memory storage for handling file upload
const upload = multer({ dest: 'uploads/' });

userUploadRouter.post("/upload-users", upload.single('file'), createUsersFromFile);
// Route for manually creating a user
userUploadRouter.post("/create", createUser);

export default userUploadRouter;