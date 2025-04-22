// frontend/src/components/RequestPasswordReset.jsx

import { useState } from "react";
import { Link } from "react-router-dom"; // Use Link for navigation back
import { supabase } from '../supabaseClient';
import {
    Container, TextField, Button, Typography, Box, Alert, CircularProgress
} from "@mui/material";

const roundedInputStyle = {
    '& .MuiOutlinedInput-root': { borderRadius: 2 }
};

const RequestPasswordReset = () => {
    const [resetEmail, setResetEmail] = useState("");
    const [loadingReset, setLoadingReset] = useState(false);
    const [errorReset, setErrorReset] = useState("");
    const [successReset, setSuccessReset] = useState("");

    const handleRequestReset = async (event) => {
        event.preventDefault();
        setLoadingReset(true); setErrorReset(""); setSuccessReset('');

        const redirectURL = `${window.location.origin}/reset-password`; // URL for the actual password setting page
        console.log("Requesting password reset redirect to:", redirectURL);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: redirectURL,
            });
            if (resetError) { throw resetError; }
            setSuccessReset(`Password reset link sent to ${resetEmail}. Please check your inbox (and spam folder).`);
            setResetEmail(""); // Clear email input on success

        } catch (err) {
            console.error("Password reset request error:", err);
            setErrorReset(err.message || "Failed to send reset link. Please ensure the email is correct and try again.");
        } finally {
            setLoadingReset(false);
        }
    };

    return (
        <Container maxWidth="xs" sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3, width: '100%' }} >
                <Typography component="h1" variant="h5" align="center" mb={1} gutterBottom > Request Password Reset </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                    Enter your account email address and we&apos;ll send you a link to reset your password.
                </Typography>

                {errorReset && (<Alert severity="error" sx={{ width: '100%', mb: 2 }}> {errorReset} </Alert>)}
                {successReset && (<Alert severity="success" sx={{ width: '100%', mb: 2 }}> {successReset} </Alert>)}

                {/* Don't hide form on success, user might need to resend */}
                {/* {!successReset && ( */}
                <Box component="form" onSubmit={handleRequestReset} noValidate sx={{ mt: 1, width: '100%' }}>
                    <TextField margin="normal" required fullWidth id="reset-email" label="Your Account Email" name="reset-email" type="email" autoComplete="email" autoFocus value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} disabled={loadingReset} sx={roundedInputStyle} />
                    <Button type="submit" fullWidth variant="contained" color="primary" disabled={loadingReset} sx={{ mt: 2, mb: 2, py: 1.5, borderRadius: 2 }} >
                        {loadingReset ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
                    </Button>
                </Box>
                {/* )} */}
                <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                    <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        Back to Login
                    </Link>
                </Typography>
            </Box>
        </Container>
    );
};

export default RequestPasswordReset;