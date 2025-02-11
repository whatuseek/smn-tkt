//  tkt/backend/models/userUploadModel.js

import mongoose from 'mongoose';

const userUploadSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        unique: true, // Ensure user_id is unique
        trim: true,  // Trim whitespace
    },
    mobile_number: {
        type: String,
        required: true,
        validate: {
            validator: (v) => /^\d{10}$/.test(v),
            message: 'Please enter a valid 10-digit mobile number',
        },
    },
});

const UserUploadModel = mongoose.model('User', userUploadSchema);

export default UserUploadModel;