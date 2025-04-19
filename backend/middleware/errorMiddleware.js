// backend/middleware/errorMiddleware.js

// Middleware for handling 404 Not Found errors
export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pass the error to the general error handler
};

// General error handling middleware - This should be the LAST middleware used
export const errorHandler = (err, req, res, next) => {
    // Determine status code: Use the status code set on the response, or default to 500
    let statusCode = res.statusCode && res.statusCode >= 400 ? res.statusCode : 500;

    // Log the error for debugging purposes
    console.error("--- ERROR HANDLER ---");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Route:", `${req.method} ${req.originalUrl}`);
    console.error("Status Code:", statusCode);
    console.error("Error Message:", err.message);
    // Log stack trace only in development for security
    if (process.env.NODE_ENV === 'development') {
        console.error("Stack Trace:", err.stack);
    }
    console.error("--- END ERROR HANDLER ---");

    // Ensure status code is an error code before sending response
    if (statusCode < 400) {
        console.warn(`errorHandler received non-error status code ${statusCode}, setting to 500.`);
        statusCode = 500;
    }

    // Set the status code on the response
    res.status(statusCode);

    // Send JSON response
    res.json({
        success: false,
        // Use a generic message in production for 5xx errors to avoid leaking details
        message: (statusCode >= 500 && process.env.NODE_ENV !== 'development')
            ? 'An internal server error occurred.'
            : err.message, // Use specific message for 4xx or in development
        // Include stack trace only in development environment
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};