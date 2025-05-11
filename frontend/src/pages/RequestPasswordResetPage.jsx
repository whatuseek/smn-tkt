// src/pages/RequestPasswordResetPage.jsx

import { useState } from "react";
import { Link } from "react-router-dom"; // Use Link for navigation back
import { supabase } from '../config/supabaseClient'; // Updated import path
import {
    Container, TextField, Button, Typography, Box, Alert, CircularProgress
} from "@mui/material";

// Assuming global styles handle base layout
// import "../styles/index.css"; // Optional: if specific styles needed

// Style for rounded text fields (can be moved to shared utility)
const roundedInputStyle = {
    '& .MuiOutlinedInput-root': { borderRadius: 2 }
};

const RequestPasswordResetPage = () => {
    const [resetEmail, setResetEmail] = useState("");
    const [loadingReset, setLoadingReset] = useState(false);
    const [errorReset, setErrorReset] = useState("");
    const [successReset, setSuccessReset] = useState(""); // To show success message

    const handleRequestReset = async (event) => {
        event.preventDefault();
        setLoadingReset(true);
        setErrorReset("");
        setSuccessReset(''); // Clear previous messages

        // Construct the redirect URL for the actual password setting page
        // This URL *must* be added to your Supabase project's list of allowed Redirect URLs
        const redirectURL = `${window.location.origin}/reset-password`;
        console.log("Requesting password reset, redirecting user to:", redirectURL);

        try {
            // Call Supabase auth function
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: redirectURL,
            });

            if (resetError) {
                // Handle specific Supabase errors if needed
                console.error("Supabase password reset request error:", resetError);
                throw resetError; // Throw to be caught below
            }

            // Success
            setSuccessReset(`Password reset link sent to ${resetEmail}. Please check your inbox (and spam folder). It might take a few minutes.`);
            setResetEmail(""); // Clear email input on success

        } catch (err) {
            console.error("Password reset request process error:", err);
            // Provide user-friendly error message
            let message = "Failed to send reset link. Please ensure the email is correct and try again.";
            // You could potentially check err.message for specific Supabase codes/messages
            setErrorReset(message);
        } finally {
            setLoadingReset(false); // Always stop loading indicator
        }
    };

    return (
        <Container
            maxWidth="xs"
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                py: 4
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: { xs: 2, sm: 4 },
                    bgcolor: 'background.paper',
                    borderRadius: 3,
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                    width: '100%'
                }}
            >
                <Typography
                    component="h1"
                    variant="h5"
                    align="center"
                    gutterBottom
                    sx={{ fontFamily: "Raleway, sans-serif", fontWeight: 'medium', mb: 1 }}
                >
                    Request Password Reset
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3, textAlign: 'center' }}
                >
                    Enter your account email address and we&apos;ll send you a link to reset your password.
                </Typography>

                {/* Display Error or Success Messages */}
                {errorReset && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 1.5 }}>
                        {errorReset}
                    </Alert>
                )}
                {successReset && (
                    <Alert severity="success" sx={{ width: '100%', mb: 2, borderRadius: 1.5 }}>
                        {successReset}
                    </Alert>
                )}

                {/* Show form unless success message is displayed? Or always show? */}
                {/* Keeping form always visible allows resending if email not received */}
                <Box component="form" onSubmit={handleRequestReset} noValidate sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="reset-email"
                        label="Your Account Email"
                        name="reset-email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        disabled={loadingReset}
                        sx={roundedInputStyle}
                        error={!!errorReset} // Highlight on error
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        disabled={loadingReset}
                        sx={{ mt: 2, mb: 2, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem' }}
                        style={{ fontFamily: "Raleway, sans-serif" }}
                    >
                        {loadingReset ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
                    </Button>
                </Box>

                {/* Link back to Login */}
                <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                    <Link
                        to="/login" // Ensure this path matches your login route
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                        style={{ textDecoration: 'none' }}
                    >
                        Back to Login
                    </Link>
                </Typography>
            </Box>
        </Container>
    );
};

export default RequestPasswordResetPage;