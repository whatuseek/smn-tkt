// backend/middleware/authMiddleware.js
import asyncHandler from 'express-async-handler';
import supabase from '../config/supabaseClient.js'; // Use the default client for JWT verification

// Middleware to protect routes - verifies JWT and attaches user info
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            if (!token) {
                res.status(401); throw new Error('Not authorized, token part missing');
            }

            // Verify token using Supabase client's getUser method
            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (error) {
                console.error("Supabase Auth Error in 'protect' middleware:", error.message);
                res.status(401);
                // Provide more specific error based on Supabase message
                throw new Error(error.message.includes('invalid') ? 'Not authorized, invalid token' : 'Not authorized, token verification failed');
            }
            if (!user) {
                // If getUser returns no error but no user, token might be valid but user doesn't exist? (unlikely)
                res.status(401); throw new Error('Not authorized, user not found for this token');
            }

            // Token is valid, user is retrieved
            console.log(`Auth Middleware 'protect': User ${user.id} authenticated. Email: ${user.email}`);

            // Attach user ID (UUID) and the full user object to the request
            req.authUserId = user.id; // The Supabase Auth UUID
            req.authUser = user; // Full user object (can be used for auditing etc.)

            next(); // Proceed to the next middleware or route handler

        } catch (error) {
            // Catch errors from split, getUser, or explicit throws
            console.error('Token verification failed:', error);
            // Ensure status is set correctly before error is passed to errorHandler
            if (!res.statusCode || res.statusCode < 400) {
                res.status(401); // Default to Unauthorized if not set
            }
            next(error); // Pass the existing error object to the central error handler
        }
    }

    // If no token was found in the header at all
    if (!token) {
        res.status(401); // Unauthorized
        next(new Error('Not authorized, no token provided')); // Pass error to the main error handler
    }
});

// Export ONLY the protect middleware
export { protect };