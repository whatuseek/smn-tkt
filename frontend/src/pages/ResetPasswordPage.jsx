// src/pages/ResetPasswordPage.jsx

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../config/supabaseClient'; // Updated import path
import {
    Container, Box, Typography, TextField, Button, Alert, CircularProgress,
    InputAdornment, IconButton
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Style object for rounded inputs
const roundedInputStyle = {
    '& .MuiOutlinedInput-root': { borderRadius: 2 }
};

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false); // Loading state for the password update action
    const [error, setError] = useState(''); // Stores verification or update errors
    const [success, setSuccess] = useState(''); // Stores success message after update
    const [isLoadingMount, setIsLoadingMount] = useState(true); // Tracks initial verification loading state
    const [userEmail, setUserEmail] = useState(''); // Stores email ONLY if verification succeeds

    const subscriptionRef = useRef(null);
    const verificationTimeoutRef = useRef(null);

    // State for password visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Handlers for password visibility toggle
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);
    const handleMouseDownPassword = (event) => { event.preventDefault(); };

    // Effect for handling authentication state on component mount to verify the recovery token
    useEffect(() => {
        setIsLoadingMount(true);
        setError(''); setSuccess(''); setUserEmail('');
        let verificationAttempted = false;

        console.log("ResetPasswordPage: Setting up auth listener for mount/verification.");

        // Listen for Supabase auth events
        subscriptionRef.current = supabase.auth.onAuthStateChange((event, session) => {
            if (verificationAttempted || !isLoadingMount) {
                console.log(`ResetPasswordPage: Listener ignoring event ${event} (verificationAttempted=${verificationAttempted}, isLoadingMount=${isLoadingMount})`);
                return;
            }
            console.log("ResetPasswordPage Auth Event:", event, "Session User Email:", session?.user?.email);

            // The key event is PASSWORD_RECOVERY. If we get a session here, the token is valid.
            // INITIAL_SESSION might also work if the user clicks the link shortly after requesting.
            if (session?.user && (event === "PASSWORD_RECOVERY" || event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
                if (event !== "PASSWORD_RECOVERY") {
                    console.warn(`ResetPasswordPage: Verified via ${event}, ideally should be PASSWORD_RECOVERY.`);
                    // Might want to add checks here if user is *already* fully logged in vs recovery mode
                }
                console.log(`ResetPasswordPage: User session verified via ${event}.`);
                setUserEmail(session.user.email || 'User'); // Store the email
                setError('');
                setIsLoadingMount(false);
                verificationAttempted = true;
                if (verificationTimeoutRef.current) clearTimeout(verificationTimeoutRef.current);
            } else if ((event === "INITIAL_SESSION" && !session?.user) || event === "SIGNED_OUT") {
                // No session found on initial check, or user logged out -> link likely invalid/expired
                console.log(`ResetPasswordPage: No user session found on ${event}.`);
                setError("Could not verify reset request. Link might be invalid, expired, or already used.");
                setIsLoadingMount(false);
                verificationAttempted = true;
                if (verificationTimeoutRef.current) clearTimeout(verificationTimeoutRef.current);
            }
        }).data.subscription; // Assign the subscription correctly

        // Clear previous timeout just in case
        if (verificationTimeoutRef.current) clearTimeout(verificationTimeoutRef.current);

        // Fallback timeout
        verificationTimeoutRef.current = setTimeout(() => {
            if (isLoadingMount) { // Check if still loading after timeout
                console.log("ResetPasswordPage: Verification timeout reached.");
                setError("Could not verify reset request (timeout). Link might be invalid or expired.");
                setIsLoadingMount(false);
                verificationAttempted = true; // Mark attempt as over
            }
        }, 7000); // Increased timeout slightly (7 seconds)

        // Cleanup function
        return () => {
            console.log("ResetPasswordPage: Cleaning up listener and timeout.");
            subscriptionRef.current?.unsubscribe();
            if (verificationTimeoutRef.current) clearTimeout(verificationTimeoutRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run ONCE on mount

    // Handler for submitting the new password form
    const handlePasswordUpdate = async (event) => {
        event.preventDefault();
        setError(''); // Clear previous errors

        if (!userEmail) {
            setError("Cannot update password. Session not verified or invalid.");
            return;
        }
        // --- Password validation checks ---
        if (!password) { setError("New Password is required."); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters long."); return; }
        if (password !== confirmPassword) { setError("Passwords do not match."); return; }
        // --- End validation ---

        setLoading(true); // Show loading indicator on button
        try {
            // Update the password for the user associated with the recovery token (current session)
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) {
                console.error("Supabase error updating password:", updateError);
                throw updateError; // Throw error to be caught below
            }

            // Password update successful
            setSuccess(`Password successfully updated for ${userEmail}! Redirecting to login...`);
            setUserEmail(''); // Clear user email state
            subscriptionRef.current?.unsubscribe(); // Unsubscribe listener

            // Navigate to login after a short delay to allow user to read success message
            setTimeout(() => {
                navigate('/login');
            }, 2500); // 2.5 second delay

        } catch (err) {
            console.error("Error during password update process:", err);
            setError(err.message || "Failed to update password. Please try again or request a new reset link.");
            setLoading(false); // Stop loading ONLY on error if navigating on success
        }
        // No setLoading(false) in finally block because we navigate on success
    };

    // --- Render Logic ---

    // Show loading spinner while verifying the link/session
    if (isLoadingMount) {
        return (
            <Container sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Verifying reset link...</Typography>
            </Container>
        );
    }

    // Render the main component content after verification attempt
    return (
        <Container
            maxWidth="xs"
            sx={{
                mt: 8, // Add margin top
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
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
                <Typography component="h1" variant="h5" sx={{ mb: 2, fontFamily: "Raleway, sans-serif", fontWeight: 'medium' }}>
                    Set New Password
                </Typography>

                {/* Display Error or Success Messages */}
                {error && <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ width: '100%', mb: 2, borderRadius: 1.5 }}>{success}</Alert>}

                {/* Render Form ONLY if verification succeeded (userEmail is set) AND no success message shown yet */}
                {userEmail && !success && (
                    <Box component="form" onSubmit={handlePasswordUpdate} noValidate sx={{ mt: 1, width: '100%' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                            Enter a new password for: <strong>{userEmail}</strong>
                        </Typography>
                        {/* Password Field */}
                        <TextField
                            margin="normal" required fullWidth
                            name="password" label="New Password"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={!!error && (error.toLowerCase().includes('password') || error.includes('too short'))} // More robust error check
                            helperText={password.length > 0 && password.length < 6 ? "Password is too short (min 6 chars)." : ""}
                            disabled={loading} sx={roundedInputStyle}
                            InputProps={{
                                endAdornment: (<InputAdornment position="end"> <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword} edge="end" disabled={loading}> {showPassword ? <VisibilityOff /> : <Visibility />} </IconButton> </InputAdornment>),
                            }}
                        />
                        {/* Confirm Password Field */}
                        <TextField
                            margin="normal" required fullWidth
                            name="confirmPassword" label="Confirm New Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            error={!!error && error.toLowerCase().includes('match')} // Check for 'match' in error message
                            disabled={loading} sx={roundedInputStyle}
                            InputProps={{
                                endAdornment: (<InputAdornment position="end"> <IconButton aria-label="toggle confirm password visibility" onClick={handleClickShowConfirmPassword} onMouseDown={handleMouseDownPassword} edge="end" disabled={loading}> {showConfirmPassword ? <VisibilityOff /> : <Visibility />} </IconButton> </InputAdornment>),
                            }}
                        />
                        {/* Submit Button */}
                        <Button
                            type="submit" fullWidth variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem' }}
                            disabled={loading || !password || !confirmPassword} // Disable if loading or fields empty
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
                        </Button>
                    </Box>
                )}

                {/* Show Go To Login button if verification failed OR after success message is shown */}
                {(!userEmail && error) || success ? (
                    <Button component={Link} to="/login" variant="outlined" sx={{ mt: 2 }}>
                        {success ? 'Go to Login Now' : 'Back to Login'}
                    </Button>
                ) : null}
            </Box>
        </Container>
    );
};

export default ResetPasswordPage;