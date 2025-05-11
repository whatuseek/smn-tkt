// backend/routes/reportRoutes.js
import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/authMiddleware.js'; // Protect the route
import { downloadTicketReport, 
    // getTicketSummaryReport, 
    // getTicketAnalyticsReport,
    getCombinedTicketReport
    } from '../controllers/reportController.js'; // Import controller

const reportRouter = express.Router();

// Define route for downloading ticket reports
// Uses GET, parameters passed via query string
reportRouter.get(
    '/tickets/download', // e.g., /api/reports/tickets/download?format=csv&status=Open
    protect, // Ensure user is authenticated
    asyncHandler(downloadTicketReport) // Handle async logic and errors
);
reportRouter.get(
    '/tickets/combined', // New endpoint path
    protect,
    asyncHandler(getCombinedTicketReport) // Link to combined controller
);

// Add more report routes here later if needed


// reportRouter.get(
//     '/tickets/summary', // New path for summary data
//     protect,
//     asyncHandler(getTicketSummaryReport) // Link to new controller
// );

// reportRouter.get(
//     '/tickets/analytics', // New path for trend data
//     protect,
//     asyncHandler(getTicketAnalyticsReport ) // Link to new controller
// );
export default reportRouter;