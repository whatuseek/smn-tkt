import express from "express";
import { createUsersFromFile } from "../controllers/userUploadController.js";
import multer from 'multer';
const userUploadRouter = express.Router();

// Configure multer for file upload, using memory storage for handling file upload
const upload = multer({ dest: 'uploads/' });

userUploadRouter.post("/upload-users", upload.single('file'), createUsersFromFile);

export default userUploadRouter;