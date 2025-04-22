// frontend/src/components/ResetPassword.jsx

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
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

const ResetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false); // Loading state for the password update action
    const [error, setError] = useState(''); // Stores verification or update errors
    const [success, setSuccess] = useState(''); // Stores success message after update
    const [isLoadingMount, setIsLoadingMount] = useState(true); // Tracks initial verification loading state
    const [userEmail, setUserEmail] = useState(''); // Stores email ONLY if verification succeeds

    // Use useRef to store the subscription and timeout IDs for reliable cleanup
    const subscriptionRef = useRef(null);
    const verificationTimeoutRef = useRef(null);

    // State for password visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Handlers for password visibility toggle
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);
    const handleMouseDownPassword = (event) => { event.preventDefault(); };

    // Effect for handling authentication state on component mount
    useEffect(() => {
        setIsLoadingMount(true); // Start loading indicator
        setError(''); // Clear previous errors
        setSuccess(''); // Clear previous success
        setUserEmail(''); // Clear previous user email
        let verificationAttempted = false; // Flag to ensure verification runs only once per mount

        console.log("ResetPassword: Setting up auth listener for mount/verification.");

        // Listen for Supabase auth events
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // Prevent processing if verification already happened or loading finished prematurely
            if (verificationAttempted || !isLoadingMount) {
                console.log(`ResetPassword: Listener ignoring event ${event} (verificationAttempted=${verificationAttempted}, isLoadingMount=${isLoadingMount})`);
                return;
            }

            console.log("ResetPassword Auth Event:", event, "Session User:", session?.user?.email);

            // If ANY event provides a user session during this initial check, assume it's the recovery session
            if (session?.user && (event === "PASSWORD_RECOVERY" || event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
                console.log(`ResetPassword: User session found via ${event}. Verification successful.`);
                setUserEmail(session.user.email || 'User'); // Store the email
                setError(''); // Clear any timeout error
                setIsLoadingMount(false); // Stop loading
                verificationAttempted = true; // Mark verification as done
                clearTimeout(verificationTimeoutRef.current); // Clear the fallback timeout
            }
            // If Supabase confirms no user or user signs out during check -> invalid link/state
            else if ((event === "INITIAL_SESSION" && !session?.user) || event === "SIGNED_OUT") {
                console.log(`ResetPassword: ${event} without user session.`);
                setError("Could not verify reset request. Link might be invalid, expired, or already used.");
                setIsLoadingMount(false); // Stop loading
                verificationAttempted = true; // Mark verification as done (failed)
                clearTimeout(verificationTimeoutRef.current); // Clear the fallback timeout
            }
        });

        // Store subscription ref for cleanup
        subscriptionRef.current = subscription;

        // Clear previous timeout just in case
        if (verificationTimeoutRef.current) {
            clearTimeout(verificationTimeoutRef.current);
        }

        // Set new timeout: If no relevant auth event confirms a user within X seconds, show error.
        verificationTimeoutRef.current = setTimeout(() => {
            // Check if still loading after the timeout (meaning listener didn't resolve)
            if (isLoadingMount) {
                console.log("ResetPassword: Verification timeout reached.");
                setError("Could not verify reset request (timeout). Link might be invalid or expired.");
                setIsLoadingMount(false); // Stop loading
                verificationAttempted = true; // Mark verification attempt as over
            }
        }, 5000); // 5 second timeout for verification (adjust if needed)


        // Cleanup function: runs on component unmount
        return () => {
            console.log("ResetPassword: Cleaning up listener and timeout.");
            subscriptionRef.current?.unsubscribe();
            if (verificationTimeoutRef.current) {
                clearTimeout(verificationTimeoutRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run ONCE on mount


    // Handler for submitting the new password form
    const handlePasswordUpdate = async (event) => {
        event.preventDefault();
        setError('');
        // Removed setSuccess('') here, set only on actual success

        // Check if user email was set (meaning verification succeeded)
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
            // Update the password for the currently authenticated user
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });
            if (updateError) { throw updateError; } // Throw error to be caught below

            setSuccess(`Password successfully updated for ${userEmail}! Redirecting to login...`);
            // --- Clear userEmail state immediately on success ---
            // This prevents the form from being shown again if user navigates back
            setUserEmail('');
            // --- Unsubscribe listener immediately on success ---
            console.log("ResetPassword: Unsubscribing auth listener after successful update.");
            subscriptionRef.current?.unsubscribe();

            // --- Navigate immediately after setting state ---
            console.log("ResetPassword: Navigating immediately to login.");
            navigate('/login');

        } catch (err) {
            console.error("Error updating password:", err);
            setError(err.message || "Failed to update password. Please try again.");
            setLoading(false); // Stop loading ONLY on error when navigating immediately on success
        }
        // No finally { setLoading(false) } because navigation happens on success
    };

    // --- Render Logic ---

    // Show loading spinner while verifying the link/session
    if (isLoadingMount) {
        return (
            <Container sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Verifying link...</Typography>
            </Container>
        );
    }

    // Render the main component content after verification attempt
    return (
        <Container maxWidth="xs" sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: { xs: 2, sm: 4 }, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3, width: '100%' }} >
                <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                    Set New Password
                </Typography>

                {/* Display Error or Success Messages */}
                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{success}</Alert>}

                {/* Render Form ONLY if loading is done, NO success message, AND user email was verified */}
                {!isLoadingMount && !success && userEmail && (
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
                            autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)}
                            error={!!error && (error.includes('Password') || error.includes('too short'))}
                            helperText={password.length > 0 && password.length < 6 ? "Password is too short (min 6 chars)." : ""}
                            disabled={loading} sx={roundedInputStyle}
                            InputProps={{
                                endAdornment: (<InputAdornment position="end"> <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword} edge="end" > {showPassword ? <VisibilityOff /> : <Visibility />} </IconButton> </InputAdornment>),
                            }}
                        />
                        {/* Confirm Password Field */}
                        <TextField
                            margin="normal" required fullWidth
                            name="confirmPassword" label="Confirm New Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            error={!!error && error.includes('match')}
                            disabled={loading} sx={roundedInputStyle}
                            InputProps={{
                                endAdornment: (<InputAdornment position="end"> <IconButton aria-label="toggle confirm password visibility" onClick={handleClickShowConfirmPassword} onMouseDown={handleMouseDownPassword} edge="end" > {showConfirmPassword ? <VisibilityOff /> : <Visibility />} </IconButton> </InputAdornment>),
                            }}
                        />
                        {/* Submit Button */}
                        <Button
                            type="submit" fullWidth variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
                        </Button>
                    </Box>
                )}

                {/* Show Go To Login button if verification failed OR after success message is shown */}
                {!isLoadingMount && ((!userEmail && error) || success) ? (
                    <Button component={Link} to="/login" variant="outlined" sx={{ mt: 2 }}>
                        {success ? 'Go to Login Now' : 'Go to Login'}
                    </Button>
                ) : null}
            </Box>
        </Container>
    );
};

export default ResetPassword;