// tkt/backend/middleware/errorMiddleware.js

// Middleware for handling 404 Not Found errors
export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Middleware for general error handling
const NODE_ENV = "development";
export const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    console.error("Error caught:", err) // this will log the error details
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : null, // Keep stack trace for development
    });
};