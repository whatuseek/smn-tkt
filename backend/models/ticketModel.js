// tkt/backend/models/ticketModel.js

// Import mongoose and Counter models
import mongoose from 'mongoose';
import Counter from './counterModel.js';
// import Counter from '../models/counterModel.js';

// Utility function to format timestamps in AM/PM
const formatTimestamp = (timestamp) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true, // Enable AM/PM format
  }).format(new Date(timestamp));
};

// Define the ticket schema
const ticketSchema = new mongoose.Schema(
  {
    // User ID (required)
    user_id: { type: String, required: true },

    // Mobile number (required, validated)
    mobile_number: {
      type: String,
      required: true,
      validate: {
        // Validate mobile number using regular expression
        validator: (v) => /^\d{10}$/.test(v),
        message: 'Please enter a valid 10-digit mobile number',
      },
    },

    // Location (required, trimmed)
    location: { type: String, required: true, trim: true },

    // Issue type (required, validated)
    issue_type: {
      type: String,
      required: true,
      validate: {
        // Validate issue type against allowed values
        validator: (value) => {
          console.log(`Validating issue_type: ${value}`);
          const allowedValues = [
            'HARDWARE',
            'SOFTWARE',
            'NETWORK',
            'CONNECTION',
            'SPEED',
            'INTERMITTENT',
            'ROUTER',
            'BILLING',
            'INSTALLATION',
            'WIFI',
            'SERVICE_OUTAGE',
            'PACKAGE',
            'TECHNICAL',
            'DEVICE',
            'OTHER',
          ];
          const isValid = allowedValues.includes(value.toUpperCase());
          console.log(`isValid: ${isValid}`);
          return isValid;
        },
        message: 'Invalid issue type',
      },
    },

    // Comments (required, trimmed)
    comments: { type: String, default: "" },      //removed required:true

    // Ticket ID (unique)
    ticket_id: { type: String,  }, // [removed unique:true] because same user unable to create multiple tickets

    // Type (default: 'user')
    type: { type: String, default: 'user' },

    // Status (added)
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved'], // Valid statuses
      default: 'Open', // Default status is 'Open'
    },
  },
  {
    timestamps: true, // Enable timestamps (createdAt, updatedAt)
  }
);

// Pre-save hook to generate ticket ID for update
ticketSchema.pre('updateOne', async function (next) {
    const ticket = this;
    const update = this.getUpdate();
    // Check if ticket_id exists, if not, we generate the id
    if (!update.ticket_id) {
        const prefix = 'TKT-';
        const incrementingId = await getIncrementingId();
        const paddedId = padZeroes(incrementingId, 6);
        update.ticket_id = `${prefix}${paddedId}`;
        this.setUpdate(update);
      }
     next();
});

// Function to get incrementing ID
async function getIncrementingId() {
  const counter = await Counter.findOne({}, 'ticketId');
  if (!counter) {
    return 1;
  }
  return counter.ticketId + 1;
}

// Function to pad zeroes
function padZeroes(value, length) {
  return value.toString().padStart(length, '0');
}

// Add a virtual to format timestamps for API responses
ticketSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    // Format timestamps before returning the object
    if (ret.createdAt) ret.createdAt = formatTimestamp(ret.createdAt);
    if (ret.updatedAt) ret.updatedAt = formatTimestamp(ret.updatedAt);
    return ret;
  },
});

// Create Ticket model
const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;