// smn/user-ticket/backend/middleware/adminErrorMiddleware.js.js

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
    res.status(statusCode).json({
        message: err.message,
        stack: NODE_ENV === "development" ? null : err.stack,
    });
};